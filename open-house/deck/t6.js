/* More versions for every slide that scored 80% or lower against the second script.
   They are added to the slides defined in t1-t5.js (by position in those files); order.js still decides the final order. */

Object.assign(ICONS, {
  clock: '<circle cx="32" cy="32" r="22"/><path d="M32 18 V32 L42 38"/>',
  link: '<path d="M26 38 L38 26"/><path d="M24 30 l-6 6 a8 8 0 0 0 12 12 l6 -6"/><path d="M40 34 l6 -6 a8 8 0 0 0 -12 -12 l-6 6"/>',
  bell: '<path d="M18 44 V30 a14 14 0 0 1 28 0 V44 L50 48 H14 Z"/><path d="M28 54 H36"/>',
});
const ST = { ground: COL.stephen, cloth: COL.stephen };
const addVariants = (i, ...vs) => SLIDES[i].variants.push(...vs);
const ctext = (c, str, cx, y, size, color, w = 900) => c.text(str, { x: cx - w / 2, w, y, size, color });
const tagAt = (c, str, cx, y, color, size) => { const t = outTag(c, 0, y, 0, 0, str, color, size); t.style.left = cx - t.offsetWidth / 2 + "px"; return t; };
const flyTo = (c, e, x, y, ms) => { e.style.transition = `left ${ms}ms var(--glide), top ${ms}ms var(--glide), transform ${ms}ms var(--snap), opacity .5s`; c.moveTo(e, x, y, 0); };

/* ---------- 1. Intro ---------- */
addVariants(0,
  V("title", "Name sticker", (c) => {
    const e = c.box(560, 240, 800, 520, {}), d = document.createElement("div");
    d.style.cssText = `width:800px;height:520px;border-radius:36px;background:#f3f1ea;overflow:hidden;transform:rotate(-2deg);box-shadow:0 40px 80px rgba(0,0,0,0.5)`;
    d.innerHTML = `<div style="height:170px;background:${COL.orange};color:${COL.night};display:grid;place-items:center;font-size:104px;font-weight:600;letter-spacing:0.06em">HELLO</div><div style="text-align:center;font-size:44px;letter-spacing:0.04em;color:${COL.night};padding-top:18px">my name is</div><div style="text-align:center;font-size:170px;letter-spacing:-0.04em;color:${COL.night};line-height:1.15">Gaurav</div>`;
    e.appendChild(d); c.pop(e, 300, 0.7);
    c.rise(c.text("Product manager, SDC team at Blueprint", { y: 840, size: 54, color: COL.mute }), 1800, 30);
  }),
  V("title", "Name, role, team", (c) => {
    c.rise(c.text("Gaurav", { y: 250, size: 210 }), 300, 50);
    c.rise(c.text("Product manager", { y: 540, size: 70, color: COL.mute }), 1100, 30);
    const lg = sdcLogo(c, { cx: 960, cy: 810, scale: 0.3, mode: "dark", withText: false, still: true }); lg.box.style.opacity = 0; c.later(() => { lg.box.style.opacity = 1; }, 1900);
    c.rise(c.text("SDC team at Blueprint", { y: 900, size: 50, color: COL.mute }), 2100, 24);
  }),
);

/* ---------- 2. Community ---------- */
addVariants(1,
  V("motion", "Who holds it together", (c) => {
    const xs = [260, 610, 960, 1310, 1660], names = ["Maya", "Dana", "Omar", "Priya", "Stephen"], Y = 520, T = rhythm(5, 350, 300);
    c.line(xs[0], Y, xs[4], Y, { w: 3, color: rgba(COL.ink, 0.25), delay: 300, ms: 1800 });
    names.forEach((n, i) => c.pop(c.avatar(xs[i], Y, 150, n, n === "Stephen" ? ST : {}), T[i]));
    [[610, "Organizes tenants' rights meetings", 2400], [1310, "Speaks up at city council", 3300]].forEach(([x, str, t]) => {
      const tg = tagAt(c, str, x, 270, COL.ink, 32); c.pop(tg, t, 0.8);
      c.line(x, 270 + 56, x, Y - 80, { w: 3, color: rgba(COL.ink, 0.3), delay: t + 300, ms: 600 });
    });
    [["clock", "Time", COL.blue, 560], ["doc", "Skills", COL.green, 960], ["cash", "Money", COL.yellow, 1360]].forEach(([ic, label, col, x], i) => {
      const t = 5000 + i * 900; c.pop(iconTile(c, x, 800, 150, ic, col, 84), t, 0.5); c.rise(ctext(c, label, x, 905, 54, col, 400), t + 300, 24);
    });
  }),
);

