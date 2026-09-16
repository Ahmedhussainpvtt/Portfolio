/* =======================================================================
   SETTINGS

   OPEN_TO_WORK: set to true when you are job hunting. It shows the
   "Open to new opportunities" badge above your name in the hero.
   Set it back to false to hide the badge again.
   ======================================================================= */
const OPEN_TO_WORK = false;

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
const availabilityBadge = document.getElementById("availability-badge");

const CONTACT_EMAIL = "mahhussain123@gmail.com";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

year.textContent = new Date().getFullYear();

if (availabilityBadge) {
  availabilityBadge.hidden = !OPEN_TO_WORK;
}

/* ---------- scroll driven UI ---------- */

const navLinks = [...nav.querySelectorAll('a[href^="#"]')].filter(
  (link) => link.getAttribute("href").length > 1
);
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const aurora = document.querySelector(".aurora");
const timeline = document.querySelector(".timeline");

let scrollQueued = false;
let lenis = null;

const prefersFineDesktop =
  finePointer && window.matchMedia("(min-width: 981px)").matches;

const updateOnScroll = () => {
  scrollQueued = false;
  const y = window.scrollY || window.pageYOffset || 0;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? Math.min(y / max, 1) : 0;

  header.classList.toggle("scrolled", y > 12);
  if (scrollBar) scrollBar.style.width = `${progress * 100}%`;

  const showTop = y > 140;
  backToTop.classList.toggle("is-stuck", showTop);
  backToTop.setAttribute("aria-hidden", showTop ? "false" : "true");
  backToTop.tabIndex = showTop ? 0 : -1;
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

  // very light background parallax (transform only)
  if (aurora && !reducedMotion && prefersFineDesktop) {
    aurora.style.setProperty("--aurora-y", `${(progress * -48).toFixed(1)}px`);
  }

  // the experience rail draws itself as the list passes the middle of the screen
  if (timeline && !reducedMotion) {
    const rect = timeline.getBoundingClientRect();
    const line = window.innerHeight * 0.55;
    const drawn = (line - rect.top) / rect.height;
    timeline.style.setProperty("--tp", Math.max(Math.min(drawn, 1), 0).toFixed(3));
  }
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

/* ---------- smooth / inertial scrolling ---------- */

if (!reducedMotion && prefersFineDesktop && typeof Lenis === "function") {
  lenis = new Lenis({
    duration: 1.05,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.95,
  });

  document.documentElement.classList.add("lenis");

  lenis.on("scroll", requestScrollUpdate);

  const raf = (time) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // keep in-page anchors silky with Lenis instead of native jump
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -88, duration: 1.15 });
    });
  });
}

/* Always land at the top on refresh / restore (not on intentional #hash clicks). */
const jumpToTopNow = () => {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true });
  } else {
    window.scrollTo(0, 0);
  }
  requestScrollUpdate();
};

const navEntry = performance.getEntriesByType?.("navigation")?.[0];
const isReload = navEntry?.type === "reload";

if (isReload && location.hash) {
  history.replaceState(null, "", location.pathname + location.search);
}

jumpToTopNow();
window.addEventListener("load", jumpToTopNow);
window.addEventListener("pageshow", (event) => {
  if (event.persisted || isReload) jumpToTopNow();
});

const scrollToTop = () => {
  if (lenis) {
    lenis.scrollTo(0, { duration: 1.1 });
  } else {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  }
  history.replaceState(null, "", window.location.pathname + window.location.search);
};

backToTop.addEventListener("click", scrollToTop);
backToTopFooter.addEventListener("click", scrollToTop);

document.querySelector(".logo")?.addEventListener("click", (event) => {
  event.preventDefault();
  scrollToTop();
});

/* Stretchy pull for CTAs: the button follows the cursor and elongates toward it,
   then snaps home once pulled past BREAK. Back-to-top stays a normal button. */
