/* The answer (paragraphs 10 to 12) */

slide("The answer is a system that remembers for you. Not a bigger spreadsheet.", [
  V("metaphor", "Heartbeat through the grid", (c) => {
    const pos = layoutGrid(100, { cx: 960, cy: 540, pitch: 80, cols: 10 }), dots = pos.map(([x, y], i) => { const e = c.dot(x, y, 42, PAL[(i * 3 + Math.floor(i / 10)) % 5], { still: true }); e.style.opacity = 0.3; return e; });
    const wave = () => dots.forEach((e, i) => c.later(() => { e.style.transitionDuration = "0.5s"; e.style.opacity = 1; e.style.transform = "scale(1.45)"; c.later(() => { e.style.transitionDuration = "1.4s"; e.style.opacity = 0.3; e.style.transform = "none"; }, 450); }, ((i % 10) + Math.floor(i / 10)) * 90));
    c.later(() => { wave(); c.every(wave, 3200); }, 500);
  }),
  V("contrast", "Spreadsheet to orb", (c) => {
    const cells = [];
    for (let r = 0; r < 8; r++) for (let k = 0; k < 14; k++) { const e = c.rect(210 + k * 108, 130 + r * 100, 100, 88, COL.dim, 8); e.style.opacity = 0; cells.push(e); c.later(() => { e.style.opacity = 1; }, 50 + (r + k) * 25); }
    c.later(() => cells.forEach((e, i) => c.later(() => { e.style.transitionDuration = "0.8s"; e.style.opacity = 0; e.style.transform = "scale(0.8)"; }, i * 12)), 2600);
    c.later(() => { const g = c.glow(960, 540, 1100, COL.orange, 0.4); const o = c.dot(960, 540, 300, COL.orange, { still: true }); c.pop(o, 0, 0.2); g.style.opacity = 0; reflow(g); g.style.opacity = 1; }, 3800);
  }),
  V("words", "Not a bigger spreadsheet", (c) => {
    const a = c.words("A system that remembers.", { y: 230, size: 180, stagger: 380 });
    c.later(() => { a.spans[3].style.color = COL.orange; }, 2300);
    c.rise(c.text("Not a bigger spreadsheet.", { y: 600, size: 120, color: COL.mute }), 2800, 30);
    c.line(330, 668, 1590, 668, { w: 8, color: COL.ink, delay: 4000, ms: 1000 });
  }),
  V("diagram", "Radar sweep", (c) => {
    const cx = 960, cy = 540, pts = [];
    c.glow(cx, cy, 700, COL.orange, 0.3); c.dot(cx, cy, 170, COL.orange, { still: true });
    for (let i = 0; i < 64; i++) { const a = rnd(0, 360), r = rnd(240, 470), e = c.dot(cx + Math.cos((a * Math.PI) / 180) * r * 1.5, cy + Math.sin((a * Math.PI) / 180) * r * 0.9, 34, PAL[i % 5], { still: true }); e.style.opacity = 0.18; pts.push({ e, a }); }
    const sweep = c.box(cx, cy - 2, 760, 4, { background: rgba(COL.orange, 0.6), transformOrigin: "0 50%", transition: "none" });
    const t0 = performance.now();
    c.every(() => { const ang = (((performance.now() - t0) / 5000) * 360) % 360; sweep.style.transform = `rotate(${ang}deg)`; pts.forEach((p) => { let d = ang - p.a; if (d < 0) d += 360; if (d < 12) { p.e.style.transitionDuration = "0.1s"; p.e.style.opacity = 1; } else if (d > 40) { p.e.style.transitionDuration = "1.6s"; p.e.style.opacity = 0.18; } }); }, 40);
  }),
  V("ui", "Self-ticking list", (c) => {
    const names = [320, 520, 410, 600, 450, 360, 540];
    names.forEach((w, i) => {
      const y = 170 + i * 115;
      const row = c.box(300, y, 1320, 92, { background: COL.dim, borderRadius: "20px" }); row.style.opacity = 0; reflow(row); c.later(() => { row.style.opacity = 1; }, 100 + i * 120);
      c.dot(360, y + 46, 46, PAL[i % 5], { still: true }); c.rect(440, y + 38, w, 16, rgba(COL.ink, 0.28), 8); c.rect(440 + w + 24, y + 38, 120, 16, rgba(COL.ink, 0.12), 8);
      const box = c.ring(1550, y + 46, 54, COL.mute, 4); const tick = c.text("✓", { x: 1520, w: 60, y: y + 20, size: 52, color: COL.night }); tick.style.opacity = 0;
      c.later(() => { box.style.background = COL.green; box.style.borderColor = COL.green; tick.style.opacity = 1; }, 1600 + i * 650);
    });
  }),
]);

