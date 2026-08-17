const MEDIA = window.__MEDIA || {};

const resolveMedia = (key) => MEDIA[key] || '';

document.querySelectorAll('[data-media]').forEach((el) => {
  const src = resolveMedia(el.dataset.media);
  if (!src) return;
  if (el.tagName === 'VIDEO') {
    el.dataset.src = src;
    const poster = resolveMedia(el.dataset.poster);
    if (poster) el.poster = poster;
  } else {
    el.src = src;
  }
});

document.querySelectorAll('.project-card').forEach((card) => {
  const poster = resolveMedia(card.dataset.posterKey);
  if (poster) card.style.setProperty('--poster', `url("${poster}")`);
});

const cards = [...document.querySelectorAll('.project-card')];
const modal = document.querySelector('#project-modal');
const modalVideo = document.querySelector('#modal-video');
const modalTitle = document.querySelector('#modal-title');
const modalMeta = document.querySelector('#modal-meta');
const closeButton = document.querySelector('.modal-close');

const ensureSource = (video) => {
  if (!video || video.src) return;
  const source = video.dataset.src;
  if (!source) return;
  video.src = source;
  video.load();
};

const startPreview = (card) => {
  if (!window.matchMedia('(hover: hover)').matches) return;
  const video = card.querySelector('.card-video');
  ensureSource(video);
  video.muted = true;
  const play = video.play();
  if (play?.catch) play.catch(() => {});
};

const stopPreview = (card) => {
  const video = card.querySelector('.card-video');
  if (!video) return;
  video.pause();
  try { video.currentTime = 0; } catch (_) {}
};

cards.forEach((card) => {
  card.addEventListener('mouseenter', () => startPreview(card));
  card.addEventListener('mouseleave', () => stopPreview(card));
  card.addEventListener('focus', () => startPreview(card));
  card.addEventListener('blur', () => stopPreview(card));
  card.addEventListener('click', () => {
    cards.forEach(stopPreview);
    modalTitle.textContent = card.dataset.title;
    modalMeta.textContent = card.dataset.meta;
    modalVideo.src = resolveMedia(card.dataset.videoKey);
    modalVideo.load();
    modal.showModal();
    document.body.classList.add('modal-open');
    const play = modalVideo.play();
    if (play?.catch) play.catch(() => {});
  });
});

const closeModal = () => {
  modalVideo.pause();
  modalVideo.removeAttribute('src');
  modalVideo.load();
  if (modal.open) modal.close();
  document.body.classList.remove('modal-open');
};

closeButton.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});
modal.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const video = entry.target.querySelector('.card-video');
    if (video) video.preload = 'metadata';
    observer.unobserve(entry.target);
  });
}, { rootMargin: '350px 0px' });

document.querySelectorAll('.project').forEach((project) => observer.observe(project));