if (finePointer && !reducedMotion) {
  const CATCH = 90;
  const BREAK = 130;
  const PULL_RATIO = 0.45;

  const buttons = [...document.querySelectorAll(".btn, .nav-cta")];
  const active = new Map();

  let pointerX = 0;
  let pointerY = 0;
  let frame = 0;

  const rest = () => ({ x: 0, y: 0, sx: 1, sy: 1, angle: 0 });

  const apply = (el, state) => {
    el.style.setProperty("--tx", `${state.x.toFixed(2)}px`);
    el.style.setProperty("--ty", `${state.y.toFixed(2)}px`);
    el.style.setProperty("--stretch-x", state.sx.toFixed(3));
    el.style.setProperty("--stretch-y", state.sy.toFixed(3));
    el.style.setProperty("--pull-angle", `${state.angle.toFixed(2)}deg`);
  };

  const release = (el, entry) => {
    if (!entry.pulling) return;
    entry.pulling = false;
    entry.target = rest();
    el.classList.remove("is-pulling");
    el.classList.add("is-snapping");
    entry.state = rest();
    apply(el, entry.state);
    clearTimeout(entry.snapTimer);
    entry.snapTimer = setTimeout(() => {
      el.classList.remove("is-snapping");
      entry.state = rest();
      apply(el, entry.state);
      active.delete(el);
    }, 560);
  };

  const tick = () => {
    let busy = false;

    active.forEach((entry, el) => {
      const ease = entry.pulling ? 0.28 : 0.22;
      entry.state.x += (entry.target.x - entry.state.x) * ease;
      entry.state.y += (entry.target.y - entry.state.y) * ease;
      entry.state.sx += (entry.target.sx - entry.state.sx) * ease;
      entry.state.sy += (entry.target.sy - entry.state.sy) * ease;
      entry.state.angle = entry.target.angle;
      apply(el, entry.state);

      const settled =
        !entry.pulling &&
        Math.abs(entry.state.x) < 0.2 &&
        Math.abs(entry.state.y) < 0.2 &&
        Math.abs(entry.state.sx - 1) < 0.01;

      if (!settled) busy = true;
    });

    frame = busy ? requestAnimationFrame(tick) : 0;
  };

  const startLoop = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const updateFromPointer = () => {
    // only one CTA stretches at a time: the closest within CATCH, or the
    // one already being pulled
    let pullingEl = null;
    active.forEach((entry, el) => {
      if (entry.pulling) pullingEl = el;
    });

    let nearest = null;
    let nearestDist = Infinity;

    if (!pullingEl) {
      buttons.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(pointerX - cx, pointerY - cy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = el;
        }
      });
      if (!nearest || nearestDist > CATCH) {
        active.forEach((entry, el) => {
          if (!entry.pulling) active.delete(el);
        });
        return;
      }
      pullingEl = nearest;
    }

    const el = pullingEl;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;

    let entry = active.get(el);
    const liveCx = rect.left + rect.width / 2;
    const liveCy = rect.top + rect.height / 2;

    // once grabbed, keep measuring from the rest centre so the stretch
    // transform does not chase its own moving bounding box
    const cx = entry?.pulling ? entry.originX : liveCx;
    const cy = entry?.pulling ? entry.originY : liveCy;
    const dx = pointerX - cx;
    const dy = pointerY - cy;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const baseSize = entry?.pulling
      ? entry.baseSize
      : Math.max(rect.width, rect.height);
    const reachLimit = baseSize * 0.5 + BREAK;

    if (!entry) {
      entry = {
        pulling: false,
        state: rest(),
        target: rest(),
        snapTimer: 0,
        originX: liveCx,
        originY: liveCy,
        baseSize: Math.max(rect.width, rect.height),
      };
      active.set(el, entry);
    }

    if (dist > reachLimit) {
      release(el, entry);
      return;
    }

    if (!entry.pulling) {
      entry.pulling = true;
      entry.originX = liveCx;
      entry.originY = liveCy;
      entry.baseSize = Math.max(rect.width, rect.height);
      el.classList.add("is-pulling");
      el.classList.remove("is-snapping");
      clearTimeout(entry.snapTimer);
    }

    const t = Math.min(dist / reachLimit, 1);
    const reach = dist * PULL_RATIO;

    entry.target.angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    entry.target.x = (dx / dist) * reach;
    entry.target.y = (dy / dist) * reach;
    // elongate toward the cursor, squash on the cross-axis
    entry.target.sx = 1 + t * 0.22;
    entry.target.sy = 1 - t * 0.1;
    startLoop();
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      updateFromPointer();
    },
    { passive: true }
  );

  window.addEventListener("blur", () => {
    active.forEach((entry, el) => release(el, entry));
  });

  document.addEventListener("pointerleave", () => {
    active.forEach((entry, el) => release(el, entry));
  });
}

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

