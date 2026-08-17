const MEDIA = window.__MEDIA || {};
const resolveMedia = (key) => MEDIA[key] || '';

document.querySelectorAll('[data-media]').forEach((el) => {
  const src = resolveMedia(el.dataset.media);
  if (!src) return;
  if (el.tagName === 'VIDEO') {
    // Keep the sharp poster visible on portfolio cards. Do not autoplay low-res previews.
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

const directVideo = (card) => {
  const project = card.closest('.project')?.dataset.project;
  if (project === 'beauty') return 'assets/video/haarstudio-hq-v8.mp4?v=8';
  if (project === 'grooming') return 'assets/video/barbershop-hq-v8.mp4?v=8';
  return resolveMedia(card.dataset.videoKey);
};

cards.forEach((card) => {
  card.addEventListener('click', () => {
    modalTitle.textContent = card.dataset.title;
    modalMeta.textContent = card.dataset.meta;
    modalVideo.src = directVideo(card);
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