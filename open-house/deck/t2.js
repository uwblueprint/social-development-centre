/* Slides 6 to 11: Stephen, the glow going out, stewardship, the wall, the quote, the disconnect */

/* A nonprofit's thank-you email, drawn in squiggles: the SDC mark, a heading, a few lines. No readable text. */
function donationEmail() {
  const W = 688, H = 270, ink = "#6d675b", dark = "#2a2722", L = SDC_LOGO, bb = L.mark.bbox, vb = [bb[0] - 6, bb[1] - 6, bb[2] - bb[0] + 12, bb[3] - bb[1] + 12], lh = 84, lw = lh * (vb[2] / vb[3]);
  const sq = (x, y, len, color) => { const n = Math.max(1, Math.round(len / 14)); let d = `M${x} ${y}`; for (let i = 0; i < n; i++) d += " q 3.5 -5 7 0 t 7 0"; return `<path d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`; };
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block">`;
  svg += `<svg x="32" y="30" width="${lw}" height="${lh}" viewBox="${vb.join(" ")}">${L.orange.map((d) => `<path d="${d}" fill="${L.colors.orange}" fill-rule="evenodd"/>`).join("")}${L.green.map((d) => `<path d="${d}" fill="${L.colors.green}" fill-rule="evenodd"/>`).join("")}</svg>`;
  svg += sq(32 + lw + 28, 66, 260, dark) + sq(32 + lw + 28, 94, 150, ink);
  svg += sq(32, 170, 600, ink) + sq(32, 198, 540, ink) + sq(32, 226, 300, ink);
  svg += "</svg>";
  const mail = document.createElement("div");
  Object.assign(mail.style, { alignSelf: "flex-start", width: W + "px", height: H + "px", borderRadius: "26px", overflow: "hidden", background: "linear-gradient(160deg, #f7f2e6 0%, #efe8d6 100%)", opacity: 0, transform: "translateY(36px) scale(0.96)", transformOrigin: "0 100%", transition: "opacity .6s var(--soft), transform .9s var(--snap)", boxShadow: "0 24px 50px rgba(0,0,0,.4)" });
  mail.innerHTML = svg;
  return mail;
}

slide("Meet Stephen. He's not an activist. A friend texted him: \"Hey! I'm helping fundraise for a nonprofit called SDC. Can you chip in?\" He gave fifty dollars, and it felt good.", [
  V("ui", "Text messages, from the friend's phone", (c) => {
    const px = 560, pw = 800, midX = px + pw / 2;
    /* the phone is far taller than the slide, so its sides run straight off the bottom */
    c.box(px, 50, pw, 1600, { borderRadius: "120px", background: "linear-gradient(180deg, #181713, #12110e)", boxShadow: "0 0 0 2px rgba(255,255,255,0.09), inset 0 0 0 10px #0d0c0a, 0 60px 120px -20px rgba(0,0,0,0.8)" });
    c.box(midX - 110, 78, 220, 58, { borderRadius: "30px", background: "#050504", zIndex: 3 });
    c.avatar(midX, 214, 92, "Stephen", { ground: COL.stephen, cloth: COL.stephen });
    c.text("Stephen", { x: px, w: pw, y: 276, size: 30, color: COL.mute });
    const col = c.box(px + 56, 340, pw - 112, 740, { display: "flex", flexDirection: "column", gap: "22px", transition: "none" });
    /* "r": sent from this phone (blue). "l": Stephen's replies (gray) */
    const bub = (side) => { const b = document.createElement("div"); Object.assign(b.style, { alignSelf: side === "l" ? "flex-start" : "flex-end", maxWidth: "540px", width: "fit-content", padding: "22px 34px", fontSize: "36px", lineHeight: 1.24, letterSpacing: "-0.015em", borderRadius: side === "l" ? "40px 40px 40px 0" : "40px 40px 0 40px", background: side === "l" ? "#2b2a26" : COL.blue, color: side === "l" ? COL.ink : COL.night, opacity: 0, transform: "translateY(36px) scale(0.96)", transformOrigin: side === "l" ? "0 100%" : "100% 100%", transition: "opacity .6s var(--slow), transform .8s cubic-bezier(.175,.885,.32,1.1)" }); return b; };
    const show = (b) => { col.appendChild(b); reflow(b); b.style.opacity = 1; b.style.transform = "none"; };
    const typing = (ms, then) => { const b = bub("l"); b.style.padding = "28px 34px"; const d = document.createElement("span"); d.style.cssText = "display:inline-flex;gap:10px"; for (let i = 0; i < 3; i++) { const q = document.createElement("i"); q.style.cssText = `width:14px;height:14px;border-radius:50%;background:${COL.mute};opacity:.4;animation:hop 0.9s ease-in-out ${i * 0.15}s infinite`; d.appendChild(q); } b.appendChild(d); show(b); c.later(() => { b.remove(); then(); }, ms); };
    c.later(() => { const b = bub("r"); b.textContent = "Hey! I'm helping fundraise for a nonprofit called SDC. Can you chip in?"; show(b); }, 400);
    c.later(() => { const d = document.createElement("div"); d.textContent = "Delivered"; Object.assign(d.style, { alignSelf: "flex-end", fontSize: "26px", color: COL.mute, opacity: 0, transition: "opacity 1s" }); col.appendChild(d); reflow(d); d.style.opacity = 1; }, 1300);
    c.later(() => typing(1000, () => { const b = bub("l"); b.textContent = "Sure, just donated $50"; show(b); }), 1900);
    c.later(() => { const img = donationEmail(); col.appendChild(img); reflow(img); img.style.opacity = 1; img.style.transform = "none"; }, 4000);
  }),
]);