/* ---------- scroll reveals (bidirectional) ---------- */

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

  // slightly wider stagger so heading → copy → actions read as a sequence
  el.style.setProperty("--d", `${Math.min(index, 8) * 110}ms`);
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
        const group = revealGroups.get(entry.target) || [];
        const show = entry.isIntersecting || entry.boundingClientRect.bottom < 0;

        group.forEach((el) => {
          el.classList.toggle("is-visible", show);
        });
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  revealGroups.forEach((_els, watched) => revealObserver.observe(watched));
} else {
  revealEls.forEach((el) => el.classList.add("is-visible"));
}

/* ---------- split headings ---------- */

/* Wrap every heading word in a clipped box so the words can rise one after the
   other. The gradient is re-anchored per word so the sweep stays continuous. */
const splitHeadings = [...document.querySelectorAll(".section-heading h2")];

if (splitHeadings.length && !reducedMotion) {
  splitHeadings.forEach((heading) => {
    const words = heading.textContent.trim().split(/\s+/);
    heading.textContent = "";

    words.forEach((word, index) => {
      const clip = document.createElement("span");
      const inner = document.createElement("span");

      clip.className = "w";
      inner.className = "word";
      inner.textContent = word;
      inner.style.setProperty("--wd", `${index * 70}ms`);

      clip.appendChild(inner);
      heading.appendChild(clip);
      if (index < words.length - 1) heading.appendChild(document.createTextNode(" "));
    });

    heading.classList.add("is-split");
  });

  const anchorGradients = () => {
    splitHeadings.forEach((heading) => {
      const width = heading.getBoundingClientRect().width;
      heading.querySelectorAll(".word").forEach((word) => {
        word.style.setProperty("--hw", `${width.toFixed(1)}px`);
        word.style.setProperty("--wx", `${word.offsetLeft.toFixed(1)}px`);
      });
    });
  };

  anchorGradients();
  window.addEventListener("load", anchorGradients);

  let anchorTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(anchorTimer);
    anchorTimer = setTimeout(anchorGradients, 180);
  });
}

/* ---------- nav letter flip ---------- */

if (!reducedMotion) {
  nav.querySelectorAll("a:not(.nav-cta)").forEach((link) => {
    const label = link.textContent.trim();
    // the flip needs a duplicate of every letter, so name the link explicitly
    link.setAttribute("aria-label", label);
    link.textContent = "";

    [...label].forEach((char, index) => {
      if (char === " ") {
        link.appendChild(document.createTextNode(" "));
        return;
      }

      const box = document.createElement("span");
      box.className = "fchar";
      box.style.setProperty("--i", String(index));

      const front = document.createElement("span");
      const back = document.createElement("span");
      front.textContent = char;
      back.textContent = char;
      back.setAttribute("aria-hidden", "true");

      box.append(front, back);
      link.appendChild(box);
    });
  });
}

/* ---------- marquee driven by scroll speed ---------- */

const marquee = document.querySelector(".marquee");
const marqueeTrack = marquee?.querySelector(".marquee-track");

