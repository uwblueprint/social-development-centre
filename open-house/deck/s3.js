/* The answer, continued (paragraphs 13 and 14) */

slide("For your biggest supporters, the email waits for you first, so you can add the one line only a person could write.", [
  V("literal", "A line only you could write", (c) => {
    c.rise(c.box(360, 180, 1200, 720, { background: COL.dim, borderRadius: "36px" }), 100, 40);
    [0, 1, 2].forEach((i) => c.rect(440, 270 + i * 54, 900 - i * 160, 18, rgba(COL.ink, 0.25), 9));
    const hl = c.rect(430, 520, 1060, 110, rgba(COL.yellow, 0.22), 18); hl.style.opacity = 0; c.later(() => { hl.style.opacity = 1; }, 900);
    const t = c.text("", { x: 460, w: 1000, y: 540, size: 52, align: "left", color: COL.yellow }); c.type(t, "Thinking of you and the kids this winter.", 55, 1600);
    const chip = c.bubble(1230, 220, 280, 76, "Waiting for you", { bg: COL.yellow, color: COL.night, size: 30 }); c.pop(chip, 700);
    c.later(() => { chip.firstChild.textContent = "Approved ✓"; chip.style.setProperty("background", COL.green); }, 5200);
  }),
  V("metaphor", "The gate", (c) => {
    c.box(790, 280, 340, 500, { border: `6px solid ${COL.ink}`, borderBottom: "none", borderRadius: "170px 170px 0 0" }); c.rect(760, 780, 400, 6, COL.ink, 3);
    const stream = () => { const e = c.dot(-40, 700, 46, COL.mute, { still: true }); e.style.transitionTimingFunction = "linear"; e.style.transitionDuration = "7s"; c.later(() => { c.moveTo(e, 2000, 700, 7000); }, 40); c.later(() => e.remove(), 7300); };
    c.every(stream, 900);
    c.later(() => {
      const s = c.dot(-40, 700, 70, COL.orange, { still: true }); s.style.transitionTimingFunction = "linear"; s.style.transitionDuration = "2.6s";
      c.later(() => { c.moveTo(s, 960, 700, 2600); }, 40);
      c.later(() => { const r = c.ring(960, 700, 120, COL.yellow, 5); r.style.opacity = 0; r.style.transform = "scale(0.5)"; reflow(r); r.style.opacity = 1; r.style.transform = "none"; c.glow(960, 700, 500, COL.yellow, 0.4); c.later(() => { c.moveTo(s, 2000, 700, 4000); r.style.transitionDuration = "4s"; c.moveTo(r, 2000, 700, 4000); }, 2400); }, 2700);
    }, 1800);
  }),
  V("words", "Only a person", (c) => {
    c.rise(c.text("Only a person could write this:", { y: 200, size: 96, color: COL.mute }), 200, 30);
    const t = c.text("", { x: 160, w: 1600, y: 420, size: 150, color: COL.yellow }); c.type(t, "How's your daughter settling into kindergarten?", 55, 1500);
  }),
  V("ui", "The outbox", (c) => {
    c.rise(c.text("Waiting for you", { x: 360, w: 800, y: 110, size: 64, align: "left", color: COL.mute }), 100, 20);
    const rows = [];
    for (let i = 0; i < 4; i++) {
      const y = 250 + i * 130, special = i === 3;
      const row = c.box(360, y, 1200, 110, { background: COL.dim, borderRadius: "22px", transition: "height 1.2s var(--slow), opacity 1s, top 1.2s var(--slow)" }); row.style.opacity = 0; reflow(row); c.later(() => { row.style.opacity = 1; }, 200 + i * 200); rows.push(row);
      c.dot(430, y + 55, 50, PAL[i % 5], { still: true }); c.rect(510, y + 46, 320 + i * 40, 18, rgba(COL.ink, 0.28), 9);
      const chip = c.bubble(1290, y + 22, 220, 66, special ? "Review" : "Scheduled", { bg: special ? COL.yellow : "transparent", color: special ? COL.night : COL.mute, size: 30 }); chip.style.opacity = 0; c.later(() => { chip.style.opacity = 1; }, 700 + i * 200);
      if (special) c.later(() => { row.style.height = "270px"; const t = c.text("", { x: 520, w: 950, y: y + 130, size: 46, align: "left", color: COL.yellow }); c.type(t, "Thinking of you and the kids this winter.", 50, 500); }, 2600);
    }
  }),
  V("process", "Conveyor", (c) => {
    c.line(0, 700, 1920, 700, { w: 4, color: rgba(COL.ink, 0.35), ms: 1200 });
    const env = (color, special) => {
      const e = c.box(2000, 560, 140, 100, { background: color, borderRadius: "12px", transition: "left 8s linear, top 0.9s var(--slow), opacity 1s" });
      c.later(() => { e.style.left = "-260px"; }, 40); c.later(() => e.remove(), 8400); return e;
    };
    c.every(() => env(COL.mute), 900);
    c.later(() => {
      const s = c.box(2000, 560, 140, 100, { background: COL.orange, borderRadius: "12px", transition: "left 3.4s linear, top 0.9s var(--slow)" });
      c.later(() => { s.style.left = "890px"; }, 40);
      c.later(() => { s.style.top = "340px"; c.glow(960, 390, 600, COL.yellow, 0.45); const m = c.dot(960, 390, 34, COL.yellow, { still: true }); c.pop(m, 400); c.later(() => { m.style.opacity = 0; }, 2600); }, 3600);
      c.later(() => { s.style.top = "560px"; }, 5400);
      c.later(() => { s.style.transitionDuration = "6s"; s.style.left = "-260px"; }, 6400);
    }, 2000);
  }),
]);

