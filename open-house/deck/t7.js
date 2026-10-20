/* Round three: the stewardship ideas as metaphors, "the note surfaces" in four layouts, and the Christmas letter with dates. */

/* a small envelope tile flying between two points */
const mailFly = (c, t, from, to, col, size) => c.later(() => { const e = iconTile(c, from[0], from[1], size, "mail", col, size * 0.55); e.style.zIndex = 4; e.style.opacity = 0; reflow(e); e.style.opacity = 1; c.later(() => { flyTo(c, e, to[0], to[1], 1400); c.later(() => { e.style.opacity = 0; }, 1400); }, 150); }, t);

/* ---------- Slide 6 (stewardship): metaphors ---------- */
addVariants(7,
  V("metaphor", "Warmth that fades", (c) => {
    const me = c.avatar(960, 500, 260, "Stephen", ST); me.style.zIndex = 3; c.pop(me, 200);
    const glow = c.glow(960, 500, 1000, COL.orange, 0.2); glow.style.zIndex = 0; glow.style.transition = "opacity 3s ease"; glow.style.opacity = 0; c.later(() => { glow.style.opacity = 1; }, 400);
    c.later(() => { glow.style.transition = "opacity 3.5s ease"; glow.style.opacity = 0.08; }, 1600);
    const touches = [["mail", COL.yellow, "Thank them", COL.yellow, -700, 5200], ["mail", COL.blue, "Keep in touch", COL.blue, 700, 7600], ["link", COL.green, "Stay connected", COL.green, 0, 10000]];
    touches.forEach(([ic, col, word, wcol, dx, t], i) => {
      c.later(() => { const e = iconTile(c, 960 + dx * 1.4, 880, 110, ic, col, 62); e.style.zIndex = 4; reflow(e); flyTo(c, e, 960, 500, 1300); c.later(() => { e.style.opacity = 0; glow.style.transition = "opacity 1s ease"; glow.style.opacity = i === 2 ? 1 : 0.55; if (i < 2) c.later(() => { glow.style.transition = "opacity 2.5s ease"; glow.style.opacity = 0.12; }, 1200); }, 1300); }, t);
      c.rise(ctext(c, word, 400 + i * 560, 800, 64, wcol, 560), t + 1100, 30);
    });
  }),
  V("metaphor", "Tending a plant", (c) => {
    const box = c.box(0, 0, 1920, 1080, { pointerEvents: "none" }), ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg"); svg.setAttribute("width", 1920); svg.setAttribute("height", 1080); svg.style.overflow = "visible"; box.appendChild(svg);
    const mk = (tag, attrs) => { const e = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); svg.appendChild(e); return e; };
    mk("path", { d: "M 700 760 Q 960 700 1220 760", fill: "none", stroke: rgba(COL.ink, 0.35), "stroke-width": 3, "stroke-linecap": "round" });
    const stem = mk("path", { d: "M 960 740 C 960 640 930 560 960 380", fill: "none", stroke: COL.green, "stroke-width": 4, "stroke-linecap": "round" }), L = stem.getTotalLength();
    stem.style.strokeDasharray = L; stem.style.strokeDashoffset = L; reflow(stem); stem.style.transition = "stroke-dashoffset 2s cubic-bezier(.4,0,.2,1)";
    const grow = (k, ms) => { stem.style.transitionDuration = ms + "ms"; stem.style.strokeDashoffset = L * (1 - k); };
    const leaf = (x, y, rot, t) => { const l = mk("path", { d: "M0 0 C 40 -40 90 -30 100 0 C 60 20 20 20 0 0 Z", fill: COL.green, transform: `translate(${x} ${y}) rotate(${rot}) scale(0)` }); l.style.transition = "transform .8s cubic-bezier(.2,1.45,.35,1)"; c.later(() => { l.setAttribute("transform", `translate(${x} ${y}) rotate(${rot}) scale(1)`); }, t); };
    const drop = (t, ic, col) => c.later(() => { const e = iconTile(c, 1500, 300, 100, ic, col, 56); e.style.zIndex = 4; reflow(e); flyTo(c, e, 960, 730, 1400); c.later(() => { e.style.opacity = 0; }, 1400); }, t);
    drop(600, "mail", COL.yellow); c.later(() => grow(0.22, 1600), 2000); c.rise(ctext(c, "Thank them", 560, 880, 60, COL.yellow, 500), 2200, 24);
    drop(3600, "mail", COL.blue); c.later(() => grow(0.65, 2000), 5000); leaf(960, 600, -30, 5600); leaf(960, 540, -150, 6000); c.rise(ctext(c, "Keep in touch", 960, 880, 60, COL.blue, 500), 5200, 24);
    drop(7600, "link", COL.green); c.later(() => grow(1, 1600), 9000);
    c.later(() => { const f = c.dot(960, 370, 120, COL.orange, { still: true }); c.pop(f, 0, 0.2); [0, 1, 2, 3, 4, 5].forEach((i) => { const a = (i / 6) * Math.PI * 2, p = c.dot(960 + 82 * Math.cos(a), 370 + 82 * Math.sin(a), 56, COL.yellow, { still: true }); p.style.zIndex = -1; c.pop(p, 150 + i * 90, 0.2); }); }, 10200);
    c.rise(ctext(c, "Stay connected", 1360, 880, 60, COL.green, 500), 9200, 24);
  }),
  V("metaphor", "Everyone has to be tended", (c) => {
    const names = ["Maya", "Dana", "Omar", "Priya", "Stephen", "Suhanya", "Tom"], xs = names.map((_, i) => 270 + i * 230), avs = names.map((n, i) => c.avatar(xs[i], 460, 150, n, n === "Stephen" ? ST : {}));
    avs.forEach((a, i) => { c.pop(a, 300 + i * 160); a.style.transition = "filter 1.6s ease, opacity 1.6s ease"; });
    const T = rhythm(avs.length, 650, 2600);
    avs.forEach((a, i) => c.later(() => { a.style.filter = "grayscale(1)"; a.style.opacity = 0.35; }, T[i]));
    const start = T[T.length - 1] + 1800, env = iconTile(c, 100, 640, 110, "mail", COL.yellow, 62); env.style.zIndex = 5; env.style.opacity = 0;
    c.later(() => { env.style.opacity = 1; env.style.transition = "left 7s linear, top .3s, opacity .5s"; env.style.left = xs[xs.length - 1] + 200 + "px"; }, start);
    avs.forEach((a, i) => c.later(() => { a.style.filter = "none"; a.style.opacity = 1; const r = c.ring(xs[i], 460, 150, COL.yellow, 3); r.style.transition = "transform 1.2s ease-out, opacity 1.2s ease-out"; reflow(r); r.style.transform = "scale(1.6)"; r.style.opacity = 0; }, start + 600 + ((xs[i] - 100) / (xs[xs.length - 1] + 100)) * 6200));
    c.later(() => { env.style.opacity = 0; }, start + 7200);
  }),
);

