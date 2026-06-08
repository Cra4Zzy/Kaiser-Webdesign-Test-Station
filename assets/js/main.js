// Kaiser-Webdesign V30 Clean Repair JS
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const mobileQuery = window.matchMedia('(max-width: 900px), (pointer: coarse)');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isMobile = () => mobileQuery.matches;
  const reduceMotion = () => reduceMotionQuery.matches;

  document.body.classList.add('lock');
  const releaseLoader = () => {
    $('.loader')?.classList.add('hide');
    document.body.classList.remove('lock');
  };
  document.addEventListener('DOMContentLoaded', () => window.setTimeout(releaseLoader, 420), { once: true });
  window.addEventListener('load', () => window.setTimeout(releaseLoader, 160), { once: true });
  window.setTimeout(releaseLoader, 2400);

  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const targetId = anchor.getAttribute('href')?.slice(1);
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // Video setup: desktop gets scroll scrubbing; mobile gets a stable poster/video layer without seeking on every scroll.
  const videos = $$('video');
  videos.forEach(video => {
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('preload', isMobile() ? 'metadata' : 'auto');
  });

  let videoUnlocked = false;
  const unlockVideos = () => {
    if (videoUnlocked) return;
    videoUnlocked = true;
    videos.forEach(video => {
      try {
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.then === 'function') {
          playAttempt.then(() => { try { video.pause(); } catch (_) {} }).catch(() => {});
        }
      } catch (_) {}
    });
  };
  window.addEventListener('touchstart', unlockVideos, { passive: true, once: true });
  window.addEventListener('pointerdown', unlockVideos, { passive: true, once: true });

  const setActive = (items, activeIndex) => {
    items.forEach((item, index) => item.classList.toggle('active', index === activeIndex));
  };

  function createScrollStage(options) {
    const section = $(options.sectionSelector);
    const video = $(options.videoSelector);
    const progress = $(options.progressSelector);
    const copies = $$(options.copySelector);
    const buttons = $$(options.buttonSelector);
    const steps = options.steps || Math.max(copies.length, buttons.length, 1);
    let duration = 8;
    let activeStep = -1;
    let lastVideoTime = -1;

    if (!section) return { update() {} };

    const chooseStep = progressValue => clamp(Math.floor(progressValue * steps), 0, steps - 1);

    const jumpTo = index => {
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const top = section.offsetTop + (index / Math.max(steps - 1, 1)) * scrollable;
      window.scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
    };

    buttons.forEach((button, index) => button.addEventListener('click', () => jumpTo(index)));

    if (video) {
      video.addEventListener('loadedmetadata', () => {
        duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
        try { if (!isMobile()) video.currentTime = 0.02; } catch (_) {}
      }, { passive: true });
      video.addEventListener('canplay', () => section.classList.add('video-ready'), { passive: true });
      video.addEventListener('error', () => section.classList.add('video-error'), { passive: true });
    }

    const update = () => {
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const progressValue = clamp(-rect.top / scrollable, 0, 1);

      if (progress) progress.style.width = `${progressValue * 100}%`;

      const nextStep = chooseStep(progressValue);
      if (nextStep !== activeStep) {
        activeStep = nextStep;
        setActive(copies, activeStep);
        setActive(buttons, activeStep);
      }

      // Do not scrub video on mobile. Mobile Safari seeking is the main source of stutter.
      if (!video || isMobile() || reduceMotion()) return;
      const maxTime = Math.max(duration - 0.12, 0.1);
      const targetTime = clamp(progressValue * maxTime, 0.02, maxTime);
      if (video.readyState > 0 && Math.abs(targetTime - lastVideoTime) > 0.045) {
        try {
          video.currentTime = targetTime;
          lastVideoTime = targetTime;
        } catch (_) {}
      }
    };

    return { update };
  }

  function createReferences() {
    const section = $('#references');
    const progress = $('.refs-progress i');
    const texts = $$('.refs-text');
    const cards = $$('.refs-card');
    const buttons = $$('.refs-tabs button');
    let activeStep = -1;

    if (!section) return { update() {} };

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
        const top = section.offsetTop + (index / Math.max(buttons.length - 1, 1)) * scrollable;
        window.scrollTo({ top, behavior: reduceMotion() ? 'auto' : 'smooth' });
      });
    });

    const update = () => {
      // Mobile has a real list and should not run sticky reference JS.
      if (isMobile()) return;
      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const progressValue = clamp(-rect.top / scrollable, 0, 1);
      if (progress) progress.style.width = `${progressValue * 100}%`;
      const nextStep = clamp(Math.floor(progressValue * texts.length), 0, Math.max(texts.length - 1, 0));
      if (nextStep !== activeStep) {
        activeStep = nextStep;
        setActive(texts, activeStep);
        setActive(cards, activeStep);
        setActive(buttons, activeStep);
      }
    };

    return { update };
  }

  const heroStage = createScrollStage({
    sectionSelector: '#hero-scroll',
    videoSelector: '#scrollVideo',
    progressSelector: '.progress-line i',
    copySelector: '.hero-copy',
    buttonSelector: '.chapter-ui button',
    steps: 6
  });

  const midStage = createScrollStage({
    sectionSelector: '#showcase',
    videoSelector: '#midScrollVideo',
    progressSelector: '.mid-progress i',
    copySelector: '.mid-copy',
    buttonSelector: '.mid-chapter-ui button',
    steps: 4
  });

  const references = createReferences();
  const parallaxImages = $$('.section-bg img');

  const updateParallax = () => {
    if (isMobile() || reduceMotion()) return;
    parallaxImages.forEach(img => {
      const section = img.closest('section');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const progressValue = clamp((window.innerHeight * 0.5 - rect.top) / window.innerHeight, -1, 1);
      img.style.setProperty('--parallax', `${progressValue * 16}px`);
    });
  };

  let scheduled = false;
  const updateAll = () => {
    scheduled = false;
    heroStage.update();
    midStage.update();
    references.update();
    updateParallax();
  };
  const scheduleUpdate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateAll);
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(scheduleUpdate, 220), { passive: true });
  mobileQuery.addEventListener?.('change', scheduleUpdate);

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  }, { threshold: isMobile() ? 0.08 : 0.18, rootMargin: isMobile() ? '0px 0px -8% 0px' : '0px' });
  $$('.reveal').forEach(element => revealObserver.observe(element));

  // Cursor glow only on real pointer devices. No mobile RAF loop.
  const glow = $('.cursor-glow');
  if (glow && !isMobile() && !reduceMotion()) {
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;
    window.addEventListener('pointermove', event => {
      mouseX = event.clientX;
      mouseY = event.clientY;
    }, { passive: true });
    const cursorLoop = () => {
      glowX += (mouseX - glowX) * 0.075;
      glowY += (mouseY - glowY) * 0.075;
      glow.style.transform = `translate(${glowX}px,${glowY}px) translate(-50%,-50%)`;
      requestAnimationFrame(cursorLoop);
    };
    requestAnimationFrame(cursorLoop);
  }

  $$('img').forEach(img => {
    img.addEventListener('error', () => img.closest('section')?.classList.add('image-error'), { passive: true });
  });

  document.addEventListener('DOMContentLoaded', scheduleUpdate, { once: true });
  window.addEventListener('load', () => {
    scheduleUpdate();
    window.setTimeout(scheduleUpdate, 300);
    window.setTimeout(scheduleUpdate, 900);
  }, { once: true });
  requestAnimationFrame(updateAll);
})();