slide("And every person has a page: when they joined, every message they've received, and your notes. What they told you on the phone, what they care about.\n\nSo two months later, you remember to ask about Stephen's daughter.", [
  V("words", "The note", (c) => {
    const t = c.text("", { x: 160, w: 1600, y: 300, size: 150 }); c.type(t, "Daughter starts kindergarten in September.", 55, 500);
    c.rise(c.text("note on Stephen", { y: 800, size: 60, color: COL.mute }), 3800, 20);
  }),
  V("ui", "Profile card", (c) => {
    c.rise(c.box(240, 120, 1440, 840, { background: COL.dim, borderRadius: "40px" }), 100, 40);
    c.pop(c.dot(400, 270, 150, COL.orange, { still: true }), 500);
    c.rise(c.text("Stephen", { x: 520, w: 800, y: 215, size: 110, align: "left" }), 700, 30);
    c.line(380, 520, 1540, 520, { w: 4, color: rgba(COL.ink, 0.3), delay: 1400, ms: 1500 });
    ["joined", "thank-you", "check-in", "call"].forEach((w, i) => { const x = 420 + i * 360; c.pop(c.dot(x, 520, 44, PAL[(i + 1) % 5], { still: true }), 1800 + i * 450); c.rise(c.text(w, { x: x - 150, w: 300, y: 570, size: 40, color: COL.mute }), 1900 + i * 450, 16); });
    const n = c.bubble(380, 720, 1160, 150, "", { bg: rgba(COL.yellow, 0.2), size: 50 }); c.pop(n, 3800); const nt = n.firstChild; nt.style.color = COL.yellow; c.type(nt, "Daughter starts kindergarten in September.", 40, 4200, false);
  }),
  V("metaphor", "Tree rings", (c) => {
    c.glow(960, 540, 900, COL.orange, 0.22); c.dot(960, 540, 120, COL.orange, { still: true });
    [220, 340, 460, 580].forEach((d, i) => { const r = c.ring(960, 540, d, PAL[(i + 1) % 5], 5); r.style.opacity = 0; r.style.transform = "scale(0.4)"; reflow(r); c.later(() => { r.style.opacity = 1; r.style.transform = "none"; }, 700 + i * 1100); c.later(() => { const a = rnd(0, Math.PI * 2); c.pop(c.dot(960 + (Math.cos(a) * d) / 2, 540 + (Math.sin(a) * d) / 2, 30, PAL[(i + 1) % 5], { still: true }), 0); }, 1400 + i * 1100); });
  }),
  V("motion", "Comet tail", (c) => {
    const s = c.dot(160, 540, 120, COL.orange, { still: true }); s.style.transitionTimingFunction = "linear";
    c.later(() => { s.style.transitionDuration = "9s"; c.moveTo(s, 1700, 540, 9000); }, 600);
    const t0 = performance.now(); let n = 0;
    c.every(() => { const k = (performance.now() - t0 - 600) / 9000; if (k < 0 || k > 1) return; const x = 160 + 1540 * k, mark = n++ === 15, d = mark ? 44 : 22, e = c.dot(x - 60, 540 + rnd(-30, 30), d, mark ? COL.yellow : COL.blue, { still: true }); e.style.opacity = mark ? 1 : 0.55; if (mark) { const r = c.ring(x - 60, 540, 120, COL.yellow, 4); r.style.opacity = 0; reflow(r); r.style.opacity = 1; } }, 360);
  }),
  V("scene", "Sticky note", (c) => {
    const note = c.box(680, 220, 560, 560, { background: COL.yellow, borderRadius: "10px", transform: "rotate(-14deg) translateY(-700px)", transition: "transform 1.4s cubic-bezier(.175,.885,.32,1.1), opacity 1s" });
    const t = c.text("Ask about her daughter", { x: 40, w: 480, y: 180, size: 84, align: "left", color: COL.night }); t.style.transition = "none"; note.appendChild(t); t.style.position = "absolute"; t.style.left = "40px"; t.style.top = "150px"; t.style.width = "480px";
    c.later(() => { note.style.transform = "rotate(-4deg)"; }, 500);
    c.later(() => { c.pop(c.dot(960, 215, 54, COL.orange, { still: true }), 0); }, 1700);
    c.later(() => { c.glow(960, 500, 1000, COL.yellow, 0.25); }, 2300);
  }),
]);