/* ---------- Slide 14: "The note surfaces", in four layouts ---------- */
const askAndAnswer = (c, t, ax, ay, bx, by) => { c.pop(c.avatar(ax, ay, 120, "Suhanya", {}), t); c.rise(c.bubble(bx, by, 620, 110, "How's your daughter doing?", { bg: COL.system, color: COL.night, size: 38, r: 30 }), t + 400, 30); };
const dimRow = (c, y, tile) => { c.rect(70, y - 31, 62, 62, tile || rgba(COL.ink, 0.12), 12); const sq = c.box(160, y - 8, 300, 16, {}); let d = "M0 8"; for (let k = 0; k < 20; k++) d += " q 5 -8 10 0 t 10 0"; sq.innerHTML = `<svg width="300" height="16" style="display:block"><path d="${d}" fill="none" stroke="${rgba(COL.ink, 0.3)}" stroke-width="3" stroke-linecap="round"/></svg>`; };
const noteChip = (c, x, y, size) => { const e = c.box(x, y, 0, 0, { background: COL.note, borderRadius: "12px", boxShadow: "0 14px 24px rgba(0,0,0,0.35)" }); e.style.cssText += `;width:auto;height:${size * 2}px;display:flex;align-items:center;padding:0 ${size * 0.7}px;white-space:nowrap;font-size:${size}px;letter-spacing:-0.025em;color:${COL.night};transform-origin:0 50%`; e.textContent = "Daughter starts school in September"; return e; };
SLIDES[11].archived = SLIDES[11].variants;
SLIDES[11].variants = [
  V("memory", "Tilted record, note comes forward", (c) => {
    const g = c.box(280, 100, 1360, 700, {}); g.style.transform = "perspective(1800px) rotateX(16deg) rotateY(-24deg)"; g.style.transition = "transform 1.8s var(--soft), opacity 1.2s ease"; g.style.opacity = 0;
    c.into(g, () => { c.card(0, 0, 1360, 700, { r: 32 }); [0, 1, 2, 3, 4].forEach((i) => { if (i !== 2) dimRow(c, 110 + i * 120); }); c.rect(70, 110 + 240 - 31, 62, 62, COL.note, 12); });
    reflow(g); c.later(() => { g.style.opacity = 1; }, 300);
    const chip = noteChip(c, 280 + 160 + 110, 100 + 350 - 8, 32); chip.style.opacity = 0; chip.style.zIndex = 3; c.later(() => { chip.style.opacity = 1; }, 1400);
    c.later(() => { g.style.transform = "perspective(1800px) rotateX(0deg) rotateY(0deg)"; g.style.opacity = 0.3; chip.style.left = "480px"; chip.style.top = "412px"; chip.style.transform = "scale(1.3)"; }, 3000);
    askAndAnswer(c, 4600, 560, 920, 660, 865);
  }),
  V("memory", "A spotlight finds it", (c) => {
    for (let i = 0; i < 14; i++) { const g = c.box(rnd(120, 1300), rnd(80, 900), 520, 70, {}); g.style.transform = `rotate(${rnd(-8, 8)}deg)`; g.style.opacity = 0; c.into(g, () => { c.rect(0, 4, 62, 62, rgba(COL.ink, 0.14), 12); const sq = c.box(84, 28, 280, 16, {}); let d = "M0 8"; for (let k = 0; k < 18; k++) d += " q 5 -8 10 0 t 10 0"; sq.innerHTML = `<svg width="280" height="16" style="display:block"><path d="${d}" fill="none" stroke="${rgba(COL.ink, 0.3)}" stroke-width="3" stroke-linecap="round"/></svg>`; }); reflow(g); c.later(() => { g.style.opacity = 0.5; }, 200 + i * 90); }
    /* Stephen's profile, then his note beside it */
    const me = c.avatar(470, 440, 130, "Stephen", ST); me.style.zIndex = 4; me.style.opacity = 0; me.style.transition = "opacity 1s var(--soft), transform 1.15s var(--snap)";
    const nm = c.text("Stephen", { x: 320, w: 300, y: 520, size: 44 }); nm.style.zIndex = 4;
    const chip = noteChip(c, 640, 410, 46); chip.style.zIndex = 4; chip.style.opacity = 0; chip.style.transform = "scale(0.6)"; reflow(chip);
    [me, nm].forEach((e) => { e.style.opacity = 0; }); c.later(() => { me.style.opacity = 1; nm.style.opacity = 1; }, 1800); c.later(() => { chip.style.opacity = 1; chip.style.transform = "none"; }, 2300);
    const spot = c.box(0, 0, 1920, 1080, { zIndex: 3, pointerEvents: "none", opacity: 0, background: "radial-gradient(ellipse 820px 320px at 54% 42%, rgba(0,0,0,0), rgba(0,0,0,0.88) 100%)" }); spot.style.transition = "opacity 2.2s ease"; c.later(() => { spot.style.opacity = 1; }, 1800);
    /* her question, as a text message */
    const av = c.avatar(470, 810, 110, "Suhanya", {}); av.style.zIndex = 5; c.pop(av, 4600);
    const msg = c.box(570, 600, 0, 0, { zIndex: 5, transition: "opacity 1s var(--soft), transform 1.15s var(--snap)" });
    msg.style.cssText += `;width:auto;height:auto;max-width:760px;background:${COL.system};color:${COL.night};padding:20px 30px;font-size:40px;line-height:1.25;letter-spacing:-0.015em;border-radius:40px 40px 40px 0`;
    msg.textContent = "Hey, how's your daughter's first day at school?"; msg.style.top = 865 - msg.offsetHeight + "px"; c.rise(msg, 5000, 24);
  }),
  V("memory", "A lens on the record", (c) => {
    const X = 130, Y = 190, W = 760, H = 640; c.rise(c.card(X, Y, W, H, { r: 32 }), 100, 40);
    const g = c.box(X, Y, W, H, {}); g.style.opacity = 0; c.into(g, () => { [0, 1, 2, 3, 4].forEach((i) => { if (i !== 2) dimRow(c, 100 + i * 110); }); c.rect(70, 100 + 220 - 31, 62, 62, COL.note, 12); }); reflow(g); c.later(() => { g.style.opacity = 1; }, 500);
    const small = c.box(X + 160, Y + 100 + 220 - 20, 0, 0, { background: COL.note, borderRadius: "8px" }); small.style.cssText += `;width:300px;height:40px`; small.style.opacity = 0; c.later(() => { small.style.opacity = 1; }, 900);
    const LX = 1400, LY = 480, LD = 620;
    c.later(() => { c.line(X + 460, Y + 320, LX - LD / 2 + 40, LY - 170, { w: 3, color: rgba(COL.ink, 0.35), delay: 0, ms: 900 }); c.line(X + 460, Y + 320, LX - LD / 2 + 40, LY + 170, { w: 3, color: rgba(COL.ink, 0.35), delay: 0, ms: 900 }); }, 1500);
    const lens = c.box(LX - LD / 2, LY - LD / 2, LD, LD, { borderRadius: "50%", background: COL.note, display: "grid", placeItems: "center", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }); lens.innerHTML = `<div style="width:420px;text-align:center;font-size:62px;line-height:1.1;letter-spacing:-0.035em;color:${COL.night}">Daughter starts school in September</div>`; c.pop(lens, 2300, 0.4);
    askAndAnswer(c, 4400, 1060, 930, 1160, 875);
  }),
  V("memory", "Pulled from the stack", (c) => {
    const cards = [];
    for (let i = 0; i < 6; i++) { const x = 420 + i * 26, y = 260 + i * 20, g = c.card(x, y, 620, 420, { r: 28 }); g.style.transform = `rotate(${[-5, 3, -2, 5, -3, 0][i]}deg)`; g.style.opacity = 0; reflow(g); c.later(() => { g.style.opacity = 1; }, 200 + i * 160); cards.push(g); }
    const front = cards[5];
    c.later(() => { front.style.transition = "left 1.4s var(--glide), top 1.4s var(--glide), transform 1.4s var(--snap)"; front.style.left = "880px"; front.style.top = "190px"; front.style.transform = "rotate(2deg) scale(1.2)"; front.style.zIndex = 5; }, 2200);
    c.later(() => { const a = c.avatar(1180, 360, 110, "Stephen", ST); a.style.zIndex = 6; c.pop(a, 0); c.rise(c.text("Stephen", { x: 1260, w: 400, y: 330, size: 60, align: "left" }), 150, 20).style.zIndex = 6; const chip = noteChip(c, 960, 470, 30); chip.style.zIndex = 6; c.rise(chip, 600, 20); }, 3400);
    askAndAnswer(c, 5000, 400, 900, 500, 845);
  }),
];

