/* Stephen and the wall (paragraphs 4 to 9) */

slide("Meet Stephen. He's not an activist. He gave fifty dollars because a friend asked, and it felt good.", [
  V("literal", "A friend asks", (c) => {
    const f = c.dot(500, 540, 170, COL.blue, { still: true }), s = c.dot(1360, 540, 220, COL.orange, { still: true });
    c.pop(f, 200); c.pop(s, 500);
    c.later(() => c.moveTo(f, 930, 540, 2600), 1200);
    const g = c.glow(1360, 540, 700, COL.orange, 0.45); g.style.opacity = 0;
    const gift = c.dot(1150, 380, 120, COL.yellow, { label: "$50", fs: 44, still: true }); gift.style.opacity = 0;
    c.later(() => { gift.style.opacity = 1; c.moveTo(gift, 1250, 540, 1200); }, 3200);
    c.later(() => { gift.style.opacity = 0; gift.style.transform = "scale(0.2)"; g.style.opacity = 1; }, 4500);
  }),
  V("words", "Name and gift", (c) => {
    c.rise(c.text("Stephen", { y: 300, size: 320 }), 200, 50);
    const t = c.text("gave $50 because a friend asked.", { y: 700, size: 72, color: COL.mute }); c.rise(t, 1800, 30);
    const g = c.glow(960, 450, 900, COL.orange, 0.3); g.style.opacity = 0; c.later(() => { g.style.opacity = 1; }, 2600);
  }),
  V("motion", "Landing", (c) => {
    const s = c.dot(960, 540, 260, COL.orange);
    const gift = c.dot(960, -150, 110, COL.yellow, { label: "$50", fs: 40, still: true });
    c.later(() => c.moveTo(gift, 960, 540, 1600), 700);
    c.later(() => {
      gift.style.opacity = 0; gift.style.transform = "scale(0.2)";
      for (let i = 0; i < 3; i++) { const r = c.ring(960, 540, 260, COL.orange, 4); r.style.transition = "transform 3s ease-out, opacity 3s ease-out"; reflow(r); c.later(() => { r.style.transform = "scale(4)"; r.style.opacity = 0; }, 80 + i * 450); }
      c.glow(960, 540, 900, COL.orange, 0.4);
    }, 2400);
  }),
  V("character", "Portrait", (c) => {
    const g = c.glow(960, 520, 1000, COL.orange, 0.25);
    const shoulders = c.box(700, 560, 520, 300, { background: COL.blue, borderRadius: "260px 260px 0 0", clipPath: "inset(0 0 0 0)" });
    const head = c.dot(960, 440, 250, COL.orange, { still: true });
    c.pop(shoulders, 200, 0.6); c.pop(head, 500, 0.6);
    const chip = c.bubble(1180, 240, 250, 120, "$50", { bg: COL.yellow, color: COL.night, size: 64 }); c.pop(chip, 1800);
  }),
  V("ui", "Text message", (c) => {
    c.rise(c.bubble(380, 260, 840, 130, "Want to chip in for SDC? I'm in.", { bg: COL.blue, color: COL.night, size: 46 }), 300, 40);
    c.rise(c.bubble(700, 430, 840, 130, "Sure. Sending now.", { bg: COL.orange, color: COL.night, size: 46 }), 1700, 40);
    c.pop(c.bubble(1010, 640, 440, 120, "$50 sent", { bg: COL.yellow, color: COL.night, size: 52 }), 3100);
  }),
]);

