const burger = document.querySelector('[data-burger]');
const navWrap = document.querySelector('[data-nav-wrap]');
const siteHeader = document.querySelector('[data-site-header]');

function closeMenu() {
  if (!burger || !navWrap) return;
  burger.setAttribute('aria-expanded', 'false');
  navWrap.classList.remove('is-open');
}

if (burger && navWrap) {
  burger.addEventListener('click', () => {
    const expanded = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!expanded));
    navWrap.classList.toggle('is-open', !expanded);
  });
  navWrap.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });
}

function syncHeader() {
  siteHeader?.classList.toggle('is-scrolled', window.scrollY > 24);
}
syncHeader();
window.addEventListener('scroll', syncHeader, { passive: true });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-reveal]').forEach((el, index) => {
  el.style.transitionDelay = `${Math.min(index * 45, 220)}ms`;
});

if (reduceMotion) {
  document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
}

const yearNode = document.querySelector('[data-year]');
if (yearNode) yearNode.textContent = new Date().getFullYear();

const form = document.querySelector('[data-contact-form]');
if (form) {
  const submitButton = form.querySelector('[data-submit-button]');
  form.addEventListener('submit', () => {
    if (!form.checkValidity()) return;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = 'Wird sicher gesendet …';
    }
  });
}

const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));
const filterItems = Array.from(document.querySelectorAll('[data-service-card]'));
const serviceGrid = document.querySelector('#service-grid');

if (filterButtons.length && filterItems.length) {
  const applyServiceFilter = (category) => {
    if (serviceGrid) serviceGrid.setAttribute('aria-busy', 'true');

    filterButtons.forEach((button) => {
      const selected = button.dataset.filter === category;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });

    filterItems.forEach((item) => {
      const categories = (item.dataset.category || '')
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean);
      const matches = category === 'all' || categories.includes(category);

      item.classList.toggle('is-filtered-out', !matches);
      item.toggleAttribute('hidden', !matches);
      item.setAttribute('aria-hidden', String(!matches));
    });

    window.requestAnimationFrame(() => {
      if (serviceGrid) serviceGrid.setAttribute('aria-busy', 'false');
    });
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => applyServiceFilter(button.dataset.filter || 'all'));
  });

  applyServiceFilter('all');
}

const gallery = document.querySelector('[data-gallery-slider]');
if (gallery) {
  const track = gallery.querySelector('.gallery-track');
  const slides = Array.from(gallery.querySelectorAll('.gallery-slide'));
  const dotsWrap = gallery.querySelector('[data-gallery-dots]');
  const counter = gallery.querySelector('[data-gallery-counter]');
  const progress = gallery.querySelector('[data-gallery-progress]');
  const prev = gallery.querySelector('[data-gallery-prev]');
  const next = gallery.querySelector('[data-gallery-next]');
  let index = 0;
  let autoPlay = null;
  let startX = 0;
  let currentX = 0;

  if (dotsWrap) {
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `gallery-dot${i === 0 ? ' is-active' : ''}`;
      dot.setAttribute('aria-label', `Bild ${i + 1} anzeigen`);
      dot.addEventListener('click', () => { goTo(i); restartAutoPlay(); });
      dotsWrap.appendChild(dot);
    });
  }
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('.gallery-dot')) : [];

  function update() {
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    if (counter) counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    if (progress) progress.style.transform = `scaleX(${(index + 1) / slides.length})`;
  }

  function goTo(newIndex) {
    index = (newIndex + slides.length) % slides.length;
    update();
  }

  function stopAutoPlay() {
    if (autoPlay) window.clearInterval(autoPlay);
    autoPlay = null;
  }

  function startAutoPlay() {
    if (reduceMotion || document.hidden) return;
    stopAutoPlay();
    autoPlay = window.setInterval(() => goTo(index + 1), 5600);
  }

  function restartAutoPlay() { stopAutoPlay(); startAutoPlay(); }

  prev?.addEventListener('click', () => { goTo(index - 1); restartAutoPlay(); });
  next?.addEventListener('click', () => { goTo(index + 1); restartAutoPlay(); });
  gallery.addEventListener('mouseenter', stopAutoPlay);
  gallery.addEventListener('mouseleave', startAutoPlay);
  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') { goTo(index - 1); restartAutoPlay(); }
    if (event.key === 'ArrowRight') { goTo(index + 1); restartAutoPlay(); }
  });
  gallery.setAttribute('tabindex', '0');

  track.addEventListener('touchstart', (event) => {
    startX = event.touches[0].clientX;
    currentX = startX;
    stopAutoPlay();
  }, { passive: true });
  track.addEventListener('touchmove', (event) => { currentX = event.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', () => {
    const delta = currentX - startX;
    if (Math.abs(delta) > 45) goTo(delta < 0 ? index + 1 : index - 1);
    startAutoPlay();
  });
  document.addEventListener('visibilitychange', () => document.hidden ? stopAutoPlay() : startAutoPlay());

  update();
  startAutoPlay();
}
