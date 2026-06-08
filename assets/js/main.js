const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isMobileViewport = () => window.matchMedia('(max-width: 820px)').matches;
const needsScrollFrameFallback = () => isiOS && isMobileViewport();

const viewportHeight = () => {
  const vv = window.visualViewport;
  return vv && vv.height ? vv.height : window.innerHeight;
};

function setViewportUnit(){
  document.documentElement.style.setProperty('--kw-vh', `${viewportHeight() * 0.01}px`);
}
setViewportUnit();
window.addEventListener('resize', setViewportUnit, { passive: true });
window.visualViewport?.addEventListener('resize', setViewportUnit, { passive: true });

document.body.classList.add('lock');

window.addEventListener('load', () => {
  setTimeout(() => {
    $('.loader')?.classList.add('hide');
    document.body.classList.remove('lock');
    setViewportUnit();
  }, 650);
});

// Safety: mobile Safari may delay the load event when media is stubborn.
setTimeout(() => {
  $('.loader')?.classList.add('hide');
  document.body.classList.remove('lock');
}, 2200);

$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

function preloadFrames(frames){
  frames.forEach(src => {
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  });
}

function createFrameFallback(section, video, frames){
  if (!section || !video || !frames?.length) return null;

  const stage = video.parentElement;
  if (!stage) return null;

  const frame = document.createElement('img');
  frame.className = 'ios-scroll-frame';
  frame.alt = '';
  frame.setAttribute('aria-hidden', 'true');
  frame.decoding = 'async';
  frame.loading = 'eager';
  frame.src = frames[0];
  stage.insertBefore(frame, video);

  let active = false;
  let currentIndex = 0;

  const activate = () => {
    if (active) return;
    active = true;
    section.classList.add('ios-scroll-fallback', 'video-ready');
    preloadFrames(frames);
    try { video.pause(); } catch(e) {}
    video.preload = 'none';
  };

  const update = (progress) => {
    if (!active) return;
    const index = clamp(Math.round(progress * (frames.length - 1)), 0, frames.length - 1);
    if (index !== currentIndex) {
      currentIndex = index;
      frame.src = frames[index];
    }
  };

  return { activate, update };
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

  const unlock = () => {
    video.muted = true;
    video.play().then(() => video.pause()).catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
}

function createScrollFilm({ sectionSelector, videoSelector, progressSelector, copySelector, buttonSelector, steps, smooth = 0.18, frames = [] }){
  const section = $(sectionSelector);
  const video = $(videoSelector);
  const progress = $(progressSelector);
  const copies = $$(copySelector);
  const buttons = $$(buttonSelector);

  let duration = 8;
  let current = 0;
  let target = 0;
  let ready = false;
  let lastProgress = 0;

  if (!section || !video) return { update(){} };

  const fallback = createFrameFallback(section, video, frames);
  if (needsScrollFrameFallback() && fallback) fallback.activate();

  if (!section.classList.contains('ios-scroll-fallback')) {
    enableVideoScrubbing(video);
  }

  const markReady = () => {
    duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : duration;
    ready = true;
    section.classList.add('video-ready');
    try { video.currentTime = Math.max(0.001, lastProgress * Math.max(duration - 0.08, 0.1)); } catch(e) {}
  };

  if (video.readyState >= 1) markReady();
  video.addEventListener('loadedmetadata', markReady, { once: true });
  video.addEventListener('canplay', () => section.classList.add('video-ready'));
  video.addEventListener('error', () => {
    if (fallback) fallback.activate();
    console.error('Video konnte nicht geladen werden:', video.getAttribute('src'));
  });

  // If iOS/Safari or hosting refuses reliable seeking, continue with frames instead of a frozen video.
  setTimeout(() => {
    if (!ready && fallback) fallback.activate();
  }, 1800);

  const setStep = (step) => {
    copies.forEach((el, i) => el.classList.toggle('active', i === step));
    buttons.forEach((el, i) => el.classList.toggle('active', i === step));
  };

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const vh = viewportHeight();
      const scrollable = Math.max(1, section.offsetHeight - vh);
      const top = section.offsetTop + (i / Math.max(steps - 1, 1)) * scrollable;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  const update = (force = false) => {
    const rect = section.getBoundingClientRect();
    const vh = viewportHeight();
    const scrollable = Math.max(1, section.offsetHeight - vh);
    const p = clamp(-rect.top / scrollable, 0, 1);
    lastProgress = p;

    if (progress) progress.style.width = `${p * 100}%`;

    const step = clamp(Math.floor(p * steps), 0, steps - 1);
    setStep(step);

    if (fallback) fallback.update(p);

    if (ready && !section.classList.contains('ios-scroll-fallback')) {
      target = p * Math.max(duration - 0.08, 0.1);
      current += (target - current) * (force ? 1 : smooth);
      if (Math.abs(video.currentTime - current) > 0.025 || force) {
        try {
          if (typeof video.fastSeek === 'function' && Math.abs(video.currentTime - current) > 0.18) {
            video.fastSeek(current);
          } else {
            video.currentTime = current;
          }
        } catch(e) {
          if (fallback) fallback.activate();
        }
      }
    }
  };

  return { update };
}

function createReferenceShowcase(){
  const section = $('#references');
  const progress = $('.refs-progress i');
  const texts = $$('.refs-text', section || document);
  const cards = $$('.refs-card', section || document);
  const buttons = $$('.refs-tabs button', section || document);
  if (!section || !texts.length || !cards.length) return { update(){} };

  let activeStep = -1;

  const setStep = (step) => {
    if (step === activeStep) return;
    activeStep = step;
    texts.forEach((el, i) => el.classList.toggle('active', i === step));
    cards.forEach((el, i) => el.classList.toggle('active', i === step));
    buttons.forEach((el, i) => el.classList.toggle('active', i === step));
  };

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const vh = viewportHeight();
      const scrollable = Math.max(1, section.offsetHeight - vh);
      const top = section.offsetTop + (i / Math.max(texts.length - 1, 1)) * scrollable;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  const update = () => {
    const rect = section.getBoundingClientRect();
    const vh = viewportHeight();
    const scrollable = Math.max(1, section.offsetHeight - vh);
    const p = clamp(-rect.top / scrollable, 0, 1);
    if (progress) progress.style.width = `${p * 100}%`;
    const step = clamp(Math.floor(p * texts.length), 0, texts.length - 1);
    setStep(step);
  };

  setStep(0);
  return { update };
}

const HERO_FRAMES = Array.from({ length: 12 }, (_, i) => `./assets/img/scroll-fallback/hero-${String(i + 1).padStart(2, '0')}.jpg`);
const MID_FRAMES = Array.from({ length: 10 }, (_, i) => `./assets/img/scroll-fallback/mid-${String(i + 1).padStart(2, '0')}.jpg`);

const heroFilm = createScrollFilm({
  sectionSelector: '#hero-scroll',
  videoSelector: '#scrollVideo',
  progressSelector: '.progress-line i',
  copySelector: '.hero-copy',
  buttonSelector: '.chapter-ui button',
  steps: 6,
  smooth: 0.18,
  frames: HERO_FRAMES
});

const midFilm = createScrollFilm({
  sectionSelector: '#showcase',
  videoSelector: '#midScrollVideo',
  progressSelector: '.mid-progress i',
  copySelector: '.mid-copy',
  buttonSelector: '.mid-chapter-ui button',
  steps: 4,
  smooth: 0.18,
  frames: MID_FRAMES
});

const references = createReferenceShowcase();

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('show');
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal').forEach(el => revealObserver.observe(el));
} else {
  $$('.reveal').forEach(el => el.classList.add('show'));
}

let mx = window.innerWidth / 2, my = window.innerHeight / 2, gx = mx, gy = my;
const glow = $('.cursor-glow');
window.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
function cursorLoop(){
  gx += (mx - gx) * .075;
  gy += (my - gy) * .075;
  if (glow) glow.style.transform = `translate(${gx}px,${gy}px) translate(-50%,-50%)`;
  requestAnimationFrame(cursorLoop);
}
cursorLoop();

const parallaxImages = $$('.section-bg img');
function updateParallax(){
  const vh = viewportHeight();
  parallaxImages.forEach(img => {
    const section = img.closest('section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const p = clamp((vh * 0.5 - rect.top) / vh, -1, 1);
    img.style.setProperty('--parallax', `${p * 16}px`);
  });
}

function tick(){
  heroFilm.update();
  midFilm.update();
  references.update();
  updateParallax();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

$$('.refs-card img, .section-bg img, .ios-scroll-frame').forEach(img => {
  img.addEventListener('error', () => console.error('Bild konnte nicht geladen werden:', img.getAttribute('src')));
});

window.addEventListener('load', () => {
  document.querySelectorAll('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < viewportHeight() * 0.92) el.classList.add('show');
  });
});
