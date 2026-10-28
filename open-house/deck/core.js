/* Toolkit shared by every slide variation. Coordinates are on a 1920x1080 stage; dots are placed by their centre. */
/* Palette taken from SDC's own illustration: deep navy, cream, orange, mustard, leaf green, teal.
   Key names stay the same across themes (lilac is the light leaf green, blue is the teal). */
const THEMES = {
  dark: { bg: "#11100e", ink: "#f3f1ea", mute: "#8d8a80", quiet: "#55534b", dim: "#2a2925", night: "#11100e", orange: "#ff6b3d", yellow: "#ffd23f", green: "#7bd389", blue: "#6fa8ff", lilac: "#c9b6ff" },
  navy: { bg: "#13233d", ink: "#f6f1e3", mute: "#9aa7ba", quiet: "#47597a", dim: "#223a5c", night: "#13233d", orange: "#ec7430", yellow: "#efb13d", green: "#4fa062", blue: "#6dbacb", lilac: "#9ccb74" },
  cream: { bg: "#f6f2e6", ink: "#1b2f4d", mute: "#6a7380", quiet: "#b9b3a1", dim: "#e6dfcb", night: "#13233d", orange: "#e8702a", yellow: "#eaa93a", green: "#3f9a5a", blue: "#5aa9bd", lilac: "#8dbd62" },
};
const COL = {}, PAL = [];
function setTheme(name) {
  Object.assign(COL, THEMES[name]);
  PAL.splice(0, PAL.length, COL.orange, COL.yellow, COL.green, COL.blue, COL.lilac);
  /* colour roles: the same colour always means the same thing */
  Object.assign(COL, { stephen: COL.orange, suhanya: COL.lilac, system: COL.blue, money: COL.yellow, ok: COL.green, note: "#f1e6b8" });
  document.documentElement.style.setProperty("--night", COL.bg);
  document.documentElement.style.setProperty("--ink", COL.ink);
  document.documentElement.style.setProperty("--mute", COL.mute);
  document.body.style.background = { dark: "#0a0a09", navy: "#0b1628", cream: "#e9e4d4" }[name];
  window.THEME = name;
}
const askedTheme = new URLSearchParams(location.search).get("theme");
setTheme(THEMES[askedTheme] ? askedTheme : "dark");
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const reflow = (el) => el.offsetWidth;
const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
/* gift amounts: mostly small, some larger, always inside SDC's $5 to $60 range */
const AMOUNTS = [5, 5, 10, 10, 15, 20, 20, 25, 30, 35, 40, 50, 60];
function amounts(n) { const out = []; for (let i = 0; i < n; i++) { let a; do { a = pick(AMOUNTS); } while (a === out[i - 1]); out.push(a); } return out; }
/* uneven timing: bursts and pauses instead of a metronome. Returns n times starting at `start`. */
function rhythm(n, base, start = 0) { const t = []; let x = start; for (let i = 0; i < n; i++) { t.push(Math.round(x)); x += base * pick([0.4, 0.55, 0.8, 1, 1, 1.3, 2.1]); } return t; }
/* LINE WEIGHTS (the only ones to use):
   LINE 3px  drawn strokes: icons, squiggles, connector lines, strikes, ticks, timeline spine
   HAIR 1.5px  dividers and outlines of containers (cards, tags, input boxes)
   BAR 8px   skeleton text bars
   4px       hero lines next to display type: the heart trace, word underlines */
const LINE = 3, HAIR = 1.5, BAR = 8;
window.AVATAR_STYLE = new URLSearchParams(location.search).get("avatar") || "classic";
const SLIDES = [];
const slide = (notes, variants) => SLIDES.push({ notes, variants });
const V = (type, name, build) => ({ type, name, build });

/* centred grid of n positions */
function layoutGrid(n, { cx = 960, cy = 540, pitch = 100, cols } = {}) {
  cols = cols || Math.ceil(Math.sqrt(n * 1.7));
  const rows = Math.ceil(n / cols), out = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols;
    out.push([cx + ((i % cols) - (inRow - 1) / 2) * pitch, cy + (r - (rows - 1) / 2) * pitch]);
  }
  return out;
}

