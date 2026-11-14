
(() => {
// Header: solid border once scrolled
const header = document.querySelector("[data-header]");
if (header) {
  const onScroll = () => header.toggleAttribute("data-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// Mobile menu
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.getElementById("site-nav");
if (menuToggle && siteNav) {
  const setMenu = (open) => {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    siteNav.dataset.open = String(open);
  };
  menuToggle.addEventListener("click", () => setMenu(menuToggle.getAttribute("aria-expanded") !== "true"));
  siteNav.addEventListener("click", (event) => { if (event.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") { setMenu(false); menuToggle.focus(); }
  });
  window.matchMedia("(min-width: 52rem)").addEventListener("change", () => setMenu(false));
}

// Give the selected photographs paired entrances without changing their frames.
const selectedFrames = document.querySelectorAll(".selected-grid > li");
if (selectedFrames.length) {
  selectedFrames.forEach((frame, index) => {
    frame.setAttribute("data-reveal", "");
    frame.style.setProperty("--i", String(index % 2));
  });
}
const collectionHeading = document.querySelector(".collection-head");
if (collectionHeading) collectionHeading.setAttribute("data-reveal", "");

// Kinetic studio strip: explicit pause, reduced-motion support, no background work.
const motionBand = document.querySelector("[data-motion-band]");
if (motionBand) {
  const toggle = motionBand.querySelector("[data-motion-toggle]");
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (toggle) {
    let paused = false;
    const update = () => {
      motionBand.dataset.running = String(!preference.matches);
      motionBand.dataset.paused = String(paused || document.hidden);
      toggle.hidden = preference.matches;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "Play moving text" : "Pause moving text");
    };
    toggle.addEventListener("click", () => { paused = !paused; update(); });
    preference.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    update();
  }
}

// Scroll reveal
const revealed = document.querySelectorAll("[data-reveal]");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
  }), { rootMargin: "0px 0px -10% 0px" });
  revealed.forEach((element) => observer.observe(element));
} else {
  revealed.forEach((element) => element.classList.add("is-visible"));
}

// Work filters
const filterButtons = document.querySelectorAll(".filter");
const projectGrid = document.querySelector("[data-project-grid]");
if (filterButtons.length && projectGrid) {
  const empty = document.querySelector("[data-empty]");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const choice = button.dataset.filter;
      filterButtons.forEach((other) => other.setAttribute("aria-pressed", String(other === button)));
      let visible = 0;
      projectGrid.querySelectorAll("[data-category]").forEach((item) => {
        const show = choice === "all" || item.dataset.category === choice;
        item.hidden = !show;
        if (show) visible += 1;
      });
      if (empty) empty.hidden = visible > 0;
    });
  });
}

// Service links prepare the inquiry without submitting anything.
const serviceLinks = document.querySelectorAll("[data-service]");
const projectType = document.getElementById("f-type");
if (serviceLinks.length && projectType) {
  serviceLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const value = link.dataset.service;
      if ([...projectType.options].some((option) => option.value === value)) {
        projectType.value = value;
        projectType.removeAttribute("aria-invalid");
        projectType.removeAttribute("aria-describedby");
        const error = document.getElementById("f-type-error");
        if (error) error.hidden = true;
      }
    });
  });
}

// Contact form with inline validation and confirmation
document.querySelectorAll("[data-form]").forEach((form) => {
  const status = form.querySelector('[role="status"]');
  const messages = {
    name: "Enter your name.",
    email: "Enter an email like name@example.com.",
    type: "Choose a project type, or pick “Help me figure it out”.",
    idea: "Tell me a little about your idea.",
  };
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let firstInvalid = null;
    form.querySelectorAll("input[required], textarea[required], select[required]").forEach((field) => {
      if (field.value.trim) field.value = field.value.trim();
      const error = document.getElementById(`${field.id}-error`);
      const valid = field.checkValidity() && (field.tagName !== "SELECT" || field.value !== "");
      field.setAttribute("aria-invalid", String(!valid));
      if (error) {
        error.hidden = valid;
        error.textContent = valid ? "" : messages[field.name] ?? "Fill in this field.";
        if (!valid) field.setAttribute("aria-describedby", error.id);
      }
      if (!valid && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }
    const value = (key) => form.elements.namedItem(key)?.value.trim() || "Not specified";
    const body = [
      `Name: ${value("name")}`,
      `Email: ${value("email")}`,
      `Project type: ${value("type")}`,
      `Timeline: ${value("timeline")}`,
      `Budget: ${value("budget")}`,
      "",
      value("idea"),
    ].join("\n");
    if (status) {
      const emailLink = document.createElement("a");
      emailLink.className = "button button-secondary";
      emailLink.href = `mailto:rachel@rayofdavis.com?subject=${encodeURIComponent(`Project inquiry: ${value("type")}`)}&body=${encodeURIComponent(body)}`;
      emailLink.textContent = "Open inquiry in email";
      status.replaceChildren(
        document.createTextNode("Your inquiry is ready, but hasn’t been sent. Open it in your email app and send it to Rachel. "),
        emailLink
      );
    }
  });
});

