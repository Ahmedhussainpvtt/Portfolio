/* =======================================================================
   SETTINGS

   OPEN_TO_WORK: set to true when you are job hunting. It shows the
   "Open to new opportunities" badge above your name in the hero.
   Set it back to false to hide the badge again.

   RECAPTCHA_SITE_KEY: Google reCAPTCHA v2 ("I'm not a robot") site key.
   Create one at https://www.google.com/recaptcha/admin for ahmedhussain.in
   (and localhost). Paste the site key here, never the secret key.
   Leave it empty and the form works without a captcha.
   ======================================================================= */
const OPEN_TO_WORK = false;
const RECAPTCHA_SITE_KEY = "6LckuL8tAAAAAHqHqjlh3ou3rqLhkXhBhwpFsIvi";

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

const CONTACT_EMAIL = "ahmedhussainpvt@gmail.com";

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
}

/* Fast travel: a full wormhole jump. The page is covered so this reads as a
   portal, not speed lines over the content. */
const travelEl = document.getElementById("travel");
const travelLabel = document.getElementById("travel-label");
const travelKicker = document.getElementById("travel-kicker");
const warpCanvas = document.getElementById("travel-fx");
const HEADER_OFFSET = 88;
let traveling = false;
let travelGuard = 0;

const warp = (() => {
  if (!warpCanvas) return { start() {}, stop() {}, setProgress() {} };

  const ctx = warpCanvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const GATE_COUNT = 16;
  const SPARK_COUNT = window.innerWidth < 760 ? 70 : 130;
  const NEAR = 48;
  const FAR = 920;
  const DEPTH = FAR - NEAR;

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let frame = null;
  let cam = 0;
  let spin = 0;
  let speed = 18;
  let dir = 1;
  let gates = [];
  let sparks = [];
  let accent = { teal: [56, 189, 248], amber: [103, 232, 249] };

  const readAccent = () => {
    const s = getComputedStyle(document.documentElement);
    const parse = (name, fallback) => {
      const raw = s.getPropertyValue(name).trim();
      if (!raw) return fallback;
      const parts = raw.split(",").map((n) => Number(n.trim()));
      return parts.length === 3 && parts.every((n) => !Number.isNaN(n)) ? parts : fallback;
    };
    accent = {
      teal: parse("--teal-rgb", [56, 189, 248]),
      amber: parse("--amber-rgb", [103, 232, 249]),
    };
  };

  const resize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    cx = w / 2;
    cy = h * 0.48;
    warpCanvas.width = Math.round(w * dpr);
    warpCanvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const wrapZ = (z) => {
    const t = ((z - NEAR) % DEPTH + DEPTH) % DEPTH;
    return NEAR + t;
  };

  const seed = () => {
    gates = Array.from({ length: GATE_COUNT }, (_, i) => ({
      z: NEAR + (i / GATE_COUNT) * DEPTH,
      rot: (i * Math.PI) / 9,
    }));
    sparks = Array.from({ length: SPARK_COUNT }, () => ({
      a: Math.random() * Math.PI * 2,
      z: NEAR + Math.random() * DEPTH,
      orbit: 70 + Math.random() * 220,
      size: 0.6 + Math.random() * 1.6,
      warm: Math.random() > 0.72,
    }));
  };

  const project = (z) => 280 / Math.max(z, 28);

  const hex = (x, y, r, rot) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i += 1) {
      const a = rot + (i * Math.PI) / 3;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  };

  const draw = () => {
    ctx.fillStyle = "#050810";
    ctx.fillRect(0, 0, w, h);

    cam += speed * dir;
    spin += 0.012 * dir;

    const [tr, tg, tb] = accent.teal;
    const [ar, ag, ab] = accent.amber;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin * 0.35);
    ctx.globalCompositeOperation = "lighter";

    gates.forEach((gate, i) => {
      const z = wrapZ(gate.z - cam);
      const scale = project(z);
      const r = 210 * scale;
      const depth = 1 - (z - NEAR) / DEPTH;
      const alpha = 0.08 + depth * 0.55;
      const rot = gate.rot + spin;

      hex(0, 0, r, rot);
      ctx.strokeStyle = `rgba(${tr}, ${tg}, ${tb}, ${alpha})`;
      ctx.lineWidth = 1.2 + depth * 2.4;
      ctx.stroke();

      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.28})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    });

    sparks.forEach((spark) => {
      spark.z = wrapZ(spark.z - speed * 1.6 * dir);
      const scale = project(spark.z);
      const x = Math.cos(spark.a + spin * 0.4) * spark.orbit * scale;
      const y = Math.sin(spark.a + spin * 0.4) * spark.orbit * scale;
      const depth = 1 - (spark.z - NEAR) / DEPTH;
      const radius = spark.size * scale * 7;
      const [r, g, b] = spark.warm ? [ar, ag, ab] : [tr, tg, tb];

      ctx.beginPath();
      ctx.arc(x, y, Math.max(radius, 0.4), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.2 + depth * 0.85})`;
      ctx.fill();
    });

    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    frame = requestAnimationFrame(draw);
  };

  window.addEventListener("resize", () => {
    if (frame) resize();
  });

  return {
    start(direction) {
      dir = direction < 0 ? -1 : 1;
      speed = 10;
      cam = 0;
      spin = 0;
      readAccent();
      resize();
      seed();
      if (!frame) frame = requestAnimationFrame(draw);
    },
    setProgress(t) {
      const cruise = t < 0.5 ? t * 2 : (1 - t) * 2;
      speed = 8 + cruise * 42;
    },
    stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = null;
      ctx.clearRect(0, 0, w, h);
    },
  };
})();

const warpEase = (t) => {
  if (t < 0.5) return 16 * t * t * t * t * t;
  return 1 - Math.pow(-2 * t + 2, 5) / 2;
};

const travelLabelFrom = (link, id) => {
  if (id === "#top") return "Top";
  const named = link.getAttribute("aria-label");
  if (named) return named.replace(/\s+/g, " ").trim();
  return (link.textContent || "").replace(/\s+/g, " ").trim();
};

const endTravel = (token) => {
  if (token !== travelGuard) return;
  traveling = false;
  document.documentElement.classList.remove("is-traveling", "is-travel-up", "is-arriving");
  if (travelEl) travelEl.setAttribute("aria-hidden", "true");
  warp.stop();
};

const currentScrollY = () =>
  lenis ? lenis.scroll : window.scrollY || window.pageYOffset || 0;

const travelAnchor = (target) => {
  if (!target || target === 0) return null;
  if (typeof target === "number") return null;
  if (target.id === "top") return target;
  return (
    target.querySelector(".section-heading") ||
    target.querySelector(".eyebrow") ||
    target.querySelector("h2") ||
    target
  );
};

const destFromTarget = (target) => {
  if (target === 0 || (target && target.id === "top")) return 0;
  if (typeof target === "number") return Math.max(0, Math.round(target));
  const anchor = travelAnchor(target);
  if (!anchor) return 0;
  return Math.max(
    0,
    Math.round(currentScrollY() + anchor.getBoundingClientRect().top - HEADER_OFFSET)
  );
};

const fastTravelTo = (target, { label = "", hash = "" } = {}) => {
  const destY = destFromTarget(target);
  const startY = currentScrollY();
  const dist = destY - startY;

  history.replaceState(null, "", "/");

  if (reducedMotion || Math.abs(dist) < 12) {
    if (lenis) lenis.scrollTo(destY, { immediate: true });
    else window.scrollTo(0, destY);
    requestScrollUpdate();
    return;
  }

  traveling = true;
  const token = (travelGuard += 1);
  document.documentElement.classList.add("is-traveling");
  document.documentElement.classList.toggle("is-travel-up", dist < 0);
  document.documentElement.classList.remove("is-arriving");
  if (travelKicker) travelKicker.textContent = hash === "#top" ? "Returning" : "Jumping to";
  if (travelLabel) travelLabel.textContent = label;
  if (travelEl) travelEl.setAttribute("aria-hidden", "false");

  const duration = Math.min(1100, Math.max(720, Math.abs(dist) * 0.09));

  warp.start(dist < 0 ? -1 : 1);

  const driveWarp = () => {
    if (token !== travelGuard || !traveling) return;
    const y = currentScrollY();
    const done = dist === 0 ? 1 : Math.min(Math.abs(y - startY) / Math.abs(dist), 1);
    warp.setProgress(done);
    requestAnimationFrame(driveWarp);
  };

  requestAnimationFrame(driveWarp);

  const finish = () => {
    document.documentElement.classList.add("is-arriving");
    requestScrollUpdate();
    if (typeof burstAt === "function") burstAt(window.innerWidth / 2, window.innerHeight * 0.48);
    setTimeout(() => endTravel(token), 380);
  };

  if (lenis) {
    lenis.scrollTo(destY, {
      duration: duration / 1000,
      easing: warpEase,
      lock: true,
      onComplete: finish,
    });
  } else {
    const t0 = performance.now();
    const step = (now) => {
      if (token !== travelGuard) return;
      const t = Math.min(1, (now - t0) / duration);
      window.scrollTo(0, startY + dist * warpEase(t));
      if (t < 1) requestAnimationFrame(step);
      else finish();
    };
    requestAnimationFrame(step);
  }

  setTimeout(() => endTravel(token), duration + 520);
};

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link) return;

  const href = link.getAttribute("href");
  if (!href) return;

  const onHome =
    location.pathname === "/" || /\/index\.html$/i.test(location.pathname);

  if ((href === "/" || href === "/index.html") && onHome) {
    event.preventDefault();
    if (traveling) return;
    fastTravelTo(document.getElementById("top") || 0, { label: "", hash: "#top" });
    return;
  }

  if (!href.startsWith("#") || href.length < 2) return;
  const target = document.querySelector(href);
  if (!target) return;
  event.preventDefault();
  if (traveling) return;
  fastTravelTo(target, { label: travelLabelFrom(link, href), hash: href });
});

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

if (isReload) {
  history.replaceState(null, "", "/");
}

jumpToTopNow();
window.addEventListener("load", jumpToTopNow);
window.addEventListener("pageshow", (event) => {
  if (event.persisted || isReload) jumpToTopNow();
});

const scrollToTop = () => {
  if (traveling) return;
  fastTravelTo(document.getElementById("top") || 0, { label: "", hash: "#top" });
};

backToTop.addEventListener("click", scrollToTop);
backToTopFooter.addEventListener("click", scrollToTop);

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

  const BLOCKER =
    "a, button, input, textarea, select, label, iframe, .g-recaptcha, [role='checkbox'], [role='button'], p, h1, h2, h3, h4, h5, h6, li, .eyebrow, .section-heading, .form-status, .legal";

  const centerOf = (el, entry) => {
    if (entry?.pulling) return { x: entry.originX, y: entry.originY };
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };

  const findNearest = () => {
    let nearest = null;
    let nearestDist = Infinity;
    buttons.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const { x, y } = centerOf(el, active.get(el));
      const dist = Math.hypot(pointerX - x, pointerY - y);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = el;
      }
    });
    return { nearest, nearestDist };
  };

  const peekUnder = (ignoreEl) => {
    const prev = ignoreEl.style.pointerEvents;
    ignoreEl.style.pointerEvents = "none";
    const hit = document.elementFromPoint(pointerX, pointerY);
    ignoreEl.style.pointerEvents = prev;
    return hit;
  };

  const updateFromPointer = () => {
    let pullingEl = null;
    active.forEach((entry, el) => {
      if (entry.pulling) pullingEl = el;
    });

    const { nearest, nearestDist } = findNearest();

    // Another CTA is closer → drop the current one and hand off.
    if (
      pullingEl &&
      nearest &&
      nearest !== pullingEl &&
      nearestDist <= CATCH
    ) {
      release(pullingEl, active.get(pullingEl));
      pullingEl = null;
    }

    if (!pullingEl) {
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

    // Peek under the stretched button: any other control or text → snap home.
    if (entry.pulling) {
      const hit = peekUnder(el);
      if (hit && !el.contains(hit)) {
        const otherBtn = hit.closest(".btn, .nav-cta");
        if (otherBtn && otherBtn !== el) {
          release(el, entry);
          return;
        }
        if (hit.closest(BLOCKER)) {
          release(el, entry);
          return;
        }
      }
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
          // split headings play once: reversing them mid-scroll remixes words
          if (el.classList.contains("is-split") && el.classList.contains("is-visible") && !show) {
            return;
          }
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

/* Section seams draw outward once and stay, so scrolling back up does not
   rewind a divider the reader has already passed. */
const seamSections = [...document.querySelectorAll(".section")];

if ("IntersectionObserver" in window && !reducedMotion) {
  const seamObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.boundingClientRect.bottom >= 0) return;
        entry.target.classList.add("is-seamed");
        seamObserver.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px" }
  );

  seamSections.forEach((section) => seamObserver.observe(section));
} else {
  seamSections.forEach((section) => section.classList.add("is-seamed"));
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
      const rise = document.createElement("span");
      const inner = document.createElement("span");

      clip.className = "w";
      rise.className = "rise";
      inner.className = "word";
      inner.textContent = word;
      rise.style.setProperty("--wd", `${index * 55}ms`);

      rise.appendChild(inner);
      clip.appendChild(rise);
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
let startRimSpin = () => {};
let stopRimSpin = () => {};

if (!reducedMotion) {
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

  startRimSpin = startSpin;
  stopRimSpin = stopSpin;

  // Touch has no hover, so there the spin is started by the press handler.
  if (finePointer) {
    document.querySelectorAll(".btn, .nav-cta").forEach((el) => {
      el.addEventListener("pointerenter", () => startSpin(el));
      el.addEventListener("pointerleave", () => stopSpin(el));
      el.addEventListener("pointercancel", () => stopSpin(el));
      el.addEventListener("focus", () => startSpin(el));
      el.addEventListener("blur", () => stopSpin(el));
    });
  }
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

/* Touch replacement for the desktop magnetic pull. Browsers apply :active
   inconsistently on touch, so the press state is set from the touch events. */
if (!finePointer) {
  const PRESSABLE = [
    ".btn",
    ".nav-cta",
    ".back-to-top",
    ".back-to-top-link",
    ".capability-toggle",
    ".work-details summary",
    ".achievement-grid article",
    ".leadership-grid article",
    ".explore-grid article",
    ".skill-groups article",
    ".approach-steps li",
    ".stats article",
    ".edu-card",
  ].join(", ");

  let pressedEl = null;

  const releasePress = () => {
    if (pressedEl) {
      pressedEl.classList.remove("is-pressed");
      stopRimSpin(pressedEl);
    }
    pressedEl = null;
  };

  document.addEventListener(
    "touchstart",
    (event) => {
      releasePress();
      const target = event.target.closest && event.target.closest(PRESSABLE);
      if (!target) return;
      pressedEl = target;
      target.classList.add("is-pressed");
      // hold on a CTA and the glowing rim sweeps, same as a desktop hover
      if (target.matches(".btn, .nav-cta")) startRimSpin(target);
    },
    { passive: true }
  );

  document.addEventListener("touchend", releasePress, { passive: true });
  document.addEventListener("touchcancel", releasePress, { passive: true });
  // a press that turns into a scroll should not stay dented
  window.addEventListener("scroll", releasePress, { passive: true });
}

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
  let linkDist = 130;
  let sparks = [];
  const trail = [];
  const pointer = { x: 0, y: 0, active: false, moving: false, lastMove: 0 };
  // Touch has no hovering position, so the tail rides finger drags instead.
  // It samples wider apart there: the hand covers the tip, so the ribbon needs
  // to reach further back to stay visible without costing more points.
  const touchTrail = !finePointer;
  const TRAIL_MAX = touchTrail ? 52 : 56;
  const TRAIL_STEP = touchTrail ? 4.5 : 2.5;
  const follow = { x: 0, y: 0, ready: false };
  let lastSampleX = 0;
  let lastSampleY = 0;

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

    // Linking every pair is O(n^2), so phones get a thinner field and a
    // shorter link reach rather than no field at all.
    const narrow = width < 760;
    linkDist = narrow ? 104 : 130;
    const count = narrow
      ? Math.min(24, Math.round(width / 18))
      : Math.min(58, Math.round(width / 26));
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

  const trackPoint = (x, y) => {
    const moved = Math.hypot(x - pointer.x, y - pointer.y);

    pointer.x = x;
    pointer.y = y;
    pointer.active = true;

    // ignore micro jitter so a resting cursor does not keep a tail alive
    if (moved > 0.6) {
      pointer.moving = true;
      pointer.lastMove = performance.now();
    }

    if (!follow.ready) {
      follow.x = x;
      follow.y = y;
      follow.ready = true;
      lastSampleX = x;
      lastSampleY = y;
    }
  };

  if (touchTrail) {
    /* Touch uses touch events, not pointer events: the browser fires
       pointercancel the moment a drag turns into a scroll, which killed the
       tail during the one gesture people actually make. touchmove keeps
       firing through the scroll. */
    const anchorTo = (touch) => {
      // start the tail at the finger so it never whips in from the last touch
      pointer.x = touch.clientX;
      pointer.y = touch.clientY;
      pointer.active = true;
      follow.x = pointer.x;
      follow.y = pointer.y;
      follow.ready = true;
      lastSampleX = pointer.x;
      lastSampleY = pointer.y;
    };

    window.addEventListener(
      "touchstart",
      (event) => {
        const touch = event.touches[0];
        if (touch) anchorTo(touch);
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (event) => {
        const touch = event.touches[0];
        if (touch) trackPoint(touch.clientX, touch.clientY);
      },
      { passive: true }
    );

    const endTouch = () => {
      pointer.active = false;
      pointer.moving = false;
    };

    window.addEventListener("touchend", endTouch, { passive: true });
    window.addEventListener("touchcancel", endTouch, { passive: true });
  } else {
    window.addEventListener(
      "pointermove",
      (event) => trackPoint(event.clientX, event.clientY),
      { passive: true }
    );

    document.addEventListener("pointerleave", () => {
      pointer.active = false;
      pointer.moving = false;
    });
  }

  const readAccents = () => {
    const styles = getComputedStyle(document.documentElement);
    const teal = styles.getPropertyValue("--teal").trim() || "#0f6c85";
    const amber = styles.getPropertyValue("--amber").trim() || "#bd8b52";
    const tealRgb = (styles.getPropertyValue("--teal-rgb").trim() || "15, 108, 133")
      .split(",")
      .map((n) => Number(n.trim()));
    const amberRgb = (styles.getPropertyValue("--amber-rgb").trim() || "189, 139, 82")
      .split(",")
      .map((n) => Number(n.trim()));
    return { teal, amber, tealRgb, amberRgb };
  };

  let accents = readAccents();
  window.addEventListener("themechange", () => {
    accents = readAccents();
  });

  burstAt = (x, y) => {
    const colors = [accents.teal, accents.amber, accents.teal, accents.amber];
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
      bgCtx.fillStyle = `rgba(${accents.tealRgb.join(",")}, ${p.a})`;
      bgCtx.fill();
    });

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist > linkDist) continue;

        bgCtx.beginPath();
        bgCtx.moveTo(particles[i].x, particles[i].y);
        bgCtx.lineTo(particles[j].x, particles[j].y);
        bgCtx.strokeStyle = `rgba(${accents.tealRgb.join(",")}, ${(1 - dist / linkDist) * 0.09})`;
        bgCtx.lineWidth = 1;
        bgCtx.stroke();
      }
    }
  };

  const drawTrail = () => {
    // tail only while the cursor is actually moving; resting = glow circle only
    if (pointer.moving && performance.now() - pointer.lastMove > 48) {
      pointer.moving = false;
    }

    follow.x += (pointer.x - follow.x) * 0.32;
    follow.y += (pointer.y - follow.y) * 0.32;

    if (pointer.active && follow.ready && pointer.moving) {
      const dx = follow.x - lastSampleX;
      const dy = follow.y - lastSampleY;
      const dist = Math.hypot(dx, dy);

      if (dist > 0.8) {
        const steps = Math.max(1, Math.ceil(dist / TRAIL_STEP));
        for (let s = 1; s <= steps; s += 1) {
          trail.push({
            x: lastSampleX + (dx * s) / steps,
            y: lastSampleY + (dy * s) / steps,
          });
        }
        lastSampleX = follow.x;
        lastSampleY = follow.y;
      }

      while (trail.length > TRAIL_MAX) trail.shift();
    } else if (trail.length) {
      // collapse fast once motion stops so it does not linger behind the cursor
      trail.splice(0, Math.max(3, Math.ceil(trail.length * 0.28)));
      if (!trail.length) {
        lastSampleX = follow.x;
        lastSampleY = follow.y;
      }
    } else {
      lastSampleX = follow.x;
      lastSampleY = follow.y;
    }

    if (trail.length < 2) return;

    const [tr, tg, tb] = accents.tealRgb;
    const [ar, ag, ab] = accents.amberRgb;

    const strokeSmooth = (width, alpha, color) => {
      fxCtx.beginPath();
      fxCtx.moveTo(trail[0].x, trail[0].y);

      if (trail.length === 2) {
        fxCtx.lineTo(trail[1].x, trail[1].y);
      } else {
        for (let i = 1; i < trail.length - 1; i += 1) {
          const xc = (trail[i].x + trail[i + 1].x) * 0.5;
          const yc = (trail[i].y + trail[i + 1].y) * 0.5;
          fxCtx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
        }
        const last = trail[trail.length - 1];
        fxCtx.lineTo(last.x, last.y);
      }

      fxCtx.strokeStyle = `rgba(${color}, ${alpha})`;
      fxCtx.lineWidth = width;
      fxCtx.lineCap = "round";
      fxCtx.lineJoin = "round";
      fxCtx.stroke();
    };

    fxCtx.save();
    strokeSmooth(16, 0.07, `${tr}, ${tg}, ${tb}`);
    strokeSmooth(9, 0.14, `${tr}, ${tg}, ${tb}`);
    strokeSmooth(4.2, 0.38, `${Math.round((tr + ar) / 2)}, ${Math.round(
      (tg + ag) / 2
    )}, ${Math.round((tb + ab) / 2)}`);
    strokeSmooth(2, 0.7, `${ar}, ${ag}, ${ab}`);

    if (pointer.moving) {
      const tip = trail[trail.length - 1];
      const glow = fxCtx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 14);
      glow.addColorStop(0, `rgba(${ar}, ${ag}, ${ab}, 0.55)`);
      glow.addColorStop(1, `rgba(${ar}, ${ag}, ${ab}, 0)`);
      fxCtx.fillStyle = glow;
      fxCtx.beginPath();
      fxCtx.arc(tip.x, tip.y, 14, 0, Math.PI * 2);
      fxCtx.fill();
    }
    fxCtx.restore();
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
      drawTrail();
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
const recaptchaWrap = document.getElementById("recaptcha-wrap");
let recaptchaWidgetId = null;
let recaptchaReady = Promise.resolve();

const loadRecaptcha = () => {
  if (!RECAPTCHA_SITE_KEY || !recaptchaWrap) return Promise.resolve();

  recaptchaWrap.hidden = false;

  if (window.grecaptcha?.render) {
    recaptchaWidgetId = window.grecaptcha.render("recaptcha", {
      sitekey: RECAPTCHA_SITE_KEY,
      theme: "dark",
    });
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    window.onRecaptchaLoad = () => {
      try {
        recaptchaWidgetId = window.grecaptcha.render("recaptcha", {
          sitekey: RECAPTCHA_SITE_KEY,
          theme: "dark",
        });
        resolve();
      } catch (error) {
        reject(error);
      }
    };

    const script = document.createElement("script");
    script.src =
      "https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit";
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("reCAPTCHA failed to load"));
    document.head.appendChild(script);
  });
};

if (form && RECAPTCHA_SITE_KEY) {
  recaptchaReady = loadRecaptcha();
}

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

  let recaptchaToken = "";
  if (RECAPTCHA_SITE_KEY) {
    try {
      await recaptchaReady;
    } catch (error) {
      setStatus("Could not load the spam check. Refresh and try again.", "error");
      return;
    }

    recaptchaToken = window.grecaptcha?.getResponse(recaptchaWidgetId) || "";
    if (!recaptchaToken) {
      setStatus("Tick the I'm not a robot box, then send.", "error");
      return;
    }
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
        _subject: `${name} - New messages on Ahmed Porfolio`,
        _template: "table",
        _captcha: "false",
        "g-recaptcha-response": recaptchaToken,
      }),
    });

    if (!response.ok) {
      throw new Error("Form service unavailable");
    }

    form.reset();
    if (RECAPTCHA_SITE_KEY && window.grecaptcha && recaptchaWidgetId !== null) {
      window.grecaptcha.reset(recaptchaWidgetId);
    }
    setButtonState("sent");
    celebrate();
    setStatus(
      "Message sent. Thanks for reaching out. I will get back to you soon.",
      "success"
    );
    setTimeout(() => setButtonState("idle"), 3200);
  } catch (error) {
    setButtonState("idle");
    const subject = encodeURIComponent(
      `${name} - New messages on Ahmed Porfolio`
    );
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
