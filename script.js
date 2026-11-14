// Cursor spotlight and gentle tilt on project cards (pointer devices only)
if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  document.querySelectorAll(".project-card").forEach((card) => {
    const frame = card.querySelector(".frame");
    if (!frame) return;
    card.addEventListener("pointermove", (event) => {
      const box = frame.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width;
      const y = (event.clientY - box.top) / box.height;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
      card.style.setProperty("--tilt-y", `${(x - 0.5) * 8}deg`);
      card.style.setProperty("--tilt-x", `${(0.5 - y) * 8}deg`);
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

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
    const first = form.elements.namedItem("name")?.value.split(" ")[0];
    if (status) status.textContent = first
      ? `Thanks, ${first}. Your inquiry is in, and I will reply within two working days.`
      : "Thanks. Your inquiry is in, and I will reply within two working days.";
    form.reset();
  });
});