/* seeded random, so a name always gets the same avatar */
function seeded(seed) { let a = 2166136261; for (const ch of String(seed)) { a ^= ch.charCodeAt(0); a = Math.imul(a, 16777619); } return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const mixHex = (a, b, t) => { const p = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)], x = p(a), y = p(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };

/* avatar drawings, all on a 100 x 100 canvas */
function avatarInner(style, name, o) {
  const r = seeded(name), cols = [COL.orange, COL.yellow, COL.green, COL.blue, COL.lilac];
  const take = (ex) => { const c = cols.filter((k) => !ex.includes(k)); return c[Math.floor(r() * c.length)]; };
  const A = o.ground || take([]), B = o.cloth || take([A]), C = take([A, B]), ink = "#16140f", cream = "#f4ead8", shade = "#d3c3a6";
  if (style === "bauhaus") {
    const cell = (kind, col) => [
      `<path d="M0 0 H50 A50 50 0 0 1 0 50 Z" fill="${col}"/>`,
      `<path d="M0 50 V25 A25 25 0 0 1 50 25 V50 Z" fill="${col}"/>`,
      `<circle cx="25" cy="25" r="22" fill="${col}"/>`,
      `<rect width="50" height="50" fill="${col}"/>`,
      `<path d="M0 50 L50 0 V50 Z" fill="${col}"/>`,
      `<path d="M0 25 A25 25 0 0 1 50 25 A25 25 0 0 1 0 25 Z" fill="${col}"/>`,
    ][kind];
    const ground = mixHex(A, ink, 0.55), B2 = B === A ? take([A]) : B, pal = [A, B2, C, cream];
    let out = `<rect width="100" height="100" fill="${ground}"/>`;
    for (let i = 0; i < 4; i++) { const kind = Math.floor(r() * 6), rot = [0, 90, 180, 270][Math.floor(r() * 4)], col = i === 0 ? A : pal[Math.floor(r() * pal.length)]; out += `<g transform="translate(${(i % 2) * 50} ${Math.floor(i / 2) * 50}) rotate(${rot} 25 25)">${cell(kind, col)}</g>`; }
    return out;
  }
  if (style === "arch") {
    const g = mixHex(A, ink, 0.6), w = mixHex(A, ink, 0.18), sx = 44 + Math.floor(r() * 12), hr = 12 + Math.floor(r() * 3), fig = B === A ? cream : B;
    return `<rect width="100" height="100" fill="${g}"/><circle cx="${74 + Math.floor(r() * 10)}" cy="${18 + Math.floor(r() * 12)}" r="8" fill="${C}"/><path d="M14 100 V44 A36 36 0 0 1 86 44 V100 Z" fill="${w}"/><path d="M${sx - 28} 100 V86 A28 28 0 0 1 ${sx + 28} 86 V100 Z" fill="${fig}"/><circle cx="${sx}" cy="54" r="${hr + 2}" fill="${fig}"/>`;
  }
  if (style === "split") {
    const g = mixHex(A, ink, 0.5), sun = mixHex(A, ink, 0.22), kind = o.kind ?? Math.floor(r() * 4), hc = kind === 3 ? C : ink;
    const hair = [`<path d="M32 44 A18 18 0 0 1 68 44 Q50 36 32 44 Z" fill="${hc}"/>`, `<rect x="31" y="22" width="38" height="14" rx="7" fill="${hc}"/>`, `<path d="M32 46 A18 18 0 0 1 68 46 L68 36 A18 18 0 0 0 32 36 Z" fill="${hc}"/>`, `<path d="M32 44 A18 18 0 0 1 68 44 Z" fill="${hc}"/><circle cx="50" cy="20" r="8" fill="${hc}"/>`][kind];
    return `<rect width="100" height="100" fill="${g}"/><circle cx="${34 + Math.floor(r() * 30)}" cy="${34 + Math.floor(r() * 12)}" r="30" fill="${sun}"/><path d="M12 100 V86 A38 38 0 0 1 88 86 V100 Z" fill="${B}"/><path d="M50 48 A38 38 0 0 1 88 86 V100 H50 Z" fill="rgba(0,0,0,0.24)"/><rect x="44" y="58" width="12" height="12" fill="${shade}"/><path d="M50 26 A18 18 0 0 0 50 62 Z" fill="${cream}"/><path d="M50 26 A18 18 0 0 1 50 62 Z" fill="${shade}"/>${hair}`;
  }
  if (name === "Stephen") {
    const g = mixHex(A, ink, 0.6);
    return `<rect width="100" height="100" fill="${g}"/><path d="M4 100 C6 78 24 70 50 70 C76 70 94 78 96 100 Z" fill="${B}"/><rect x="43" y="56" width="14" height="16" rx="3" fill="#cdbfa4"/><circle cx="31" cy="47" r="3.6" fill="#e4d6bb"/><circle cx="69" cy="47" r="3.6" fill="#e4d6bb"/><circle cx="50" cy="45" r="19" fill="${cream}"/><path d="M30.5 47 C28 28 44 24 52 25 C64 26 72 34 69.5 47 C67 40 62 36 50 36 C42 36 34 40 30.5 47 Z" fill="#2a1d14"/>`;
  }
  if (name === "Suhanya") {
    const g = mixHex(A, ink, 0.4);
    return `<rect width="100" height="100" fill="${g}"/><path d="M6 100 A44 44 0 0 1 94 100 Z" fill="${B}"/><path d="M27 48 C24 26 36 20 50 20 C64 20 76 26 73 48 C72 62 76 76 80 86 C70 90 62 78 50 78 C38 78 30 90 20 86 C24 76 28 62 27 48 Z" fill="#15110d"/><rect x="44" y="56" width="12" height="16" rx="3" fill="#cdbfa4"/><circle cx="50" cy="46" r="18.5" fill="${cream}"/><path d="M31 46 C32 30 42 26 50 27 C58 26 68 30 69 46 C64 38 57 35 50 37 C43 35 36 38 31 46 Z" fill="#15110d"/>`;
  }
  /* classic */
  const kind = o.kind ?? Math.floor(r() * 4), hair = take([A, B]), g = mixHex(A, ink, 0.62);
  const hs = [`<path d="M31 45 A19 19 0 0 1 69 45 Z" fill="${hair}"/>`, `<path d="M31 45 A19 19 0 0 1 69 45 Z" fill="${hair}"/><circle cx="50" cy="22" r="9" fill="${hair}"/>`, `<ellipse cx="50" cy="35" rx="21" ry="13" fill="${hair}"/>`, `<g fill="none" stroke="${ink}" stroke-width="2.6"><circle cx="43" cy="46" r="5.5"/><circle cx="57" cy="46" r="5.5"/><path d="M48.5 46 H51.5"/></g>`][kind];
  return `<rect width="100" height="100" fill="${g}"/><path d="M6 100 A44 44 0 0 1 94 100 Z" fill="${B}"/><rect x="43" y="56" width="14" height="14" fill="#cdbfa4"/><circle cx="50" cy="45" r="19" fill="${cream}"/>${hs}`;
}

