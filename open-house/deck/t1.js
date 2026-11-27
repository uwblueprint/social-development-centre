/* Slides 1 to 5: blank, the community, SDC, the funding problem, community support */

function centerText(c, str, o = {}) {
  const w = c.words(str, { ...o, y: 0 });
  w.el.style.top = (1080 - w.el.offsetHeight) / 2 + (o.dy || 0) + "px";
  return w;
}

/* The SDC logo, vectorized from the supplied PNG. Mark pieces can pop in one by one, bottom of the pyramid first. */
function sdcLogo(c, { cx, cy, scale, mode = "dark", withText = true, still = false }) {
  const L = SDC_LOGO, bb = L.mark.bbox, vb = withText ? [0, 0, L.w, L.h] : [bb[0] - 6, bb[1] - 6, bb[2] - bb[0] + 12, bb[3] - bb[1] + 12];
  const w = vb[2] * scale, h = vb[3] * scale;
  const col = mode === "brand" ? { orange: L.colors.orange, green: L.colors.green, name: L.colors.gray, sub: L.colors.gray } : { orange: COL.orange, green: COL.green, name: COL.ink, sub: COL.mute };
  const box = c.box(cx - w / 2, cy - h / 2, w, h, {}), ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg"); svg.setAttribute("viewBox", vb.join(" ")); svg.setAttribute("width", w); svg.setAttribute("height", h); svg.style.cssText = "display:block;overflow:visible"; box.appendChild(svg);
  const yRange = (d) => { const n = d.match(/-?\d+\.?\d*/g).map(Number), ys = n.filter((_, i) => i % 2); return [Math.min(...ys), Math.max(...ys)]; };
  const mk = (d, fill) => { const p = document.createElementNS(ns, "path"); p.setAttribute("d", d); p.setAttribute("fill", fill); p.setAttribute("fill-rule", "evenodd"); svg.appendChild(p); return p; };
  const bbox = (d) => { const n = d.match(/-?\d+\.?\d*/g).map(Number); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, A = 0; for (let i = 0; i < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); } for (let i = 0; i < n.length; i += 2) { const j = (i + 2) % n.length; A += n[i] * n[j + 1] - n[j] * n[i + 1]; } return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0, fill: Math.abs(A / 2) / ((x1 - x0) * (y1 - y0)) }; };
  const parts = [...L.orange.map((d) => [d, col.orange, 1]), ...L.green.map((d) => [d, col.green, 0])].map(([d, f, o]) => ({ p: mk(d, f), o, ...bbox(d) }));
  /* the figures share their edges (one person's leg is the neighbour's arm), so each piece goes to the first person who needs it.
     Order inside a person: head, body, arms, legs. People: bottom row left to right, then the middle two, then the top. */
  const GROUPS = [[23, 12, 19, 18, 8, 11], [25, 13, 15, 16, 10, 9], [24, 14, 17, 20, 7, 6], [28, 22, 26], [29, 21, 27], [5, 2, 3, 4, 0, 1]];
  const people = GROUPS.map((g) => ({ items: g.map((i) => parts[i]) }));
  const words = [];
  if (withText) L.text.forEach((d) => { const [a, b] = yRange(d), p = mk(d, (a + b) / 2 < 440 ? col.name : col.sub); words.push(p); });
  if (!still) parts.forEach(({ p }) => { p.style.cssText = "opacity:0;transform-box:fill-box;transform-origin:50% 50%;transform:scale(0.3);transition:opacity .45s ease,transform .8s cubic-bezier(.2,1.45,.35,1)"; });
  if (!still) words.forEach((p) => { p.style.cssText = "opacity:0;transform:translateY(14px);transition:opacity .9s ease,transform 1s cubic-bezier(.37,.31,0,1)"; });
  return {
    box, svg,
    revealMark(delay = 0, gap = 650) { people.forEach((pp, k) => pp.items.forEach((q, j) => c.later(() => { q.p.style.opacity = 1; q.p.style.transform = "none"; }, delay + k * gap + j * 90))); return delay + people.length * gap + 700; },
    revealText(delay = 0) { words.forEach((p) => c.later(() => { p.style.opacity = 1; p.style.transform = "none"; }, delay)); },
    pulse(k = 1.1) { box.style.transition = "transform .25s ease"; box.style.transform = `scale(${k})`; c.later(() => { box.style.transform = "none"; }, 260); },
  };
}

