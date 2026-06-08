/* Kaiser-Webdesign V44
   Mobile Safari hard fix:
   - no modern syntax that can break older Safari parsers
   - mobile/touch uses image-frame scrubbing instead of video.currentTime
   - scroll/touchmove driven updates, not only requestAnimationFrame
*/
(function(){
  'use strict';

  function $(selector, root){ return (root || document).querySelector(selector); }
  function $$(selector, root){ return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
  function clamp(value, min, max){ return Math.min(max, Math.max(min, value)); }
  function pad2(value){ return value < 10 ? '0' + value : String(value); }
  function makeFrames(prefix, amount){
    var frames = [];
    for (var i = 1; i <= amount; i += 1) {
      frames.push('./assets/img/scroll-fallback/' + prefix + '-' + pad2(i) + '.jpg');
    }
    return frames;
  }

  var ua = navigator.userAgent || '';
  var platform = navigator.platform || '';
  var maxTouch = navigator.maxTouchPoints || 0;
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
  var isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  var isTouch = ('ontouchstart' in window) || maxTouch > 0;

  function viewportHeight(){
    return window.visualViewport && window.visualViewport.height ? window.visualViewport.height : window.innerHeight;
  }

  function isMobileViewport(){
    if (window.matchMedia) return window.matchMedia('(max-width: 820px)').matches;
    return window.innerWidth <= 820;
  }

  function needsFrameFallback(){
    // Important: iOS Safari does not reliably scrub MP4 with currentTime while scrolling after hosting.
    // We therefore use frames on all small/touch Safari contexts instead of trying to force video seeking.
    return isMobileViewport() || isIOS || (isTouch && isSafari);
  }

  function setViewportUnit(){
    document.documentElement.style.setProperty('--kw-vh', (viewportHeight() * 0.01) + 'px');
  }

  function addEvent(target, eventName, handler, options){
    if (!target || !target.addEventListener) return;
    try { target.addEventListener(eventName, handler, options || false); }
    catch(e) { target.addEventListener(eventName, handler, false); }
  }

  setViewportUnit();
  document.documentElement.classList.add(isTouch ? 'kw-touch-device' : 'kw-pointer-device');

  addEvent(window, 'resize', setViewportUnit, { passive: true });
  addEvent(window, 'orientationchange', function(){ setTimeout(setViewportUnit, 250); }, { passive: true });
  if (window.visualViewport) addEvent(window.visualViewport, 'resize', setViewportUnit, { passive: true });

  if (document.body) document.body.classList.add('lock');

  function hideLoader(){
    var loader = $('.loader');
    if (loader) loader.classList.add('hide');
    if (document.body) document.body.classList.remove('lock');
    setViewportUnit();
  }

  addEvent(window, 'load', function(){ setTimeout(hideLoader, 650); });
  setTimeout(hideLoader, 2200);

  $$('a[href^="#"]').forEach(function(anchor){
    anchor.addEventListener('click', function(e){
      var href = anchor.getAttribute('href') || '';
      var id = href.slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      try { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      catch(err) { target.scrollIntoView(true); }
    });
  });

  function preloadFrames(frames){
    for (var i = 0; i < frames.length; i += 1) {
      var img = new Image();
      img.src = frames[i];
    }
  }

  function createFrameFallback(section, video, frames){
    if (!section || !video || !frames || !frames.length) return null;

    var stage = video.parentNode;
    if (!stage) return null;

    var frame = document.createElement('img');
    frame.className = 'kw-scroll-frame';
    frame.alt = '';
    frame.setAttribute('aria-hidden', 'true');
    frame.setAttribute('loading', 'eager');
    frame.src = frames[0];
    stage.insertBefore(frame, video);

    var active = false;
    var currentIndex = -1;

    function activate(){
      if (active) return;
      active = true;
      section.classList.add('kw-frame-fallback', 'video-ready');
      document.documentElement.classList.add('kw-mobile-scroll-fix');
      preloadFrames(frames);

      // Stop Mobile Safari from trying to seek/download the MP4 in the background.
      try { video.pause(); } catch(e1) {}
      try {
        video.removeAttribute('src');
        video.preload = 'none';
        video.load();
      } catch(e2) {}
    }

    function update(progress){
      if (!active) return;
      var index = clamp(Math.round(progress * (frames.length - 1)), 0, frames.length - 1);
      if (index !== currentIndex) {
        currentIndex = index;
        frame.src = frames[index];
      }
    }

    return {
      activate: activate,
      update: update,
      isActive: function(){ return active; }
    };
  }

  function enableVideoScrubbing(video){
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'auto';
    try { video.load(); } catch(e) {}

    function unlock(){
      try {
        var playPromise = video.play();
        if (playPromise && playPromise.then) {
          playPromise.then(function(){ video.pause(); }).catch(function(){});
        } else {
          video.pause();
        }
      } catch(err) {}
    }

    addEvent(window, 'pointerdown', unlock, { once: true, passive: true });
    addEvent(window, 'touchstart', unlock, { once: true, passive: true });
  }

  function createScrollFilm(config){
    var section = $(config.sectionSelector);
    var video = $(config.videoSelector);
    if (!section || !video) return { update: function(){} };

    var progress = $(config.progressSelector, section) || $(config.progressSelector);
    var copies = $$(config.copySelector, section);
    var buttons = $$(config.buttonSelector, section);
    var steps = config.steps || Math.max(copies.length, 1);
    var smooth = typeof config.smooth === 'number' ? config.smooth : 0.18;
    var frames = config.frames || [];

    var duration = 8;
    var current = 0;
    var target = 0;
    var ready = false;
    var lastProgress = 0;
    var activeStep = -1;

    var fallback = createFrameFallback(section, video, frames);
    if (needsFrameFallback() && fallback) fallback.activate();
    if (!fallback || !fallback.isActive()) enableVideoScrubbing(video);

    function markReady(){
      if (fallback && fallback.isActive()) return;
      duration = video.duration && isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
      ready = true;
      section.classList.add('video-ready');
      try { video.currentTime = Math.max(0.001, lastProgress * Math.max(duration - 0.08, 0.1)); } catch(e) {}
    }

    if (video.readyState >= 1) markReady();
    addEvent(video, 'loadedmetadata', markReady);
    addEvent(video, 'canplay', function(){ section.classList.add('video-ready'); });
    addEvent(video, 'error', function(){ if (fallback) fallback.activate(); });

    setTimeout(function(){
      if (!ready && fallback) fallback.activate();
    }, 1800);

    function setStep(step){
      if (step === activeStep) return;
      activeStep = step;
      for (var i = 0; i < copies.length; i += 1) copies[i].classList.toggle('active', i === step);
      for (var j = 0; j < buttons.length; j += 1) buttons[j].classList.toggle('active', j === step);
    }

    buttons.forEach(function(btn, index){
      btn.addEventListener('click', function(){
        var vh = viewportHeight();
        var scrollable = Math.max(1, section.offsetHeight - vh);
        var top = section.offsetTop + (index / Math.max(steps - 1, 1)) * scrollable;
        try { window.scrollTo({ top: top, behavior: 'smooth' }); }
        catch(e) { window.scrollTo(0, top); }
      });
    });

    function update(force){
      var rect = section.getBoundingClientRect();
      var vh = viewportHeight();
      var scrollable = Math.max(1, section.offsetHeight - vh);
      var p = clamp(-rect.top / scrollable, 0, 1);
      lastProgress = p;

      if (progress) progress.style.width = (p * 100) + '%';

      var step = clamp(Math.floor(p * steps), 0, steps - 1);
      setStep(step);

      if (fallback) fallback.update(p);

      if (ready && (!fallback || !fallback.isActive())) {
        target = p * Math.max(duration - 0.08, 0.1);
        current += (target - current) * (force ? 1 : smooth);
        if (Math.abs(video.currentTime - current) > 0.025 || force) {
          try {
            if (typeof video.fastSeek === 'function' && Math.abs(video.currentTime - current) > 0.18) video.fastSeek(current);
            else video.currentTime = current;
          } catch(err) {
            if (fallback) fallback.activate();
          }
        }
      }
    }

    setStep(0);
    update(true);
    return { update: update };
  }

  function createReferenceShowcase(){
    var section = $('#references');
    if (!section) return { update: function(){} };

    var progress = $('.refs-progress i', section) || $('.refs-progress i');
    var texts = $$('.refs-text', section);
    var cards = $$('.refs-card', section);
    var buttons = $$('.refs-tabs button', section);
    if (!texts.length || !cards.length) return { update: function(){} };

    var activeStep = -1;

    function setStep(step){
      if (step === activeStep) return;
      activeStep = step;
      for (var i = 0; i < texts.length; i += 1) texts[i].classList.toggle('active', i === step);
      for (var j = 0; j < cards.length; j += 1) cards[j].classList.toggle('active', j === step);
      for (var k = 0; k < buttons.length; k += 1) buttons[k].classList.toggle('active', k === step);
    }

    buttons.forEach(function(btn, index){
      btn.addEventListener('click', function(){
        var vh = viewportHeight();
        var scrollable = Math.max(1, section.offsetHeight - vh);
        var top = section.offsetTop + (index / Math.max(texts.length - 1, 1)) * scrollable;
        try { window.scrollTo({ top: top, behavior: 'smooth' }); }
        catch(e) { window.scrollTo(0, top); }
      });
    });

    function update(){
      var rect = section.getBoundingClientRect();
      var vh = viewportHeight();
      var scrollable = Math.max(1, section.offsetHeight - vh);
      var p = clamp(-rect.top / scrollable, 0, 1);
      var step = clamp(Math.floor(p * texts.length), 0, texts.length - 1);
      if (progress) progress.style.width = (p * 100) + '%';
      setStep(step);
    }

    setStep(0);
    update();
    return { update: update };
  }

  var heroFilm = createScrollFilm({
    sectionSelector: '#hero-scroll',
    videoSelector: '#scrollVideo',
    progressSelector: '.progress-line i',
    copySelector: '.hero-copy',
    buttonSelector: '.chapter-ui button',
    steps: 6,
    smooth: 0.18,
    frames: makeFrames('hero', 24)
  });

  var midFilm = createScrollFilm({
    sectionSelector: '#showcase',
    videoSelector: '#midScrollVideo',
    progressSelector: '.mid-progress i',
    copySelector: '.mid-copy',
    buttonSelector: '.mid-chapter-ui button',
    steps: 4,
    smooth: 0.18,
    frames: makeFrames('mid', 16)
  });

  var references = createReferenceShowcase();
  var revealEls = $$('.reveal');
  var parallaxImages = $$('.section-bg img');

  function updateReveals(){
    var vh = viewportHeight();
    for (var i = 0; i < revealEls.length; i += 1) {
      if (revealEls[i].classList.contains('show')) continue;
      var rect = revealEls[i].getBoundingClientRect();
      if (rect.top < vh * 0.88) revealEls[i].classList.add('show');
    }
  }

  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) entry.target.classList.add('show');
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    revealEls.forEach(function(el){ revealObserver.observe(el); });
  }

  function updateParallax(){
    var vh = viewportHeight();
    for (var i = 0; i < parallaxImages.length; i += 1) {
      var img = parallaxImages[i];
      var section = img.closest ? img.closest('section') : null;
      if (!section) continue;
      var rect = section.getBoundingClientRect();
      var p = clamp((vh * 0.5 - rect.top) / vh, -1, 1);
      img.style.setProperty('--parallax', (p * 16) + 'px');
    }
  }

  function updateAll(force){
    setViewportUnit();
    heroFilm.update(!!force);
    midFilm.update(!!force);
    references.update();
    updateReveals();
    updateParallax();
  }

  var rafQueued = false;
  function requestUpdate(force){
    if (force) {
      updateAll(true);
      return;
    }
    if (rafQueued) return;
    rafQueued = true;
    requestAnimationFrame(function(){
      rafQueued = false;
      updateAll(false);
    });
  }

  // Mobile Safari can throttle pure RAF during momentum scroll, so scroll/touchmove update directly.
  addEvent(window, 'scroll', function(){ updateAll(false); }, { passive: true });
  addEvent(window, 'touchmove', function(){ updateAll(false); }, { passive: true });
  addEvent(window, 'resize', function(){ requestUpdate(true); }, { passive: true });
  addEvent(window, 'orientationchange', function(){ setTimeout(function(){ requestUpdate(true); }, 300); }, { passive: true });
  addEvent(window, 'load', function(){ requestUpdate(true); });
  addEvent(document, 'visibilitychange', function(){ requestUpdate(true); });

  function loop(){
    updateAll(false);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  updateAll(true);

  var glow = $('.cursor-glow');
  if (glow && !isTouch) {
    var mx = window.innerWidth / 2;
    var my = window.innerHeight / 2;
    var gx = mx;
    var gy = my;
    addEvent(window, 'pointermove', function(e){ mx = e.clientX; my = e.clientY; }, { passive: true });
    function cursorLoop(){
      gx += (mx - gx) * 0.075;
      gy += (my - gy) * 0.075;
      glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(cursorLoop);
    }
    requestAnimationFrame(cursorLoop);
  }

  $$('.refs-card img, .section-bg img, .kw-scroll-frame').forEach(function(img){
    img.addEventListener('error', function(){
      // Keep this silent for visitors, useful in Safari remote console.
      if (window.console && console.warn) console.warn('Asset konnte nicht geladen werden:', img.getAttribute('src'));
    });
  });
})();
