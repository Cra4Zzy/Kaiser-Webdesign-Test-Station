(() => {
  "use strict";

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const smoothstep = (edge0, edge1, value) => {
    const x = clamp((value - edge0) / Math.max(0.0001, edge1 - edge0));
    return x * x * (3 - 2 * x);
  };
  const frameName = (index) => String(index + 1).padStart(4, "0");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 760px)").matches;

  document.documentElement.classList.add("has-js");

  class TaskQueue {
    constructor(limit = 6) {
      this.limit = limit;
      this.active = 0;
      this.tasks = [];
    }

    add(task, priority = 0) {
      return new Promise((resolve, reject) => {
        this.tasks.push({ task, priority, resolve, reject });
        this.tasks.sort((a, b) => b.priority - a.priority);
        this.run();
      });
    }

    run() {
      while (this.active < this.limit && this.tasks.length) {
        const item = this.tasks.shift();
        this.active += 1;
        Promise.resolve()
          .then(item.task)
          .then(item.resolve, item.reject)
          .finally(() => {
            this.active -= 1;
            this.run();
          });
      }
    }
  }

  const networkQueue = new TaskQueue(isMobile ? 4 : 7);
  const sequencePlayers = [];
  let renderRequested = false;

  function requestRender() {
    if (renderRequested) return;
    renderRequested = true;
    requestAnimationFrame(renderLoop);
  }

  function renderLoop() {
    renderRequested = false;
    let keepAlive = false;

    sequencePlayers.forEach((player) => {
      if (player.step()) keepAlive = true;
    });

    if (keepAlive) requestRender();
  }

  class FrameSequence {
    constructor(section) {
      this.section = section;
      this.canvas = section.querySelector("[data-sequence-canvas]");
      this.context = this.canvas.getContext("2d", { alpha: false, desynchronized: true });
      this.count = Number(section.dataset.frameCount) || 1;
      this.pathTemplate = section.dataset.framePath;
      this.packSrc = section.dataset.packSrc;
      this.packBlob = null;
      this.packPromise = null;
      this.packFailed = false;
      this.priority = section.dataset.priority === "true";
      this.scenes = [...section.querySelectorAll("[data-scene]")];
      this.progressBar = section.querySelector("[data-film-progress]");
      this.chapterDots = [...section.querySelectorAll(".chapter-dots span")];
      this.scrollCue = section.querySelector(".scroll-indicator");
      this.blobs = new Array(this.count);
      this.requests = new Array(this.count);
      this.bitmaps = new Map();
      this.decodes = new Map();
      this.currentProgress = 0;
      this.targetProgress = 0;
      this.lastFrame = -1;
      this.top = 0;
      this.distance = 1;
      this.nearViewport = this.priority;
      this.didStartFullLoad = false;
      this.maxBitmaps = isMobile ? 15 : 26;
      this.destroyed = false;
      this.drawPending = false;
      this.directFileMode = window.location.protocol === "file:";

      this.measure();
      this.resize();
      this.updateScenes(0);

      if ("ResizeObserver" in window) {
        this.resizeObserver = new ResizeObserver(() => {
          this.measure();
          this.resize();
        });
        this.resizeObserver.observe(this.section);
      }
    }

    url(index) {
      if (!this.pathTemplate) return "";
      return this.pathTemplate.replace("{frame}", frameName(index));
    }

    async loadPack(onProgress) {
      if (!this.packSrc || this.packFailed) return null;
      if (this.packBlob) {
        if (onProgress) onProgress(this.packBlob.size, this.packBlob.size);
        return this.packBlob;
      }
      if (this.packPromise) return this.packPromise;

      this.packPromise = (async () => {
        const response = await fetch(this.packSrc, { cache: "force-cache" });
        if (!response.ok) throw new Error("Sequenzdatei konnte nicht geladen werden.");

        const totalBytes = Number(response.headers.get("content-length")) || 0;
        let packBlob;

        if (response.body && typeof response.body.getReader === "function") {
          const reader = response.body.getReader();
          const chunks = [];
          let loadedBytes = 0;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            loadedBytes += value.byteLength;
            if (onProgress && totalBytes) onProgress(loadedBytes, totalBytes);
          }

          packBlob = new Blob(chunks, { type: "application/octet-stream" });
        } else {
          packBlob = await response.blob();
        }

        if (onProgress) onProgress(packBlob.size, totalBytes || packBlob.size);

        const prefix = await packBlob.slice(0, 12).arrayBuffer();
        const prefixBytes = new Uint8Array(prefix, 0, 8);
        const magic = String.fromCharCode(...prefixBytes);
        const prefixView = new DataView(prefix);
        const packedCount = prefixView.getUint32(8, true);

        if (magic !== "KSEQ0001" || packedCount !== this.count) {
          throw new Error("Ungültige Sequenzdatei.");
        }

        const headerSize = 12 + (packedCount + 1) * 4;
        const header = await packBlob.slice(0, headerSize).arrayBuffer();
        const headerView = new DataView(header);

        for (let index = 0; index < packedCount; index += 1) {
          const start = headerView.getUint32(12 + index * 4, true);
          const end = headerView.getUint32(12 + (index + 1) * 4, true);
          this.blobs[index] = packBlob.slice(headerSize + start, headerSize + end, "image/webp");
        }

        this.packBlob = packBlob;
        return packBlob;
      })().catch((error) => {
        this.packFailed = true;
        console.warn("Kaiser Webdesign: Scrollsequenz konnte nicht geladen werden.", error);
        return null;
      });

      return this.packPromise;
    }

    async fetchFrame(index, priority = 0) {
      const safeIndex = clamp(Math.round(index), 0, this.count - 1);
      if (this.blobs[safeIndex]) return this.blobs[safeIndex];
      if (this.requests[safeIndex]) return this.requests[safeIndex];

      if (this.packSrc) {
        this.requests[safeIndex] = this.loadPack().then(() => this.blobs[safeIndex] || null);
        return this.requests[safeIndex];
      }

      if (this.directFileMode) {
        const directUrl = this.url(safeIndex);
        this.blobs[safeIndex] = directUrl;
        this.requests[safeIndex] = Promise.resolve(directUrl);
        return this.requests[safeIndex];
      }

      this.requests[safeIndex] = networkQueue
        .add(async () => {
          const response = await fetch(this.url(safeIndex), { cache: "force-cache" });
          if (!response.ok) throw new Error(`Frame ${safeIndex + 1} konnte nicht geladen werden.`);
          const blob = await response.blob();
          this.blobs[safeIndex] = blob;
          return blob;
        }, priority)
        .catch(() => null);

      return this.requests[safeIndex];
    }

    async decode(index, priority = 0) {
      const safeIndex = clamp(Math.round(index), 0, this.count - 1);
      if (this.bitmaps.has(safeIndex)) return this.bitmaps.get(safeIndex);
      if (this.decodes.has(safeIndex)) return this.decodes.get(safeIndex);

      const promise = this.fetchFrame(safeIndex, priority)
        .then(async (blob) => {
          if (!blob || this.destroyed) return null;

          let image;
          if (typeof blob === "string") {
            image = await this.urlToImage(blob);
          } else if ("createImageBitmap" in window) {
            image = await createImageBitmap(blob);
          } else {
            image = await this.blobToImage(blob);
          }

          if (this.destroyed) {
            if (image && typeof image.close === "function") image.close();
            return null;
          }

          this.bitmaps.set(safeIndex, image);
          this.decodes.delete(safeIndex);
          this.trimBitmapCache(safeIndex);
          requestRender();
          return image;
        })
        .catch(() => {
          this.decodes.delete(safeIndex);
          return null;
        });

      this.decodes.set(safeIndex, promise);
      return promise;
    }

    blobToImage(blob) {
      const url = URL.createObjectURL(blob);
      return this.urlToImage(url, true);
    }

    urlToImage(url, revoke = false) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          if (revoke) URL.revokeObjectURL(url);
          resolve(image);
        };
        image.onerror = () => {
          if (revoke) URL.revokeObjectURL(url);
          reject(new Error("Bild konnte nicht dekodiert werden."));
        };
        image.src = url;
      });
    }

    trimBitmapCache(anchor) {
      if (this.bitmaps.size <= this.maxBitmaps) return;

      const candidates = [...this.bitmaps.keys()]
        .filter((index) => Math.abs(index - anchor) > 5)
        .sort((a, b) => Math.abs(b - anchor) - Math.abs(a - anchor));

      while (this.bitmaps.size > this.maxBitmaps && candidates.length) {
        const index = candidates.shift();
        const image = this.bitmaps.get(index);
        if (image && typeof image.close === "function") image.close();
        this.bitmaps.delete(index);
      }
    }

    preloadRange(start, end, priority = 0, onProgress) {
      const first = clamp(Math.floor(start), 0, this.count - 1);
      const last = clamp(Math.ceil(end), first, this.count - 1);
      const jobs = [];
      let completed = 0;

      for (let index = first; index <= last; index += 1) {
        const job = this.fetchFrame(index, priority).then((result) => {
          completed += 1;
          if (onProgress) onProgress(completed, last - first + 1);
          return result;
        });
        jobs.push(job);
      }

      return Promise.all(jobs);
    }

    startFullLoad() {
      if (this.didStartFullLoad || this.destroyed) return;
      this.didStartFullLoad = true;

      if (this.packSrc) {
        this.loadPack().then(() => {
          this.warmDecode(this.frameIndex());
          requestRender();
        });
        return;
      }

      const anchor = Math.round(this.targetProgress * (this.count - 1));
      const order = [];

      for (let radius = 0; radius < this.count; radius += 1) {
        const forward = anchor + radius;
        const backward = anchor - radius;
        if (forward < this.count) order.push(forward);
        if (radius > 0 && backward >= 0) order.push(backward);
      }

      const loadBatch = (cursor = 0) => {
        if (this.destroyed || cursor >= order.length) return;
        const batch = order.slice(cursor, cursor + 20);
        Promise.all(
          batch.map((index) => {
            if (this.blobs[index] || this.requests[index]) return Promise.resolve();
            return this.fetchFrame(index, -1);
          })
        ).finally(() => {
          window.setTimeout(() => loadBatch(cursor + batch.length), 16);
        });
      };

      loadBatch();
    }

    warmDecode(index) {
      const direction = this.targetProgress >= this.currentProgress ? 1 : -1;
      const offsets = [0, direction, -direction, direction * 2, -direction * 2, direction * 3];
      offsets.forEach((offset, order) => {
        const candidate = clamp(index + offset, 0, this.count - 1);
        this.decode(candidate, 10 - order);
      });
    }

    measure() {
      const rect = this.section.getBoundingClientRect();
      this.top = rect.top + window.scrollY;
      this.distance = Math.max(1, this.section.offsetHeight - window.innerHeight);
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));

      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.lastFrame = -1;
        this.draw(this.frameIndex());
      }
    }

    setTarget(scrollY) {
      this.targetProgress = clamp((scrollY - this.top) / this.distance);
    }

    frameIndex() {
      return clamp(Math.round(this.currentProgress * (this.count - 1)), 0, this.count - 1);
    }

    draw(index) {
      const image = this.bitmaps.get(index) || this.closestBitmap(index);
      if (!image) {
        this.warmDecode(index);
        return false;
      }

      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      const sourceWidth = image.width;
      const sourceHeight = image.height;
      const scale = Math.max(canvasWidth / sourceWidth, canvasHeight / sourceHeight);
      const drawWidth = sourceWidth * scale;
      const drawHeight = sourceHeight * scale;
      const drawX = (canvasWidth - drawWidth) * 0.5;
      const drawY = (canvasHeight - drawHeight) * 0.5;

      this.context.fillStyle = "#020304";
      this.context.fillRect(0, 0, canvasWidth, canvasHeight);
      this.context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
      this.lastFrame = index;
      this.warmDecode(index);
      return true;
    }

    closestBitmap(index) {
      let nearest = null;
      let distance = Infinity;

      this.bitmaps.forEach((image, candidate) => {
        const delta = Math.abs(candidate - index);
        if (delta < distance) {
          distance = delta;
          nearest = image;
        }
      });

      return nearest;
    }

    updateScenes(progress) {
      this.scenes.forEach((scene) => {
        const from = Number(scene.dataset.from) || 0;
        const to = Number(scene.dataset.to) || 1;
        const fadeLength = Math.min(0.055, Math.max(0.025, (to - from) * 0.28));
        const fadeIn = from === 0 ? 1 : smoothstep(from, from + fadeLength, progress);
        const fadeOut = to === 1 ? 1 : 1 - smoothstep(to - fadeLength, to, progress);
        const opacity = clamp(fadeIn * fadeOut);

        scene.style.opacity = opacity.toFixed(3);
        scene.classList.toggle("is-visible", opacity > 0.08);
        scene.setAttribute("aria-hidden", opacity > 0.08 ? "false" : "true");
      });

      if (this.progressBar) {
        this.progressBar.style.setProperty("--progress", `${(progress * 100).toFixed(2)}%`);
      }

      if (this.scrollCue) {
        this.scrollCue.style.setProperty("--cue-opacity", String(1 - smoothstep(0.02, 0.08, progress)));
      }

      if (this.chapterDots.length) {
        const active = Math.min(this.chapterDots.length - 1, Math.floor(progress * this.chapterDots.length));
        this.chapterDots.forEach((dot, index) => dot.classList.toggle("is-active", index === active));
      }
    }

    step() {
      if (reduceMotion || this.destroyed) return false;

      const delta = this.targetProgress - this.currentProgress;
      if (Math.abs(delta) > 0.00008) {
        const damping = Math.abs(delta) > 0.25 ? 0.16 : 0.115;
        this.currentProgress = lerp(this.currentProgress, this.targetProgress, damping);
      } else {
        this.currentProgress = this.targetProgress;
      }

      const index = this.frameIndex();
      if (index !== this.lastFrame) this.draw(index);
      this.updateScenes(this.currentProgress);

      return Math.abs(this.targetProgress - this.currentProgress) > 0.00008;
    }
  }

  function initSequences() {
    if (reduceMotion) return;

    document.querySelectorAll("[data-sequence]").forEach((section) => {
      const player = new FrameSequence(section);
      sequencePlayers.push(player);
    });

    const priorityPlayer = sequencePlayers.find((player) => player.priority);
    const loader = document.querySelector("[data-loader]");
    const loaderValue = document.querySelector("[data-loader-value]");
    const loaderTrack = document.querySelector("[data-loader-track]");
    const startedAt = performance.now();

    const updateLoader = (completed, total) => {
      const percent = Math.round(clamp(completed / Math.max(total, 1)) * 100);
      if (loaderValue) loaderValue.textContent = `${percent}%`;
      if (loaderTrack) loaderTrack.style.setProperty("--load", `${percent}%`);
    };

    const finishLoader = () => {
      const wait = Math.max(0, 650 - (performance.now() - startedAt));
      window.setTimeout(() => {
        loader?.classList.add("is-hidden");
        document.body.classList.add("is-ready");
      }, wait);
    };

    if (priorityPlayer?.packSrc) {
      priorityPlayer.loadPack(updateLoader).then(() => {
        priorityPlayer.decode(0, 100).then(() => priorityPlayer.draw(0));
        priorityPlayer.warmDecode(0);
        finishLoader();
      });
    } else if (priorityPlayer) {
      priorityPlayer.decode(0, 100).then(() => priorityPlayer.draw(0));
      priorityPlayer
        .preloadRange(0, isMobile ? 28 : 42, 80, updateLoader)
        .then(() => {
          priorityPlayer.warmDecode(0);
          finishLoader();
          window.setTimeout(() => priorityPlayer.startFullLoad(), 200);
        });
    } else {
      finishLoader();
    }

    window.setTimeout(finishLoader, 6500);

    const sequenceObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const player = sequencePlayers.find((candidate) => candidate.section === entry.target);
          if (!player) return;
          player.nearViewport = entry.isIntersecting;
          if (entry.isIntersecting) {
            player.startFullLoad();
            player.warmDecode(player.frameIndex());
            requestRender();
          }
        });
      },
      { rootMargin: "180% 0px", threshold: 0 }
    );

    sequencePlayers.forEach((player) => sequenceObserver.observe(player.section));

    const updateScroll = () => {
      const scrollY = window.scrollY;
      sequencePlayers.forEach((player) => player.setTarget(scrollY));
      requestRender();
    };

    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", () => {
      sequencePlayers.forEach((player) => {
        player.measure();
        player.resize();
      });
      updateScroll();
    });

    window.addEventListener("orientationchange", () => {
      window.setTimeout(() => {
        sequencePlayers.forEach((player) => {
          player.measure();
          player.resize();
        });
        updateScroll();
      }, 250);
    });

    updateScroll();
  }

  function initHeaderAndMenu() {
    const header = document.querySelector("[data-header]");
    const menuToggle = document.querySelector("[data-menu-toggle]");
    const mobileNav = document.querySelector("[data-mobile-nav]");

    const updateHeader = () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    const closeMenu = () => {
      if (!menuToggle || !mobileNav) return;
      menuToggle.setAttribute("aria-expanded", "false");
      mobileNav.classList.remove("is-open");
      document.body.classList.remove("menu-open");
    };

    menuToggle?.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!open));
      mobileNav?.classList.toggle("is-open", !open);
      document.body.classList.toggle("menu-open", !open);
    });

    mobileNav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 980) closeMenu();
    });
    updateHeader();
  }

  function initReveals() {
    const elements = [...document.querySelectorAll(".reveal")];
    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    elements.forEach((element) => observer.observe(element));
  }

  function initAutoplayVideos() {
    const videos = [...document.querySelectorAll("[data-autoplay-video]")];
    if (!videos.length) return;

    const safelyPlay = (video) => {
      const playRequest = video.play();
      if (playRequest && typeof playRequest.catch === "function") {
        playRequest.catch(() => {});
      }
    };

    if (!("IntersectionObserver" in window)) {
      videos.forEach(safelyPlay);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            safelyPlay(video);
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.35 }
    );

    videos.forEach((video) => observer.observe(video));
  }

  function initPointerAura() {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let auraX = pointerX;
    let auraY = pointerY;
    let active = false;

    window.addEventListener(
      "pointermove",
      (event) => {
        pointerX = event.clientX;
        pointerY = event.clientY;
        if (!active) {
          active = true;
          animate();
        }
      },
      { passive: true }
    );

    const animate = () => {
      auraX = lerp(auraX, pointerX, 0.11);
      auraY = lerp(auraY, pointerY, 0.11);
      document.documentElement.style.setProperty("--pointer-x", `${auraX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${auraY}px`);

      if (Math.abs(pointerX - auraX) > 0.1 || Math.abs(pointerY - auraY) > 0.1) {
        requestAnimationFrame(animate);
      } else {
        active = false;
      }
    };
  }

  initHeaderAndMenu();
  initReveals();
  initAutoplayVideos();
  initPointerAura();

  if (document.readyState === "complete") {
    initSequences();
  } else {
    window.addEventListener("load", initSequences, { once: true });
  }
})();