/* ---------- Slide 16: written Nov 24, sent Dec 24 ---------- */
const snowBg = (c) => { const flake = () => { const x = rnd(0, 1920), d = rnd(6, 18), e = c.dot(x, -30, d, COL.ink, { still: true }); e.style.opacity = rnd(0.35, 0.95); e.style.zIndex = 1; e.style.transitionDuration = rnd(6, 11) + "s"; e.style.transitionTimingFunction = "linear"; c.later(() => { c.moveTo(e, x + rnd(-200, 200), 1120, 0); }, 40); c.later(() => e.remove(), 11500); }; c.every(flake, 90); };
const envelopeAt = (c, cx, cy, w) => {
  const h = (w * 270) / 400, env = c.box(cx - w / 2, cy - h / 2, w, h, { zIndex: 2, transition: "left 2.2s cubic-bezier(.6,0,.1,1), top 2.2s cubic-bezier(.6,0,.1,1), transform 2.2s cubic-bezier(.6,0,.1,1), opacity 1s" });
  const inner = document.createElement("div"); inner.style.cssText = "position:absolute;inset:0;animation:drift 5s ease-in-out infinite alternate";
  inner.innerHTML = `<svg viewBox="0 0 400 270" width="${w}" height="${h}" style="display:block;overflow:visible"><defs><clipPath id="envClip2"><rect width="400" height="270" rx="16"/></clipPath><radialGradient id="seal2" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#d9990f"/></radialGradient><filter id="envShadow2" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="26" stdDeviation="22" flood-color="#000" flood-opacity="0.5"/></filter></defs><rect width="400" height="270" rx="16" fill="#d3402f" filter="url(#envShadow2)"/><g clip-path="url(#envClip2)"><polygon points="0,0 400,0 200,172" fill="#b3302a"/><path d="M0 270 L150 150 M400 270 L250 150" stroke="rgba(0,0,0,0.12)" stroke-width="3" fill="none"/><path d="M0 0 L200 172 L400 0" stroke="rgba(0,0,0,0.16)" stroke-width="3" fill="none"/></g><circle cx="200" cy="172" r="36" fill="url(#seal2)"/><path d="M200 151 l6.2 12.6 13.9 2 -10 9.8 2.4 13.8 -12.5 -6.5 -12.5 6.5 2.4 -13.8 -10 -9.8 13.9 -2 z" fill="#8a5a00"/></svg>`;
  env.appendChild(inner); return env;
};
const sendAway = (c, env) => { env.style.left = "1900px"; env.style.top = "-260px"; env.style.transform = "rotate(-16deg) scale(0.45)"; };
const dateTag = (c, str, cx, y, col, size) => { const t = tagAt(c, str, cx, y, col, size); t.style.zIndex = 5; return t; };
const christmasVariants = [
  V("atmosphere", "Date tag on the letter", (c) => {
    snowBg(c); const env = envelopeAt(c, 960, 560, 560); c.pop(env, 400);
    const a = dateTag(c, "Written November 24", 960, 230, COL.mute, 44); a.style.opacity = 0; c.later(() => { a.style.opacity = 1; }, 1400);
    const b = dateTag(c, "Sent December 24", 960, 230, COL.green, 44); b.style.opacity = 0;
    c.later(() => { a.style.opacity = 0; b.style.opacity = 1; }, 4200); c.later(() => sendAway(c, env), 5600);
  }),
  V("atmosphere", "Two postmarks", (c) => {
    snowBg(c); const env = envelopeAt(c, 960, 560, 640); c.pop(env, 400);
    const stamp = (str, col, rot, x, y, t) => { const s = c.box(x - 90, y - 90, 180, 180, { borderRadius: "50%", border: `${LINE}px solid ${col}`, display: "grid", placeItems: "center", zIndex: 6, color: col, fontSize: "36px", letterSpacing: "0.04em", textAlign: "center", lineHeight: 1.1 }); s.innerHTML = str; s.style.transform = `rotate(${rot}deg) scale(1.8)`; s.style.opacity = 0; reflow(s); c.later(() => { s.style.opacity = 1; s.style.transform = `rotate(${rot}deg)`; }, t); return s; };
    const n = stamp("NOV<br>24", COL.mute, -14, 1130, 420, 1600);
    c.later(() => { n.style.opacity = 0.35; stamp("DEC<br>24", COL.green, 9, 1060, 470, 0); }, 4200); c.later(() => sendAway(c, env), 5800);
  }),
  V("atmosphere", "Along the weeks", (c) => {
    snowBg(c); const X0 = 300, X1 = 1620, Y = 820, env = envelopeAt(c, X0, 520, 320); c.pop(env, 300);
    c.rect(X0, Y - 1.5, X1 - X0, 3, rgba(COL.ink, 0.3));
    const days = 31, dots = []; for (let i = 0; i <= days; i++) { const x = X0 + (i / days) * (X1 - X0), e = c.rect(x - 4, Y - 4 + (i === 0 || i === days ? -8 : 0), 8, i === 0 || i === days ? 24 : 8, rgba(COL.ink, 0.35), 4); dots.push(e); }
    ctext(c, "Nov 24", X0, Y + 40, 54, COL.ink, 400); const end = ctext(c, "Dec 24", X1, Y + 40, 54, COL.green, 400);
    c.later(() => { env.style.transition = "left 5s linear, top 2s var(--soft), transform 2.2s cubic-bezier(.6,0,.1,1), opacity 1s"; env.style.left = X1 - 160 + "px"; dots.forEach((d, i) => c.later(() => { d.style.background = COL.yellow; }, (i / days) * 5000)); }, 1800);
    c.later(() => { env.style.left = X1 - 160 + "px"; sendAway(c, env); }, 7600);
  }),
  V("atmosphere", "Two calendar pages", (c) => {
    snowBg(c);
    const page = (x, month, col) => { const g = c.box(x, 250, 420, 480, {}); c.into(g, () => { c.card(0, 0, 420, 480, { r: 36 }); c.box(0, 0, 420, 118, { background: col, borderRadius: "36px 36px 0 0" }); c.text(month, { x: 0, w: 420, y: 18, size: 72, color: COL.night }); c.text("24", { x: 0, w: 420, y: 150, size: 210 }); }); return g; };
    const a = page(190, "November", COL.blue), b = page(1310, "December", COL.green); c.rise(a, 200, 40); c.rise(b, 600, 40); b.style.filter = "brightness(0.55)"; b.style.transition = "filter 1.2s ease";
    const env = envelopeAt(c, 960, 560, 360); env.style.opacity = 0; env.style.left = "200px"; env.style.top = "520px";
    c.later(() => { env.style.opacity = 1; env.style.left = 960 - 180 + "px"; env.style.top = 560 - 121 + "px"; }, 2200);
    c.later(() => { b.style.filter = "none"; const bell = iconTile(c, 1740, 270, 90, "bell", COL.yellow, 50); bell.style.zIndex = 6; c.pop(bell, 0, 0.5); }, 4600);
    c.later(() => sendAway(c, env), 6000);
  }),
];
SLIDES[13].variants.push(...christmasVariants);
