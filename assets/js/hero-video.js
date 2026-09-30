/* Scroll film: native source frames, independently decodable H.264 frames.
   One seek at a time; seeked immediately services the newest scroll position. */
(() => {
  'use strict';
  const section = document.querySelector('.hero-scroll');
  if (!section) return;
  const stage = section.querySelector('.hero-sticky');
  const media = section.querySelector('.hero-media');
  const cover = section.querySelector('.hero-mark-cover');
  const video = section.querySelector('.hero-video');
  const chapter = section.querySelector('[data-hero-step]');
  if (!stage || !video || !chapter) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 900px)');
  const shortScreen = matchMedia('(max-width: 760px) and (max-height: 600px)');
  const saveData = Boolean(navigator.connection?.saveData);
  const FPS = 30;
  let enabled = !reduced.matches && !saveData;
  let ready = false;
  let failed = false;
  let loaded = false;
  let mobileSource = compact.matches;
  let visible = true;
  let target = 0;
  let position = 0;
  let end = 0;
  let raf = 0;
  let lastTick = 0;
  let requestedTime = -1;

  video.muted = true;
  video.playsInline = true;
  const clamp = n => Math.max(0, Math.min(1, n));
  const running = () => enabled && !failed && visible && !document.hidden;

  function seek() {
    if (!running() || !ready || video.seeking) return;
    const time = Math.min(end, Math.round(position * end * FPS) / FPS);
    // Seeking to the same time need not fire seeked, so never lock on it.
    if (Math.abs(time - video.currentTime) < 0.001 || time === requestedTime) return;
    requestedTime = time;
    try { video.currentTime = time; }
    catch { requestedTime = -1; }
  }

  function schedule() {
    if (!raf && running()) raf = requestAnimationFrame(tick);
  }

  function tick(now) {
    raf = 0;
    if (!running()) { lastTick = 0; return; }
    const elapsed = lastTick ? now - lastTick : 16.67;
    lastTick = now;
    position += (target - position) * (1 - Math.exp(-elapsed / 85));
    if (Math.abs(target - position) < 0.0002) position = target;
    stage.style.setProperty('--hero-progress', position);
    chapter.textContent = position < .22 ? '01 / DEINE MARKE' : position < .67 ? '02 / DESIGN & ENTWICKLUNG' : '03 / DEIN DIGITALER AUFTRITT';
    seek();
    if (position !== target) schedule();
    else lastTick = 0;
  }

  // Match object-fit: contain exactly, including letterboxing on phones.
  function positionCover() {
    if (!media || !cover) return;
    const w = media.clientWidth, h = media.clientHeight;
    const fw = Math.min(w, h * 16 / 9), fh = fw * 9 / 16;
    Object.assign(cover.style, {
      left: `${(w - fw) / 2}px`, top: `${(h - fh) / 2}px`,
      width: `${fw * .075}px`, height: `${fh * .115}px`
    });
  }

  function measure() {
    const rect = section.getBoundingClientRect();
    visible = rect.bottom > 0 && rect.top < innerHeight;
    const travel = section.offsetHeight - stage.offsetHeight;
    target = travel > 1 ? clamp(-rect.top / travel) : 0;
    // The final frame is also resolved when a quick scroll leaves the hero.
    if (!visible) { position = target; lastTick = 0; }
    schedule();
  }

  function load() {
    if (loaded || !enabled || shortScreen.matches) return;
    loaded = true;
    video.src = `assets/video/kaiser-scroll-${mobileSource ? 'mobile' : 'desktop'}.mp4?v=hero-hq-1`;
    video.load();
  }

  function sync() {
    section.classList.toggle('is-scrubbing', enabled && !failed && !shortScreen.matches);
    section.classList.toggle('has-video', enabled && ready && !failed);
    if (!running()) { cancelAnimationFrame(raf); raf = 0; lastTick = 0; }
    load();
    measure();
  }

  video.addEventListener('loadedmetadata', () => {
    end = Math.max(0, video.duration - 1 / FPS);
    requestedTime = -1;
  });
  video.addEventListener('loadeddata', () => { ready = true; sync(); });
  video.addEventListener('seeked', () => {
    requestedTime = -1;
    seek();
  });
  video.addEventListener('error', () => {
    // Devices without a 4K decoder can still use the Full-HD film.
    if (!mobileSource) {
      mobileSource = true; loaded = false; ready = false; requestedTime = -1;
      section.classList.remove('has-video'); load();
    } else {
      failed = true; ready = false; sync(); // Keep the sharp poster, no fake motion.
    }
  });
  reduced.addEventListener('change', () => {
    enabled = !reduced.matches && !saveData; sync();
  });
  shortScreen.addEventListener('change', sync);
  addEventListener('scroll', measure, { passive: true });
  addEventListener('resize', () => { positionCover(); measure(); }, { passive: true });
  addEventListener('pageshow', measure);
  document.addEventListener('visibilitychange', () => {
    lastTick = 0;
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
    else measure();
  });
  if ('ResizeObserver' in window) {
    new ResizeObserver(measure).observe(stage);
    if (media) new ResizeObserver(positionCover).observe(media);
  }
  positionCover();
  sync();
})();