slide("When someone joins, a thank-you goes out automatically, in Suhanya's own words, written once.", [
  V("ui", "Email types itself", (c) => {
    c.rise(c.box(360, 190, 1200, 700, { background: COL.dim, borderRadius: "36px" }), 100, 40);
    c.rise(c.text("To: Stephen", { x: 430, w: 800, y: 240, size: 40, color: COL.mute, align: "left" }), 500, 20);
    const t = c.text("", { x: 430, w: 1060, y: 340, size: 62, align: "left" });
    c.type(t, "Stephen, thank you for joining us. It means a lot to everyone at SDC.\n— Suhanya", 42, 1200);
    c.pop(c.bubble(1230, 780, 260, 80, "Sent ✓", { bg: COL.green, color: COL.night, size: 40 }), 5600);
  }),
  V("metaphor", "Warmth passes along", (c) => {
    const row = [];
    for (let i = 0; i < 12; i++) { const e = c.dot(260 + i * 126, 540, 60, COL.dim, { still: true }); row.push(e); c.pop(e, i * 60); }
    const s = c.dot(60, 540, 100, COL.orange, { still: true }); s.style.transitionTimingFunction = "linear";
    c.later(() => { c.moveTo(s, 1860, 540, 4200); }, 900);
    row.forEach((e, i) => c.later(() => { e.style.transitionDuration = "0.6s"; e.style.setProperty("--bg", COL.yellow); e.style.transform = "scale(1.5)"; c.later(() => { e.style.transform = "none"; }, 500); }, 900 + (i / 12) * 4200 + 350));
  }),
  V("motion", "Paper plane", (c) => {
    c.dot(360, 560, 200, COL.orange, { label: "S", fs: 90, still: true }); const st = c.dot(1560, 560, 200, COL.blue, { still: true });
    const plane = c.box(300, 500, 100, 76, { background: COL.yellow, clipPath: "polygon(0 0, 100% 50%, 0 100%, 25% 50%)" }); plane.style.transitionTimingFunction = "cubic-bezier(.37,.31,0,1)";
    c.later(() => { plane.style.left = "1400px"; plane.style.top = "460px"; plane.style.transitionDuration = "2.4s"; }, 900);
    c.line(420, 540, 1440, 500, { w: 3, color: rgba(COL.yellow, 0.4), delay: 900, ms: 2400 });
    c.later(() => { plane.style.opacity = 0; c.glow(1560, 560, 800, COL.orange, 0.45); const r = c.ring(1560, 560, 200, COL.yellow, 4); r.style.transition = "transform 2.6s ease-out, opacity 2.6s"; reflow(r); r.style.transform = "scale(3.2)"; r.style.opacity = 0; }, 3300);
  }),
  V("kinetic", "Joins. Thanked.", (c) => {
    c.rise(c.text("Joins.", { x: 20, w: 880, y: 400, size: 200, color: COL.ink }), 200, 50);
    c.line(900, 520, 1020, 520, { w: 8, color: COL.mute, delay: 1300, ms: 700 });
    c.rise(c.text("Thanked.", { x: 1020, w: 880, y: 400, size: 200, color: COL.yellow }), 2000, 50);
    c.rise(c.text("that morning", { y: 760, size: 70, color: COL.mute }), 3200, 20);
  }),
  V("diagram", "Written once", (c) => {
    c.dot(300, 540, 190, COL.orange, { label: "S", fs: 84, still: true });
    const letter = c.box(480, 450, 170, 120, { background: COL.ink, borderRadius: "12px" }); c.rise(letter, 600, 20);
    [0, 1, 2].forEach((i) => c.rect(500, 478 + i * 28, 130 - i * 24, 8, COL.night, 4));
    const targets = [[1200, 200], [1500, 340], [1300, 540], [1560, 700], [1180, 840]];
    targets.forEach(([x, y], i) => {
      c.later(() => {
        const m = c.dot(x, y, 100, PAL[(i + 1) % 5], { still: true }); c.pop(m, 0);
        c.later(() => { const l = c.box(480, 450, 170, 120, { background: COL.ink, borderRadius: "12px" }); reflow(l); l.style.left = x - 85 + "px"; l.style.top = y - 60 + "px"; l.style.transitionDuration = "1.4s"; l.style.transform = "scale(0.7)"; c.later(() => { l.style.opacity = 0; c.glow(x, y, 300, COL.orange, 0.5); }, 1300); }, 500);
      }, 1500 + i * 1100);
    });
  }),
]);