/* ---------- 5. Community support: money, time, skills ---------- */
addVariants(4,
  V("motion", "Three kinds of support", (c) => {
    const lg = sdcLogo(c, { cx: 960, cy: 520, scale: 0.5, mode: "dark", withText: false, still: true }), groups = [
      { cx: 380, cy: 420, col: COL.yellow, label: "Money", mk: (i) => ({ label: "$" + [25, 50, 10, 35, 15][i] }) },
      { cx: 1540, cy: 420, col: COL.blue, label: "Time", mk: (i) => ({ label: [3, 5, 2, 4, 6][i] + "h" }) },
      { cx: 960, cy: 880, col: COL.green, label: "Skills", mk: () => ({ icon: true }) },
    ], skillIcons = ["doc", "note", "phone", "people", "cal"];
    groups.forEach((g, gi) => {
      const t = 500 + gi * 2300;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2, x = g.cx + 120 * Math.cos(a), y = g.cy + 120 * Math.sin(a), o = g.mk(i);
        c.line(x, y, 960, 520, { w: 3, color: rgba(g.col, 0.3), delay: t + 1100 + i * 80, ms: 900 });
        const d = c.dot(x, y, 82, g.col, { still: true, label: o.label, fs: 28, lc: COL.night });
        if (o.icon) d.firstChild.innerHTML = iconSvg(skillIcons[i], COL.night, 42);
        d.style.zIndex = 2; c.pop(d, t + i * 160, 0.4);
      }
      c.rise(ctext(c, g.label, g.cx, g.cy + (gi === 2 ? 160 : 170), 56, g.col, 500), t + 800, 24);
    });
  }),
  V("motion", "Three supporters", (c) => {
    [["Stephen", "$50", COL.yellow, 400, ST], ["Priya", "3 hours a week", COL.blue, 960, {}], ["Omar", "Web design", COL.green, 1520, {}]].forEach(([n, str, col, x, pre], i) => {
      const t = 400 + i * 1500; c.pop(c.avatar(x, 420, 240, n, pre), t); c.pop(tagAt(c, str, x, 590, col, 44), t + 600, 0.8);
    });
    c.later(() => {
      const b = c.box(260, 740, 1400, 120, {}); b.innerHTML = `<svg width="1400" height="120" viewBox="0 0 1400 120" style="overflow:visible"><path d="M0 0 Q 700 130 1400 0" fill="none" stroke="${rgba(COL.ink, 0.4)}" stroke-width="3" stroke-linecap="round"/></svg>`;
      const p = b.querySelector("path"), L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; reflow(p); p.style.transition = "stroke-dashoffset 1.6s cubic-bezier(.6,0,.1,1)"; p.style.strokeDashoffset = 0;
      c.rise(c.text("The community behind SDC's work", { y: 840, size: 64, color: COL.ink }), 900, 30);
    }, 5200);
  }),
);

