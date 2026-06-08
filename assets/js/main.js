/* Kaiser-Webdesign V46 – Launch-stable Safari scroll engine
   Core decision:
   - Desktop: MP4 scroll scrubbing stays available.
   - iOS / touch / mobile: no video.currentTime dependency. A canvas image sequence is drawn on scroll.
   - Visual layers use positive z-index values to avoid Safari sticky/negative-layer rendering bugs.
*/
(function(){
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var win = window;

  function $(selector, scope){ return (scope || doc).querySelector(selector); }
  function $$(selector, scope){ return Array.prototype.slice.call((scope || doc).querySelectorAll(selector)); }
  function clamp(value, min, max){ return Math.min(max, Math.max(min, value)); }
  function pad3(value){ return value < 10 ? '00' + value : (value < 100 ? '0' + value : String(value)); }
  function addEvent(target, type, handler, options){
    if (!target || !target.addEventListener) return;
    try { target.addEventListener(type, handler, options || false); }
    catch(err){ target.addEventListener(type, handler, false); }
  }
  function setActiveClass(el, active){
    if (!el || !el.classList) return;
    if (active) el.classList.add('active');
    else el.classList.remove('active');
  }

  var ua = navigator.userAgent || '';
  var platform = navigator.platform || '';
  var maxTouch = navigator.maxTouchPoints || 0;
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (platform === 'MacIntel' && maxTouch > 1);
  var isSafari = /Safari/i.test(ua) && !/Chrome|Chromium|CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  var isTouch = ('ontouchstart' in win) || maxTouch > 0;

  function viewportHeight(){
    return (win.visualViewport && win.visualViewport.height) ? win.visualViewport.height : win.innerHeight;
  }
  function viewportWidth(){
    return (win.visualViewport && win.visualViewport.width) ? win.visualViewport.width : win.innerWidth;
  }
  function setViewportUnit(){
    root.style.setProperty('--kw-vh', (viewportHeight() * 0.01) + 'px');
  }
  function isSmallViewport(){
    if (win.matchMedia) return win.matchMedia('(max-width: 900px)').matches;
    return viewportWidth() <= 900;
  }
  function shouldUseCanvasFrames(){
    // This is intentionally wider than only Safari. Touch devices should not depend on MP4 seeking.
    return isIOS || (isTouch && isSmallViewport()) || (isSafari && isSmallViewport());
  }
  function makeFrameList(prefix, amount){
    var list = [];
    for (var i = 1; i <= amount; i += 1) {
      list.push('./assets/img/scroll-frames-v45/' + prefix + '-' + pad3(i) + '.jpg?v=46');
    }
    return list;
  }

  setViewportUnit();
  root.classList.add(isTouch ? 'kw-touch-device' : 'kw-pointer-device');
  if (shouldUseCanvasFrames()) root.classList.add('kw-mobile-canvas-mode');

  addEvent(win, 'resize', setViewportUnit, { passive: true });
  addEvent(win, 'orientationchange', function(){ setTimeout(setViewportUnit, 250); }, { passive: true });
  if (win.visualViewport) addEvent(win.visualViewport, 'resize', setViewportUnit, { passive: true });

  if (doc.body) doc.body.classList.add('lock');
  function hideLoader(){
    var loader = $('.loader');
    if (loader) loader.classList.add('hide');
    if (doc.body) doc.body.classList.remove('lock');
    setViewportUnit();
  }
  addEvent(doc, 'DOMContentLoaded', function(){ setTimeout(hideLoader, 380); });
  addEvent(win, 'load', function(){ setTimeout(hideLoader, 420); });
  setTimeout(hideLoader, 1600);

  $$('a[href^="#"]').forEach(function(anchor){
    addEvent(anchor, 'click', function(event){
      var href = anchor.getAttribute('href') || '';
      var target = doc.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      try { target.scrollIntoView({ behavior: shouldUseCanvasFrames() ? 'auto' : 'smooth', block: 'start' }); }
      catch(err) { target.scrollIntoView(true); }
    });
  });

  function createCanvasRenderer(stage, frames){
    if (!stage || !frames || !frames.length) return null;

    var canvas = doc.createElement('canvas');
    canvas.className = 'kw-scroll-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    stage.insertBefore(canvas, stage.firstChild);

    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return null;

    var dpr = Math.min(2, win.devicePixelRatio || 1);
    var images = [];
    var loaded = [];
    var requested = [];
    var lastIndex = 0;
    var hasDrawn = false;

    function resize(){
      var width = Math.max(1, stage.clientWidth || viewportWidth());
      var height = Math.max(1, stage.clientHeight || viewportHeight());
      var realWidth = Math.round(width * dpr);
      var realHeight = Math.round(height * dpr);
      if (canvas.width !== realWidth) canvas.width = realWidth;
      if (canvas.height !== realHeight) canvas.height = realHeight;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      draw(lastIndex, true);
    }

    function drawCover(img){
      if (!img || !img.naturalWidth || !img.naturalHeight) return false;
      var cw = canvas.width;
      var ch = canvas.height;
      var iw = img.naturalWidth;
      var ih = img.naturalHeight;
      var scale = Math.max(cw / iw, ch / ih);
      var dw = iw * scale;
      var dh = ih * scale;
      var dx = (cw - dw) / 2;
      var dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, dx, dy, dw, dh);
      hasDrawn = true;
      return true;
    }

    function nearestLoaded(index){
      if (loaded[index]) return index;
      for (var offset = 1; offset < loaded.length; offset += 1) {
        var back = index - offset;
        var forward = index + offset;
        if (back >= 0 && loaded[back]) return back;
        if (forward < loaded.length && loaded[forward]) return forward;
      }
      return -1;
    }

    function draw(index, force){
      index = clamp(index, 0, frames.length - 1);
      lastIndex = index;
      var available = nearestLoaded(index);
      if (available >= 0) {
        drawCover(images[available]);
      } else if (force && images[0] && images[0].complete) {
        drawCover(images[0]);
      }
    }

    function requestImage(index, priority){
      if (index < 0 || index >= frames.length || requested[index]) return;
      requested[index] = true;
      var img = new Image();
      img.decoding = priority ? 'sync' : 'async';
      img.onload = function(){
        loaded[index] = true;
        if (!hasDrawn || Math.abs(index - lastIndex) <= 1) draw(lastIndex, true);
      };
      img.onerror = function(){ loaded[index] = false; };
      img.src = frames[index];
      images[index] = img;
    }

    function loadInitial(){
      requestImage(0, true);
      requestImage(1, true);
      requestImage(frames.length - 1, false);
      // Load the rest in small waves to avoid blocking Mobile Safari during first paint.
      var i = 2;
      function wave(){
        var end = Math.min(frames.length, i + 4);
        for (; i < end; i += 1) requestImage(i, false);
        if (i < frames.length) setTimeout(wave, 90);
      }
      setTimeout(wave, 120);
    }

    resize();
    loadInitial();
    addEvent(win, 'resize', resize, { passive: true });
    addEvent(win, 'orientationchange', function(){ setTimeout(resize, 260); }, { passive: true });
    if (win.visualViewport) addEvent(win.visualViewport, 'resize', resize, { passive: true });

    return {
      resize: resize,
      draw: draw,
      preloadNear: function(progress){
        var index = clamp(Math.round(progress * (frames.length - 1)), 0, frames.length - 1);
        for (var offset = -2; offset <= 3; offset += 1) requestImage(index + offset, false);
      }
    };
  }

  function prepareVideoForDesktop(video){
    if (!video) return;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'auto';
    try { video.load(); } catch(err) {}

    function unlock(){
      try {
        var playPromise = video.play();
        if (playPromise && playPromise.then) {
          playPromise.then(function(){ video.pause(); }).catch(function(){});
        } else {
          video.pause();
        }
      } catch(e) {}
    }
    addEvent(win, 'pointerdown', unlock, { once: true, passive: true });
    addEvent(win, 'touchstart', unlock, { once: true, passive: true });
  }

  function disableVideoForMobile(video){
    if (!video) return;
    try { video.pause(); } catch(e1) {}
    try {
      var src = video.getAttribute('src');
      if (src) video.setAttribute('data-desktop-src', src);
      video.removeAttribute('src');
      video.preload = 'none';
      video.load();
    } catch(e2) {}
  }

  function createScrollFilm(config){
    var section = $(config.sectionSelector);
    if (!section) return { update: function(){}, resize: function(){} };

    var sticky = $('.hero-sticky', section) || $('.mid-sticky', section) || section.firstElementChild;
    var video = $(config.videoSelector, section) || $(config.videoSelector);
    var progressEl = $(config.progressSelector, section) || $(config.progressSelector);
    var copies = $$(config.copySelector, section);
    var buttons = $$(config.buttonSelector, section);
    var steps = config.steps || Math.max(1, copies.length);
    var frames = config.frames || [];
    var smooth = typeof config.smooth === 'number' ? config.smooth : 0.18;
    var canvasMode = shouldUseCanvasFrames() && frames.length > 0;
    var canvasRenderer = null;
    var duration = config.duration || 8;
    var current = 0;
    var target = 0;
    var ready = false;
    var activeStep = -1;

    if (canvasMode) {
      section.classList.add('kw-canvas-mode', 'video-ready');
      canvasRenderer = createCanvasRenderer(sticky, frames);
      disableVideoForMobile(video);
    } else {
      prepareVideoForDesktop(video);
      if (video && video.readyState >= 1) markReady();
      addEvent(video, 'loadedmetadata', markReady);
      addEvent(video, 'canplay', function(){ section.classList.add('video-ready'); });
      addEvent(video, 'error', function(){ section.classList.add('video-ready'); });
    }

    function markReady(){
      if (!video) return;
      duration = video.duration && isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
      ready = true;
      section.classList.add('video-ready');
      try { video.currentTime = 0.001; } catch(e) {}
    }

    function setStep(step){
      step = clamp(step, 0, Math.max(0, steps - 1));
      if (step === activeStep) return;
      activeStep = step;
      for (var i = 0; i < copies.length; i += 1) setActiveClass(copies[i], i === step);
      for (var j = 0; j < buttons.length; j += 1) setActiveClass(buttons[j], j === step);
    }

    for (var b = 0; b < buttons.length; b += 1) {
      (function(index){
        addEvent(buttons[index], 'click', function(){
          var scrollable = Math.max(1, section.offsetHeight - viewportHeight());
          var top = section.offsetTop + (index / Math.max(steps - 1, 1)) * scrollable;
          try { win.scrollTo({ top: top, behavior: canvasMode ? 'auto' : 'smooth' }); }
          catch(e) { win.scrollTo(0, top); }
        });
      })(b);
    }

    function progress(){
      var rect = section.getBoundingClientRect();
      var scrollable = Math.max(1, section.offsetHeight - viewportHeight());
      return clamp(-rect.top / scrollable, 0, 1);
    }

    function update(force){
      var p = progress();
      if (progressEl) progressEl.style.width = (p * 100) + '%';
      setStep(clamp(Math.floor(p * steps), 0, steps - 1));

      if (canvasMode && canvasRenderer) {
        canvasRenderer.preloadNear(p);
        canvasRenderer.draw(Math.round(p * (frames.length - 1)), !!force);
        return;
      }

      if (video && ready) {
        target = p * Math.max(duration - 0.08, 0.1);
        current += (target - current) * (force ? 1 : smooth);
        if (Math.abs(video.currentTime - current) > 0.025 || force) {
          try { video.currentTime = current; } catch(e2) {}
        }
      }
    }

    setStep(0);
    update(true);

    return {
      update: update,
      resize: function(){ if (canvasRenderer) canvasRenderer.resize(); update(true); }
    };
  }

  function createReferenceShowcase(){
    var section = $('#references');
    if (!section) return { update: function(){} };
    var progressEl = $('.refs-progress i', section);
    var texts = $$('.refs-text', section);
    var cards = $$('.refs-card', section);
    var buttons = $$('.refs-tabs button', section);
    if (!texts.length || !cards.length) return { update: function(){} };

    var activeStep = -1;
    function setStep(step){
      if (step === activeStep) return;
      activeStep = step;
      for (var i = 0; i < texts.length; i += 1) setActiveClass(texts[i], i === step);
      for (var j = 0; j < cards.length; j += 1) setActiveClass(cards[j], j === step);
      for (var k = 0; k < buttons.length; k += 1) setActiveClass(buttons[k], k === step);
    }

    for (var b = 0; b < buttons.length; b += 1) {
      (function(index){
        addEvent(buttons[index], 'click', function(){
          var scrollable = Math.max(1, section.offsetHeight - viewportHeight());
          var top = section.offsetTop + (index / Math.max(texts.length - 1, 1)) * scrollable;
          try { win.scrollTo({ top: top, behavior: shouldUseCanvasFrames() ? 'auto' : 'smooth' }); }
          catch(e) { win.scrollTo(0, top); }
        });
      })(b);
    }

    function update(){
      var rect = section.getBoundingClientRect();
      var scrollable = Math.max(1, section.offsetHeight - viewportHeight());
      var p = clamp(-rect.top / scrollable, 0, 1);
      if (progressEl) progressEl.style.width = (p * 100) + '%';
      var step = clamp(Math.floor(p * texts.length), 0, texts.length - 1);
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
    duration: 12,
    frames: makeFrameList('hero', 48)
  });

  var midFilm = createScrollFilm({
    sectionSelector: '#showcase',
    videoSelector: '#midScrollVideo',
    progressSelector: '.mid-progress i',
    copySelector: '.mid-copy',
    buttonSelector: '.mid-chapter-ui button',
    steps: 4,
    smooth: 0.18,
    duration: 8,
    frames: makeFrameList('mid', 32)
  });

  var references = createReferenceShowcase();
  var revealEls = $$('.reveal');
  var parallaxImages = $$('.section-bg img');

  function updateReveals(){
    var vh = viewportHeight();
    for (var i = 0; i < revealEls.length; i += 1) {
      if (revealEls[i].classList.contains('show')) continue;
      var rect = revealEls[i].getBoundingClientRect();
      if (rect.top < vh * 0.92) revealEls[i].classList.add('show');
    }
  }

  if ('IntersectionObserver' in win) {
    var revealObserver = new IntersectionObserver(function(entries){
      for (var i = 0; i < entries.length; i += 1) {
        if (entries[i].isIntersecting) entries[i].target.classList.add('show');
      }
    }, { threshold: 0.1, rootMargin: '0px 0px -4% 0px' });
    for (var r = 0; r < revealEls.length; r += 1) revealObserver.observe(revealEls[r]);
  }

  function updateParallax(){
    if (shouldUseCanvasFrames()) return;
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
    win.requestAnimationFrame(function(){
      rafQueued = false;
      updateAll(false);
    });
  }

  addEvent(win, 'scroll', function(){ requestUpdate(false); }, { passive: true });
  addEvent(win, 'touchmove', function(){ requestUpdate(false); }, { passive: true });
  addEvent(win, 'resize', function(){ heroFilm.resize(); midFilm.resize(); requestUpdate(true); }, { passive: true });
  addEvent(win, 'orientationchange', function(){ setTimeout(function(){ heroFilm.resize(); midFilm.resize(); requestUpdate(true); }, 300); }, { passive: true });
  addEvent(win, 'pageshow', function(){ requestUpdate(true); });
  addEvent(win, 'load', function(){ requestUpdate(true); });
  addEvent(doc, 'visibilitychange', function(){ requestUpdate(true); });

  function desktopLoop(){
    updateAll(false);
    win.requestAnimationFrame(desktopLoop);
  }
  if (!shouldUseCanvasFrames()) win.requestAnimationFrame(desktopLoop);
  updateAll(true);

  var glow = $('.cursor-glow');
  if (glow && !isTouch) {
    var mx = win.innerWidth / 2;
    var my = win.innerHeight / 2;
    var gx = mx;
    var gy = my;
    addEvent(win, 'pointermove', function(event){ mx = event.clientX; my = event.clientY; }, { passive: true });
    function cursorLoop(){
      gx += (mx - gx) * 0.075;
      gy += (my - gy) * 0.075;
      glow.style.transform = 'translate(' + gx + 'px,' + gy + 'px) translate(-50%,-50%)';
      win.requestAnimationFrame(cursorLoop);
    }
    win.requestAnimationFrame(cursorLoop);
  }

  // Debug only when explicitly opened as ?kwdebug=1. Useful for a real iPhone Safari check after upload.
  if (/[?&]kwdebug=1/.test(win.location.search)) {
    var panel = doc.createElement('div');
    panel.style.cssText = 'position:fixed;left:10px;bottom:10px;z-index:99999;background:rgba(0,0,0,.78);color:#98ff36;padding:8px 10px;font:11px/1.35 monospace;max-width:92vw;pointer-events:none;border:1px solid rgba(152,255,54,.45)';
    doc.body.appendChild(panel);
    setInterval(function(){
      panel.textContent = 'V46 canvas=' + shouldUseCanvasFrames() + ' ios=' + isIOS + ' safari=' + isSafari + ' y=' + Math.round(win.scrollY) + ' vh=' + Math.round(viewportHeight());
    }, 250);
  }

  $$('.refs-card img, .section-bg img').forEach(function(img){
    addEvent(img, 'error', function(){
      if (win.console && console.warn) console.warn('Bild konnte nicht geladen werden:', img.getAttribute('src'));
    });
  });
})();
