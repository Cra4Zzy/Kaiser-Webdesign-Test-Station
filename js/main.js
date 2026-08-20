(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const menuButton = document.querySelector(".menu-toggle");
  const mobilePanel = document.querySelector(".mobile-panel");
  const mobileLinks = document.querySelectorAll(".mobile-panel a");
  const lightbox = document.getElementById("lightbox");
  const lightboxClose = document.getElementById("lightbox-close");
  const lightboxImage = document.getElementById("lightbox-image");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxTag = document.getElementById("lightbox-tag");
  const projectCards = document.querySelectorAll(".project-card");
  const contactForm = document.getElementById("contact-form");
  const currentYear = document.getElementById("current-year");

  root.classList.add("js");

  const updateBodyLock = () => {
    const menuOpen = mobilePanel?.classList.contains("is-open");
    const lightboxOpen = lightbox && !lightbox.hidden;
    body.style.overflow = menuOpen || lightboxOpen ? "hidden" : "";
  };

  const closeMenu = () => {
    if (!menuButton || !mobilePanel) return;
    menuButton.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Menü öffnen");
    mobilePanel.classList.remove("is-open");
    mobilePanel.setAttribute("aria-hidden", "true");
    updateBodyLock();
  };

  menuButton?.addEventListener("click", () => {
    if (!mobilePanel) return;
    const opening = !mobilePanel.classList.contains("is-open");
    menuButton.classList.toggle("is-open", opening);
    menuButton.setAttribute("aria-expanded", String(opening));
    menuButton.setAttribute("aria-label", opening ? "Menü schließen" : "Menü öffnen");
    mobilePanel.classList.toggle("is-open", opening);
    mobilePanel.setAttribute("aria-hidden", String(!opening));
    updateBodyLock();
  });

  mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    updateBodyLock();
  };

  projectCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (!lightbox || !lightboxImage || !lightboxTitle || !lightboxTag) return;
      const src = card.getAttribute("data-src") || "";
      const title = card.getAttribute("data-title") || "Projekt";
      const tag = card.getAttribute("data-tag") || "";
      lightboxImage.setAttribute("src", src);
      lightboxImage.setAttribute("alt", `${title} – ${tag}`);
      lightboxTitle.textContent = title;
      lightboxTag.textContent = tag;
      lightbox.hidden = false;
      updateBodyLock();
      lightboxClose?.focus();
    });
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      closeLightbox();
    }
  });

  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = String(data.get("name") || "");
    const phone = String(data.get("phone") || "");
    const service = String(data.get("service") || "Allgemeine Anfrage");
    const message = String(data.get("message") || "");
    const subject = encodeURIComponent(`Projektanfrage: ${service}`);
    const mailBody = encodeURIComponent(
      `Hallo Herr Kopp,\n\n${message}\n\nName: ${name}\nTelefon: ${phone}\nGewünschte Leistung: ${service}`,
    );
    window.location.href = `mailto:info@kopp-dach.de?subject=${subject}&body=${mailBody}`;
  });

  if (currentYear) currentYear.textContent = String(new Date().getFullYear());
})();