/* ---------- 6. Stewardship ---------- */
addVariants(7,
  V("words", "Thank, back and forth, connected", (c) => {
    sdcLogo(c, { cx: 330, cy: 620, scale: 0.45, mode: "dark", withText: false, still: true }); c.pop(c.avatar(1590, 620, 220, "Stephen", ST), 200);
    const W = [["Thank them", COL.yellow, 410], ["Keep in touch", COL.blue, 960], ["Stay connected", COL.green, 1510]];
    const fly = (t, out, col, size) => c.later(() => { const a = out ? 480 : 1400, b = out ? 1400 : 480, e = iconTile(c, a, 620, size, "mail", col, size * 0.55); e.style.zIndex = 4; reflow(e); flyTo(c, e, b, 620, 1500); c.later(() => { e.style.opacity = 0; }, 1500); }, t);
    c.rise(ctext(c, W[0][0], W[0][2], 200, 70, W[0][1], 600), 600, 30); fly(900, true, COL.yellow, 96);
    c.rise(ctext(c, W[1][0], W[1][2], 200, 70, W[1][1], 600), 3400, 30);
    fly(3700, true, COL.blue, 72); fly(5000, false, COL.orange, 72); fly(6300, true, COL.blue, 72); fly(7600, false, COL.orange, 72);
    c.rise(ctext(c, W[2][0], W[2][2], 200, 70, W[2][1], 600), 9400, 30);
    c.line(480, 620, 1470, 620, { w: 3, color: rgba(COL.green, 0.8), delay: 9700, ms: 1200 });
    c.pop(iconTile(c, 960, 620, 120, "link", COL.green, 66), 10700, 0.5);
  }),
  V("words", "Three phrases", (c) => {
    [["Thank.", COL.yellow, "mail", "Thank people for their support"], ["Keep in touch.", COL.blue, "phone", ""], ["Stay connected.", COL.green, "link", ""]].forEach(([s, col, ic], i) => {
      const y = 130 + i * 290, t = 400 + i * 1500;
      c.pop(iconTile(c, 330, y + 120, 160, ic, col, 90), t, 0.5); c.rise(c.text(s, { x: 520, w: 1300, y, size: 200, color: col, align: "left" }), t + 250, 40);
    });
  }),
);

/* ---------- 7. Workload ---------- */
addVariants(18,
  V("people", "Relationships get buried", (c) => {
    const keep = c.bubble(960 - 330, 390, 660, 100, "Relationships with donors", { bg: COL.yellow, color: COL.night, size: 44, r: 24 }); keep.style.zIndex = 1; c.pop(keep, 300, 0.7);
    c.pop(c.avatar(960, 800, 180, "Suhanya", {}), 500);
    const items = [["Grant reports", -150, -20], ["Events", 170, -30], ["Budget", -40, 50], ["Newsletter", 130, 60], ["Volunteers", -230, 20], ["Meetings", 240, -50], ["Board", 10, -10]], T = rhythm(items.length, 600, 1500);
    items.forEach(([s, dx, dy], i) => {
      const w = 70 + s.length * 21, e = c.bubble(960 + dx - w / 2, -140, w, 80, s, { bg: COL.dim, color: COL.ink, size: 36, r: 20 }); e.style.zIndex = 2 + i; e.style.opacity = 0; e.style.transition = "top .9s cubic-bezier(.3,1.3,.5,1), opacity .4s, transform .9s var(--snap)"; e.style.transform = `rotate(${rnd(-6, 6)}deg)`; reflow(e);
      c.later(() => { e.style.top = 440 + dy - 40 + "px"; e.style.opacity = 1; }, T[i]);
    });
  }),
  V("people", "A day with no room", (c) => {
    const X0 = 260, W = 1400, Y = 440, H = 150; c.box(X0 - 12, Y - 12, W + 24, H + 24, { border: `${HAIR}px solid ${rgba(COL.ink, 0.25)}`, borderRadius: "24px" });
    const donors = c.box(X0, Y, 520, H, { background: COL.yellow, borderRadius: "14px", display: "grid", placeItems: "center", color: COL.night, fontSize: "38px", overflow: "hidden", whiteSpace: "nowrap" }); donors.textContent = "Donor relationships"; c.pop(donors, 300, 0.9);
    const others = [["Grants", COL.blue, 160], ["Events", COL.green, 140], ["Reports", COL.lilac, 200], ["Meetings", COL.orange, 180], ["Budget", COL.blue, 140], ["Email", COL.green, 150]], tot = others.reduce((a, o) => a + o[2], 0), blocks = [];
    others.forEach(([s, col, w], i) => { const b = c.box(X0 + W, Y, w, H, { background: col, borderRadius: "14px", display: "grid", placeItems: "center", color: COL.night, fontSize: "30px", overflow: "hidden" }); b.textContent = s; b.style.opacity = 0; blocks.push([b, w]); });
    const lay = (dw) => { donors.style.width = dw + "px"; let x = X0 + dw + 8; blocks.forEach(([b, w]) => { const ww = ((W - dw - 8) * w) / tot - 8; b.style.left = x + "px"; b.style.width = ww + "px"; x += ww + 8; }); };
    lay(520 + 0); blocks.forEach(([b], i) => { b.style.transition = "none"; b.style.left = X0 + W + "px"; });
    const T = rhythm(blocks.length, 500, 1400);
    blocks.forEach(([b], i) => c.later(() => { b.style.transition = ""; b.style.opacity = 1; lay(Math.max(70, 520 - (i + 1) * 80)); }, T[i]));
    c.rise(c.text("And that's not easy.", { y: 760, size: 60, color: COL.mute }), T[T.length - 1] + 1600, 24);
  }),
);