slide("Want to send a Christmas message? Write it in November, when you have time.\n\nIt goes out Christmas Eve.", [
  V("literal", "Timeline", (c) => {
    c.line(240, 620, 1680, 620, { w: 5, color: COL.ink, ms: 1600 });
    for (let i = 0; i <= 8; i++) c.rect(240 + i * 180 - 2, 600, 4, 40, rgba(COL.ink, 0.4)).style.opacity = 0.9;
    const n = c.text("Nov", { x: 140, w: 400, y: 680, size: 90, color: COL.mute }), d = c.text("Dec 24", { x: 1380, w: 600, y: 680, size: 90, color: COL.mute });
    const env = c.box(260, 480, 140, 100, { background: COL.ink, borderRadius: "12px", transition: "left 3s cubic-bezier(.37,.31,0,1), opacity 1s, transform 1s" }); c.pop(env, 900);
    c.rect(280, 510, 100, 6, COL.night, 3).style.opacity = 0;
    c.later(() => { env.style.left = "1500px"; }, 2400);
    c.later(() => { d.style.color = COL.yellow; c.glow(1570, 530, 600, COL.yellow, 0.4); }, 5200);
  }),
  V("metaphor", "Seed to bloom", (c) => {
    c.line(300, 780, 1620, 780, { w: 4, color: COL.ink, ms: 1400 });
    const seed = c.dot(960, 100, 44, COL.yellow, { still: true }); c.later(() => c.moveTo(seed, 960, 770, 1500), 700);
    const stem = c.rect(955, 780, 10, 0, COL.green, 5); stem.style.transition = "top 3.4s cubic-bezier(.37,.31,0,1), height 3.4s cubic-bezier(.37,.31,0,1)";
    c.later(() => { seed.style.opacity = 0; stem.style.top = "460px"; stem.style.height = "320px"; }, 2500);
    c.later(() => { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; c.pop(c.dot(960 + Math.cos(a) * 80, 440 + Math.sin(a) * 80, 90, COL.orange, { still: true }), i * 90); } c.pop(c.dot(960, 440, 80, COL.yellow, { still: true }), 600); }, 5700);
  }),
  V("words", "Write it, send it", (c) => {
    c.words("Write it in November.", { y: 230, size: 190, stagger: 380 });
    const w = c.words("Send it Christmas Eve.", { y: 560, size: 190, stagger: 380, delay: 2000 });
    c.later(() => w.spans.slice(2).forEach((s) => { s.style.color = COL.yellow; }), 3600);
  }),
  V("ui", "Calendar flip", (c) => {
    const month = c.text("November", { y: 70, size: 110 });
    const cells = [];
    for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) { const e = c.rect(480 + k * 138, 260 + r * 128, 126, 116, COL.dim, 16); e.style.opacity = 0; c.later(() => { e.style.opacity = 1; }, 100 + (r + k) * 50); cells.push(e); }
    const env = c.box(480 + 2 * 138 + 28, 260 + 128 + 30, 70, 50, { background: COL.ink, borderRadius: "8px" }); c.pop(env, 900);
    c.later(() => { month.style.opacity = 0; c.later(() => { month.textContent = "December"; month.style.opacity = 1; }, 700); }, 2400);
    c.later(() => { const target = cells[3 * 7 + 3]; target.style.setProperty("background", COL.yellow); target.style.opacity = 1; env.style.left = 480 + 3 * 138 + 28 + "px"; env.style.top = 260 + 3 * 128 + 30 + "px"; env.style.transitionDuration = "1.8s"; }, 3800);
    c.later(() => { const t = c.text("24", { x: 480 + 3 * 138, w: 126, y: 260 + 3 * 128 + 8, size: 60, color: COL.night }); t.style.opacity = 0; c.later(() => { t.style.opacity = 1; }, 50); c.glow(480 + 3 * 138 + 63, 260 + 3 * 128 + 58, 500, COL.yellow, 0.4); }, 5800);
  }),
  V("atmosphere", "First snow", (c) => {
    const flake = () => { const x = rnd(0, 1920), e = c.dot(x, -30, rnd(6, 14), COL.ink, { still: true }); e.style.opacity = rnd(0.3, 0.8); e.style.transitionDuration = rnd(7, 12) + "s"; e.style.transitionTimingFunction = "linear"; c.later(() => { c.moveTo(e, x + rnd(-120, 120), 1120, 0); }, 40); c.later(() => e.remove(), 12500); };
    let iv = c.every(flake, 220);
    const env = c.box(850, 470, 220, 150, { background: COL.ink, borderRadius: "16px" }); c.pop(env, 600);
    const g = c.glow(960, 545, 700, COL.yellow, 0.3); g.style.opacity = 0; c.later(() => { g.style.opacity = 1; }, 3000);
    c.later(() => { env.style.transitionDuration = "3.2s"; env.style.left = "1900px"; env.style.top = "-200px"; env.style.transform = "rotate(-18deg) scale(0.5)"; g.style.opacity = 0; }, 5600);
  }),
]);