slide("Giving once was the easy part. A month later, he feels no connection to SDC, and he doesn't give again.", [
  V("metaphor", "The glow goes out", (c) => {
    const g = c.glow(960, 540, 1000, COL.orange, 0.5);
    const s = c.dot(960, 540, 300, COL.orange);
    c.later(() => { s.style.setProperty("--bg", COL.quiet); g.style.transitionDuration = "5s"; g.style.opacity = 0; s.style.transitionDuration = "5s"; s.style.top = "560px"; }, 1800);
  }),
  V("metaphor", "Flatline", (c) => {
    const w = 1500, h = 300;
    const box = c.box(210, 390, w, h, {});
    const beat = (x, a) => `L${x},150 L${x + 25},${150 - a} L${x + 55},${150 + a * 1.3} L${x + 85},${150 - a * 0.5} L${x + 110},150`;
    const d = `M0,150 ${beat(150, 110)} L420,150 ${beat(500, 80)} L760,150 ${beat(840, 45)} L1100,150 ${beat(1180, 15)} L${w},150`;
    box.innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" stroke="${COL.orange}" stroke-width="8"/></svg>`;
    const p = box.querySelector("path"), L = p.getTotalLength();
    p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.style.transition = "stroke-dashoffset 6s linear, stroke 4s linear"; reflow(p);
    c.later(() => { p.style.strokeDashoffset = 0; }, 300); c.later(() => { p.style.stroke = COL.quiet; }, 3500);
  }),
  V("ui", "Day thirty", (c) => {
    const t = c.text("Day 1", { y: 250, size: 330 }); c.count(t, 1, 30, (v) => "Day " + v, 4800, 400);
    c.rise(c.text("No new messages.", { y: 700, size: 76, color: COL.mute }), 1800, 30);
  }),
  V("motion", "Drifting away", (c) => {
    const cluster = layoutGrid(12, { cx: 1300, cy: 540, pitch: 118, cols: 4 });
    cluster.forEach(([x, y], i) => c.pop(c.dot(x, y, 64, PAL[(i + 1) % 5]), i * 90));
    const s = c.dot(960, 540, 130, COL.orange); c.pop(s, 200);
    c.later(() => c.moveTo(s, 560, 560, 3500), 1400);
    c.later(() => { s.style.opacity = 0.15; s.style.filter = "grayscale(1)"; }, 3600);
  }),
  V("words", "Easy part", (c) => {
    const w = c.words("Giving once was the easy part.", { y: 300, size: 170, stagger: 360 });
    c.later(() => { w.spans[4].style.color = COL.lilac; }, 2400);
    c.rise(c.text("A month later, he's gone quiet.", { y: 700, size: 80, color: COL.mute }), 3400, 30);
  }),
]);

slide("Keeping someone giving and involved has a name in the nonprofit world: donor stewardship.\n\nThank them. Remember them. Invite them in.", [
  V("words", "Three verbs", (c) => {
    ["Thank.", "Remember.", "Invite."].forEach((s, i) => c.rise(c.text(s, { y: 140 + i * 280, size: 250, color: [COL.yellow, COL.blue, COL.orange][i] }), 300 + i * 900, 50));
  }),
  V("words", "Definition", (c) => {
    c.rise(c.text("stewardship", { y: 270, size: 260 }), 200, 50);
    c.rise(c.text("keeping people close, year after year", { y: 640, size: 76, color: COL.mute }), 1600, 30);
  }),
  V("literal", "Three gestures", (c) => {
    const cols = [480, 960, 1440], cap = ["thank", "remember", "invite"];
    cols.forEach((x, i) => c.rise(c.text(cap[i], { x: x - 250, w: 500, y: 770, size: 64, color: COL.mute }), 400 + i * 1600, 24));
    /* thank: a gift passes between two dots */
    c.pop(c.dot(380, 480, 100, COL.orange, { still: true }), 300); c.pop(c.dot(580, 480, 100, COL.blue, { still: true }), 300);
    const gift = c.dot(380, 400, 44, COL.yellow, { still: true }); c.later(() => c.moveTo(gift, 580, 400, 1400), 900);
    /* remember: a ring settles around a dot */
    c.later(() => { const d = c.dot(960, 480, 120, COL.orange, { still: true }); c.pop(d, 0); const r = c.ring(960, 480, 300, COL.yellow, 5); r.style.opacity = 0; r.style.transform = "scale(1.6)"; reflow(r); c.later(() => { r.style.opacity = 1; r.style.transform = "none"; }, 400); }, 1600);
    /* invite: a dot walks through a gap */
    c.later(() => { c.rect(1425, 330, 30, 120, COL.ink, 6); c.rect(1425, 540, 30, 120, COL.ink, 6); const d = c.dot(1300, 495, 90, COL.orange, { still: true }); c.pop(d, 0); c.later(() => c.moveTo(d, 1600, 495, 2000), 900); }, 3200);
  }),
  V("metaphor", "Tending a fire", (c) => {
    const g = c.glow(960, 560, 700, COL.orange, 0.25);
    c.dot(960, 560, 210, COL.orange, { still: true });
    [0, 1, 2].forEach((i) => c.later(() => {
      const side = [[300, 300], [1620, 340], [960, 40]][i], e = c.dot(side[0], side[1], 54, COL.yellow, { still: true });
      c.moveTo(e, 960, 560, 1500);
      c.later(() => { e.style.opacity = 0; g.style.width = 700 + (i + 1) * 380 + "px"; g.style.height = 700 + (i + 1) * 380 + "px"; g.style.left = 960 - (700 + (i + 1) * 380) / 2 + "px"; g.style.top = 560 - (700 + (i + 1) * 380) / 2 + "px"; g.style.opacity = 1; }, 1450);
    }, 600 + i * 1900));
  }),
  V("diagram", "Drawing closer", (c) => {
    const a = c.dot(360, 540, 190, COL.orange, { still: true }), b = c.dot(1560, 540, 190, COL.blue, { still: true });
    const stages = [["thank", 1], ["remember", 2], ["invite", 3]];
    stages.forEach(([w, n], i) => {
      c.later(() => {
        c.moveTo(a, 360 + n * 130, 540, 1800); c.moveTo(b, 1560 - n * 130, 540, 1800);
        c.line(360 + n * 130 + 95, 540, 1560 - n * 130 - 95, 540, { w: 4 + n * 4, color: rgba(COL.yellow, 0.6), ms: 1400 });
        c.rise(c.text(w, { x: 660, w: 600, y: 700 + i * 90, size: 56, color: COL.mute }), 900, 20);
      }, 400 + i * 1900);
    });
  }),
]);