if (marqueeTrack && !reducedMotion) {
  marquee.classList.add("is-live");

  let half = marqueeTrack.scrollWidth / 2;
  let offset = 0;
  let lastY = window.scrollY;
  let velocity = 0;
  let hovered = false;
  let visible = true;
  let frame = 0;

  window.addEventListener("resize", () => {
    half = marqueeTrack.scrollWidth / 2;
  });

  marquee.addEventListener("pointerenter", () => {
    hovered = true;
  });
  marquee.addEventListener("pointerleave", () => {
    hovered = false;
  });

  const step = () => {
    const y = window.scrollY;
    // smoothed scroll delta: fast scrolling speeds the band up and can flip it
    velocity += (y - lastY - velocity) * 0.16;
    lastY = y;

    const boost = Math.min(Math.abs(velocity) * 0.3, 7);
    const direction = velocity < -0.5 ? 1 : -1;
    const speed = hovered ? boost * 0.4 : 0.55 + boost;

    offset += speed * direction;
    if (offset <= -half) offset += half;
    if (offset >= 0) offset -= half;

    const skew = Math.max(Math.min(-velocity * 0.1, 6), -6);
    marqueeTrack.style.transform = `translate3d(${offset.toFixed(
      2
    )}px, 0, 0) skewX(${skew.toFixed(2)}deg)`;

    frame = visible ? requestAnimationFrame(step) : 0;
  };

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !frame) {
          lastY = window.scrollY;
          frame = requestAnimationFrame(step);
        }
      },
      { rootMargin: "120px 0px" }
    ).observe(marquee);
  } else {
    frame = requestAnimationFrame(step);
  }
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
}

/* Spin the glowing rim from here rather than with a CSS keyframe: animating a
   custom property needs @property support, which some browsers lack, and there
   it silently freezes at one angle instead of rotating. */
