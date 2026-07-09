(() => {
  const doc = document.documentElement;
  const body = document.body;
  const header = document.querySelector('[data-header]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  window.addEventListener('load', () => body.classList.add('is-loaded'), { once: true });

  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', (event) => {
      doc.style.setProperty('--mx', `${event.clientX}px`);
      doc.style.setProperty('--my', `${event.clientY}px`);
    }, { passive: true });
  }

  const setHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 32);
  };
  setHeader();
  window.addEventListener('scroll', setHeader, { passive: true });

  const revealEls = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  class ScrollVideo {
    constructor(section) {
      this.section = section;
      this.video = section.querySelector('[data-video]');
      this.fadeSteps = [...section.querySelectorAll('[data-fade-step]')];
      this.heroCopy = section.querySelector('.hero-copy');
      this.heroLinks = section.querySelector('.hero-links');
      this.heroMeta = section.querySelector('.hero-meta');
      this.startTime = Number(section.dataset.videoStart || 0);
      this.endTimeSetting = Number(section.dataset.videoEnd || 0);
      this.smoothing = Number(section.dataset.smoothing || 0.055);
      this.targetTime = this.startTime;
      this.currentVirtualTime = this.startTime;
      this.progress = this.getProgress();
      this.duration = 0;
      this.ready = false;
      this.active = true;
      this.lastSeekAt = 0;

      if (!this.video) return;
      this.video.muted = true;
      this.video.playsInline = true;
      this.video.preload = 'auto';
      this.video.pause();

      this.video.addEventListener('loadedmetadata', () => {
        this.duration = Math.max(0, this.video.duration || 0);
        this.ready = this.duration > 0;
        const safeStart = clamp(this.startTime, 0, Math.max(0, this.duration - 0.16));
        this.startTime = safeStart;
        this.currentVirtualTime = safeStart;
        try { this.video.currentTime = safeStart + 0.01; } catch (_) {}
      }, { once: true });

      this.video.addEventListener('canplay', () => {
        this.ready = (this.video.duration || 0) > 0;
      });

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            this.active = entry.isIntersecting;
            if (entry.isIntersecting) {
              this.video.preload = 'auto';
              try { this.video.load(); } catch (_) {}
            }
          });
        }, { threshold: 0, rootMargin: '65% 0px 65% 0px' });
        io.observe(section);
      }
    }

    getProgress() {
      const rect = this.section.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      return clamp(-rect.top / scrollable);
    }

    updateFadeSteps(progress) {
      this.fadeSteps.forEach((step) => {
        const start = Number(step.dataset.start || 0);
        const end = Number(step.dataset.end || 1);
        const fade = Math.min(0.18, Math.max(0.075, (end - start) * 0.44));
        const inOpacity = smoothstep(start, start + fade, progress);
        const outOpacity = 1 - smoothstep(end - fade, end, progress);
        const opacity = clamp(inOpacity * outOpacity);
        const lift = 18 - (opacity * 18);
        step.style.opacity = opacity.toFixed(3);
        step.style.setProperty('--scene-opacity', opacity.toFixed(3));
        step.style.transform = `translate3d(0, ${lift.toFixed(2)}px, 0)`;
        step.style.filter = opacity < 0.999 ? `blur(${((1 - opacity) * 5).toFixed(2)}px)` : 'none';
        step.style.visibility = opacity < 0.035 ? 'hidden' : 'visible';
      });
    }

    updateHeroChrome(progress) {
      if (!this.heroCopy) return;
      const copyOut = 1 - smoothstep(0.80, 0.94, progress);
      const linksInFirstScene = 1 - smoothstep(0.31, 0.40, progress);
      const metaOut = 1 - smoothstep(0.36, 0.62, progress);
      this.heroCopy.style.opacity = copyOut.toFixed(3);
      if (this.heroLinks) {
        const linksOpacity = clamp(copyOut * linksInFirstScene);
        this.heroLinks.style.opacity = linksOpacity.toFixed(3);
        this.heroLinks.style.pointerEvents = linksOpacity < 0.08 ? 'none' : 'auto';
        this.heroLinks.style.transform = `translate3d(0, ${(1 - linksOpacity) * 16}px, 0)`;
      }
      if (this.heroMeta) this.heroMeta.style.opacity = metaOut.toFixed(3);
    }

    update() {
      const targetProgress = this.getProgress();
      const smoothing = reduceMotion ? 1 : this.smoothing;
      this.progress = lerp(this.progress, targetProgress, smoothing);
      const progress = clamp(this.progress);
      this.section.style.setProperty('--progress', progress.toFixed(4));

      if (this.ready && this.active && !reduceMotion) {
        const configuredEnd = this.endTimeSetting > 0 ? this.endTimeSetting : this.duration - 0.08;
        const end = clamp(configuredEnd, this.startTime + 0.12, Math.max(this.startTime + 0.12, this.duration - 0.06));
        this.targetTime = this.startTime + progress * (end - this.startTime);
        this.currentVirtualTime = lerp(this.currentVirtualTime, this.targetTime, 0.18);

        const diff = Math.abs(this.video.currentTime - this.currentVirtualTime);
        const now = performance.now();
        if (diff > 0.018 && now - this.lastSeekAt > 28) {
          this.lastSeekAt = now;
          try { this.video.currentTime = this.currentVirtualTime; } catch (_) {}
        }
      }

      this.updateFadeSteps(progress);
      this.updateHeroChrome(progress);
    }
  }

  const scrollVideos = [...document.querySelectorAll('[data-scroll-video]')].map((section) => new ScrollVideo(section));

  const parallaxEls = [...document.querySelectorAll('[data-parallax]')];
  const updateParallax = () => {
    parallaxEls.forEach((el) => {
      const section = el.closest('.scroll-video-section');
      const rect = section?.getBoundingClientRect();
      if (!rect) return;
      const progress = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
      const amount = Number(el.dataset.parallax || 0);
      el.style.setProperty('--parallax-y', `${(progress * amount).toFixed(2)}px`);
    });
  };

  const frame = () => {
    scrollVideos.forEach((sv) => sv.update());
    if (!reduceMotion) updateParallax();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('.social-video').forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    const play = () => video.play().catch(() => {});
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) play();
          else video.pause();
        });
      }, { threshold: 0.25 });
      observer.observe(video);
    } else {
      play();
    }
  });
})();
