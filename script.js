const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const year = document.getElementById("year");
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("contact-submit");
const backToTop = document.getElementById("back-to-top");
const backToTopFooter = document.getElementById("back-to-top-footer");

const CONTACT_EMAIL = "mahhussain123@gmail.com";

year.textContent = new Date().getFullYear();

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", window.location.pathname + window.location.search);
};

const onScroll = () => {
  header.classList.toggle("scrolled", window.scrollY > 12);
  const showTop = window.scrollY > 480;
  backToTop.hidden = !showTop;
};

onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

backToTop.addEventListener("click", scrollToTop);
backToTopFooter.addEventListener("click", scrollToTop);

document.querySelector(".logo")?.addEventListener("click", (event) => {
  event.preventDefault();
  scrollToTop();
});

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

const setStatus = (message, type = "") => {
  statusEl.textContent = message;
  statusEl.className = `form-status${type ? ` is-${type}` : ""}`;
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const name = String(data.get("name") || "").trim();
  const email = String(data.get("email") || "").trim();
  const message = String(data.get("message") || "").trim();

  if (!name || !email || !message) {
    setStatus("Please fill in your name, email, and message.", "error");
    return;
  }

  submitBtn.disabled = true;
  setStatus("Sending your message...", "");

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${CONTACT_EMAIL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        message,
        _subject: `Portfolio inquiry from ${name}`,
        _template: "table",
        _captcha: "false",
      }),
    });

    if (!response.ok) {
      throw new Error("Form service unavailable");
    }

    form.reset();
    setStatus(
      "Message sent. Thanks for reaching out. I will get back to you soon.",
      "success"
    );
  } catch (error) {
    const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
    const body = encodeURIComponent(`${message}\n\n-\n${name}\n${email}`);
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

    setStatus(
      "Could not send automatically. Opening your email app instead...",
      "error"
    );
    window.location.href = mailto;
  } finally {
    submitBtn.disabled = false;
  }
});