/* ---------- 10. He never donates again ---------- */
addVariants(6,
  V("metaphor", "One gift, then nothing", (c) => {
    const months = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"], x0 = 200, step = 138;
    months.forEach((m, i) => {
      const x = x0 + i * step, t = 1400 + i * 330;
      if (i === 0) { c.pop(c.dot(x, 520, 100, COL.yellow, { still: true, label: "$50", fs: 34, lc: COL.night }), 400); }
      else { const e = c.box(x - 50, 470, 100, 100, { border: `${LINE}px dashed ${rgba(COL.ink, 0.28)}`, borderRadius: "50%" }); c.pop(e, t, 0.7); }
      c.rise(ctext(c, m, x, 610, 30, COL.mute, 120), i === 0 ? 700 : t, 12);
    });
  }),
  V("metaphor", "The thread goes slack", (c) => {
    sdcLogo(c, { cx: 330, cy: 540, scale: 0.45, mode: "dark", withText: false, still: true });
    const me = c.avatar(1590, 540, 220, "Stephen", ST); c.pop(me, 200);
    const a = c.line(480, 540, 960, 540, { w: 3, color: rgba(COL.ink, 0.5), delay: 600, ms: 700 }), b = c.line(960, 540, 1470, 540, { w: 3, color: rgba(COL.ink, 0.5), delay: 600, ms: 700 });
    b.style.transformOrigin = "100% 50%"; b.style.transform = "rotate(0deg) scaleX(0)"; c.later(() => { b.style.transform = "rotate(0deg) scaleX(1)"; }, 600);
    c.later(() => { [a, b].forEach((l) => { l.style.transition = "transform .3s cubic-bezier(.6,0,.9,.4), opacity .3s"; }); a.style.transformOrigin = "0 50%"; a.style.transform = "rotate(0deg) scaleX(0)"; b.style.transform = "rotate(0deg) scaleX(0)"; me.style.filter = "grayscale(1)"; me.style.opacity = 0.4; }, 2400);
  }),
);