slide("Now multiply Stephen by a hundred. A hundred thank-yous. A hundred holiday cards, each at the right time. Whose email do you customize?\n\nAnd when you have ten minutes to make one call, who do you call?", [
  V("literal", "Hundred and a timer", (c) => {
    const dots = layoutGrid(100, { cx: 960, cy: 400, pitch: 74, cols: 10 }).map(([x, y], i) => { const e = c.dot(x, y, 38, PAL[(i * 3 + Math.floor(i / 10)) % 5]); e.style.opacity = 0; reflow(e); c.later(() => { e.style.opacity = 1; }, 100 + i * 16); return e; });
    const t = c.text("10:00", { y: 800, size: 190 }); let s = 600;
    c.later(() => c.every(() => { s--; t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }, 1000), 1800);
    const order = dots.map((_, i) => i).sort(() => Math.random() - 0.5); let n = 0;
    c.later(() => c.every(() => { const d = dots[order[n++]]; if (d) { d.style.opacity = 0.14; d.style.filter = "grayscale(1)"; } }, 480), 2400);
  }),
  V("metaphor", "One thread", (c) => {
    const pts = layoutGrid(60, { cx: 960, cy: 330, pitch: 100, cols: 12 }).map(([x, y], i) => c.dot(x, y, 34, PAL[i % 5]));
    const s = c.dot(960, 900, 120, COL.orange, { still: true });
    let prev;
    const reach = () => { const t = pick(pts), x = t.offsetLeft + 17, y = t.offsetTop + 17; if (prev) prev.style.opacity = 0; prev = c.line(960, 840, x, y, { w: 5, color: COL.yellow, ms: 700 }); t.style.transform = "scale(1.6)"; c.later(() => { t.style.transform = "none"; }, 900); };
    c.later(() => c.every(reach, 1100), 900);
  }),
  V("kinetic", "Times a hundred", (c) => {
    c.rise(c.text("× 100", { y: 130, size: 440, color: COL.yellow }), 200, 60);
    const items = ["thank-yous", "holiday cards", "emails to personalize", "calls to make"], t = c.text("", { y: 760, size: 100, color: COL.ink });
    let i = 0; const next = () => { t.style.transition = "none"; t.style.opacity = 0; t.style.transform = "translateY(30px)"; reflow(t); t.textContent = items[i % 4]; t.style.transition = ""; t.style.opacity = 1; t.style.transform = "none"; i++; };
    c.later(() => { next(); c.every(next, 1200); }, 1200);
  }),
  V("ui", "Unread pile", (c) => {
    const count = c.text("0", { x: 1250, w: 500, y: 90, size: 200, color: COL.orange, align: "left" });
    c.text("unread", { x: 1250, w: 500, y: 300, size: 64, color: COL.mute, align: "left" });
    for (let i = 0; i < 12; i++) {
      const row = c.box(180, 90 + i * 78, 960, 64, { background: COL.dim, borderRadius: "14px" }); row.style.opacity = 0; row.style.transform = "translateY(-40px)"; reflow(row);
      c.later(() => { row.style.opacity = 1; row.style.transform = "none"; row.style.transitionDuration = "0.6s"; }, 300 + i * 260);
      c.dot(220, 122 + i * 78, 22, PAL[i % 5]); c.rect(270, 112 + i * 78, 300 + (i * 53) % 400, 14, rgba(COL.ink, 0.25), 7);
    }
    c.count(count, 0, 100, String, 3200, 300);
  }),
  V("scene", "Dealt cards and a clock", (c) => {
    for (let i = 0; i < 70; i++) {
      const x = rnd(160, 820), y = rnd(380, 880), card = c.box(x, -160, 74, 104, { background: PAL[i % 5], borderRadius: "10px", transform: `rotate(${rnd(-35, 35)}deg)`, transition: "top 0.9s cubic-bezier(.37,.31,0,1), opacity .4s" });
      c.later(() => { card.style.top = y + "px"; }, 200 + i * 55);
    }
    const clock = c.ring(1440, 480, 420, COL.ink, 6); c.pop(clock, 800);
    const hand = c.box(1440 - 4, 480 - 170, 8, 170, { background: COL.orange, borderRadius: "4px", transformOrigin: "50% 100%", transition: "transform 10s linear" });
    c.later(() => { hand.style.transform = "rotate(360deg)"; }, 1400);
    c.rise(c.text("10 min", { x: 1240, w: 400, y: 740, size: 80, color: COL.mute }), 2200, 20);
  }),
]);