class Ctx {
  constructor(root) { this.root = root; this.ids = []; this.steps = []; this.auto = false; }
  /* a reveal that waits for the next key press; in the compare grid it runs by itself after autoMs */
  step(fn, autoMs = 9000) { this.steps.push(fn); if (this.auto) this.later(() => { if (this.steps[0] === fn) this.steps.shift()(); }, autoMs); }
  later(fn, ms) { const i = setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, ms); this.ids.push(i); return i; }
  every(fn, ms) { const i = setInterval(() => { try { fn(); } catch (e) { console.error(e); } }, ms); this.ids.push(i); return i; }
  destroy() { this.ids.forEach((i) => { clearTimeout(i); clearInterval(i); }); this.root.innerHTML = ""; }
  /* run fn with a different parent, e.g. a group that scales as one */
  into(parent, fn) { const prev = this.root; this.root = parent; try { fn(); } finally { this.root = prev; } }
  group() { const g = this.box(0, 0, 1920, 1080); g.style.transformOrigin = "960px 540px"; return g; }

  box(x, y, w, h, st = {}) {
    const e = document.createElement("div"); e.className = "o";
    Object.assign(e.style, { left: x + "px", top: y + "px", width: w + "px", height: h + "px" }, st);
    this.root.appendChild(e); return e;
  }
  dot(x, y, d, color, o = {}) {
    const e = this.box(x - d / 2, y - d / 2, d, d, { borderRadius: "50%" });
    e.style.setProperty("--bg", color);
    const i = document.createElement("i");
    i.style.setProperty("--t", rnd(5, 9) + "s"); i.style.setProperty("--dl", -rnd(0, 6) + "s");
    if (o.still) i.className = "still";
    if (o.label) { i.textContent = o.label; i.style.fontSize = (o.fs || d * 0.3) + "px"; i.style.color = o.lc || COL.night; }
    e.appendChild(i); return e;
  }
  ring(x, y, d, color, w = 3) { return this.box(x - d / 2, y - d / 2, d, d, { borderRadius: "50%", border: `${w}px solid ${color}` }); }
  glow(x, y, d, color = COL.orange, a = 0.45) { return this.box(x - d / 2, y - d / 2, d, d, { borderRadius: "50%", background: `radial-gradient(circle, ${rgba(color, a)}, ${rgba(color, 0)} 66%)`, pointerEvents: "none" }); }
  rect(x, y, w, h, color, r = 0) { return this.box(x, y, w, h, { background: color, borderRadius: r + "px" }); }
  moveTo(e, x, y, ms) { if (ms) e.style.transitionDuration = ms + "ms"; e.style.left = x - e.offsetWidth / 2 + "px"; e.style.top = y - e.offsetHeight / 2 + "px"; }

  text(str, o = {}) {
    const e = document.createElement("div"); e.className = "t"; e.textContent = str;
    Object.assign(e.style, { left: (o.x ?? 0) + "px", top: (o.y ?? 0) + "px", width: (o.w ?? 1920) + "px", fontSize: (o.size ?? 120) + "px", color: o.color || COL.ink, textAlign: o.align || "center", fontWeight: o.weight || 400 });
    this.root.appendChild(e); return e;
  }
  /* word by word (or char by char) reveal; returns { el, spans } */
  words(str, o = {}) {
    const e = this.text("", o), sp = [];
    const parts = o.chars ? [...str] : str.split(" "); let wt = o.delay ?? 300;
    parts.forEach((w, i) => {
      const s = document.createElement("span"); s.className = "w"; s.textContent = w === " " ? " " : w; e.appendChild(s); sp.push(s);
      if (!o.chars && i < parts.length - 1) e.appendChild(document.createTextNode(" "));
      this.later(() => s.classList.add("in"), wt); wt += (o.stagger ?? 260) * rnd(0.55, 1.6) * (Math.random() < 0.12 ? 2.2 : 1);
    });
    return { el: e, spans: sp };
  }
  rise(e, ms = 0, dy = 40) { e.style.opacity = 0; e.style.transform = `translateY(${dy * rnd(0.8, 1.25)}px) rotate(${rnd(-0.8, 0.8)}deg)`; reflow(e); this.later(() => { e.style.opacity = 1; e.style.transform = "none"; }, Math.max(0, ms + rnd(-25, 25))); return e; }
  pop(e, ms = 0, from = 0.3) { e.style.opacity = 0; e.style.transform = `scale(${from}) rotate(${rnd(-7, 7)}deg)`; reflow(e); this.later(() => { e.style.opacity = 1; e.style.transform = "none"; }, Math.max(0, ms + rnd(-25, 25))); return e; }
  hide(e, ms) { this.later(() => { e.style.opacity = 0; }, ms); }
  type(e, str, ms = 45, delay = 0, caret = true) {
    e.style.whiteSpace = "pre-wrap";
    let i = 0;
    const step = () => {
      i++; e.textContent = str.slice(0, i);
      if (caret) { const c = document.createElement("span"); c.className = "caret"; e.appendChild(c); }
      if (i < str.length) { const ch = str[i - 1]; let d = ms * rnd(0.55, 1.55); if (ch === " " && Math.random() < 0.22) d += ms * 3.5; if (",.".includes(ch)) d += ms * 4; this.later(step, d); }
      else if (caret) this.later(() => { const k = e.querySelector(".caret"); if (k) k.remove(); }, 1400);
    };
    this.later(step, delay);
  }
  line(x1, y1, x2, y2, o = {}) {
    const L = Math.hypot(x2 - x1, y2 - y1), a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI, w = o.w || 3;
    const e = this.box(x1, y1 - w / 2, L, w, { background: o.color || rgba(COL.ink, 0.3), transformOrigin: "0 50%", transform: `rotate(${a}deg) scaleX(0)`, transition: `transform ${o.ms || 1600}ms var(--slow), opacity 1.2s var(--slow)` });
    e._a = a; reflow(e);
    this.later(() => { e.style.transform = `rotate(${a}deg) scaleX(1)`; }, o.delay || 0);
    return e;
  }
  count(e, from, to, fmt, ms = 1800, delay = 0) {
    this.later(() => { const t0 = performance.now(); const id = this.every(() => { const k = Math.min(1, (performance.now() - t0) / ms), v = from + (to - from) * (1 - Math.pow(1 - k, 3)); e.textContent = fmt(Math.round(v)); if (k >= 1) clearInterval(id); }, 30); }, delay);
  }
  /* a raised surface: tonal fill, hairline edge, soft tinted shadow */
  card(x, y, w, h, o = {}) {
    return this.box(x, y, w, h, { borderRadius: (o.r ?? 36) + "px", background: o.bg || "linear-gradient(180deg, #211f1b, #181714)", boxShadow: "0 0 0 1px rgba(255,255,255,0.075), inset 0 1px 0 rgba(255,255,255,0.06), 0 50px 90px -30px rgba(0,0,0,0.75)" });
  }
  /* a geometric portrait. style: "split" (two-tone shaded figure), "arch" (silhouette in an arch window), "bauhaus" (abstract tiles), "classic" (earlier cartoon heads) */
  avatar(x, y, d, name, o = {}) {
    const style = o.style || window.AVATAR_STYLE || "split";
    const sq = o.shape === "square", e = this.box(x - d / 2, y - d / 2, d, d, { borderRadius: sq ? "12px" : "50%", overflow: "hidden", boxShadow: sq ? "none" : "0 0 0 2px rgba(255,255,255,0.12), 0 16px 34px rgba(0,0,0,0.4)" });
    e.innerHTML = `<svg viewBox="0 0 100 100" width="100%" height="100%" style="display:block">${avatarInner(style, name, o)}</svg>`;
    return e;
  }
  /* a simple chat bubble; returns the element */
  bubble(x, y, w, h, str, o = {}) {
    const e = this.box(x, y, w, h, { background: o.bg || COL.dim, borderRadius: (o.r ?? 36) + "px", boxShadow: (o.bg || COL.dim) === COL.dim ? "0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.05)" : "inset 0 -4px 10px rgba(0,0,0,0.12), 0 12px 24px rgba(0,0,0,0.25)" });
    const t = document.createElement("div");
    Object.assign(t.style, { position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: "0 28px", textAlign: "center", fontSize: (o.size || 40) + "px", letterSpacing: "-0.03em", color: o.color || COL.ink, lineHeight: 1.1 });
    t.textContent = str; e.appendChild(t); return e;
  }
}
