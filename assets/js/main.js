/* AnalySight website: effects, router, analytics lab, contact form. */
(() => {
"use strict";
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ---------------- Contact details ---------------- */
$("#emailLink").textContent = CONFIG.email;
$("#emailLink").href = "mailto:" + CONFIG.email;
$("#liLink").href = CONFIG.linkedin;
$("#ytLink").href = CONFIG.youtube;
const waNumber = String(CONFIG.whatsapp).replace(/\D/g, "");
$$(".js-wa").forEach((a) => { a.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`; });
$$(".js-wa-num").forEach((a) => { a.textContent = "+" + waNumber; });

/* ---------------- Theme ---------------- */
const themeListeners = [];
function applyTheme(t) {
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("as-theme", t); } catch (e) {}
  themeListeners.forEach((fn) => fn());
}
try { const saved = localStorage.getItem("as-theme"); if (saved === "light" || saved === "dark") document.documentElement.setAttribute("data-theme", saved); } catch (e) {}
$("#themeBtn").addEventListener("click", () => {
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

/* ---------------- Mobile menu ---------------- */
const menuBtn = $("#menuBtn"), navLinks = $("#navLinks");
menuBtn.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
});
function closeMenu() { navLinks.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.setAttribute("aria-label", "Open menu"); }

/* ============================================================
   Hover text effects
   ============================================================ */
const GLYPHS = "!<>-_\\/[]{}=+*^?#%@&$~";
const RAMP = ".:-=+*#%@";
const rand = (s) => s[Math.floor(Math.random() * s.length)];

// Split an element's text into per-character spans (screen readers still get the real text).
function split(el) {
  if (el._spans) return el._spans;
  const text = el.textContent;
  if (!el.hasAttribute("aria-label") && el.tagName !== "SPAN") el.setAttribute("aria-label", text);
  el.textContent = "";
  const wrap = document.createElement("span");
  wrap.setAttribute("aria-hidden", "true");
  el._spans = [...text].map((c) => {
    const s = document.createElement("span");
    s.className = "ch"; s.dataset.c = c; s.textContent = c;
    wrap.appendChild(s); return s;
  });
  el.appendChild(wrap);
  return el._spans;
}
// Hover target may be a parent (e.g. the whole row triggers the title's effect).
function bind(target, onEnter, onLeave) {
  target.addEventListener("pointerenter", onEnter);
  target.addEventListener("focusin", onEnter);
  if (onLeave) { target.addEventListener("pointerleave", onLeave); target.addEventListener("focusout", onLeave); }
}
// Smooth sweep: one band of shading glyphs travels across the word (no random flicker).
function scramble(el) {
  cancelAnimationFrame(el._raf);
  const spans = el._spans, n = spans.length, band = 5, dur = 260 + n * 22, t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const front = (1 - Math.pow(1 - p, 2)) * (n + band);
    spans.forEach((s, i) => {
      if (s.dataset.c === " ") return;
      const d = front - i;
      const g = d >= 0 && d < band ? RAMP[Math.max(0, Math.round((1 - d / band) * (RAMP.length - 1)))] : null;
      if (g !== (s._g || null)) { s._g = g; g ? s.setAttribute("data-g", g) : s.removeAttribute("data-g"); }
    });
    if (p < 1) el._raf = requestAnimationFrame(tick);
  };
  el._raf = requestAnimationFrame(tick);
}
function wave(el) {
  const ink = cssVar("--ink"), gold = cssVar("--gold");
  el._spans.forEach((s, i) => {
    if (s._anim) s._anim.cancel();
    s._anim = s.animate(
      [{ transform: "translateY(0)", color: ink }, { transform: "translateY(-0.35em)", color: gold }, { transform: "translateY(0)", color: ink }],
      { duration: 420, delay: i * 28, easing: "ease-in-out" });
  });
}
function setupRetype(el) {
  const original = el.textContent.trim(), alt = el.dataset.alt || original;
  el.setAttribute("aria-label", original);
  el.textContent = "";
  const txt = document.createElement("span"); txt.setAttribute("aria-hidden", "true"); txt.textContent = original;
  const caret = document.createElement("span"); caret.className = "tw-caret"; caret.setAttribute("aria-hidden", "true"); caret.textContent = "_";
  el.append(txt, caret);
  // Fixed width so the button never shrinks out from under the cursor.
  el.style.minWidth = `calc(${Math.max(original.length, alt.length) + 1}ch + 50px)`;
  el._token = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function morph(target) {
    const token = ++el._token;
    el.classList.add("typing");
    while (txt.textContent.length && !target.startsWith(txt.textContent)) {
      await wait(26); if (token !== el._token) return;
      txt.textContent = txt.textContent.slice(0, -1);
    }
    while (txt.textContent !== target) {
      await wait(42); if (token !== el._token) return;
      txt.textContent = target.slice(0, txt.textContent.length + 1);
    }
    el.classList.remove("typing");
  }
  bind(el, () => morph(alt), () => morph(original));
}
function setupShade(el, radius) {
  const spans = split(el);
  let raf = 0, px = 0, py = 0;
  const paint = () => {
    raf = 0;
    spans.forEach((s) => {
      const o = s.dataset.c; if (o === " ") return;
      const r = s.getBoundingClientRect();
      const d = Math.hypot(r.left + r.width / 2 - px, r.top + r.height / 2 - py);
      if (d < radius) {
        s.textContent = RAMP[Math.min(RAMP.length - 1, Math.floor((1 - d / radius) * RAMP.length))];
        s.classList.add("g");
      } else if (s.textContent !== o) { s.textContent = o; s.classList.remove("g"); }
    });
  };
  const reset = () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } spans.forEach((s) => { s.textContent = s.dataset.c; s.classList.remove("g"); }); };
  el.addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(paint); });
  el.addEventListener("pointerleave", reset);
  el.addEventListener("pointercancel", reset);
}

if (!reduceMotion) {
  $$('[data-fx="scramble"]').forEach((el) => {
    split(el);
    const trigger = el.closest(".service") || el;
    bind(trigger, () => scramble(el));
  });
  $$('[data-fx="wave"]').forEach((el) => { split(el); bind(el.closest(".build") || el, () => wave(el)); });
  $$('[data-fx="retype"]').forEach(setupRetype);
  setupShade($("#footerName"), 130);
}

/* ============================================================
   Particle hero: grains converge into the name, react to the cursor,
   scatter on click and drift apart and back every few seconds.
   ============================================================ */
const Hero = (() => {
  const canvas = $("#heroCanvas"), ctx = canvas.getContext("2d");
  const hero = $("#hero");
  let W = 0, H = 0, dpr = 1, parts = [], colors = [], raf = 0, last = 0, running = false;
  let mouse = { x: -9999, y: -9999 }, nextDrift = 0, driftUntil = 0, built = false;

  function readColors() { colors = [cssVar("--gold"), cssVar("--gold-2"), cssVar("--rose"), cssVar("--teal"), cssVar("--muted")]; }

  function targets() {
    const off = document.createElement("canvas");
    off.width = Math.max(1, Math.floor(W)); off.height = Math.max(1, Math.floor(H));
    const o = off.getContext("2d");
    const lines = W < 760 ? CONFIG.brandLinesMobile : [CONFIG.brandLine];
    let fs = W < 760 ? W * 0.2 : W * 0.12;
    o.font = `800 ${fs}px Fraunces, Georgia, serif`;
    const widest = Math.max(...lines.map((l) => o.measureText(l).width));
    fs = Math.min(fs * (W * 0.86) / widest, H * (lines.length > 1 ? 0.2 : 0.3));
    o.font = `800 ${fs}px Fraunces, Georgia, serif`;
    o.textAlign = "center"; o.textBaseline = "middle"; o.fillStyle = "#fff";
    const lh = fs * 1.0, cy = H * (W < 760 ? 0.36 : 0.40);
    lines.forEach((l, i) => o.fillText(l, W / 2, cy + (i - (lines.length - 1) / 2) * lh));
    const step = Math.max(3, Math.round(fs / 32));
    const data = o.getImageData(0, 0, off.width, off.height).data, pts = [];
    for (let y = 0; y < off.height; y += step)
      for (let x = 0; x < off.width; x += step)
        if (data[(y * off.width + x) * 4 + 3] > 140) pts.push([x + (Math.random() - .5) * step * .6, y + (Math.random() - .5) * step * .6]);
    const max = W < 760 ? 1600 : 3600;
    for (let i = pts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pts[i], pts[j]] = [pts[j], pts[i]]; }
    return pts.slice(0, max);
  }

  function build() {
    const r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    if (W < 10 || H < 10) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readColors();
    const pts = targets();
    const dust = Math.round(pts.length * 0.12);
    const fresh = !built;
    const next = [];
    for (let i = 0; i < pts.length + dust; i++) {
      const p = parts[i] || { x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0 };
      if (i < pts.length) { p.tx = pts[i][0]; p.ty = pts[i][1]; p.dust = false; }
      else { p.tx = Math.random() * W; p.ty = Math.random() * H; p.dust = true; }
      // Colour sweeps left to right (amber -> coral -> pink) with mint sparks mixed in.
      if (p.dust) p.c = 4;
      else if (Math.random() < .12) p.c = 3;
      else { const f = p.tx / W + (Math.random() - .5) * .25; p.c = f < .38 ? 0 : f < .68 ? 1 : 2; }
      p.s = p.dust ? 1.2 : (Math.random() < .18 ? 2.4 : 1.8);
      if (fresh) p.delay = Math.random() * 1400 + (p.x / W) * 600;
      p.ph = Math.random() * Math.PI * 2;
      next.push(p);
    }
    // Group by colour so the canvas changes fillStyle only 3 times per frame.
    parts = next.sort((a, b) => a.c - b.c);
    built = true;
    return true;
  }

  function step(now) {
    const dt = Math.min((now - last) / 16.67, 3); last = now;
    const drifting = now < driftUntil;
    if (!reduceMotion && now > nextDrift) { scatter(0.9); driftUntil = now + 1100; nextDrift = now + 12000; }
    const R = 110, R2 = R * R;
    const damp = Math.pow(0.86, dt);
    for (const p of parts) {
      if (p.delay > 0) { p.delay -= dt * 16.67; p.x += Math.sin(now * .001 + p.ph) * .3; p.y += Math.cos(now * .0013 + p.ph) * .3; continue; }
      let k = p.dust ? 0.004 : (drifting ? 0.004 : 0.05);
      if (p.dust) { p.tx += Math.sin(now * .0004 + p.ph) * .25 * dt; p.ty += Math.cos(now * .0003 + p.ph) * .2 * dt; }
      p.vx += (p.tx - p.x) * k * dt; p.vy += (p.ty - p.y) * k * dt;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < R2 && d2 > 0.01) { const d = Math.sqrt(d2), f = (1 - d / R) * 3.2 * dt; p.vx += dx / d * f; p.vy += dy / d * f; }
      p.vx *= damp; p.vy *= damp;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    let cur = -1;
    for (const p of parts) {
      if (p.c !== cur) { cur = p.c; ctx.fillStyle = colors[cur]; ctx.globalAlpha = cur === 4 ? 0.45 : 1; }
      ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.globalAlpha = 1;
  }

  function scatter(power, cx, cy) {
    for (const p of parts) {
      if (p.dust) continue;
      if (cx != null) {
        const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1;
        const f = Math.max(0, 1 - d / 420) * 22 * power;
        p.vx += dx / d * f + (Math.random() - .5) * 2; p.vy += dy / d * f + (Math.random() - .5) * 2;
      } else {
        p.vx += (Math.random() - .5) * 9 * power; p.vy += (Math.random() - .5) * 9 * power;
      }
    }
  }

  function start() {
    if (running) return;
    if (!built && !build()) return;
    if (reduceMotion) { parts.forEach((p) => { p.x = p.tx; p.y = p.ty; }); draw(); return; }
    running = true; last = performance.now(); nextDrift = last + 9000;
    raf = requestAnimationFrame(step);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  hero.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });
  hero.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    const r = canvas.getBoundingClientRect(); scatter(1, e.clientX - r.left, e.clientY - r.top);
  });
  let rt = 0;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => { if (!$('[data-page="home"]').classList.contains("active")) { built = false; return; } build(); if (reduceMotion) draw(); }, 180);
  });
  themeListeners.push(() => { readColors(); if (reduceMotion && built) draw(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else if (Router.current === "home") start(); });
  // Pause when the hero scrolls out of view.
  new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && Router.current === "home") start(); else stop(); })).observe(hero);
  return { start, stop, rebuild: () => { built = false; } };
})();

/* ============================================================
   Wave reveal: headings and paragraphs are "printed" by a travelling
   band of ASCII shading when they scroll into view.
   ============================================================ */
const Reveal = (() => {
  const SEL = ".hero-lede, .show-head h2, .lead-pitch h2, .page-head h1, .page-head p, .section-head h2, .section-head p, .service h3, .steps h3, .about h2, .about p, .svc-block h2, .svc-block .intro, .case h3, .cta-band h2, .contact > div > p";
  const els = $$(SEL).filter((el) => !el.closest("[data-fx]") && !el.hasAttribute("data-fx"));

  // Wrap every character in a span, keeping nested tags (em, b, a) and word wrapping intact.
  function charify(el) {
    if (el._chars) return el._chars;
    const chars = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement("span"); w.className = "wd";
            [...part].forEach((c) => { const s = document.createElement("span"); s.className = "cx"; s.textContent = c; w.appendChild(s); chars.push(s); });
            frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    el._chars = chars;
    return chars;
  }
  function arm(el) {
    cancelAnimationFrame(el._raf);
    charify(el).forEach((c) => { c.classList.add("hid"); c.removeAttribute("data-g"); c._s = "hid"; });
    el._armed = true;
  }
  function play(el, delay) {
    el._armed = false;
    const cs = el._chars, n = cs.length, band = 12;
    const dur = Math.min(1600, 550 + n * 5), t0 = performance.now() + delay;
    const tick = (now) => {
      const p = Math.max(0, Math.min(1, (now - t0) / dur));
      const front = (1 - Math.pow(1 - p, 3)) * (n + band);   // ease-out: fast start, gentle landing
      for (let i = 0; i < n; i++) {
        const c = cs[i], d = front - i;
        let st;
        if (d < 0) st = "hid";
        else if (d < band) st = RAMP[Math.max(0, Math.round((1 - d / band) * (RAMP.length - 1)))];
        else st = "";
        if (st === c._s) continue;          // only touch the DOM when a letter changes state
        c._s = st;
        if (st === "hid") { c.classList.add("hid"); c.removeAttribute("data-g"); }
        else if (st) { c.classList.remove("hid"); c.setAttribute("data-g", st); }
        else { c.classList.remove("hid"); c.removeAttribute("data-g"); }
      }
      if (p < 1) el._raf = requestAnimationFrame(tick);
    };
    el._raf = requestAnimationFrame(tick);
  }
  const io = new IntersectionObserver((entries) => {
    let k = 0;
    entries.forEach((e) => { if (e.isIntersecting && e.target._armed) play(e.target, k++ * 90); });
  }, { threshold: 0.2 });

  if (!reduceMotion) els.forEach((el) => { arm(el); io.observe(el); });

  // Gradient text on split letters: CSS background-clip can't paint positioned spans,
  // so colour each letter along the amber -> coral -> pink gradient instead.
  function tint() {
    const hex = (h) => { const n = parseInt(h.replace("#", ""), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
    const stops = [cssVar("--gold"), cssVar("--gold-2"), cssVar("--rose")].map(hex);
    $$(".hero-lede em").forEach((em) => {
      const cs = [...em.querySelectorAll(".cx")];
      cs.forEach((c, i) => {
        const t = cs.length > 1 ? i / (cs.length - 1) : 0, seg = t < .5 ? 0 : 1, f = seg ? (t - .5) * 2 : t * 2;
        const a = stops[seg], b = stops[seg + 1];
        c.style.color = `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(",")})`;
      });
    });
  }
  if (!reduceMotion) tint();
  themeListeners.push(() => { if (!reduceMotion) tint(); });

  return {
    // Re-arm a page's text each time it's opened so the reveal plays again.
    armPage(page) {
      if (reduceMotion) return;
      els.forEach((el) => { if (el.closest(".page") === page) arm(el); });
    }
  };
})();

/* ============================================================
   Router (hash based: #/, #/services, #/work, #/analytics, #/contact)
   ============================================================ */
const Router = { current: null };
function route() {
  const [name0, query = ""] = (location.hash.replace(/^#\/?/, "") || "home").split("?");
  const name = name0 || "home";
  const page = $(`[data-page="${name}"]`) ? name : "home";
  const toLead = page === "analytics" && /(^|&)lead\b/.test(query);
  const jump = () => { if (toLead) setTimeout(() => $("#lead-form").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }), 60); };
  if (page === Router.current) { jump(); return; }
  Router.current = page;
  Reveal.armPage($(`[data-page="${page}"]`));
  $$(".page").forEach((p) => p.classList.toggle("active", p.dataset.page === page));
  $$("[data-route]").forEach((a) => a.dataset.route === page ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current"));
  const B = CONFIG.brand;
  const titles = { home: `${B} | AI, Automation and Data Analytics Consultancy`, services: `Services | ${B}`, work: `Work | ${B}`, analytics: `Analytics lab | ${B}`, contact: `Contact | ${B}` };
  document.title = titles[page];
  closeMenu();
  window.scrollTo(0, 0);
  if (page === "home") { Hero.rebuild(); requestAnimationFrame(() => Hero.start()); } else Hero.stop();
  if (page === "analytics") Lab.onShow();
  jump();
}
window.addEventListener("hashchange", route);
// Clicking a "?lead" link while already on that exact URL fires no hashchange, so scroll by hand.
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href="#/analytics?lead"]');
  if (a && location.hash === "#/analytics?lead") { e.preventDefault(); $("#lead-form").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); }
});

/* ============================================================
   Analytics lab
   ============================================================ */
const Lab = (() => {
  const MAX_ROWS = 50000;
  const state = { rows: [], cols: [], loaded: false, source: "no" };
  const charts = {};
  const msg = $("#labMsg");
  const say = (t, err) => { msg.textContent = t; msg.classList.toggle("err", !!err); };

  /* ---- Parsing ---- */
  function detectDelim(text) {
    const line = text.split(/\r?\n/).find((l) => l.trim()) || "";
    let best = ",", bestN = 0;
    for (const d of [",", ";", "\t", "|"]) {
      let n = 0, q = false;
      for (const ch of line) { if (ch === '"') q = !q; else if (ch === d && !q) n++; }
      if (n > bestN) { bestN = n; best = d; }
    }
    return best;
  }
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, "");
    const d = detectDelim(text), rows = [];
    let row = [], field = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
        else field += ch;
      } else if (ch === '"') q = true;
      else if (ch === d) { row.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); field = "";
        if (row.some((v) => v.trim() !== "")) rows.push(row);
        row = [];
        if (rows.length > MAX_ROWS) break;
      } else field += ch;
    }
    if (field !== "" || row.length) { row.push(field); if (row.some((v) => v.trim() !== "")) rows.push(row); }
    return rows;
  }
  function toNum(v) {
    if (v == null) return NaN;
    let s = String(v).trim();
    if (!s) return NaN;
    s = s.replace(/^(rs\.?|pkr|usd|aed)\s*/i, "").replace(/[$€£¥₹₨%\s]/g, "");
    if (/^\(.*\)$/.test(s)) s = "-" + s.slice(1, -1);
    if (/^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
    if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return NaN;
    return Number(s);
  }
  const MONTHS = /jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i;
  function dateParser(values) {
    // Decide day/month order from the column itself: a first part above 12 means day-first.
    let dmy = true, sawSlash = false;
    for (const v of values) {
      const m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/.exec(v);
      if (m) { sawSlash = true; if (+m[1] > 12) { dmy = true; break; } if (+m[2] > 12) { dmy = false; break; } }
    }
    return (v) => {
      const s = String(v).trim();
      let m = /^(\d{4})[\/.-](\d{1,2})(?:[\/.-](\d{1,2}))?(?:[ T](\d{1,2}):(\d{2}))?/.exec(s);
      if (m) { const mo = +m[2], da = m[3] ? +m[3] : 1; if (mo < 1 || mo > 12 || da < 1 || da > 31) return NaN; return Date.UTC(+m[1], mo - 1, da, m[4] ? +m[4] : 0, m[5] ? +m[5] : 0); }
      m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})/.exec(s);
      if (m) {
        let y = +m[3]; if (y < 100) y += 2000;
        const da = dmy ? +m[1] : +m[2], mo = dmy ? +m[2] : +m[1];
        if (mo < 1 || mo > 12 || da < 1 || da > 31) return NaN;
        return Date.UTC(y, mo - 1, da);
      }
      if (MONTHS.test(s) && /\d/.test(s)) { const t = Date.parse(s); return isNaN(t) ? NaN : t; }
      return NaN;
    };
  }
  function inferColumns(header, body) {
    return header.map((name, idx) => {
      const raw = body.map((r) => (r[idx] ?? "").trim());
      const filled = raw.filter((v) => v !== "");
      const col = { name: name.trim() || `column_${idx + 1}`, idx, missing: raw.length - filled.length, type: "text" };
      if (!filled.length) { col.type = "empty"; col.values = raw; return col; }
      const nums = filled.map(toNum);
      const numOk = nums.filter((n) => !isNaN(n)).length / filled.length;
      const dp = dateParser(filled.slice(0, 500));
      const dateOk = filled.slice(0, 500).filter((v) => !isNaN(dp(v))).length / Math.min(filled.length, 500);
      if (dateOk >= 0.9 && !/^\d+(\.\d+)?$/.test(filled[0])) {
        col.type = "date"; col.values = raw.map((v) => (v === "" ? NaN : dp(v)));
      } else if (numOk >= 0.9) {
        col.type = "number"; col.values = raw.map(toNum);
      } else {
        col.type = "text"; col.values = raw;
      }
      if (col.type !== "date") col.distinct = new Set(filled).size;
      return col;
    });
  }

  /* ---- Maths ---- */
  const clean = (arr) => arr.filter((v) => typeof v === "number" && isFinite(v));
  function stats(arr) {
    const a = clean(arr).sort((x, y) => x - y), n = a.length;
    if (!n) return null;
    const sum = a.reduce((s, v) => s + v, 0), mean = sum / n;
    const q = (p) => { const i = (n - 1) * p, lo = Math.floor(i), hi = Math.ceil(i); return a[lo] + (a[hi] - a[lo]) * (i - lo); };
    const sd = Math.sqrt(a.reduce((s, v) => s + (v - mean) ** 2, 0) / (n > 1 ? n - 1 : 1));
    return { n, sum, mean, median: q(.5), min: a[0], max: a[n - 1], q1: q(.25), q3: q(.75), sd };
  }
  function pearson(x, y) {
    let n = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
    for (let i = 0; i < x.length; i++) {
      const a = x[i], b = y[i];
      if (!isFinite(a) || !isFinite(b)) continue;
      n++; sx += a; sy += b; sxx += a * a; syy += b * b; sxy += a * b;
    }
    if (n < 3) return NaN;
    const den = Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
    return den ? (n * sxy - sx * sy) / den : NaN;
  }
  function aggregate(values, how) {
    const a = clean(values);
    if (how === "count") return values.length;
    if (!a.length) return NaN;   // no usable numbers: leave the bucket out instead of showing 0
    if (how === "sum") return a.reduce((s, v) => s + v, 0);
    if (how === "avg") return a.reduce((s, v) => s + v, 0) / a.length;
    if (how === "max") return Math.max(...a);
    if (how === "min") return Math.min(...a);
    return 0;
  }
  const fmt = (v, digits) => {
    if (!isFinite(v)) return "–";
    const a = Math.abs(v);
    if (a >= 1e6) return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 2 }).format(v);
    return new Intl.NumberFormat("en", { maximumFractionDigits: digits ?? (a < 10 ? 2 : a < 1000 ? 1 : 0) }).format(v);
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---- Grouping ---- */
  function groupData(metric, group, how) {
    const buckets = new Map();
    let kind = "category", unit = null;
    if (group.type === "date") {
      kind = "time";
      const ts = clean(group.values);
      const span = (Math.max(...ts) - Math.min(...ts)) / 864e5;
      unit = span <= 62 ? "day" : span <= 1100 ? "month" : "year";
      group.values.forEach((t, i) => {
        if (!isFinite(t)) return;
        const d = new Date(t);
        const key = unit === "day" ? d.toISOString().slice(0, 10) : unit === "month" ? d.toISOString().slice(0, 7) : String(d.getUTCFullYear());
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key).push(metric ? metric.values[i] : 1);
      });
      let keys = [...buckets.keys()].sort();
      // A first or last period with far fewer rows than usual is usually incomplete (data stops mid-month).
      // For totals and counts that would show a fake drop, so leave it out and say so.
      const partial = [];
      if ((how === "sum" || how === "count") && unit !== "day" && keys.length >= 4) {
        const counts = keys.map((k) => buckets.get(k).length).sort((a, b) => a - b);
        const median = counts[Math.floor(counts.length / 2)];
        const edge = (k) => buckets.get(k).length < median * 0.6;
        if (edge(keys[keys.length - 1])) partial.push(keys.pop());
        if (edge(keys[0])) partial.push(keys.shift());
      }
      const pairs = keys.map((k) => [k, aggregate(buckets.get(k), how)]).filter((e) => isFinite(e[1]));
      return { kind, unit, partial, labels: pairs.map((e) => e[0]), values: pairs.map((e) => e[1]) };
    }
    group.values.forEach((g, i) => {
      const key = (g === "" || (typeof g === "number" && !isFinite(g))) ? "(blank)" : String(g);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(metric ? metric.values[i] : 1);
    });
    let entries = [...buckets.entries()].map(([k, v]) => [k, aggregate(v, how)]).filter((e) => isFinite(e[1])).sort((a, b) => b[1] - a[1]);
    const total = entries.length;
    if (entries.length > 12) {
      const rest = entries.slice(11);
      const restVal = how === "sum" || how === "count" ? rest.reduce((s, e) => s + e[1], 0) : NaN;
      entries = entries.slice(0, 11);
      if (isFinite(restVal)) entries.push([`Other (${rest.length})`, restVal]);
    }
    return { kind, labels: entries.map((e) => e[0]), values: entries.map((e) => e[1]), totalGroups: total };
  }

  /* ---- Loading ---- */
  function load(text, label) {
    const rows = parseCSV(text || "");
    if (rows.length < 2) { say("The data needs a header row plus at least one data row. Check the data and try again.", true); return; }
    const header = rows[0];
    const width = header.length;
    if (width < 2) { say("Only one column found. Make sure values are separated by commas, semicolons or tabs.", true); return; }
    const body = rows.slice(1, MAX_ROWS + 1).map((r) => { const x = r.slice(0, width); while (x.length < width) x.push(""); return x; });
    const cols = inferColumns(header, body);
    // Make duplicate column names unique so dropdowns stay unambiguous.
    const seen = {};
    cols.forEach((c) => { if (seen[c.name]) c.name = `${c.name}_${++seen[c.name]}`; else seen[c.name] = 1; });
    if (!cols.some((c) => c.type === "number")) {
      say("No numeric column found to measure. Add at least one column of numbers, such as sales or quantity.", true); return;
    }
    state.rows = body; state.cols = cols; state.loaded = true;
    const truncated = rows.length - 1 > MAX_ROWS ? ` Only the first ${fmt(MAX_ROWS)} rows were used.` : "";
    say(`Loaded ${label ? label + ": " : ""}${fmt(body.length)} rows and ${cols.length} columns.${truncated}`);
    fillControls();
    $("#results").hidden = false;
    render();
  }

  function fillControls() {
    const nums = state.cols.filter((c) => c.type === "number");
    const groups = state.cols.filter((c) => c.type === "date" || (c.type === "text" && c.distinct <= 200) || (c.type === "number" && c.distinct <= 20));
    const mSel = $("#selMetric"), gSel = $("#selGroup");
    // Prefer money-like columns as the default metric.
    const pref = nums.find((c) => /revenue|sales|amount|total|price|profit|value/i.test(c.name)) || nums[0];
    mSel.innerHTML = nums.map((c) => `<option value="${c.idx}" ${c === pref ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    const gPref = groups.find((c) => c.type === "date") || groups.find((c) => c.type === "text") || groups[0];
    gSel.innerHTML = groups.length
      ? groups.map((c) => `<option value="${c.idx}" ${c === gPref ? "selected" : ""}>${esc(c.name)}${c.type === "date" ? " (over time)" : ""}</option>`).join("")
      : `<option value="">(no column to group by)</option>`;
    gSel.disabled = !groups.length;
  }

  /* ---- Rendering ---- */
  function chartDefaults() {
    if (!window.Chart) return;
    Chart.defaults.color = cssVar("--muted");
    Chart.defaults.borderColor = cssVar("--line");
    Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
    Chart.defaults.font.size = 12;
    Chart.defaults.animation.duration = reduceMotion ? 0 : 600;
  }
  function makeChart(id, config) {
    if (charts[id]) { charts[id].destroy(); delete charts[id]; }
    if (!window.Chart) return;
    charts[id] = new Chart($("#" + id), config);
  }
  function chartMissing() {
    ["chMain", "chHist", "chShare"].forEach((id) => {
      const box = $("#" + id).parentElement;
      if (!box.querySelector(".empty-note")) box.insertAdjacentHTML("beforeend", `<p class="empty-note">Charts need an internet connection to load the chart library. The numbers and insights still work.</p>`);
    });
  }

  function render() {
    if (!state.loaded) return;
    chartDefaults();
    const gold = cssVar("--gold"), teal = cssVar("--teal"), rose = cssVar("--rose"), gold2 = cssVar("--gold-2"), ink = cssVar("--ink");
    const metric = state.cols.find((c) => c.idx === +$("#selMetric").value);
    const gv = $("#selGroup").value;
    const group = gv === "" ? null : state.cols.find((c) => c.idx === +gv);
    const how = $("#selAgg").value;
    const aggName = { sum: "Total", avg: "Average", count: "Count of rows", max: "Highest", min: "Lowest" }[how];
    const st = stats(metric.values);
    const totalCells = state.rows.length * state.cols.length;
    const missing = state.cols.reduce((s, c) => s + c.missing, 0);

    // KPIs
    $("#kpis").innerHTML = [
      ["rows", fmt(state.rows.length, 0)],
      [`total ${metric.name}`, fmt(st ? st.sum : NaN)],
      [`average ${metric.name}`, fmt(st ? st.mean : NaN)],
      [`median ${metric.name}`, fmt(st ? st.median : NaN)],
      [`range`, st ? `${fmt(st.min)} <small>to</small> ${fmt(st.max)}` : "–"],
      ["missing cells", `${fmt(totalCells ? (missing / totalCells) * 100 : 0, 1)}<small>%</small>`]
    ].map(([l, v]) => `<div class="kpi"><div class="l">${esc(l)}</div><div class="v">${v}</div></div>`).join("");

    // Main chart
    let grouped = null;
    if (group) {
      grouped = groupData(how === "count" ? null : metric, group, how);
      $("#mainTitle").textContent = `${aggName} of ${how === "count" ? "rows" : metric.name} by ${group.name}${grouped.unit ? ` (per ${grouped.unit})` : ""}`;
      if (window.Chart) {
        const isTime = grouped.kind === "time";
        makeChart("chMain", {
          type: isTime ? "line" : "bar",
          data: { labels: grouped.labels, datasets: [{
            label: aggName, data: grouped.values,
            backgroundColor: isTime ? (c) => { const a = c.chart.chartArea; if (!a) return hexA(gold, .3); const g = c.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom); g.addColorStop(0, hexA(rose, .55)); g.addColorStop(.55, hexA(gold, .18)); g.addColorStop(1, hexA(gold, 0)); return g; } : gold,
            borderColor: gold, borderWidth: 3,
            borderRadius: 6, fill: isTime, tension: .3,
            pointRadius: grouped.labels.length > 40 ? 0 : 3, pointHoverRadius: 5
          }] },
          options: {
            responsive: true, maintainAspectRatio: false,
            indexAxis: !isTime && grouped.labels.length > 6 ? "y" : "x",
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${aggName}: ${fmt(c.parsed[!isTime && grouped.labels.length > 6 ? "x" : "y"])}` } } },
            scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } }, y: { grid: { color: hexA(cssVar("--line"), .6) }, ticks: { autoSkip: true } } }
          }
        });
      }
    } else {
      $("#mainTitle").textContent = "Breakdown (add a text or date column to group by)";
      if (charts.chMain) { charts.chMain.destroy(); delete charts.chMain; }
    }

    // Histogram
    const a = clean(metric.values);
    $("#histTitle").textContent = `How ${metric.name} values are spread`;
    if (st && window.Chart) {
      const bins = Math.min(24, Math.max(5, Math.ceil(Math.log2(a.length) + 1)));
      const width = (st.max - st.min) / bins || 1;
      const counts = new Array(bins).fill(0);
      a.forEach((v) => { counts[Math.min(bins - 1, Math.floor((v - st.min) / width))]++; });
      const labels = counts.map((_, i) => `${fmt(st.min + i * width)}–${fmt(st.min + (i + 1) * width)}`);
      makeChart("chHist", {
        type: "bar",
        data: { labels, datasets: [{ label: "Rows", data: counts, backgroundColor: teal, borderRadius: 3, barPercentage: 1, categoryPercentage: .92 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 6 } }, y: { grid: { color: hexA(cssVar("--line"), .6) } } } }
      });
    }

    // Share doughnut: first text column with few categories (or the chosen group if it's text)
    const shareCol = (group && group.type === "text") ? group
      : state.cols.find((c) => c.type === "text" && c.distinct >= 2 && c.distinct <= 30);
    const shareBox = $("#chShare").parentElement;
    shareBox.querySelectorAll(".empty-note").forEach((n) => n.remove());
    if (shareCol) {
      const sh = groupData(metric, shareCol, "sum");
      const labels = sh.labels.slice(0, 6), vals = sh.values.slice(0, 6);
      const rest = sh.values.slice(6).reduce((s, v) => s + v, 0);
      if (rest > 0) { labels.push("Everything else"); vals.push(rest); }
      $("#shareTitle").textContent = `Share of ${metric.name} by ${shareCol.name}`;
      const palette = [gold, teal, rose, gold2, hexA(teal, .55), hexA(rose, .55), hexA(ink, .3)];
      if (window.Chart) makeChart("chShare", {
        type: "doughnut",
        data: { labels, datasets: [{ data: vals, backgroundColor: palette, borderColor: cssVar("--bg-2"), borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: "62%",
          plugins: { legend: { position: "right", labels: { boxWidth: 10, boxHeight: 10 } },
            tooltip: { callbacks: { label: (c) => { const t = vals.reduce((s, v) => s + v, 0); return ` ${c.label}: ${fmt(c.parsed)} (${fmt(t ? c.parsed / t * 100 : 0, 1)}%)`; } } } } }
      });
    } else {
      $("#shareTitle").textContent = "Share";
      if (charts.chShare) { charts.chShare.destroy(); delete charts.chShare; }
      shareBox.insertAdjacentHTML("beforeend", `<p class="empty-note">Add a text column with a few categories (like region or product) to see how the total splits.</p>`);
    }
    if (!window.Chart) chartMissing();

    // Column summary
    $("#summary").innerHTML = `<table class="data"><thead><tr><th>Column</th><th>Type</th><th>Missing</th><th>Min</th><th>Average</th><th>Max</th><th>Distinct</th></tr></thead><tbody>${
      state.cols.map((c) => {
        const s = c.type === "number" ? stats(c.values) : null;
        const typeName = { number: "number", date: "date", text: "text", empty: "empty" }[c.type];
        let mn = "–", av = "–", mx = "–";
        if (s) { mn = fmt(s.min); av = fmt(s.mean); mx = fmt(s.max); }
        if (c.type === "date") { const t = clean(c.values); if (t.length) { mn = new Date(Math.min(...t)).toISOString().slice(0, 10); mx = new Date(Math.max(...t)).toISOString().slice(0, 10); } }
        return `<tr><td>${esc(c.name)}</td><td>${typeName}</td><td class="num">${fmt(c.missing, 0)}</td><td class="num">${mn}</td><td class="num">${av}</td><td class="num">${mx}</td><td class="num">${c.distinct != null ? fmt(c.distinct, 0) : "–"}</td></tr>`;
      }).join("")}</tbody></table>`;

    // Correlation matrix
    const nums = state.cols.filter((c) => c.type === "number").slice(0, 8);
    let best = null;
    if (nums.length >= 2) {
      const cell = (r) => {
        if (!isFinite(r)) return `<td>–</td>`;
        const col = r >= 0 ? cssVar("--gold") : cssVar("--teal");
        return `<td style="background:${hexA(col, Math.abs(r) * .85)};color:${Math.abs(r) > .55 ? cssVar("--bg") : "inherit"}">${r.toFixed(2)}</td>`;
      };
      let html = `<table class="data heat"><thead><tr><th></th>${nums.map((c) => `<th>${esc(c.name)}</th>`).join("")}</tr></thead><tbody>`;
      nums.forEach((a1, i) => {
        html += `<tr><th>${esc(a1.name)}</th>`;
        nums.forEach((b1, j) => {
          const r = i === j ? 1 : pearson(a1.values, b1.values);
          if (i < j && isFinite(r) && (!best || Math.abs(r) > Math.abs(best.r))) best = { a: a1.name, b: b1.name, r };
          html += cell(r);
        });
        html += "</tr>";
      });
      $("#corr").innerHTML = html + `</tbody></table><p class="sub" style="margin-top:12px">1.00 means two columns rise and fall together, −1.00 means one rises as the other falls, 0 means no link.</p>`;
    } else {
      $("#corr").innerHTML = `<p class="empty-note">Add a second numeric column to see which numbers move together.</p>`;
    }

    // Insights
    const ins = [];
    if (grouped && grouped.kind === "category" && grouped.values.length) {
      const top = grouped.labels[0], topV = grouped.values[0];
      const tot = grouped.values.reduce((s, v) => s + v, 0);
      if (how === "sum" || how === "count") ins.push(`<b>${esc(top)}</b> leads with ${fmt(topV)}, which is ${fmt(tot ? topV / tot * 100 : 0, 1)}% of the total ${how === "count" ? "rows" : esc(metric.name)}.`);
      else ins.push(`<b>${esc(top)}</b> has the highest ${aggName.toLowerCase()} ${esc(metric.name)} at ${fmt(topV)}.`);
      if (grouped.values.length > 1) { const lo = grouped.values.length - 1; ins.push(`<b>${esc(grouped.labels[lo])}</b> is at the bottom with ${fmt(grouped.values[lo])}.`); }
    }
    if (grouped && grouped.partial && grouped.partial.length)
      ins.push(`${grouped.partial.length > 1 ? "The first and last periods" : `<b>${grouped.partial[0]}</b>`} ${grouped.partial.length > 1 ? `(${grouped.partial.join(", ")}) look` : "looks"} incomplete (far fewer rows than usual), so ${grouped.partial.length > 1 ? "they're" : "it's"} left out of the chart and trend.`);
    if (grouped && grouped.kind === "time" && grouped.values.length >= 2) {
      const v = grouped.values, first = v[0], lastV = v[v.length - 1];
      const ch = first ? (lastV - first) / Math.abs(first) * 100 : NaN;
      const pk = v.indexOf(Math.max(...v));
      if (isFinite(ch)) ins.push(`${esc(metric.name)} went from ${fmt(first)} in ${grouped.labels[0]} to ${fmt(lastV)} in ${grouped.labels[v.length - 1]}, a <b>${ch >= 0 ? "+" : ""}${fmt(ch, 1)}%</b> change.`);
      ins.push(`The best ${grouped.unit} was <b>${grouped.labels[pk]}</b> at ${fmt(v[pk])}.`);
      if (grouped.unit !== "year" && v.length >= 4) {
        const half = Math.floor(v.length / 2);
        const a1 = v.slice(0, half).reduce((s, x) => s + x, 0) / half, b1 = v.slice(half).reduce((s, x) => s + x, 0) / (v.length - half);
        if (a1) ins.push(`The second half of the period averaged ${fmt(Math.abs((b1 - a1) / a1 * 100), 1)}% <b>${b1 >= a1 ? "higher" : "lower"}</b> than the first half.`);
      }
    }
    if (best && Math.abs(best.r) >= 0.5) ins.push(`<b>${esc(best.a)}</b> and <b>${esc(best.b)}</b> ${best.r > 0 ? "rise and fall together" : "move in opposite directions"} (correlation ${best.r.toFixed(2)}).`);
    if (st && st.n >= 8) {
      const iqr = st.q3 - st.q1, lo = st.q1 - 1.5 * iqr, hi = st.q3 + 1.5 * iqr;
      const out = a.filter((v) => v < lo || v > hi).length;
      if (out && iqr > 0) ins.push(`<b>${fmt(out, 0)} rows</b> have unusually ${a.filter((v) => v > hi).length >= out / 2 ? "high" : "low"} ${esc(metric.name)} values, worth checking for errors or special cases.`);
      if (st.mean > st.median * 1.25 && st.median > 0) ins.push(`The average ${esc(metric.name)} (${fmt(st.mean)}) is well above the median (${fmt(st.median)}), so a few large values are pulling the average up.`);
    }
    const worst = [...state.cols].sort((x, y) => y.missing - x.missing)[0];
    if (worst && worst.missing > 0) ins.push(`<b>${esc(worst.name)}</b> has ${fmt(worst.missing, 0)} empty cells (${fmt(worst.missing / state.rows.length * 100, 1)}%).`);
    else ins.push(`No empty cells found. The data is complete.`);
    $("#insights").innerHTML = ins.map((t) => `<li>${t}</li>`).join("");

    // Preview
    const shown = state.rows.slice(0, 100);
    $("#previewNote").textContent = `Showing ${fmt(shown.length, 0)} of ${fmt(state.rows.length, 0)} rows.`;
    $("#preview").innerHTML = `<table class="data"><thead><tr>${state.cols.map((c) => `<th>${esc(c.name)}<span class="type-tag">${c.type}</span></th>`).join("")}</tr></thead><tbody>${
      shown.map((r) => `<tr>${state.cols.map((c) => `<td class="${c.type === "number" ? "num" : ""}">${esc(r[c.idx] ?? "")}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  }

  function hexA(color, alpha) {
    const c = color.trim();
    const m = /^#([0-9a-f]{6})$/i.exec(c);
    if (!m) return c;
    const n = parseInt(m[1], 16);
    return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${alpha})`;
  }

  /* ---- Sample data (seeded so it's the same every time) ---- */
  function rng(seed) { return () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }; }
  function sampleSales() {
    const r = rng(42), regions = ["North", "South", "East", "West", "Central"], products = ["Starter plan", "Growth plan", "Pro plan", "Add-on pack", "Consulting hour"];
    const price = { "Starter plan": 29, "Growth plan": 79, "Pro plan": 199, "Add-on pack": 15, "Consulting hour": 120 };
    const channels = ["Website", "Referral", "Partner", "Sales call"], rw = [1.3, 1, .9, 1.1, .6];
    const lines = ["order_date,region,product,channel,units,revenue,cost"];
    const start = Date.UTC(2025, 0, 1);
    for (let d = 0; d < 365; d += 1) {
      const orders = 1 + Math.floor(r() * 3 + d / 180);
      for (let k = 0; k < orders; k++) {
        const ri = Math.floor(r() * regions.length); if (r() > rw[ri] / 1.3) continue;
        const p = products[Math.floor(r() * products.length)], ch = channels[Math.floor(r() * channels.length)];
        const units = 1 + Math.floor(r() * (p === "Add-on pack" ? 12 : 5));
        const season = 1 + .18 * Math.sin((d / 365) * Math.PI * 2 - 1.2);
        const rev = Math.round(units * price[p] * season * (0.9 + r() * .2) * (r() < .01 ? 6 : 1));
        const cost = Math.round(rev * (0.35 + r() * .2));
        lines.push(`${new Date(start + d * 864e5).toISOString().slice(0, 10)},${regions[ri]},${p},${ch},${units},${rev},${cost}`);
      }
    }
    return lines.join("\n");
  }
  function sampleTraffic() {
    const r = rng(7), sources = ["Google search", "LinkedIn", "YouTube", "Direct", "Newsletter"], base = [420, 160, 210, 140, 90];
    const lines = ["date,source,sessions,signups,bounce_rate"];
    const start = Date.UTC(2026, 2, 1);
    for (let d = 0; d < 180; d++) {
      const date = new Date(start + d * 864e5), wd = date.getUTCDay(), weekend = wd === 0 || wd === 6 ? .7 : 1;
      sources.forEach((s, i) => {
        const growth = 1 + d / (i === 2 ? 150 : 320);
        const sessions = Math.round(base[i] * growth * weekend * (0.85 + r() * .3));
        const conv = [0.021, 0.034, 0.028, 0.045, 0.06][i];
        const signups = Math.round(sessions * conv * (0.8 + r() * .4));
        const bounce = (0.38 + (i === 0 ? .08 : 0) - (i === 4 ? .1 : 0) + r() * .08).toFixed(3);
        lines.push(`${date.toISOString().slice(0, 10)},${s},${sessions},${signups},${bounce}`);
      });
    }
    return lines.join("\n");
  }
  function sampleInventory() {
    const r = rng(19), whs = ["Lahore DC", "Karachi DC", "Islamabad DC"], cats = ["Phone cases", "Chargers", "Cables", "Earbuds", "Power banks"];
    const price = [6, 14, 5, 22, 18], lines = ["week,warehouse,category,units_sold,stock_on_hand,stockouts,reorder_cost"];
    const start = Date.UTC(2026, 0, 5);
    for (let w = 0; w < 36; w++) {
      const date = new Date(start + w * 7 * 864e5).toISOString().slice(0, 10);
      whs.forEach((wh, wi) => cats.forEach((c, ci) => {
        const demand = Math.round((60 + ci * 18 + wi * 25) * (1 + w / 60) * (0.8 + r() * .4) * (ci === 3 && w > 20 ? 1.6 : 1));
        const stock = Math.max(0, Math.round(demand * (1.4 + r() * 1.2) - (ci === 3 && w > 20 ? demand * 1.1 : 0)));
        const outs = stock < demand * .6 ? 1 + Math.floor(r() * 4) : 0;
        const cost = Math.round((outs ? demand * 1.3 : demand * .9) * price[ci] * .55);
        lines.push(`${date},${wh},${c},${demand},${stock},${outs},${cost}`);
      }));
    }
    return lines.join("\n");
  }
  const SAMPLES = { sales: ["store sales", sampleSales], traffic: ["website traffic", sampleTraffic], inventory: ["inventory", sampleInventory] };
  function loadSample(key) {
    $$(".samples button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.sample === key)));
    const text = SAMPLES[key][1]();
    const lines = text.split("\n");
    $("#csvInput").value = lines.slice(0, 60).join("\n") + (lines.length > 60 ? "\n" : "");
    if (state.source !== "own") state.source = "sample";
    load(text, "sample " + SAMPLES[key][0]);
    if (lines.length > 60) say(`${msg.textContent} The text box shows the first 60 lines; the full sample is analysed.`);
  }

  /* ---- Events ---- */
  $("#analyzeBtn").addEventListener("click", () => {
    const t = $("#csvInput").value;
    if (!t.trim()) { say("Paste some CSV data first, or pick a sample.", true); return; }
    $$(".samples button").forEach((b) => b.setAttribute("aria-pressed", "false"));
    state.source = "own";
    load(t, "your data");
  });
  $("#clearBtn").addEventListener("click", () => {
    $("#csvInput").value = ""; state.loaded = false; $("#results").hidden = true; say("");
    Object.keys(charts).forEach((k) => { charts[k].destroy(); delete charts[k]; });
    $$(".samples button").forEach((b) => b.setAttribute("aria-pressed", "false"));
  });
  $$(".samples button").forEach((b) => b.addEventListener("click", () => loadSample(b.dataset.sample)));
  ["#selMetric", "#selGroup", "#selAgg"].forEach((s) => $(s).addEventListener("change", render));

  function readFile(file) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { say("That file is over 15 MB. Try a smaller export or a sample of the rows.", true); return; }
    if (/\.(xlsx?|numbers)$/i.test(file.name)) { say("Excel files need to be saved as CSV first (File > Save As > CSV).", true); return; }
    const fr = new FileReader();
    fr.onload = () => {
      const text = String(fr.result);
      const lines = text.split(/\r?\n/);
      $("#csvInput").value = lines.slice(0, 60).join("\n");
      $$(".samples button").forEach((b) => b.setAttribute("aria-pressed", "false"));
      state.source = "own";
      load(text, file.name);
    };
    fr.onerror = () => say("I couldn't read that file. Try exporting it again as CSV.", true);
    fr.readAsText(file);
  }
  const drop = $("#drop"), fileInput = $("#fileInput");
  fileInput.addEventListener("change", () => { readFile(fileInput.files[0]); fileInput.value = ""; });
  drop.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput.click(); } });
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
  drop.addEventListener("drop", (e) => readFile(e.dataTransfer.files[0]));

  themeListeners.push(() => { if (state.loaded && Router.current === "analytics") render(); });

  // Showcase cards load their dataset and jump to the results.
  $$("[data-demo]").forEach((b) => b.addEventListener("click", () => {
    loadSample(b.dataset.demo);
    requestAnimationFrame(() => $("#labMsg").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }));
  }));

  return {
    source: () => state.source,
    onShow() {
      if (!state.loaded) { loadSample("sales"); state.source = "no"; }   // auto-loaded demo doesn't count as trying it
      else requestAnimationFrame(render);   // charts sized while hidden need a redraw
    }
  };
})();


/* ============================================================
   Lead capture: sends form data to the n8n webhook, falls back
   to WhatsApp or email if the webhook can't be reached.
   ============================================================ */
const Leads = (() => {
  const waLink = (text) => `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  async function send(payload) {
    if (!CONFIG.leadWebhook) throw new Error("no-webhook");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await fetch(CONFIG.leadWebhook, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload), signal: ctrl.signal
      });
      let data = {};
      try { data = await res.json(); } catch (e) {}
      if (!res.ok || data.ok === false) { const err = new Error(data.error || `status ${res.status}`); err.userFacing = !!data.error; throw err; }
      return data;
    } finally { clearTimeout(timer); }
  }
  function summary(p) {
    return [`Hi, I'd like a data review.`, `Name: ${p.name}`, `Email: ${p.email}`, p.company ? `Company: ${p.company}` : "",
      `Need: ${p.project_type}`, p.data_sources ? `Data: ${p.data_sources}` : "", p.budget ? `Budget: ${p.budget}` : "",
      p.timeline ? `Timeline: ${p.timeline}` : "", "", p.message].filter((x) => x !== "").join("\n");
  }
  return { send, summary, waLink };
})();

const leadForm = $("#leadForm");
// Clear an error as soon as the visitor starts fixing it.
leadForm.addEventListener("input", (e) => {
  if (e.target.classList.contains("invalid")) { e.target.classList.remove("invalid"); $("#leadNote").textContent = ""; }
});
leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = $("#leadNote"), btn = $("#leadSubmit");
  const fd = new FormData(leadForm);
  const p = {
    name: (fd.get("name") || "").trim(), email: (fd.get("email") || "").trim(), whatsapp: (fd.get("whatsapp") || "").trim(),
    company: (fd.get("company") || "").trim(), project_type: fd.get("project_type") || "",
    data_sources: fd.getAll("data_sources").join(", "), data_size: fd.get("data_size") || "",
    budget: fd.get("budget") || "", timeline: fd.get("timeline") || "", message: (fd.get("message") || "").trim(),
    tried_lab: Lab.source(), source_page: location.hash || "#/analytics", website: fd.get("website") || ""
  };
  // Client-side checks mirror the workflow's rules so people see problems instantly.
  leadForm.querySelectorAll(".invalid").forEach((x) => x.classList.remove("invalid"));
  const fail = (sel, text) => { const el = leadForm.querySelector(sel); el.classList.add("invalid"); el.focus(); note.style.color = cssVar("--danger"); note.textContent = text; };
  if (p.name.length < 2) return fail('[name="name"]', "Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.email)) return fail('[name="email"]', "Please enter a valid email address.");
  if (!p.project_type) return fail('[name="project_type"]', "Please choose what you need.");
  if (p.message.length < 10) return fail('[name="message"]', "Please tell us a little more (at least 10 characters).");

  btn.disabled = true; btn.textContent = "Sending...";
  note.style.color = cssVar("--muted"); note.textContent = "";
  try {
    const res = await Leads.send(p);
    const ref = res.lead_id ? `<p>Your reference: <span class="ref">${res.lead_id}</span></p>` : "";
    leadForm.innerHTML = `<div class="lead-done"><h3>Thanks, ${p.name.split(" ")[0].replace(/[<>&"']/g, "")}. We've got it.</h3>
      <p>We'll reply within one working day with next steps.</p>${ref}
      <a class="btn btn-ghost" href="${Leads.waLink(`Hi, I just sent a data review request${res.lead_id ? " (ref " + res.lead_id + ")" : ""}.`)}" target="_blank" rel="noopener">Want a faster reply? Message us on WhatsApp</a></div>`;
  } catch (err) {
    btn.disabled = false; btn.textContent = "Get my free data review";
    if (err.userFacing) { note.style.color = cssVar("--danger"); note.textContent = err.message; return; }
    // Webhook unreachable (offline, blocked, not set): don't lose the lead, hand it to WhatsApp or email.
    note.style.color = cssVar("--gold");
    note.innerHTML = `We couldn't send the form just now. Your details are ready to go by
      <a href="${Leads.waLink(Leads.summary(p))}" target="_blank" rel="noopener" style="color:#25D366;font-weight:700">WhatsApp</a> or
      <a href="mailto:${CONFIG.email}?subject=${encodeURIComponent("Data review request: " + p.project_type)}&body=${encodeURIComponent(Leads.summary(p))}" style="color:var(--gold);font-weight:700">email</a>.`;
  }
});

/* ---------------- Contact form ---------------- */
$("#contactForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target, note = $("#formNote");
  const bad = [...f.querySelectorAll("[required]")].find((i) => !i.value.trim() || (i.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(i.value)));
  if (bad) { note.style.color = cssVar("--danger"); note.textContent = bad.type === "email" ? "Enter a valid email address." : "Fill in your name, email and message."; bad.focus(); return; }
  const d = Object.fromEntries(new FormData(f));
  if (d.message.trim().length < 10) { note.style.color = cssVar("--danger"); note.textContent = "Please tell us a little more (at least 10 characters)."; f.querySelector('[name="message"]').focus(); return; }
  const body = `Name: ${d.name}\nEmail: ${d.email}\nCompany: ${d.company || "-"}\nTopic: ${d.topic}\n\n${d.message}`;
  const mailto = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Consultation request: " + d.topic)}&body=${encodeURIComponent(body)}`;
  const btn = f.querySelector('button[type="submit"]');
  btn.disabled = true; btn.textContent = "Sending...";
  // Contact enquiries go to the same lead table, tagged with the chosen topic.
  Leads.send({ name: d.name.trim(), email: d.email.trim(), company: (d.company || "").trim(), project_type: d.topic,
               message: d.message.trim(), tried_lab: Lab.source(), source_page: "#/contact", website: d.website || "" })
    .then((res) => {
      f.innerHTML = `<div class="lead-done"><h3>Thanks, we've got your message.</h3><p>We'll reply within one working day.</p>${res.lead_id ? `<p>Your reference: <span class="ref">${res.lead_id}</span></p>` : ""}</div>`;
    })
    .catch((err) => {
      btn.disabled = false; btn.textContent = "Send message";
      if (err.userFacing) { note.style.color = cssVar("--danger"); note.textContent = err.message; return; }
      note.style.color = cssVar("--gold");
      note.innerHTML = `We couldn't send the form just now. Please use <a href="${mailto}" style="color:var(--gold);font-weight:700">email</a> or <a href="${Leads.waLink(body)}" target="_blank" rel="noopener" style="color:#25D366;font-weight:700">WhatsApp</a> instead.`;
    });
});

route();
// Rebuild the particle name once the display font has loaded (first build may use the fallback font).
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
  if (Router.current === "home") { Hero.stop(); Hero.rebuild(); Hero.start(); }
});
})();