if (finePointer && !reducedMotion) {
  const RIM_SPIN_MS = 1800;
  const spinning = new Set();
  let spinFrame = null;
  let spinStart = 0;

  const stepSpin = (now) => {
    if (!spinning.size) {
      spinFrame = null;
      spinStart = 0;
      return;
    }

    if (!spinStart) spinStart = now;
    const angle = (((now - spinStart) / RIM_SPIN_MS) * 360) % 360;
    spinning.forEach((el) => {
      el.style.setProperty("--angle", `${angle.toFixed(1)}deg`);
    });
    spinFrame = requestAnimationFrame(stepSpin);
  };

  const startSpin = (el) => {
    spinning.add(el);
    if (!spinFrame) spinFrame = requestAnimationFrame(stepSpin);
  };

  const stopSpin = (el) => {
    spinning.delete(el);
    el.style.removeProperty("--angle");
  };

  document.querySelectorAll(".btn, .nav-cta").forEach((el) => {
    el.addEventListener("pointerenter", () => startSpin(el));
    el.addEventListener("pointerleave", () => stopSpin(el));
    el.addEventListener("pointercancel", () => stopSpin(el));
    el.addEventListener("focus", () => startSpin(el));
    el.addEventListener("blur", () => stopSpin(el));
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

/* Capability rows open on hover, so the button is here for taps and keyboards.
   Where hover does not exist the rows stay open, matching the stylesheet. */
const capabilityToggles = document.querySelectorAll(".capability-toggle");

if (capabilityToggles.length) {
  const alwaysOpen = !window.matchMedia("(hover: hover)").matches;

  capabilityToggles.forEach((toggle) => {
    const row = toggle.closest("li");

    if (alwaysOpen) {
      row.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      return;
    }

    toggle.addEventListener("click", () => {
      const isOpen = row.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });
}

if (finePointer && !reducedMotion && cursorGlow) {
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let scale = 1;
  let targetScale = 1;

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

  // grows and warms whenever the cursor is over something you can act on
  const hotSelector = "a, button, [data-tilt], .capability-head, input, textarea";

  document.addEventListener("pointerover", (event) => {
    if (event.target.closest?.(hotSelector)) {
      cursorGlow.classList.add("is-hot");
      targetScale = 1.32;
    }
  });

  document.addEventListener("pointerout", (event) => {
    if (event.target.closest?.(hotSelector)) {
      cursorGlow.classList.remove("is-hot");
      targetScale = 1;
    }
  });

  const followCursor = () => {
    currentX += (targetX - currentX) * 0.12;
    currentY += (targetY - currentY) * 0.12;
    scale += (targetScale - scale) * 0.1;
    cursorGlow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(${scale.toFixed(
      3
    )})`;
    requestAnimationFrame(followCursor);
  };

  requestAnimationFrame(followCursor);
}

/* ---------- canvas effects: drifting field, cursor trail, celebration ---------- */

let burstAt = () => {};

const bgCanvas = document.getElementById("bg-fx");
const fxCanvas = document.getElementById("cursor-fx");

if (bgCanvas && fxCanvas && !reducedMotion) {
  const bgCtx = bgCanvas.getContext("2d");
  const fxCtx = fxCanvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let width = 0;
  let height = 0;
  let particles = [];
  let sparks = [];
  const trail = [];
  const pointer = { x: 0, y: 0, active: false };
  const follow = { x: 0, y: 0, ready: false };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;

    [bgCanvas, fxCanvas].forEach((canvas) => {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    });

    const count = width < 760 ? 0 : Math.min(58, Math.round(width / 26));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.16,
      vy: (Math.random() - 0.5) * 0.16,
      r: Math.random() * 1.6 + 0.6,
      a: Math.random() * 0.26 + 0.1,
    }));
  };

  resize();
  window.addEventListener("resize", resize);

  if (finePointer) {
    window.addEventListener(
      "pointermove",
      (event) => {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        pointer.active = true;

        if (!follow.ready) {
          follow.x = pointer.x;
          follow.y = pointer.y;
          follow.ready = true;
        }
      },
      { passive: true }
    );

    document.addEventListener("pointerleave", () => {
      pointer.active = false;
    });
  }

  burstAt = (x, y) => {
    const colors = ["#0f6c85", "#bd8b52", "#2f9ab5", "#e3c9a3"];
    for (let i = 0; i < 46; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5.5 + 1.8;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.2,
        life: 1,
        size: Math.random() * 3.4 + 1.6,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  };

  const drawField = () => {
    bgCtx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(15, 108, 133, ${p.a})`;
      bgCtx.fill();
    });

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist > 130) continue;

        bgCtx.beginPath();
        bgCtx.moveTo(particles[i].x, particles[i].y);
        bgCtx.lineTo(particles[j].x, particles[j].y);
        bgCtx.strokeStyle = `rgba(15, 108, 133, ${(1 - dist / 130) * 0.09})`;
        bgCtx.lineWidth = 1;
        bgCtx.stroke();
      }
    }
  };

  const drawTrail = () => {
    // A smoothed follower feeds the trail, so the tail keeps its shape between
    // pointer events and eases back into the cursor when the mouse stops.
    if (pointer.active && follow.ready) {
      follow.x += (pointer.x - follow.x) * 0.17;
      follow.y += (pointer.y - follow.y) * 0.17;
      trail.push({ x: follow.x, y: follow.y });
      while (trail.length > 26) trail.shift();
    } else if (trail.length) {
      trail.shift();
    }

    for (let i = 1; i < trail.length; i += 1) {
      const t = i / trail.length;
      fxCtx.beginPath();
      fxCtx.moveTo(trail[i - 1].x, trail[i - 1].y);
      fxCtx.lineTo(trail[i].x, trail[i].y);
      // tail fades from teal into the bronze head
      fxCtx.strokeStyle = `rgba(${Math.round(15 + t * 174)}, ${Math.round(
        108 + t * 31
      )}, ${Math.round(133 - t * 51)}, ${t * 0.55})`;
      fxCtx.lineWidth = t * 7;
      fxCtx.lineCap = "round";
      fxCtx.lineJoin = "round";
      fxCtx.stroke();
    }

    const head = trail[trail.length - 1];
    if (head && pointer.active && trail.length > 1) {
      fxCtx.save();
      fxCtx.shadowColor = "rgba(189, 139, 82, 0.85)";
      fxCtx.shadowBlur = 12;
      fxCtx.beginPath();
      fxCtx.arc(head.x, head.y, 4, 0, Math.PI * 2);
      fxCtx.fillStyle = "rgba(189, 139, 82, 0.9)";
      fxCtx.fill();
      fxCtx.restore();
    }
  };

  const drawSparks = () => {
    sparks = sparks.filter((s) => s.life > 0.02);

    sparks.forEach((s) => {
      s.vy += 0.14;
      s.vx *= 0.99;
      s.x += s.vx;
      s.y += s.vy;
      s.life -= 0.014;

      fxCtx.globalAlpha = Math.max(s.life, 0);
      fxCtx.fillStyle = s.color;
      fxCtx.beginPath();
      fxCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      fxCtx.fill();
      fxCtx.globalAlpha = 1;
    });
  };

  const render = () => {
    if (!document.hidden) {
      drawField();
      fxCtx.clearRect(0, 0, width, height);
      if (finePointer) drawTrail();
      drawSparks();
    }
    requestAnimationFrame(render);
  };

  requestAnimationFrame(render);
}

