/* The name and the close (paragraphs 15 to 17) */

slide("Here's what we call it.\n\nA potluck works because everyone brings something small, and the table is full. That's SDC. Five dollars here, sixty there, a hundred people at a time.\n\nBut every potluck needs a host. Someone who remembers who came. Who thanks everyone. Who makes sure they get invited back.\n\nWe built the host. We call it Potluck.", [
  V("literal", "The host lights each dish", (c) => {
    c.line(220, 800, 1700, 800, { w: 4, color: COL.ink, ms: 1400 });
    const dishes = [];
    for (let i = 0; i < 9; i++) { const w = i % 3 === 1 ? 140 : 100, x = 330 + i * 157; const d = c.dot(x, 800 - w / 4, w, PAL[i % 5], { still: true }); d.style.height = w / 2 + "px"; d.style.borderRadius = "999px 999px 0 0"; d.style.top = 800 - w / 2 + "px"; d.style.opacity = 0.3; c.pop(d, 500 + i * 100); c.later(() => { d.style.opacity = 0.3; }, 1400 + i * 100); dishes.push([d, x]); }
    const host = c.dot(330, 600, 150, COL.orange, { still: true }); c.pop(host, 1800);
    dishes.forEach(([d, x], i) => c.later(() => { c.moveTo(host, x, 600, 600); d.style.transitionDuration = "0.8s"; d.style.opacity = 1; d.style.transform = "scale(1.18)"; c.glow(x, 760, 280, PAL[i % 5], 0.45); }, 2500 + i * 650));
    const name = c.text("Potluck", { y: 150, size: 300 }); c.rise(name, 8600, 40);
  }),
  V("kinetic", "The o is a dish", (c) => {
    const t = c.text("", { y: 300, size: 460 }); t.innerHTML = 'P<span style="display:inline-block;width:.6em;height:.6em;margin:0 .05em;border-radius:50%;background:' + COL.orange + ';vertical-align:-0.02em;animation:drift 5s ease-in-out infinite alternate"></span>tluck'; c.rise(t, 300, 60);
    [[160, 140, 120], [1640, 180, 90], [300, 800, 70], [1520, 820, 130], [840, 100, 60], [1130, 900, 80]].forEach(([x, y, w], i) => { const o = c.dot(x, y, w, PAL[(i + 2) % 5]); o.style.height = w / 2 + "px"; o.style.borderRadius = "999px 999px 0 0"; c.pop(o, 1200 + i * 150, 0.4); });
  }),
  V("metaphor", "Dishes rise like a sun", (c) => {
    c.line(200, 760, 1720, 760, { w: 4, color: COL.ink, ms: 1400 });
    const N = 13;
    for (let i = 0; i < N; i++) { const a = Math.PI + (i / (N - 1)) * Math.PI, x = 960 + Math.cos(a) * 560, y = 760 + Math.sin(a) * 440, w = 110; const d = c.dot(x, 900, w, PAL[i % 5], { still: true }); d.style.height = w / 2 + "px"; d.style.borderRadius = "999px 999px 0 0"; d.style.transform = "rotate(" + ((a * 180) / Math.PI + 90) + "deg)"; d.style.opacity = 0; c.later(() => { d.style.opacity = 1; d.style.left = x - w / 2 + "px"; d.style.top = y - w / 4 + "px"; d.style.transitionDuration = "2.6s"; }, 700 + i * 220); }
    const name = c.text("Potluck", { y: 800, size: 200 }); name.style.zIndex = 4; c.rise(name, 4200, 40);
  }),
  V("words", "Three lines", (c) => {
    c.rise(c.text("Everyone brings something small.", { y: 150, size: 110, color: COL.mute }), 200, 30);
    c.rise(c.text("Someone has to host.", { y: 340, size: 150 }), 1800, 40);
    c.rise(c.text("Potluck.", { y: 560, size: 340, color: COL.orange }), 3800, 50);
  }),
  V("scene", "A long table fills up", (c) => {
    c.rect(220, 800, 1480, 40, COL.dim, 14);
    for (let i = 0; i < 8; i++) {
      const left = i % 2 === 0, x = 340 + i * 175, p = c.dot(left ? -80 : 2000, 620, 120, PAL[i % 5], { still: true }); p.style.transitionDuration = "2s";
      c.later(() => { c.moveTo(p, x, 620, 2000); }, 300 + i * 500);
      c.later(() => { const d = c.dot(x, 780, 90, PAL[(i + 2) % 5], { still: true }); d.style.height = "45px"; d.style.borderRadius = "999px 999px 0 0"; d.style.top = "755px"; c.pop(d, 0, 0.3); }, 2300 + i * 500);
    }
    const host = c.dot(960, 330, 170, COL.orange, { still: true }); c.pop(host, 5800);
    c.glow(960, 330, 800, COL.orange, 0.35).style.opacity = 0.9;
    const name = c.text("Potluck", { y: 80, size: 240 }); c.rise(name, 6600, 40);
  }),
]);

