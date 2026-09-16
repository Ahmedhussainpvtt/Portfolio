const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const year = document.getElementById("year");
const form = document.getElementById("contact-form");

year.textContent = new Date().getFullYear();

const onScroll = () => {
  header.classList.toggle("scrolled", window.scrollY > 12);
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

toggle.addEventListener("click", () => {
  const expanded = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", String(!expanded));
  nav.classList.toggle("open");
});

nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const message = String(data.get("message") || "").trim();
  const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
  const body = encodeURIComponent(
    `${message}\n\n—\n${name}\n${email}`
  );
  window.location.href = `mailto:alex@bluespacetech.com?subject=${subject}&body=${body}`;
});
