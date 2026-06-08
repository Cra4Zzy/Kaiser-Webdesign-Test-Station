const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

document.body.classList.add('lock');

window.addEventListener('load', () => {
  setTimeout(() => {
    $('.loader')?.classList.add('hide');
    document.body.classList.remove('lock');
  }, 650);
});

$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

function enableVideoScrubbing(video){
  if (!video) return;
  video.pause();
  video.muted = true;
  video.playsInline = true;

  const unlock = () => {
    video.play().then(() => video.pause()).catch(() => {});
  };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true });
}

function createScrollFilm({sectionSelector, videoSelector, progressSelector, copySelector, buttonSelector, steps, smooth = 0.18}){
  const section = $(sectionSelector);
  const video = $(videoSelector);
  const progress = $(progressSelector);
  const copies = $$(copySelector);
  const buttons = $$(buttonSelector);

  let duration = 8;
  let current = 0;
  let target = 0;
  let ready = false;

  if (!section || !video) return { update(){} };

  enableVideoScrubbing(video);

  video.addEventListener('loadedmetadata', () => {
    duration = video.duration || duration;
    ready = true;
    try { video.currentTime = 0.001; } catch(e) {}
  });

  video.addEventListener('canplay', () => section.classList.add('video-ready'));
  video.addEventListener('error', () => console.error('Video konnte nicht geladen werden:', video.getAttribute('src')));

  const setStep = (step) => {
    copies.forEach((el, i) => el.classList.toggle('active', i === step));
    buttons.forEach((el, i) => el.classList.toggle('active', i === step));
  };

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const scrollable = section.offsetHeight - innerHeight;
      const top = section.offsetTop + (i / Math.max(steps - 1, 1)) * scrollable;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  const update = (force = false) => {
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, section.offsetHeight - innerHeight);
    const p = clamp(-rect.top / scrollable, 0, 1);

    if (progress) progress.style.width = `${p * 100}%`;

    const step = clamp(Math.floor(p * steps), 0, steps - 1);
    setStep(step);

    if (ready) {
      target = p * Math.max(duration - 0.08, 0.1);
      current += (target - current) * (force ? 1 : smooth);
      if (Math.abs(video.currentTime - current) > 0.025 || force) {
        try { video.currentTime = current; } catch(e) {}
      }
    }
  };

  return { update };
}

function createReferenceShowcase(){
  const section = $('#references');
  const progress = $('.refs-progress i');
  const texts = $$('.refs-text');
  const cards = $$('.refs-card');
  const buttons = $$('.refs-tabs button');
  if (!section) return { update(){} };

  const setStep = (step) => {
    texts.forEach((el, i) => el.classList.toggle('active', i === step));
    cards.forEach((el, i) => el.classList.toggle('active', i === step));
    buttons.forEach((el, i) => el.classList.toggle('active', i === step));
  };

  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      const scrollable = section.offsetHeight - innerHeight;
      const top = section.offsetTop + (i / Math.max(buttons.length - 1, 1)) * scrollable;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  const update = () => {
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, section.offsetHeight - innerHeight);
    const p = clamp(-rect.top / scrollable, 0, 1);
    if (progress) progress.style.width = `${p * 100}%`;
    const step = clamp(Math.floor(p * texts.length), 0, texts.length - 1);
    setStep(step);
  };

  return { update };
}

const heroFilm = createScrollFilm({
  sectionSelector: '#hero-scroll',
  videoSelector: '#scrollVideo',
  progressSelector: '.progress-line i',
  copySelector: '.hero-copy',
  buttonSelector: '.chapter-ui button',
  steps: 6,
  smooth: 0.18
});

const midFilm = createScrollFilm({
  sectionSelector: '#showcase',
  videoSelector: '#midScrollVideo',
  progressSelector: '.mid-progress i',
  copySelector: '.mid-copy',
  buttonSelector: '.mid-chapter-ui button',
  steps: 4,
  smooth: 0.18
});

const references = createReferenceShowcase();

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('show');
  });
}, { threshold: 0.18 });
$$('.reveal').forEach(el => revealObserver.observe(el));

let mx = innerWidth / 2, my = innerHeight / 2, gx = mx, gy = my;
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
  parallaxImages.forEach(img => {
    const section = img.closest('section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const p = clamp((innerHeight * 0.5 - rect.top) / innerHeight, -1, 1);
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

$$('.refs-card img, .section-bg img').forEach(img => {
  img.addEventListener('error', () => console.error('Bild konnte nicht geladen werden:', img.getAttribute('src')));
});


/* V15 final safety: ensure reveal elements activate if already in viewport on load */
window.addEventListener('load', () => {
  document.querySelectorAll('.reveal').forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < innerHeight * 0.92) el.classList.add('show');
  });
});


/* ==========================================================
   V18 References real scroll fix
   Robust independent updater for website references.
   ========================================================== */
(() => {
  const section = document.querySelector('#references');
  if (!section) return;

  const texts = Array.from(section.querySelectorAll('.refs-text'));
  const cards = Array.from(section.querySelectorAll('.refs-card'));
  const buttons = Array.from(section.querySelectorAll('.refs-tabs button'));
  const progress = section.querySelector('.refs-progress i');

  if (!texts.length || !cards.length) return;

  let activeStep = -1;

  const clampLocal = (value, min, max) => Math.min(max, Math.max(min, value));

  const setStep = (step) => {
    if (step === activeStep) return;
    activeStep = step;

    texts.forEach((el, index) => el.classList.toggle('active', index === step));
    cards.forEach((el, index) => el.classList.toggle('active', index === step));
    buttons.forEach((el, index) => el.classList.toggle('active', index === step));
  };

  const updateReferences = () => {
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    const progressValue = clampLocal(-rect.top / scrollable, 0, 1);

    if (progress) progress.style.width = `${progressValue * 100}%`;

    // Use rounded segment mapping so the last item is reachable but not overly long.
    const step = clampLocal(Math.floor(progressValue * texts.length), 0, texts.length - 1);
    setStep(step);

    requestAnimationFrame(updateReferences);
  };

  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
      const top = section.offsetTop + (index / Math.max(texts.length - 1, 1)) * scrollable;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // Start after layout settles
  requestAnimationFrame(() => {
    setStep(0);
    updateReferences();
  });
})();