slide("We don't write the emails. Suhanya does. Potluck makes sure the right one reaches the right person at the right time, so she can spend her hours on the part only a person can do: picking up the phone.", [
  V("words", "Writes. Remembers.", (c) => {
    c.rise(c.text("Suhanya writes.", { y: 260, size: 190 }), 200, 50);
    c.rise(c.text("Potluck remembers.", { y: 560, size: 190, color: COL.blue }), 1800, 50);
  }),
  V("literal", "The phone call", (c) => {
    c.dot(460, 540, 220, COL.orange, { label: "S", fs: 96, still: true }); c.dot(1460, 540, 220, COL.blue, { still: true });
    const ph = c.box(640, 470, 76, 150, { background: COL.lilac, borderRadius: "20px" }); c.pop(ph, 400);
    c.glow(960, 540, 1200, COL.orange, 0.2);
    c.later(() => { const wave = () => { const r = c.ring(960, 540, 160, COL.yellow, 4); r.style.transition = "transform 2.6s ease-out, opacity 2.6s ease-out"; reflow(r); r.style.transform = "scale(3.4)"; r.style.opacity = 0; c.later(() => r.remove(), 2800); }; wave(); c.every(wave, 900); }, 1200);
  }),
  V("metaphor", "Absorbing the chores", (c) => {
    c.dot(1500, 540, 240, COL.orange, { still: true }); c.dot(1500, 540, 100, COL.blue, { still: true });
    const orb = c.dot(560, 540, 260, COL.blue, { label: "P", fs: 110, lc: COL.night, still: true });
    for (let i = 0; i < 28; i++) { const e = c.dot(rnd(80, 1000), rnd(80, 1000), rnd(20, 40), COL.mute); e.style.opacity = 0.7; c.later(() => { c.moveTo(e, 560, 540, 1800); c.later(() => { e.style.opacity = 0; }, 1700); }, 1200 + i * 150); }
    c.later(() => { c.line(1330, 540, 1620, 540, { w: 8, color: COL.yellow, ms: 1200 }); c.glow(1500, 540, 700, COL.orange, 0.4); }, 5600);
  }),
  V("ui", "A freed-up day", (c) => {
    const items = ["thank-yous", "reminders", "holiday cards", "follow-ups", "birthday emails", "new members", "check-ins"];
    const chips = items.map((w, i) => { const e = c.bubble(560, 90 + i * 130, 800, 104, w, { bg: COL.dim, color: COL.mute, size: 44 }); e.style.opacity = 0; reflow(e); c.later(() => { e.style.opacity = 1; }, 100 + i * 120); return e; });
    chips.forEach((e, i) => c.later(() => { e.style.transitionDuration = "1s"; e.style.opacity = 0; e.style.transform = "translateX(80px)"; }, 2500 + i * 330));
    const call = c.bubble(560, 480, 800, 130, "Call Stephen · 10 min", { bg: COL.yellow, color: COL.night, size: 52 }); call.style.opacity = 0; c.later(() => { call.style.opacity = 1; }, 4800);
  }),
  V("diagram", "Who does what", (c) => {
    c.line(960, 150, 960, 930, { w: 3, color: rgba(COL.ink, 0.3), ms: 1200 });
    c.rise(c.text("Potluck", { x: 100, w: 800, y: 150, size: 140, color: COL.blue }), 400, 40);
    c.rise(c.text("Suhanya", { x: 1020, w: 800, y: 150, size: 140, color: COL.orange }), 400, 40);
    ["when", "who"].forEach((w, i) => c.rise(c.text(w, { x: 100, w: 800, y: 450 + i * 150, size: 130 }), 1500 + i * 800, 30));
    ["what to say", "why it matters"].forEach((w, i) => c.rise(c.text(w, { x: 1020, w: 800, y: 450 + i * 150, size: 130 }), 3000 + i * 800, 30));
  }),
]);

