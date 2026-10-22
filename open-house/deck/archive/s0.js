/* Title and "The change" (paragraphs 1 to 3) */

slide("Intro slide for the team.\n\nWe're UW Blueprint, working with the Social Development Centre in Kitchener-Waterloo.", [
  V("words", "Plain title", (c) => {
    c.rise(c.text("Blueprint × SDC", { y: 380, size: 200 }), 300, 50);
    c.rise(c.text("Social Development Centre, Kitchener-Waterloo", { y: 640, size: 48, color: COL.mute }), 1300, 30);
  }),
  V("motion", "Gathering", (c) => {
    const n = 26;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, d = rnd(30, 54), e = c.dot(rnd(100, 1820), rnd(60, 1020), d, PAL[i % 5]);
      c.later(() => c.moveTo(e, 960 + Math.cos(a) * 400, 540 + Math.sin(a) * 400, 3200), 300 + i * 60);
    }
    c.rise(c.text("Blueprint × SDC", { y: 490, size: 110 }), 2600, 30);
  }),
  V("metaphor", "Sunrise", (c) => {
    const sun = c.dot(960, 760, 300, COL.orange, { still: true }), g = c.glow(960, 640, 1100, COL.orange, 0.35);
    g.style.opacity = 0;
    c.later(() => { c.moveTo(sun, 960, 520, 3600); g.style.opacity = 1; }, 400);
    c.box(0, 620, 1920, 460, { background: COL.bg, zIndex: 2 });
    c.line(0, 620, 1920, 620, { color: COL.ink, w: 3, ms: 2200 }).style.zIndex = 3;
    const t = c.text("Blueprint × SDC", { y: 700, size: 130 }); t.style.zIndex = 3; c.rise(t, 2200, 30);
  }),
  V("literal", "Two circles", (c) => {
    const a = c.dot(560, 540, 300, COL.blue, { label: "Blueprint", fs: 44, still: true }), b = c.dot(1360, 540, 300, COL.orange, { label: "SDC", fs: 56, still: true });
    c.pop(a, 200); c.pop(b, 600);
    c.line(715, 540, 1205, 540, { w: 4, color: COL.ink, delay: 1200, ms: 1400 });
  }),
  V("kinetic", "Letter drop", (c) => {
    c.words("Social Development Centre", { y: 330, size: 150, chars: true, stagger: 45, delay: 200 });
    c.rise(c.text("× UW Blueprint", { y: 620, size: 70, color: COL.mute }), 2000, 30);
  }),
]);

slide("Every community runs on people who hold it together. The ones who organize tenants' rights meetings. Who stand up at council.\n\nSomeone has to pay them.", [
  V("motion", "Constellation", (c) => {
    const pts = [];
    for (let i = 0; i < 34; i++) pts.push([rnd(240, 1680), rnd(160, 920)]);
    pts.forEach(([x, y], i) => { const e = c.dot(x, y, rnd(18, 34), PAL[i % 5]); c.pop(e, i * 40); });
    let k = 0;
    pts.forEach((p, i) => pts.forEach((q, j) => { if (j > i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 330) c.line(p[0], p[1], q[0], q[1], { w: 2, color: rgba(COL.ink, 0.2), delay: 900 + (k++) * 25, ms: 1400 }); }));
  }),
  V("metaphor", "Beam", (c) => {
    const xs = [380, 560, 740, 920, 1100, 1280, 1460];
    xs.forEach((x, i) => { const p = c.dot(x, 700, 84, PAL[i % 5], { still: true }); p.style.top = "1160px"; c.later(() => { p.style.top = 700 - 42 + "px"; }, 200 + i * 130); });
    const beam = c.rect(300, 560, 1320, 30, COL.ink, 15); beam.style.transformOrigin = "0 50%"; beam.style.transform = "scaleX(0)"; reflow(beam);
    c.later(() => { beam.style.transform = "scaleX(1)"; beam.style.transitionDuration = "1.6s"; }, 1300);
    const coin = c.dot(960, -200, 190, COL.yellow, { label: "$", fs: 90, still: true });
    c.later(() => { c.moveTo(coin, 960, 460, 1800); }, 3000);
  }),
  V("words", "Someone has to pay", (c) => {
    const w = c.words("Someone has to pay them.", { y: 400, size: 190, stagger: 420 });
    c.later(() => { w.spans[3].style.color = COL.yellow; }, 2200);
  }),
  V("literal", "Three scenes", (c) => {
    const place = (xc, cap, delay, fn) => { fn(xc, delay); c.rise(c.text(cap, { x: xc - 250, w: 500, y: 760, size: 52, color: COL.mute }), delay + 1500, 24); };
    place(420, "organize", 200, (x, d) => { for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; c.pop(c.dot(x + Math.cos(a) * 110, 480 + Math.sin(a) * 110, 56, PAL[i % 5]), d + i * 120); } });
    place(960, "speak up", 900, (x, d) => { c.pop(c.dot(x, 380, 120, COL.orange), d); c.pop(c.rect(x - 90, 440, 180, 90, COL.dim, 12), d + 200); for (let i = 0; i < 5; i++) c.pop(c.dot(x - 200 + i * 100, 640, 44, PAL[(i + 1) % 5]), d + 500 + i * 100); });
    place(1500, "show up", 1600, (x, d) => { c.pop(c.rect(x - 190, 560, 380, 18, COL.ink, 9), d); for (let i = 0; i < 5; i++) c.pop(c.dot(x - 150 + i * 75, 500, 56, PAL[(i + 2) % 5]), d + 200 + i * 120); });
  }),
  V("scale", "Pull back", (c) => {
    const g = c.group();
    c.into(g, () => { layoutGrid(84, { pitch: 120, cols: 12 }).forEach(([x, y], i) => { c.dot(x, y, 46, i === 42 ? COL.orange : PAL[(i * 3) % 5], { still: i !== 42 }); }); });
    g.style.transition = "none"; g.style.transform = "scale(16)"; reflow(g);
    c.later(() => { g.style.transition = "transform 5.5s cubic-bezier(.37,.31,0,1)"; g.style.transform = "scale(1)"; }, 400);
  }),
]);

