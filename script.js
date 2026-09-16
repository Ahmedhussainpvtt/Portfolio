const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");
const year = document.getElementById("year");
const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("contact-submit");
const backToTop = document.getElementById("back-to-top");
const backToTopFooter = document.getElementById("back-to-top-footer");
const scrollBar = document.getElementById("scroll-bar");
const cursorGlow = document.getElementById("cursor-glow");
const rotator = document.getElementById("rotator");

const CONTACT_EMAIL = "mahhussain123@gmail.com";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

year.textContent = new Date().getFullYear();

/* ---------- scroll driven UI ---------- */

const navLinks = [...nav.querySelectorAll('a[href^="#"]')].filter(
  (link) => link.getAttribute("href").length > 1
);
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

let scrollQueued = false;

const updateOnScroll = () => {
  scrollQueued = false;
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(y / max, 1) : 0;

  header.classList.toggle("scrolled", y > 12);
  scrollBar.style.width = `${progress * 100}%`;

  const showTop = y > 480;
  backToTop.hidden = !showTop;
  backToTop.style.setProperty("--p", String(Math.round(progress * 100)));

  const activationLine = Math.max(140, window.innerHeight * 0.3);
  let current = null;
  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= activationLine) {
      current = section;
    }
  });

  navLinks.forEach((link) => {
    const isActive = Boolean(current) && link.getAttribute("href") === `#${current.id}`;
    link.classList.toggle("active", isActive);
  });
};

const requestScrollUpdate = () => {
  if (scrollQueued) return;
  scrollQueued = true;
  requestAnimationFrame(updateOnScroll);
};

updateOnScroll();
window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);
window.addEventListener("load", requestScrollUpdate);
window.addEventListener("hashchange", () => setTimeout(requestScrollUpdate, 600));

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  history.replaceState(null, "", window.location.pathname + window.location.search);
};

backToTop.addEventListener("click", scrollToTop);
backToTopFooter.addEventListener("click", scrollToTop);

document.querySelector(".logo")?.addEventListener("click", (event) => {
  event.preventDefault();
  scrollToTop();
});

/* ---------- navigation ---------- */

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

/* ---------- scroll reveals ---------- */

const revealEls = [...document.querySelectorAll("[data-reveal]")];

revealEls.forEach((el) => {
  let index = 0;

  if (el.dataset.reveal === "mask") {
    const line = el.parentElement;
    index = [...line.parentElement.children].indexOf(line);
  } else if (el.parentElement) {
    const siblings = [...el.parentElement.children].filter((child) =>
      child.hasAttribute("data-reveal")
    );
    index = Math.max(siblings.indexOf(el), 0);
  }

  el.style.setProperty("--d", `${Math.min(index, 6) * 90}ms`);
});

// Masked elements sit outside their clipping parent until revealed, so they can
// never intersect on their own. Watch the parent and reveal the group together.
const revealGroups = new Map();

revealEls.forEach((el) => {
  const watched =
    el.dataset.reveal === "mask" ? el.closest(".hero-title") || el.parentElement : el;

  if (!revealGroups.has(watched)) revealGroups.set(watched, []);
  revealGroups.get(watched).push(el);
});

if ("IntersectionObserver" in window && !reducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (revealGroups.get(entry.target) || []).forEach((el) =>
          el.classList.add("is-visible")
        );
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  revealGroups.forEach((_els, watched) => revealObserver.observe(watched));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* ---------- pointer effects ---------- */

document.querySelectorAll("[data-spotlight]").forEach((card) => {
  card.addEventListener(
    "pointermove",
    (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--sx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--sy", `${event.clientY - rect.top}px`);
    },
    { passive: true }
  );
});

if (finePointer && !reducedMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const maxTilt = card.classList.contains("hero-portrait") ? 6 : 4;

    card.addEventListener(
      "pointermove",
      (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty("--ry", `${px * maxTilt * 2}deg`);
        card.style.setProperty("--rx", `${-py * maxTilt * 2}deg`);
      },
      { passive: true }
    );

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--ry", "0deg");
      card.style.setProperty("--rx", "0deg");
    });
  });

  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    el.addEventListener(
      "pointermove",
      (event) => {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        el.style.setProperty("--tx", `${Math.max(Math.min(dx * 0.22, 10), -10)}px`);
        el.style.setProperty("--ty", `${Math.max(Math.min(dy * 0.32, 8), -8)}px`);
      },
      { passive: true }
    );

    el.addEventListener("pointerleave", () => {
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
    });
  });
}

document.querySelectorAll("[data-ripple]").forEach((el) => {
  el.addEventListener("pointerdown", (event) => {
    if (reducedMotion) return;

    const rect = el.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");

    ripple.className = "ripple";
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;

    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });
});

if (finePointer && !reducedMotion && cursorGlow) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;

  window.addEventListener(
    "pointermove",
    (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      cursorGlow.classList.add("is-on");
    },
    { passive: true }
  );

  document.addEventListener("pointerleave", () => {
    cursorGlow.classList.remove("is-on");
  });

  const followCursor = () => {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    cursorGlow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    requestAnimationFrame(followCursor);
  };

  requestAnimationFrame(followCursor);
}

/* ---------- rotating role ---------- */

if (rotator && !reducedMotion) {
  const words = [
    "ContactSwing AI",
    "AI Solutions",
    "Automation",
    "Customer Success",
    "Team Enablement",
  ];
  let wordIndex = 0;

  setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    rotator.classList.add("is-swapping");

    setTimeout(() => {
      rotator.textContent = words[wordIndex];
      rotator.classList.remove("is-swapping");
    }, 350);
  }, 2800);
}

/* ---------- contact form ---------- */

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