// Image story: swipe, keyboard scrolling, and previous/next controls.
document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".carousel-track");
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  if (!track || !prev || !next) return;
  const update = () => {
    prev.disabled = track.scrollLeft <= 1;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };
  const move = (direction) => {
    const width = track.firstElementChild?.getBoundingClientRect().width || track.clientWidth;
    track.scrollBy({
      left: direction * (width + 16),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
    });
  };
  prev.addEventListener("click", () => move(-1));
  next.addEventListener("click", () => move(1));
  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
});

// Photographs open uncropped, without sending visitors to draft project pages.
const viewer = document.querySelector(".lightbox");
const photoLinks = [...document.querySelectorAll("[data-photo]")];
if (viewer && photoLinks.length && typeof viewer.showModal === "function") {
  const image = viewer.querySelector("figure img");
  const caption = viewer.querySelector(".lightbox-caption");
  const count = viewer.querySelector("[data-photo-count]");
  const close = viewer.querySelector("[data-photo-close]");
  const thumbnails = viewer.querySelector("[data-photo-thumbnails]");
  const inquiry = viewer.querySelector("[data-photo-inquiry]");
  const idea = document.getElementById("f-idea");
  const stage = viewer.querySelector("[data-photo-stage]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let current = 0;
  let opener = null;
  let moveToInquiry = false;
  const thumbnailButtons = [];
  const show = (index) => {
    current = (index + photoLinks.length) % photoLinks.length;
    const link = photoLinks[current];
    const thumb = link.querySelector("img");
    if (!image || !thumb) return;
    image.src = link.href;
    image.alt = thumb.alt;
    if (caption) caption.textContent = link.querySelector(".project-title")?.textContent || "";
    if (count) count.textContent = `${current + 1} / ${photoLinks.length}`;
    thumbnailButtons.forEach((button, position) => {
      button.setAttribute("aria-pressed", String(position === current));
    });
    const active = thumbnailButtons[current];
    if (active && thumbnails) {
      thumbnails.scrollTo({
        left: active.offsetLeft - thumbnails.offsetLeft - (thumbnails.clientWidth - active.offsetWidth) / 2,
        behavior: reducedMotion.matches ? "auto" : "smooth"
      });
    }
    if (viewer.open && image.animate) {
      image.getAnimations().forEach((animation) => animation.cancel());
      image.animate([{ opacity: .3 }, { opacity: 1 }], {
        duration: reducedMotion.matches ? 100 : 250,
        easing: "ease-out"
      });
    }
  };
  if (thumbnails) {
    photoLinks.forEach((link, index) => {
      const source = link.querySelector("img");
      if (!source) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "photo-thumbnail";
      button.setAttribute("aria-label", `View photograph ${index + 1}`);
      button.setAttribute("aria-pressed", "false");
      const preview = source.cloneNode();
      preview.alt = "";
      preview.loading = "lazy";
      preview.decoding = "async";
      button.append(preview);
      button.addEventListener("click", () => show(index));
      thumbnailButtons.push(button);
      thumbnails.append(button);
    });
  }
  if (stage) {
    let start = null;
    stage.addEventListener("touchstart", (event) => {
      start = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
    }, { passive: true });
    stage.addEventListener("touchend", (event) => {
      if (!start || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        show(current + (dx < 0 ? 1 : -1));
      }
      start = null;
    }, { passive: true });
    stage.addEventListener("touchcancel", () => { start = null; }, { passive: true });
  }
  if (inquiry && idea) {
    inquiry.addEventListener("click", () => {
      const title = photoLinks[current].querySelector(".project-title")?.textContent || `Photograph ${current + 1}`;
      const reference = `Visual reference: ${title}.`;
      if (!idea.value.includes(reference)) {
        idea.value = idea.value.trim() ? `${idea.value.trim()}\n\n${reference}` : `${reference}\n\n`;
      }
      const type = document.getElementById("f-type");
      if (type && !type.value) type.value = "Portrait or photography";
      moveToInquiry = true;
      viewer.close();
    });
  }
  photoLinks.forEach((link, index) => link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    show(index);
    viewer.showModal();
    close?.focus();
  }));
  close?.addEventListener("click", () => viewer.close());
  viewer.querySelector("[data-photo-prev]")?.addEventListener("click", () => show(current - 1));
  viewer.querySelector("[data-photo-next]")?.addEventListener("click", () => show(current + 1));
  viewer.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); show(current - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); show(current + 1); }
  });
  viewer.addEventListener("click", (event) => {
    if (event.target !== viewer) return;
    const bounds = viewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) viewer.close();
  });
  viewer.addEventListener("close", () => {
    if (moveToInquiry && idea) {
      moveToInquiry = false;
      idea.focus({ preventScroll: true });
      idea.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
      idea.setSelectionRange(idea.value.length, idea.value.length);
    } else {
      opener?.focus();
    }
  });
}
})();