slide("It's coming to SDC in early December.\n\nAnd Stephen? He's still bringing a dish.", [
  V("metaphor", "Lights come back on", (c) => {
    const pos = layoutGrid(40, { cx: 960, cy: 500, pitch: 130, cols: 10 }), dots = pos.map(([x, y], i) => c.dot(x, y, 70, COL.dim, { still: true }));
    const order = dots.map((_, i) => i).filter((i) => i !== 18).sort(() => Math.random() - 0.5);
    order.forEach((idx, k) => c.later(() => { dots[idx].style.setProperty("--bg", PAL[idx % 5]); dots[idx].style.transform = "scale(1.2)"; c.later(() => { dots[idx].style.transform = "none"; }, 500); }, 600 + k * 110));
    c.later(() => { dots[18].style.setProperty("--bg", COL.orange); c.glow(pos[18][0], pos[18][1], 700, COL.orange, 0.5); dots[18].style.transform = "scale(1.5)"; }, 5400);
    c.rise(c.text("Early December.", { y: 900, size: 90, color: COL.mute }), 6200, 20);
  }),
  V("words", "Early December", (c) => {
    c.rise(c.text("Early December.", { y: 280, size: 230 }), 200, 50);
    c.rise(c.text("And Stephen? Still bringing a dish.", { y: 700, size: 90, color: COL.mute }), 2200, 30);
  }),
  V("literal", "December", (c) => {
    const month = c.text("December", { y: 80, size: 130 }); c.rise(month, 100, 30);
    const cells = [];
    for (let r = 0; r < 5; r++) for (let k = 0; k < 7; k++) { const e = c.rect(480 + k * 138, 280 + r * 128, 126, 116, COL.dim, 18); e.style.opacity = 0; c.later(() => { e.style.opacity = 1; }, 300 + (r + k) * 50); cells.push(e); }
    [0, 1, 2, 3, 4, 5, 6].forEach((k) => c.later(() => { cells[k].style.setProperty("background", COL.yellow); cells[k].style.transform = "scale(1.06)"; }, 2200 + k * 280));
    c.later(() => c.glow(960, 340, 1400, COL.yellow, 0.25), 4400);
  }),
  V("callback", "Dishes return", (c) => {
    c.line(260, 820, 1660, 820, { w: 3, color: COL.ink, ms: 1500 });
    for (let i = 0; i < 12; i++) {
      const last = i === 11, w = last ? 190 : i % 4 === 1 ? 128 : 84, o = c.dot(rnd(200, 1700), -80, w, last ? COL.orange : PAL[i % 5], { still: true }); o.style.transitionDuration = last ? "2.6s" : "2.2s";
      const slot = 280 + i * (1360 / 11) - w / 2;
      c.later(() => { o.style.left = slot + "px"; o.style.height = w / 2 + "px"; o.style.borderRadius = "999px 999px 0 0"; o.style.top = 820 - w / 2 + "px"; }, (last ? 4600 : 800) + i * 140);
      if (last) c.later(() => { c.glow(slot + w / 2, 760, 800, COL.orange, 0.5); }, 7400);
    }
  }),
  V("atmosphere", "Skyline at dawn", (c) => {
    const sun = c.dot(960, 900, 460, COL.orange, { still: true }); c.later(() => { c.moveTo(sun, 960, 520, 6000); }, 300);
    const g = c.glow(960, 700, 1600, COL.yellow, 0.3);
    const widths = [160, 120, 200, 140, 180, 110, 220, 130, 170, 120, 190, 140];
    let x = 20;
    widths.forEach((w, i) => {
      const h = 260 + ((i * 97) % 360), b = c.box(x, 1080 - h, w, h, { background: COL.night, zIndex: 3, outline: `3px solid ${rgba(COL.ink, 0.25)}` });
      for (let r = 0; r < Math.floor(h / 90); r++) for (let k = 0; k < Math.floor(w / 60); k++) { const win = c.rect(x + 18 + k * 50, 1080 - h + 24 + r * 70, 22, 32, COL.dim, 4); win.style.zIndex = 4; c.later(() => { win.style.setProperty("background", COL.yellow); }, 1500 + rnd(0, 4500)); }
      x += w + 12;
    });
  }),
]);