slide("The Social Development Centre in Kitchener-Waterloo is an advocacy organization. It gets petitions signed. It speaks up on housing.\n\nBut speaking up is harder when the people you're asking to change are also the people who fund you.", [
  V("metaphor", "Voice waves", (c) => {
    c.dot(480, 540, 130, COL.lilac, { still: true });
    const big = c.dot(1440, 540, 340, COL.yellow, { still: true });
    const wave = () => {
      const w = c.box(560, 440, 200, 200, { borderRadius: "50%", border: `7px solid ${COL.lilac}`, borderLeftColor: "transparent", borderTopColor: "transparent", borderBottomColor: "transparent", transform: "scale(0.6)", opacity: 1, transition: "transform 3s linear, left 3s linear, opacity 3s ease-in" });
      reflow(w); w.style.left = "1000px"; w.style.transform = "scale(1.7)"; w.style.opacity = 0;
      c.later(() => w.remove(), 3200);
    };
    wave(); c.every(wave, 900);
    c.every(() => { big.style.transform = "scale(1.05)"; c.later(() => { big.style.transform = "none"; }, 400); }, 1800);
  }),
  V("literal", "Leash", (c) => {
    c.dot(420, 560, 130, COL.lilac, { still: true });
    const b = c.bubble(520, 380, 300, 120, "housing!", { bg: COL.lilac, color: COL.night, size: 48 });
    c.dot(1500, 540, 320, COL.yellow, { label: "funder", fs: 50, still: true });
    c.line(1340, 540, 480, 560, { w: 6, color: COL.yellow, ms: 1400, delay: 500 });
    const tug = () => { b.style.transitionDuration = "1.1s"; b.style.transform = "translateX(360px)"; c.later(() => { b.style.transitionDuration = "0.35s"; b.style.transform = "none"; }, 1300); };
    c.later(tug, 2000); c.every(tug, 3600);
  }),
  V("words", "When they pay you", (c) => {
    const w = c.words("Speaking up is harder when they pay you.", { x: 160, w: 1600, y: 300, size: 150, stagger: 320 });
    c.later(() => { w.spans[6].style.color = COL.yellow; w.spans[7].style.color = COL.yellow; }, 3200);
  }),
  V("data", "Volume bars", (c) => {
    c.dot(300, 540, 130, COL.lilac, { still: true });
    const bars = [];
    for (let i = 0; i < 11; i++) bars.push(c.rect(560 + i * 62, 540 - 20, 30, 40, COL.lilac, 15));
    const coin = c.dot(1560, 540, 90, COL.yellow, { still: true }); c.later(() => { coin.style.width = "520px"; coin.style.height = "520px"; coin.style.left = "1300px"; coin.style.top = "280px"; coin.style.transitionDuration = "9s"; }, 600);
    const t0 = performance.now();
    c.every(() => { const lvl = Math.max(0.1, 1 - (performance.now() - t0) / 9500); bars.forEach((b, i) => { const h = Math.max(14, rnd(0.25, 1) * lvl * 420 * (0.55 + 0.45 * Math.sin((i / 10) * Math.PI))); b.style.transitionDuration = "0.25s"; b.style.height = h + "px"; b.style.top = 540 - h / 2 + "px"; }); }, 250);
  }),
  V("diagram", "Overlap", (c) => {
    const a = c.dot(560, 480, 560, rgba(COL.lilac, 0.78), { still: true }), b = c.dot(1360, 480, 560, rgba(COL.yellow, 0.78), { still: true });
    a.style.mixBlendMode = "screen"; b.style.mixBlendMode = "screen";
    const la = c.text("who you ask", { x: 360, w: 400, y: 800, size: 60, color: COL.mute }), lb = c.text("who pays you", { x: 1160, w: 400, y: 800, size: 60, color: COL.mute });
    c.rise(la, 400, 20); c.rise(lb, 800, 20);
    c.later(() => { c.moveTo(a, 790, 480, 3600); c.moveTo(b, 1130, 480, 3600); la.style.left = "590px"; lb.style.left = "930px"; la.style.transition = lb.style.transition = "left 3.6s var(--slow), opacity 1.4s"; la.style.width = lb.style.width = "400px"; }, 1600);
  }),
]);