slide("Suhanya, SDC's communications lead, told us: \"We don't have any dedicated resources around stewardship. We just identified that as a massive gap.\"\n\nOne fundraiser wrote: \"Being a professional fundraiser is taxing, and sometimes we forget things.\"", [
  V("words", "One at a time", (c) => {
    const Q1 = "We don't have any dedicated resources around stewardship. We just identified that as a massive gap.";
    const a = c.words(Q1, { x: 210, w: 1500, y: 300, size: 92, stagger: 120 });
    const au = c.text("Suhanya, SDC", { y: 820, size: 46, color: COL.mute }); c.rise(au, 3000, 20);
    c.later(() => { a.el.style.opacity = 0; au.style.opacity = 0; }, 8200);
    c.later(() => { const b = c.words("Being a professional fundraiser is taxing, and sometimes we forget things.", { x: 210, w: 1500, y: 300, size: 92, stagger: 120, delay: 0 }); c.rise(c.text("A fundraiser", { y: 820, size: 46, color: COL.mute }), 2400, 20); }, 9400);
  }),
  V("typing", "Typed out", (c) => {
    const t = c.text("", { x: 210, w: 1500, y: 300, size: 92, align: "left" });
    c.type(t, "We don't have any dedicated resources around stewardship. We just identified that as a massive gap.", 38, 400);
    const av = c.dot(260, 880, 90, COL.orange, { label: "S", fs: 40, still: true }); c.pop(av, 4600);
    c.rise(c.text("Suhanya, SDC", { x: 330, w: 800, y: 850, size: 46, color: COL.mute, align: "left" }), 4800, 20);
  }),
  V("layout", "Two voices", (c) => {
    c.pop(c.dot(300, 220, 100, COL.orange, { label: "S", fs: 44, still: true }), 200);
    c.rise(c.text("We don't have any dedicated resources around stewardship. We just identified that as a massive gap.", { x: 110, w: 800, y: 330, size: 58, align: "left" }), 700, 30);
    c.rise(c.text("Suhanya, SDC", { x: 110, w: 800, y: 800, size: 40, color: COL.mute, align: "left" }), 1400, 20);
    c.pop(c.dot(1100, 220, 100, COL.blue, { label: "F", fs: 44, still: true }), 2200);
    c.rise(c.text("Being a professional fundraiser is taxing, and sometimes we forget things.", { x: 1010, w: 800, y: 330, size: 58, align: "left" }), 2700, 30);
    c.rise(c.text("A fundraiser", { x: 1010, w: 800, y: 800, size: 40, color: COL.mute, align: "left" }), 3400, 20);
  }),
  V("emphasis", "Highlight", (c) => {
    const w = c.words("We don't have any dedicated resources around stewardship. We just identified that as a massive gap.", { x: 210, w: 1500, y: 280, size: 96, stagger: 90 });
    c.later(() => w.spans.forEach((s, i) => { s.style.color = i >= w.spans.length - 2 ? COL.yellow : COL.quiet; }), 3600);
    c.later(() => { w.el.style.opacity = 0; }, 7000);
    c.later(() => { const b = c.words("Being a professional fundraiser is taxing, and sometimes we forget things.", { x: 210, w: 1500, y: 280, size: 96, stagger: 90, delay: 0 }); c.later(() => b.spans.forEach((s, i) => { s.style.color = i >= b.spans.length - 2 ? COL.yellow : COL.quiet; }), 3000); }, 8200);
  }),
  V("ui", "Overheard", (c) => {
    c.pop(c.dot(240, 280, 110, COL.orange, { label: "S", fs: 48, still: true }), 200);
    c.rise(c.bubble(340, 190, 1180, 250, "We don't have any dedicated resources around stewardship. We just identified that as a massive gap.", { size: 48, bg: COL.dim }), 600, 30);
    c.pop(c.dot(1680, 700, 110, COL.blue, { label: "F", fs: 48, still: true }), 2800);
    c.rise(c.bubble(400, 580, 1180, 200, "Being a professional fundraiser is taxing, and sometimes we forget things.", { size: 48, bg: COL.dim }), 3200, 30);
  }),
]);