slide("(Blank screen. Press next to start.)", [V("blank", "Blank", () => {})]);

slide("Every community runs on people who hold it together. The ones who organize tenants' rights meetings. Who stand up at council.\n\nSomeone has to pay them.", [
  V("motion", "Constellation", (c) => {
    const pts = []; let tries = 0, minD = 130;
    while (pts.length < 34 && tries++ < 30000) { const p = [rnd(240, 1680), rnd(160, 920)]; if (pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > minD)) pts.push(p); if (tries % 5000 === 0 && pts.length < 34) minD -= 10; }
    const T = rhythm(pts.length, 45);
    const AV = ["Maya", "Dana", "Omar", "Priya", "Stephen", "Suhanya"];
    pts.forEach(([x, y], i) => { const who = i % 4 === 1 ? AV[(i >> 2) % AV.length] : null, e = who ? c.avatar(x, y, Math.round(rnd(54, 66)), who, who === "Stephen" ? ST : {}) : c.dot(x, y, rnd(18, 34), PAL[i % 5], { still: true }); e.style.zIndex = 2; c.pop(e, T[i]); });
    let k = 0;
    pts.forEach((p, i) => pts.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 330) c.line(p[0], p[1], q[0], q[1], { w: 2, color: "rgba(255,255,255,0.3)", delay: 900 + (k++) * 25, ms: 1400 }); }));
  }),
]);

slide("The Social Development Centre in Kitchener-Waterloo is an advocacy organization. It gets petitions signed. It speaks up on housing.", [
  V("logo", "Mark, name in green", (c) => {
    const lg = sdcLogo(c, { cx: 960, cy: 400, scale: 1.55, mode: "dark", withText: false });
    lg.revealMark(2400, 650);
    const name = c.text("Social Development Centre", { y: 720, size: 124, color: COL.green }); c.rise(name, 300, 40);
    c.rise(c.text("Waterloo Region", { y: 880, size: 54, color: COL.mute }), 1000, 24);
  }),
]);

/* the government: a grand building with a pediment and columns */
function govBuilding(c, cx, cy, w) {
  const k = w / 400, h = 360 * k, box = c.box(cx - w / 2, cy - h / 2, w, h, {}), Y = COL.blue;
  /* six columns centred on x=200: shafts 32 wide, caps 44 wide, 58 apart */
  const cols = [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${39 + i * 58}" y="146" width="32" height="140" fill="${Y}"/><rect x="${33 + i * 58}" y="146" width="44" height="12" fill="${Y}"/><rect x="${33 + i * 58}" y="274" width="44" height="12" fill="${Y}"/>`).join("");
  box.innerHTML = `<svg viewBox="0 0 400 360" width="${w}" height="${h}" style="display:block;overflow:visible"><polygon points="200,16 38,108 362,108" fill="${Y}"/><circle cx="200" cy="72" r="13" fill="${COL.night}"/><rect x="26" y="116" width="348" height="22" fill="${Y}"/>${cols}<rect x="22" y="292" width="356" height="18" fill="${Y}"/><rect x="6" y="314" width="388" height="18" fill="${Y}"/><rect x="-10" y="336" width="420" height="18" fill="${Y}"/></svg>`;
  return box;
}
/* SDC's voice in white waves; the government building sends money to SDC, and each gift quiets the voice */
function voiceBars(c) {
  const N = 48, x0 = 504, step = 19, bars = [];
  sdcLogo(c, { cx: 300, cy: 540, scale: 1.0, mode: "dark", withText: false, still: true });
  for (let i = 0; i < N; i++) { const b = c.rect(x0 + i * step, 530, 9, 20, COL.ink, 5); b.style.transition = "height .22s ease, top .22s ease"; bars.push(b); }
  govBuilding(c, 1620, 540, 360);
  const levels = [1, 0.66, 0.4, 0.2, 0.08, 0.03]; let lvl = 1, phase = 0;
  for (let k = 0; k < 5; k++) {
    c.later(() => {
      /* the coin travels in an arc above the waves */
      const coin = c.dot(1450, 540, 58, COL.yellow, { label: "$", fs: 34, lc: "#8a5a00", still: true }); coin.style.zIndex = 5; coin.style.boxShadow = "0 0 0 3px rgba(255,255,255,0.4)"; coin.style.transitionTimingFunction = "linear";
      coin.firstChild.style.animation = "arcY 1.5s forwards"; c.later(() => c.moveTo(coin, 470, 540, 1500), 30);
      c.later(() => { coin.remove(); lvl = levels[k + 1]; }, 1540);
    }, 800 + k * 700);
  }
  c.every(() => { phase += 0.5; bars.forEach((b, i) => { const env = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.23 + phase * 0.35)) * (0.55 + 0.45 * Math.sin(i * 0.07 + phase * 0.11 + 1.3)), h = Math.max(8, (0.35 + 0.65 * Math.random()) * env * lvl * 430); b.style.height = h + "px"; b.style.top = 540 - h / 2 + "px"; }); }, 230);
}
slide("But speaking up is harder when the people you're asking to change are also the people who fund you.\n\nIt's hard to challenge the government when the government funds you.", [
  V("data", "The government funds SDC, and the voice quiets", (c) => voiceBars(c)),
]);