/* ==========================================================
   V35 MOBILE FRAME-SEQUENCE FIX
   Sichtbare Scroll-Animation auf Mobile ohne Video-Seeking.
   ========================================================== */
(() => {
  const mobileQuery = window.matchMedia('(max-width: 820px), (pointer: coarse)');
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const stages = [
    {
      section: document.querySelector('#hero-scroll'),
      frames: Array.from(document.querySelectorAll('.mobile-hero-frames img')),
      copies: Array.from(document.querySelectorAll('#hero-scroll .hero-copy')),
      buttons: Array.from(document.querySelectorAll('#hero-scroll .chapter-ui button')),
      progress: document.querySelector('#hero-scroll .progress-line i')
    },
    {
      section: document.querySelector('#showcase'),
      frames: Array.from(document.querySelectorAll('.mobile-mid-frames img')),
      copies: Array.from(document.querySelectorAll('#showcase .mid-copy')),
      buttons: Array.from(document.querySelectorAll('#showcase .mid-chapter-ui button')),
      progress: document.querySelector('#showcase .mid-progress i')
    }
  ].filter(stage => stage.section && stage.frames.length);

  let ticking = false;

  const sectionProgress = (section) => {
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    return clamp(-rect.top / scrollable, 0, 1);
  };

  const setActive = (items, activeIndex) => {
    items.forEach((item, index) => item.classList.toggle('active', index === activeIndex));
  };

  const update = () => {
    ticking = false;
    if (!mobileQuery.matches) return;

    stages.forEach(stage => {
      const p = sectionProgress(stage.section);
      const frameIndex = clamp(Math.floor(p * stage.frames.length), 0, stage.frames.length - 1);
      const copyIndex = clamp(Math.floor(p * Math.max(stage.copies.length, 1)), 0, Math.max(stage.copies.length - 1, 0));

      stage.frames.forEach((img, index) => {
        img.classList.toggle('is-active', index === frameIndex);
        img.classList.toggle('is-prev', index === frameIndex - 1);
      });

      setActive(stage.copies, copyIndex);
      setActive(stage.buttons, copyIndex);

      if (stage.progress) {
        stage.progress.style.width = `${p * 100}%`;
      }
    });
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('touchmove', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(requestUpdate, 250), { passive: true });
  mobileQuery.addEventListener?.('change', requestUpdate);

  document.addEventListener('DOMContentLoaded', requestUpdate, { once: true });
  window.addEventListener('load', () => {
    requestUpdate();
    setTimeout(requestUpdate, 350);
    setTimeout(requestUpdate, 900);
  }, { once: true });

  requestAnimationFrame(requestUpdate);
})();