/* ---------- 12. The platform introduced ---------- */
addVariants(19,
  V("product", "Tangle to straight", (c) => {
    sdcLogo(c, { cx: 150, cy: 540, scale: 0.28, mode: "dark", withText: false, still: true });
    const box = c.box(0, 0, 1920, 1080, { pointerEvents: "none" }), ns = "http://www.w3.org/2000/svg", svg = document.createElementNS(ns, "svg"); svg.setAttribute("width", 1920); svg.setAttribute("height", 1080); box.appendChild(svg);
    let d = "M 230 540"; for (let i = 1; i <= 12; i++) d += ` L ${230 + i * 46} ${540 + (i % 2 ? -1 : 1) * rnd(90, 260)}`; d += " L 830 540";
    const draw = (dd, color, t, ms) => { const p = document.createElementNS(ns, "path"); p.setAttribute("d", dd); p.setAttribute("fill", "none"); p.setAttribute("stroke", color); p.setAttribute("stroke-width", 3); p.setAttribute("stroke-linecap", "round"); p.setAttribute("stroke-linejoin", "round"); svg.appendChild(p); const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; reflow(p); p.style.transition = `stroke-dashoffset ${ms}ms cubic-bezier(.6,0,.1,1)`; c.later(() => { p.style.strokeDashoffset = 0; }, t); };
    draw(d, rgba(COL.ink, 0.5), 600, 2200);
    const tile = iconTile(c, 960, 540, 260, "people", COL.blue, 150); tile.style.background = "#13202f"; tile.style.zIndex = 3; c.pop(tile, 2500, 0.6);
    draw("M 1090 540 L 1480 540", COL.blue, 3200, 900);
    c.pop(c.avatar(1600, 540, 200, "Stephen", ST), 3900);
  }),
  V("product", "A checklist that checks itself", (c) => {
    const X = 460, Y = 130, W = 1000, H = 820; c.card(X, Y, W, H, { r: 32 });
    const T = rhythm(8, 650, 900);
    for (let i = 0; i < 8; i++) {
      const y = Y + 100 + i * 90, box = c.box(X + 70, y - 28, 56, 56, { border: `${LINE}px solid ${rgba(COL.ink, 0.4)}`, borderRadius: "12px" });
      box.innerHTML = `<svg viewBox="0 0 56 56" width="56" height="56" style="position:absolute;inset:-3px"><path class="tk" d="M14 29 L24 39 L42 17" fill="none" stroke="${COL.green}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="50" stroke-dashoffset="50" style="transition:stroke-dashoffset .35s ease-out"/></svg>`;
      c.rect(X + 170, y - BAR / 2, 560 - (i % 3) * 120, BAR, rgba(COL.ink, 0.28), 4);
      c.later(() => { box.querySelector(".tk").style.strokeDashoffset = 0; box.style.borderColor = rgba(COL.green, 0.8); }, T[i]);
    }
  }),
);

/* ---------- 14. Two months later: on his page ---------- */
addVariants(11,
  V("memory", "A reminder on his page", (c) => {
    const X = 360, Y = 150, W = 1200, H = 780; c.card(X, Y, W, H, { r: 32 });
    c.avatar(X + 130, Y + 130, 120, "Stephen", ST); c.text("Stephen", { x: X + 220, w: 600, y: Y + 100, size: 70, align: "left" });
    [0, 1, 2, 3].forEach((i) => c.rect(X + 70, Y + 280 + i * 70, W - 140 - i * 220, BAR, rgba(COL.ink, 0.25), 4));
    const cap = c.text("Two months later", { x: X, w: W, y: Y + 80, size: 46, color: COL.mute, align: "right" }); cap.style.left = X - 70 + "px"; cap.style.opacity = 0; c.later(() => { cap.style.opacity = 1; }, 800);
    const ban = c.box(X + 70, Y - 140, W - 140, 130, { background: "#1d2a3d", borderRadius: "24px", border: `${HAIR}px solid ${rgba(COL.blue, 0.7)}`, zIndex: 5, transition: "top 1s cubic-bezier(.2,1.3,.4,1)" });
    ban.innerHTML = `<div style="position:absolute;left:34px;top:34px;width:62px;height:62px;border-radius:12px;background:${COL.note}"></div><div style="position:absolute;left:130px;top:0;bottom:0;display:flex;align-items:center;font-size:48px;letter-spacing:-0.03em;color:${COL.ink}">Ask about her daughter</div>`;
    c.later(() => { ban.style.top = Y + 190 + "px"; }, 2400);
  }),
);