/* a coin that looks like a coin */
function coin(c, x, y, d) {
  const g = c.glow(x, y, d * 3.6, COL.yellow, 0.1); g.style.opacity = 0; g.style.transition = "opacity 3.5s ease-in-out";
  const e = c.box(x - d / 2, y - d / 2, d, d, { borderRadius: "50%", zIndex: 6, background: "radial-gradient(circle at 32% 28%, #fff4b0 0%, #ffd23f 42%, #d99a14 100%)", boxShadow: "inset 0 0 0 10px rgba(255,255,255,0.16), inset 0 0 0 20px rgba(150,95,0,0.18), 0 30px 60px rgba(0,0,0,0.45)", overflow: "hidden" });
  const s = document.createElement("div"); s.textContent = "$";
  Object.assign(s.style, { position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: d * 0.56 + "px", fontWeight: 600, color: "rgba(120,72,0,0.88)", textShadow: "0 3px 0 rgba(255,255,255,0.35)" });
  const shine = document.createElement("div");
  Object.assign(shine.style, { position: "absolute", top: 0, bottom: 0, width: "40%", left: "-60%", background: "linear-gradient(105deg, transparent, rgba(255,255,255,0.65), transparent)", transition: "left 1.6s cubic-bezier(.37,.31,0,1)" });
  e.appendChild(s); e.appendChild(shine);
  c.later(() => { shine.style.left = "130%"; }, 1400); c.later(() => { g.style.opacity = 1; }, 1200);
  return { e, g };
}
slide("Community support fixes that. So SDC is building something new: a base of people who give directly. Five dollars, sixty dollars, whatever you can. A hundred people at a time.", [
  V("metaphor", "People first, then the SDC mark", (c) => {
    const N = 22, cx = 960, cy = 300, dots = [], amt = amounts(N);
    for (let i = 0; i < N; i++) {
      const x = 170 + i * (1580 / (N - 1)), d = Math.round(54 + amt[i] * 0.42), y = 850 + (i % 2) * 36;
      const e = c.dot(x, y, d, PAL[i % 5], { label: i % 3 === 1 ? (2 + ((i * 7) % 8)) + "h" : "$" + amt[i], fs: 22, lc: COL.night, still: true }); c.pop(e, 200 + i * 85); dots.push([x, y, d]);
    }
    const t = 200 + N * 85 + 500;
    dots.forEach(([x, y, d], i) => c.line(x, y - d / 2, cx, cy, { w: 3, color: rgba(COL.yellow, 0.5), delay: t + i * 55, ms: 1500 }));
    c.later(() => { const disc = c.box(cx - 200, cy - 200, 400, 400, { borderRadius: "50%", background: "#f3f1ea", zIndex: 5, opacity: 0, transition: "opacity 1.8s ease" }); const lg = sdcLogo(c, { cx, cy: cy - 10, scale: 0.6, mode: "brand", withText: false, still: true }); lg.box.style.zIndex = 6; lg.box.style.opacity = 0; lg.box.style.transition = "opacity 1.8s ease"; reflow(lg.box); disc.style.opacity = 1; lg.box.style.opacity = 1; }, t + N * 55 + 900);
  }),
]);