slide("Giving once was the easy part. A month later, he feels no connection to SDC, and he doesn't give again.", [
  V("metaphor", "Heart monitor", (c) => {
    const G = COL.green, gr = (a) => rgba(G, a);
    /* the monitor: phosphor grid, a glow behind the trace, scanlines on top */
    const grid = c.box(0, 0, 1920, 1080, { zIndex: 0, background: `linear-gradient(${gr(0.16)} 2px, transparent 2px) 0 0/384px 384px, linear-gradient(90deg, ${gr(0.16)} 2px, transparent 2px) 0 0/384px 384px, linear-gradient(${gr(0.06)} 1px, transparent 1px) 0 0/96px 96px, linear-gradient(90deg, ${gr(0.06)} 1px, transparent 1px) 0 0/96px 96px, radial-gradient(ellipse 70% 60% at 50% 55%, ${gr(0.09)}, ${gr(0)} 70%)` });
    grid.style.opacity = 0; reflow(grid); grid.style.opacity = 1;
    c.box(0, 0, 1920, 1080, { zIndex: 4, pointerEvents: "none", background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0 2px, rgba(0,0,0,0) 2px 4px)" });
    const alarm = c.box(0, 0, 1920, 1080, { zIndex: 3, pointerEvents: "none", opacity: 0, background: `radial-gradient(ellipse 80% 80% at 50% 50%, ${rgba(COL.orange, 0)} 45%, ${rgba(COL.orange, 0.3)} 100%)` });
    const lab = c.text("HEART RATE", { x: 120, y: 96, w: 700, size: 34, color: gr(0.85), align: "left", weight: 500 }); lab.style.letterSpacing = "0.12em";
    const num = c.text("72", { x: 120, y: 140, w: 700, size: 250, color: G, align: "left" }); num.style.fontVariantNumeric = "tabular-nums"; num.style.zIndex = 5;
    const unit = c.text("BPM", { x: 120, y: 410, w: 700, size: 40, color: gr(0.85), align: "left", weight: 500 }); unit.style.letterSpacing = "0.12em";
    const trace = c.box(0, 440, 1920, 500, { zIndex: 2 });
    const cv = document.createElement("canvas"); cv.width = 1920; cv.height = 500; cv.style.cssText = "display:block;width:1920px;height:500px"; trace.appendChild(cv);
    const g = cv.getContext("2d");
    const D = 4200, BW = 520, gaps = [1000], amps = [1], starts = [];
    let tt = 900; gaps.forEach((gp) => { starts.push(tt); tt += gp; });
    const gs = (u, m, sd) => Math.exp(-(((u - m) / sd) ** 2));
    const ecg = (u) => 0.1 * gs(u, 0.16, 0.05) - 0.14 * gs(u, 0.29, 0.02) + gs(u, 0.32, 0.022) - 0.3 * gs(u, 0.36, 0.024) + 0.2 * gs(u, 0.6, 0.07);
    const val = (t) => { for (let i = 0; i < starts.length; i++) { const u = (t - starts[i]) / BW; if (u >= 0 && u <= 1) return amps[i] * ecg(u); } return 0; };
    const lastEnd = starts[starts.length - 1] + BW; let t0 = 0, id = null, shown = "72", flat = false;
    c.later(() => {
      t0 = performance.now();
      id = c.every(() => {
        const el = Math.min(D, performance.now() - t0), headX = (el / D) * 1920;
        g.clearRect(0, 0, 1920, 500); g.lineJoin = "round"; g.lineCap = "round"; g.lineWidth = 4;
        g.strokeStyle = el > lastEnd ? COL.quiet : G; g.shadowColor = el > lastEnd ? "rgba(0,0,0,0)" : G; g.shadowBlur = 14;
        g.beginPath(); for (let x = 0; x <= headX; x += 2) { const y = 250 - val((x / 1920) * D) * 210; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
        g.shadowBlur = 0; g.fillStyle = el > lastEnd ? COL.quiet : G; g.beginPath(); g.arc(headX, 250 - val(el) * 210, 7, 0, 6.3); g.fill();
        let bpm = "72";
        if (el > lastEnd) bpm = "0";
        if (bpm !== shown) { shown = bpm; num.textContent = bpm; }
        if (el > lastEnd && !flat) { flat = true; num.style.color = COL.quiet; lab.style.color = COL.quiet; unit.style.color = COL.quiet; grid.style.transition = "opacity 3.5s ease"; grid.style.opacity = 0.2; }
        if (el >= D) clearInterval(id);
      }, 16);
    }, 500);
  }),
]);

const ICONS = {
  mail: '<rect x="9" y="15" width="46" height="34" rx="6"/><path d="M11 19 L32 36 L53 19"/>',
  note: '<rect x="12" y="9" width="40" height="46" rx="6"/><path d="M20 24 h24 M20 34 h24 M20 44 h13"/>',
  door: '<path d="M17 55 V30 a15 15 0 0 1 30 0 V55"/><path d="M9 55 H55"/><circle cx="39" cy="42" r="1.5"/>',
};
/* icons keep a 3px stroke at any size */
const iconSvg = (k, color, sz) => `<svg viewBox="0 0 64 64" width="${sz}" height="${sz}" fill="none" stroke="${color}" stroke-width="${(3 * 64) / sz}" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`;
const VERBS = [["Thank.", COL.yellow, "mail"], ["Remember.", COL.blue, "note"], ["Invite.", COL.orange, "door"]];
slide("Keeping someone giving and involved has a name in the nonprofit world: donor stewardship.\n\nWe thank the donor for their donation. We remember them and check up on them, and we build a relationship. Then we invite them into the work the nonprofit is doing: updates, volunteer opportunities, and more.", [
  V("words", "Three verbs", (c) => {
    VERBS.forEach(([s, col], i) => c.rise(c.text(s, { y: 140 + i * 280, size: 250, color: col }), 300 + i * 900, 50));
  }),
  V("words", "Icons over the verbs", (c) => {
    const T = rhythm(3, 800, 300);
    VERBS.forEach(([s, col, ic], i) => {
      const cx = 400 + i * 560, tile = c.box(cx - 100, 250, 200, 200, { border: `3px solid ${rgba(col, 0.75)}`, borderRadius: "40px", display: "grid", placeItems: "center" });
      tile.innerHTML = iconSvg(ic, col, 110); tile.style.display = "grid"; tile.style.placeItems = "center";
      c.pop(tile, T[i], 0.5); c.rise(c.text(s, { x: cx - 330, w: 660, y: 520, size: 118, color: col }), T[i] + 300, 40);
    });
  }),
  V("words", "One word at a time", (c) => {
    const els = VERBS.map(([s, col]) => { const e = c.text(s, { y: 330, size: 330, color: col }); e.style.opacity = 0; e.style.transition = "none"; return e; });
    const show = (i) => { els.forEach((e, k) => { e.style.transition = "none"; e.style.opacity = k === i ? 1 : 0; e.style.transform = k === i ? "scale(0.88)" : "none"; }); reflow(els[i]); els[i].style.transition = "transform .5s var(--snap)"; els[i].style.transform = "none"; };
    [500, 1700, 2800].forEach((t, i) => c.later(() => show(i), t));
    c.later(() => { els.forEach((e) => { e.style.transition = "none"; e.style.opacity = 0; }); const row = c.text("", { y: 440, size: 150 }); row.innerHTML = VERBS.map(([s, col]) => `<span style="color:${col}">${s}</span>`).join("  "); row.style.whiteSpace = "pre"; }, 4200);
  }),
  V("words", "Stephen walks the path", (c) => {
    const xs = [360, 960, 1560], Y = 640;
    c.rect(xs[0], Y - 1.5, xs[2] - xs[0], 3, rgba(COL.ink, 0.22));
    const nodes = VERBS.map(([s, col, ic], i) => { const n = c.box(xs[i] - 56, Y - 56, 112, 112, { border: `3px solid ${rgba(COL.ink, 0.3)}`, borderRadius: "24px", background: COL.night }); n.innerHTML = iconSvg(ic, rgba(COL.ink, 0.5), 60); n.style.display = "grid"; n.style.placeItems = "center"; return n; });
    const who = c.avatar(xs[0], Y + 150, 96, "Stephen", { ground: COL.stephen, cloth: COL.stephen });
    const arrive = (i) => { const col = VERBS[i][1], n = nodes[i]; n.style.borderColor = col; n.style.background = rgba(col, 0.18); n.innerHTML = iconSvg(VERBS[i][2], col, 60); c.rise(c.text(VERBS[i][0], { x: xs[i] - 330, w: 660, y: 330, size: 130, color: col }), 0, 40); };
    c.later(() => arrive(0), 600);
    c.later(() => c.moveTo(who, xs[1], Y + 150, 1100), 1700); c.later(() => arrive(1), 2800);
    c.later(() => c.moveTo(who, xs[2], Y + 150, 1100), 3900); c.later(() => arrive(2), 5000);
  }),
  V("words", "Sliding in, underlined", (c) => {
    const rows = [["Thank.", COL.yellow, 260, -400], ["Remember.", COL.blue, 520, 400], ["Invite.", COL.orange, 900, -400]];
    rows.forEach(([s, col, x, dx], i) => {
      const y = 120 + i * 300, t = c.text(s, { x, w: 1300, y, size: 250, color: col, align: "left" }); t.style.opacity = 0; t.style.transform = `translateX(${dx}px)`; reflow(t);
      const when = 300 + i * 1000; c.later(() => { t.style.opacity = 1; t.style.transform = "none"; }, when);
      const L = [760, 1020, 600][i], u = c.box(x + 6, y + 232, L, 20, {}); u.innerHTML = `<svg width="${L}" height="20" viewBox="0 0 ${L} 20" style="overflow:visible"><path d="${handStrike(L)}" fill="none" stroke="${col}" stroke-width="4" stroke-linecap="round"/></svg>`;
      const p = u.querySelector("path"), len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; reflow(p); p.style.transition = "stroke-dashoffset .5s ease-out"; c.later(() => { p.style.strokeDashoffset = 0; }, when + 600);
    });
  }),
  V("words", "Around a donor", (c) => {
    const cx = 960, cy = 520, pts = [[-430, -250], [430, -250], [0, 270]];
    const hub = c.avatar(cx, cy, 230, "Stephen", { ground: COL.stephen, cloth: COL.stephen }); hub.style.zIndex = 3; c.pop(hub, 200);
    VERBS.forEach(([s, col, ic], i) => {
      const x = cx + pts[i][0], y = cy + pts[i][1], t = 900 + i * 1100;
      c.line(cx, cy, x, y, { w: 3, color: rgba(col, 0.6), delay: t, ms: 900 });
      const tile = iconTile(c, x, y, 180, ic, col, 100); tile.style.zIndex = 3; c.pop(tile, t + 700, 0.5);
      c.rise(c.text(s, { x: x - 260, w: 520, y: y + 110, size: 80, color: col }), t + 900, 30);
    });
  }),
  V("words", "Three cards", (c) => {
    const W = 520, H = 560, Y = 260, xs = [110, 700, 1290], sq = (len) => { const n = Math.round(len / 14); let d = "M0 8"; for (let i = 0; i < n; i++) d += " q 3.5 -6 7 0 t 7 0"; return d; };
    VERBS.forEach(([s, col, ic], i) => {
      const t = 500 + i * 1200;
      c.rise(c.card(xs[i], Y, W, H, { r: 32 }), t, 50);
      c.rise(c.text(s, { x: xs[i], w: W, y: Y + 40, size: 84, color: col }), t + 200, 30);
      const ill = c.box(xs[i] + 60, Y + 190, W - 120, 320, {});
      ill.innerHTML = `<div style="display:grid;place-items:center;height:210px">${iconSvg(ic, col, 170)}</div><svg width="${W - 120}" height="60" style="display:block;margin-top:20px"><path d="${sq(340)}" fill="none" stroke="${rgba(COL.ink, 0.3)}" stroke-width="3" stroke-linecap="round"/><path transform="translate(0 30)" d="${sq(220)}" fill="none" stroke="${rgba(COL.ink, 0.3)}" stroke-width="3" stroke-linecap="round"/></svg>`;
      c.rise(ill, t + 400, 30);
    });
  }),
  V("words", "Three threads to one person", (c) => {
    sdcLogo(c, { cx: 330, cy: 540, scale: 0.5, mode: "dark", withText: false, still: true });
    c.pop(c.avatar(1590, 540, 220, "Stephen", { ground: COL.stephen, cloth: COL.stephen }), 200);
    const svgBox = c.box(0, 0, 1920, 1080, { pointerEvents: "none" }), ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", 1920); svg.setAttribute("height", 1080); svgBox.appendChild(svg);
    VERBS.forEach(([s, col], i) => {
      const off = [-300, 0, 300][i], t = 700 + i * 1500, p = document.createElementNS(ns, "path");
      p.setAttribute("d", `M 480 540 C 800 ${540 + off} 1200 ${540 + off} 1470 540`); p.setAttribute("fill", "none"); p.setAttribute("stroke", col); p.setAttribute("stroke-width", 4); p.setAttribute("stroke-linecap", "round"); svg.appendChild(p);
      const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; reflow(p); p.style.transition = "stroke-dashoffset 1.3s cubic-bezier(.6,0,.1,1)"; c.later(() => { p.style.strokeDashoffset = 0; }, t);
      const ly = [330, 440, 740][i]; c.rise(c.text(s, { x: 610, w: 700, y: ly, size: 70, color: col }), t + 900, 30);
    });
  }),
]);

slide("Now multiply a donor like Stephen by a hundred: a hundred thank-yous, a hundred reminder emails, each at the right time. Whose email do you customize?\n\nAnd when you have ten minutes to make one call, who do you call?", [
  V("literal", "Hundred and a timer", (c) => {
    const dots = layoutGrid(100, { cx: 640, cy: 540, pitch: 76, cols: 10 }).map(([x, y], i) => { const e = c.dot(x, y, 38, PAL[(i * 3 + Math.floor(i / 10)) % 5]); e.style.opacity = 0; reflow(e); c.later(() => { e.style.opacity = 1; }, 100 + i * 16); return e; });
    const t = c.text("10:00", { x: 1000, w: 760, y: 400, size: 250 }); t.style.fontVariantNumeric = "tabular-nums"; let s = 600;
    c.later(() => c.every(() => { s--; t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }, 1000), 1800);
    const order = dots.map((_, i) => i).sort(() => Math.random() - 0.5); let n = 0;
    c.later(() => c.every(() => { for (let k = 0; k < 2; k++) { const d = dots[order[n++]]; if (d) { d.style.transition = "none"; d.style.filter = "brightness(2.2)"; c.later(() => { d.style.opacity = 0.1; d.style.filter = "grayscale(1)"; }, 90); } } }, 450), 2400);
  }),
]);

const QUOTE_F = { str: "Being a professional fundraiser is taxing, and sometimes we forget things.", who: "Rachel Reis", sub: "Donor relations coordinator, in a letter to The Chronicle of Philanthropy, 2023", tail: 2, av: (c) => c.avatar(320, 815, 112, "Rachel", { ground: COL.mute, cloth: COL.mute }) };
/* each quote: words rise, the key words light up, the speaker appears underneath */
function quotes(c, list) {
  let t = 200;
  list.forEach((q, idx) => {
    const last = idx === list.length - 1, n = q.str.split(" ").length, doneAt = n * 110 + 500;
    c.later(() => {
      const w = c.words(q.str, { x: 260, w: 1400, y: 0, size: 88, stagger: 110, delay: 0, align: "left" });
      w.el.style.lineHeight = 1.3; w.el.style.top = "250px";
      c.later(() => w.spans.forEach((sp, i) => { sp.style.color = i >= n - q.tail ? COL.yellow : COL.mute; }), doneAt);
      const a = q.av(c); a.style.opacity = 0; const lab = c.text(q.who, { x: 400, w: 800, y: 766, size: 50, color: COL.mute, align: "left" }); lab.style.opacity = 0; const src = c.text(q.sub || "", { x: 400, w: 1400, y: 836, size: 32, color: COL.mute, align: "left" }); src.style.opacity = 0;
      c.later(() => { a.style.opacity = 1; lab.style.opacity = 1; src.style.opacity = 1; }, doneAt + 200);
      if (!last) c.later(() => { w.el.style.opacity = 0; a.style.opacity = 0; lab.style.opacity = 0; src.style.opacity = 0; }, doneAt + 3600);
    }, t);
    t += doneAt + 3600 + 1600;
  });
}
slide("Rachel Reis, a fundraiser, wrote to The Chronicle of Philanthropy: \"Being a professional fundraiser is taxing, and sometimes we forget things.\"\n\nIt's very easy, right? Put yourself in their shoes. You have five hours to manage a hundred people, build a relationship with each one, and keep it going. How do you even do that? That's where we come in.", [
  V("emphasis", "The fundraiser who forgets", (c) => quotes(c, [QUOTE_F])),
]);

/* Stephen was never pushed out. Nobody ever told him anything, so he never knew what was going on. */
slide("And Stephen wants to be part of this community. But nobody told him about the events, the notes, the ways to help. Nobody talked to him. So he never knew, and he feels connected to none of it.", [
  V("literal", "Every phone buzzes but his", (c) => {
    const PW = 360, PH = 800, T = rhythm(5, 240, 100);
    /* off-grid on purpose: some run off the left, right and bottom edges. Stephen's is the quiet one in the corner. */
    const cfg = [["Maya", 110, 170, -6], ["Dana", 520, 330, 5], ["Stephen", 960, 150, 0], ["Priya", 1400, 330, -5], ["Omar", 1810, 190, 6]];
    cfg.forEach(([n, cx, top, rot], i) => {
      const me = n === "Stephen", g = c.box(cx - PW / 2, top, PW, PH, { transform: `translateY(170px) rotate(${rot * 2}deg)`, opacity: 0 });
      const body = document.createElement("div"); body.style.cssText = `position:absolute;left:0;top:0;width:${PW}px;height:${PH}px;border-radius:54px;background:linear-gradient(160deg,#2c2b28,#171614);box-shadow:0 0 0 ${me ? 3 : 2}px ${me ? rgba(COL.stephen, 0.85) : "rgba(255,255,255,0.18)"}, inset 0 0 0 9px #080807, 0 40px 80px -30px rgba(0,0,0,0.8)`;
      const btn = (l, t, w, h) => { const b = document.createElement("div"); b.style.cssText = `position:absolute;left:${l}px;top:${t}px;width:${w}px;height:${h}px;background:#3a3935;border-radius:2px`; body.appendChild(b); };
      btn(-4, 170, 4, 62); btn(-4, 250, 4, 62); btn(PW, 210, 4, 108);
      const screen = document.createElement("div"); screen.style.cssText = `position:absolute;left:12px;top:12px;width:${PW - 24}px;height:${PH - 24}px;border-radius:42px;overflow:hidden;background:${me ? "#070706" : "linear-gradient(180deg,#2b3652,#141a28)"}`;
      const island = document.createElement("div"); island.style.cssText = "position:absolute;left:50%;top:16px;width:96px;height:28px;margin-left:-48px;border-radius:14px;background:#050504;z-index:3"; screen.appendChild(island);
      const clock = document.createElement("div"); clock.textContent = "9:41"; clock.style.cssText = `position:absolute;left:0;right:0;top:64px;text-align:center;font-size:72px;font-weight:500;letter-spacing:-0.04em;color:rgba(255,255,255,${me ? 0.3 : 0.9})`; screen.appendChild(clock);
      if (me) { const nn = document.createElement("div"); nn.textContent = "No notifications"; nn.style.cssText = "position:absolute;left:0;right:0;top:330px;text-align:center;font-size:28px;color:rgba(255,255,255,0.32)"; screen.appendChild(nn); }
      body.appendChild(screen); g.appendChild(body);
      c.later(() => { g.style.opacity = 1; g.style.transform = `rotate(${rot}deg)`; }, T[i]);
      if (me) return;
      /* a notification drops in from the top of the lock screen; older ones slide down */
      const banners = [];
      const buzz = () => {
        const b = document.createElement("div"); b.style.cssText = `position:absolute;left:14px;width:${PW - 52}px;height:84px;top:-110px;border-radius:22px;background:rgba(255,255,255,0.17);transition:top .6s cubic-bezier(.2,1.45,.35,1),opacity .5s`;
        b.innerHTML = `<div style="position:absolute;left:16px;top:18px;width:48px;height:48px;border-radius:12px;background:${pick([COL.note, COL.blue, COL.lilac, COL.green])}"></div><div style="position:absolute;left:78px;top:22px;width:130px;height:13px;border-radius:7px;background:rgba(255,255,255,0.72)"></div><div style="position:absolute;left:78px;top:47px;width:100px;height:11px;border-radius:6px;background:rgba(255,255,255,0.34)"></div>`;
        screen.appendChild(b); reflow(b); banners.unshift(b); banners.forEach((x, k) => { x.style.top = 170 + k * 96 + "px"; });
        while (banners.length > 3) { const o = banners.pop(); o.style.opacity = 0; c.later(() => o.remove(), 600); }
        c.later(() => { const k = banners.indexOf(b); if (k >= 0) { banners.splice(k, 1); b.style.opacity = 0; c.later(() => b.remove(), 600); } }, 4200);
      };
      c.later(() => { buzz(); c.every(buzz, rnd(1700, 2900)); }, 1100 + i * 350);
    });
  }),
]);