/* ---------- 16. Written in November, sent on Christmas Eve ---------- */
addVariants(13,
  V("atmosphere", "November to Christmas Eve", (c) => {
    const mkCal = (x, month, col, big) => { const g = c.box(x, 250, 440, 500, {}); c.into(g, () => { c.card(0, 0, 440, 500, { r: 36 }); c.box(0, 0, 440, 120, { background: col, borderRadius: "36px 36px 0 0" }); c.text(month, { x: 0, w: 440, y: 18, size: 74, color: COL.night }); if (big) c.text(big, { x: 0, w: 440, y: 160, size: 220 }); }); return g; };
    c.rise(mkCal(280, "November", COL.blue, ""), 200, 40); c.rise(mkCal(1200, "December", COL.green, "24"), 600, 40);
    [0, 1, 2].forEach((i) => { const l = c.box(340, 430 + i * 60, 0, 0, {}); l.innerHTML = ""; const q = c.box(340, 430 + i * 60, 320 - i * 70, 16, {}); let d = "M0 8"; for (let k = 0; k < (320 - i * 70) / 20; k++) d += " q 5 -8 10 0 t 10 0"; q.innerHTML = `<svg width="${320 - i * 70}" height="16" style="display:block"><path d="${d}" fill="none" stroke="${rgba(COL.ink, 0.35)}" stroke-width="3" stroke-linecap="round"/></svg>`; q.style.opacity = 0; c.later(() => { q.style.opacity = 1; }, 900 + i * 500); });
    ctext(c, "Written in November", 500, 800, 44, COL.mute, 700); ctext(c, "Sent on Christmas Eve", 1420, 800, 44, COL.mute, 700);
    const env = iconTile(c, 500, 640, 120, "mail", COL.yellow, 66); env.style.zIndex = 4; c.pop(env, 2600, 0.5);
    c.later(() => { flyTo(c, env, 1420, 690, 1700); }, 3700);
    c.pop(iconTile(c, 1700, 300, 90, "clock", COL.green, 50), 5600, 0.5);
  }),
  V("ui", "Schedule it", (c) => {
    const X = 460, Y = 150, W = 1000, H = 780, P = 70; c.card(X, Y, W, H, { r: 28 });
    [0, 1, 2].forEach((i) => c.box(X + P + i * 32, Y + P, 16, 16, { borderRadius: "50%", background: rgba(COL.ink, 0.2) }));
    c.text("Holiday message", { x: X + P, w: 700, y: Y + 150, size: 56, color: COL.mute, align: "left" });
    [0, 1, 2, 3].forEach((i) => c.rect(X + P, Y + 280 + i * 56, W - 2 * P - i * 200, BAR, rgba(COL.ink, 0.28), 4));
    const nov = outTag(c, 0, Y + P - 16, 0, 0, "Written in November", COL.mute, 30); nov.style.left = X + W - P - nov.offsetWidth + "px"; nov.style.opacity = 0; c.later(() => { nov.style.opacity = 1; }, 600);
    const on = outTag(c, X + P, Y + H - P - 56, 0, 0, "Send on December 24", COL.blue, 34); on.style.opacity = 0; c.later(() => { on.style.opacity = 1; }, 2200);
    const bw = 300, bh = 84, btn = c.bubble(X + W - P - bw, Y + H - P - bh, bw, bh, "Schedule", { bg: COL.system, color: COL.night, size: 38, r: 12 });
    c.later(() => { btn.style.transform = "scale(.95)"; c.later(() => { btn.style.transform = "none"; btn.style.background = COL.green; btn.firstChild.textContent = "Scheduled ✓"; }, 200); }, 4200);
  }),
);

/* ---------- 18. The platform does the admin; she does the human part ---------- */
addVariants(16,
  V("ui", "Handed off, then a call", (c) => {
    const tile = iconTile(c, 640, 480, 260, "mail", COL.blue, 150); tile.style.background = rgba(COL.blue, 0.14); c.pop(tile, 300, 0.6);
    [["Remembering", 1], ["Sending", 2]].forEach(([s, k], i) => {
      const chip = c.bubble(240, 280 + i * 400, 400, 100, s, { bg: COL.dim, color: COL.ink, size: 44, r: 20 }); chip.style.opacity = 0; c.later(() => { chip.style.opacity = 1; }, 600);
      c.later(() => { c.moveTo(chip, 640, 480, 1100); chip.style.transform = "scale(0.3)"; }, 1700 + i * 800); c.later(() => { chip.style.opacity = 0; tile.style.transform = "scale(1.06)"; c.later(() => { tile.style.transform = "none"; }, 220); }, 2650 + i * 800);
    });
    const av = c.avatar(1350, 440, 280, "Stephen", ST); c.pop(av, 4400);
    [0, 1].forEach((i) => c.later(() => { const r = c.ring(1350, 440, 280, COL.green, 3); r.style.transition = "transform 1.6s ease-out, opacity 1.6s ease-out"; r.style.zIndex = 0; reflow(r); r.style.transform = "scale(1.8)"; r.style.opacity = 0; }, 5000 + i * 900));
    c.pop(c.bubble(1070, 640, 560, 100, "Call Stephen · 10 min", { bg: COL.green, color: COL.night, size: 40, r: 14 }), 5200, 0.8);
  }),
  V("people", "The calendar clears", (c) => {
    const cols = 5, rows = 6, gx = 460, gy = 200, cw = 200, ch = 110, cells = [];
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { const i = r * cols + k, e = c.rect(gx + k * cw + 6, gy + r * ch + 6, cw - 12, ch - 12, rgba(PAL[i % 5], 0.75), 14); cells.push(e); }
    const keep = [7, 21], order = cells.map((_, i) => i).filter((i) => !keep.includes(i)).sort(() => Math.random() - 0.5), T = rhythm(order.length, 120, 1400);
    order.forEach((idx, i) => c.later(() => { cells[idx].style.background = rgba(COL.ink, 0.06); }, T[i]));
    const t = T[T.length - 1] + 500;
    [[7, "phone"], [21, "people"]].forEach(([idx, ic]) => c.later(() => { const e = cells[idx]; e.style.background = COL.green; e.innerHTML = `<div style="display:grid;place-items:center;height:100%">${iconSvg(ic, COL.night, 56)}</div>`; }, t));
  }),
);