/* ---------- hero parallax ---------- */

const heroPortrait = document.querySelector(".hero-portrait");

if (heroPortrait && finePointer && !reducedMotion) {
  const parallax = () => {
    const shift = Math.max(Math.min(window.scrollY * 0.06, 22), -22);
    heroPortrait.style.setProperty("--pty", `${-shift}px`);
  };

  parallax();
  window.addEventListener("scroll", () => requestAnimationFrame(parallax), {
    passive: true,
  });
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
  const noise = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&*+=<>/";
  const SCRAMBLE_MS = 620;

  let wordIndex = 0;

  // each letter churns through random glyphs before settling on the real one
  const scrambleTo = (text) => {
    const from = rotator.textContent;
    const length = Math.max(from.length, text.length);
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / SCRAMBLE_MS, 1);
      let out = "";

      for (let i = 0; i < length; i += 1) {
        const settled = progress * length;

        if (i < settled - 1) {
          out += text[i] ?? "";
        } else if (i < settled + 3 && text[i] !== " ") {
          out += noise[Math.floor(Math.random() * noise.length)];
        } else {
          out += text[i] === " " ? " " : "";
        }
      }

      rotator.textContent = progress === 1 ? text : out;
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  };

  setInterval(() => {
    wordIndex = (wordIndex + 1) % words.length;
    scrambleTo(words[wordIndex]);
  }, 3200);
}

/* ---------- contact form ---------- */

const btnLabel = submitBtn.querySelector(".btn-label");

const setStatus = (message, type = "") => {
  statusEl.textContent = message;
  statusEl.className = `form-status${type ? ` is-${type}` : ""}${
    message ? " is-shown" : ""
  }`;
};

const setButtonState = (state) => {
  submitBtn.classList.remove("is-loading", "is-sent");

  if (state === "loading") {
    submitBtn.classList.add("is-loading");
    btnLabel.textContent = "Sending";
  } else if (state === "sent") {
    submitBtn.classList.add("is-sent");
    btnLabel.textContent = "Message sent";
  } else {
    btnLabel.textContent = "Send message";
  }
};

const celebrate = () => {
  const rect = submitBtn.getBoundingClientRect();
  burstAt(rect.left + rect.width / 2, rect.top + rect.height / 2);
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
  setButtonState("loading");
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
    setButtonState("sent");
    celebrate();
    setStatus(
      "Message sent. Thanks for reaching out. I will get back to you soon.",
      "success"
    );
    setTimeout(() => setButtonState("idle"), 3200);
  } catch (error) {
    setButtonState("idle");
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