slide("Independent money fixes that. So SDC is building something new: a base of people who give directly.\n\nFive dollars. Sixty dollars. A hundred people at a time.", [
  V("literal", "Settling gifts", (c) => {
    c.line(260, 820, 1660, 820, { w: 3, color: COL.ink, ms: 1600 });
    for (let i = 0; i < 12; i++) {
      const big = i % 4 === 1, w = big ? 128 : 84;
      const o = c.dot(rnd(160, 1700), rnd(-60, 520), w, PAL[i % 5]); o.style.opacity = 0; reflow(o); o.style.opacity = 1;
      const slot = 280 + i * (1360 / 11) - w / 2;
      c.later(() => { o.style.left = slot + "px"; o.style.height = w / 2 + "px"; o.style.borderRadius = "999px 999px 0 0"; o.style.top = 820 - w / 2 + "px"; }, 1400 + i * 120);
    }
  }),
  V("metaphor", "Stream splits", (c) => {
    c.dot(960, 130, 200, COL.yellow, { label: "$", fs: 100, still: true });
    const thick = c.line(960, 230, 960, 430, { w: 44, color: COL.yellow, ms: 900, delay: 400 });
    const N = 30;
    for (let i = 0; i < N; i++) {
      const x = 180 + i * (1560 / (N - 1)), y = 880;
      c.line(960, 430, x, y, { w: 3, color: rgba(COL.yellow, 0.55), ms: 1400, delay: 1400 + i * 45 });
      c.pop(c.dot(x, y + 20, 30, PAL[i % 5]), 2200 + i * 45);
    }
    c.later(() => { thick.style.opacity = 0.25; }, 2600);
  }),
  V("numbers", "Five, sixty, a hundred", (c) => {
    const spec = [["$5", 5, (v) => "$" + v, 330], ["$60", 60, (v) => "$" + v, 960], ["100", 100, (v) => String(v), 1590]];
    spec.forEach(([s, to, f, x], i) => { const t = c.text("0", { x: x - 300, w: 600, y: 380, size: 260, color: PAL[i + 1] }); c.count(t, 0, to, f, 1500, 300 + i * 500); });
    c.rise(c.text("people", { x: 1240, w: 560, y: 720, size: 64, color: COL.mute }), 2200, 20);
  }),
  V("motion", "Filling the jar", (c) => {
    c.box(700, 220, 520, 700, { border: `5px solid ${COL.ink}`, borderTop: "none", borderRadius: "0 0 60px 60px" });
    const fill = c.box(705, 915, 510, 0, { background: COL.yellow, borderRadius: "0 0 56px 56px", opacity: 0.9, transition: "height 8s linear, top 8s linear" });
    c.later(() => { fill.style.top = "395px"; fill.style.height = "520px"; }, 300);
    c.every(() => { const x = rnd(740, 1180), e = c.dot(x, 60, 34, PAL[Math.floor(rnd(0, 5))], { still: true }); e.style.transitionDuration = "1.3s"; c.later(() => { c.moveTo(e, x, rnd(560, 880), 1300); c.later(() => { e.style.opacity = 0; }, 1300); }, 40); c.later(() => e.remove(), 3200); }, 170);
  }),
  V("metaphor", "Cell division", (c) => {
    const dots = [c.dot(960, 540, 300, COL.yellow, { still: true })];
    const place = (n) => { const pos = layoutGrid(n, { pitch: Math.min(150, 880 / Math.ceil(Math.sqrt(n * 1.7))), cols: Math.ceil(Math.sqrt(n * 1.7)) }); const d = Math.min(110, 560 / Math.ceil(Math.sqrt(n * 1.7))); dots.forEach((e, i) => { e.style.width = d + "px"; e.style.height = d + "px"; c.moveTo(e, pos[i][0], pos[i][1], 1100); }); };
    [2, 4, 8, 16, 32, 64, 100].forEach((n, k) => c.later(() => {
      const base = dots.length; for (let i = base; i < n; i++) { const src = dots[i % base], e = c.dot(src.offsetLeft + src.offsetWidth / 2, src.offsetTop + src.offsetHeight / 2, src.offsetWidth, PAL[i % 5], { still: true }); dots.push(e); }
      reflow(c.root); place(n);
    }, 700 + k * 1000));
  }),
]);