slide("And Stephen wants to be part of this community. He just doesn't feel connected, so he stops.", [
  V("metaphor", "Edge of the ring", (c) => {
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; c.pop(c.dot(760 + Math.cos(a) * 250, 540 + Math.sin(a) * 250, 70, PAL[(i + 1) % 5]), i * 90); }
    const s = c.dot(1500, 540, 120, COL.orange); c.pop(s, 300);
    c.later(() => c.moveTo(s, 1150, 540, 2600), 1200);
    c.later(() => { c.moveTo(s, 1750, 620, 3600); s.style.opacity = 0.1; }, 4800);
  }),
  V("literal", "Outside the conversation", (c) => {
    layoutGrid(7, { cx: 700, cy: 540, pitch: 150, cols: 3 }).forEach(([x, y], i) => { c.pop(c.dot(x, y, 90, PAL[(i + 1) % 5]), i * 150); c.later(() => { const b = c.rect(x + 40, y - 80, 70 + (i % 3) * 24, 34, COL.dim, 17); c.pop(b, 0); }, 1200 + i * 450); });
    const s = c.dot(1500, 540, 130, COL.orange); c.pop(s, 400);
    c.line(1200, 540, 1400, 540, { w: 3, color: rgba(COL.ink, 0.25), delay: 1000 });
  }),
  V("words", "He just doesn't feel it", (c) => {
    c.words("He wants to belong.", { y: 260, size: 190, stagger: 380 });
    const w = c.words("He just doesn't feel it.", { y: 560, size: 190, stagger: 380, delay: 2000 });
    c.later(() => { w.el.style.color = COL.mute; }, 3800);
  }),
  V("metaphor", "The thread snaps", (c) => {
    const s = c.dot(520, 540, 130, COL.orange), cl = [];
    layoutGrid(6, { cx: 1400, cy: 540, pitch: 130, cols: 3 }).forEach(([x, y], i) => c.pop(c.dot(x, y, 76, PAL[(i + 1) % 5]), i * 100));
    const l = c.line(590, 540, 1300, 540, { w: 4, color: COL.ink, ms: 1400, delay: 700 });
    c.later(() => { l.style.opacity = 0; const L = 355; [0, 1].forEach((k) => { const h = c.rect(k ? 945 : 590, 538, L, 4, COL.ink, 2); h.style.transformOrigin = k ? "0 50%" : "100% 50%"; reflow(h); h.style.transition = "transform 1.6s ease-in, opacity 1.6s ease-in"; h.style.transform = `rotate(${k ? 40 : -40}deg) translateY(${k ? 120 : -120}px)`; h.style.opacity = 0; }); c.moveTo(s, 330, 600, 3000); }, 3000);
  }),
  V("scene", "The doorway", (c) => {
    c.glow(1100, 560, 900, COL.orange, 0.3);
    c.box(920, 220, 360, 560, { border: `6px solid ${COL.ink}`, borderBottom: "none", borderRadius: "180px 180px 0 0", background: rgba(COL.orange, 0.25) });
    c.rect(900, 780, 400, 6, COL.ink, 3);
    const s = c.dot(460, 700, 130, COL.orange); c.pop(s, 300);
    c.later(() => c.moveTo(s, 760, 700, 2600), 1200);
    c.later(() => { c.moveTo(s, 300, 760, 3600); s.style.opacity = 0.1; }, 4600);
  }),
]);