/* ---------- 19. The potluck ---------- */
function potluckScene(c, o) {
  const tableY = 905; c.box(180, tableY, 1560, 40, { background: "linear-gradient(#2f2d28, #23211d)", borderRadius: "14px", boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 30px 50px rgba(0,0,0,0.5)" });
  const kinds = ["$", "h", "s", "$", "h", "s", "$", "s"], icons = ["doc", "note", "phone", "people", "cal"], amts = amounts(8), T = o.guests;
  /* each guest simply takes a seat, one at a time: money, time or a skill in hand */
  kinds.forEach((k, i) => {
    const x = 280 + i * 150, col = PAL[i % 5], lab = k === "$" ? "$" + amts[i] : k === "h" ? (2 + ((i * 3) % 7)) + "h" : null;
    c.later(() => {
      const d = c.dot(x, tableY - 26, 100, PAL[(i + 2) % 5], { still: true }); d.style.height = "50px"; d.style.borderRadius = "999px 999px 0 0"; d.style.top = tableY - 50 + "px"; c.pop(d, 0, 0.3);
      const p = c.dot(x, 775, 112, col, { label: lab, fs: 40, lc: COL.night, still: true }); if (!lab) p.firstChild.innerHTML = iconSvg(icons[i % 5], COL.night, 56); c.pop(p, 120, 0.4);
    }, T[i]);
  });
  const g = c.glow(1560, 770, 900, COL.yellow, 0.3); g.style.zIndex = -1; g.style.opacity = 0;
  const host = c.avatar(1560, 770, 220, "Host", { ground: COL.system, cloth: COL.system, kind: 1 }); host.style.opacity = 0;
  const arriveHost = () => { g.style.opacity = 1; host.style.transform = "scale(0.4)"; reflow(host); host.style.opacity = 1; host.style.transform = "none"; };
  const name = c.text("Potluck", { y: 130, size: 230 }); name.style.opacity = 0;
  const sub = c.text("Launching in early December 2026", { y: 390, size: 60, color: COL.mute }); sub.style.opacity = 0;
  const reveal = () => { name.style.transform = "translateY(40px)"; reflow(name); name.style.opacity = 1; name.style.transform = "none"; c.later(() => { sub.style.transform = "translateY(24px)"; reflow(sub); sub.style.opacity = 1; sub.style.transform = "none"; }, 700); };
  return { arriveHost, reveal };
}
addVariants(17,
  V("scene", "Paced to the script", (c) => {
    const s = potluckScene(c, { guests: [800, 3400, 6000, 8600, 11200, 13800, 16400, 19000] });
    c.later(s.arriveHost, 23500);
    c.step(s.reveal, 31000);
  }),
  V("scene", "Three beats, on your cue", (c) => {
    const s = potluckScene(c, { guests: rhythm(8, 520, 500) });
    c.step(s.arriveHost, 9000);
    c.step(s.reveal, 14000);
  }),
);
