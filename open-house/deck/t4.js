/* Slides 17 and 18: the last item on the to-do list, then the name (last slide) */

const CHORES = ["thank-yous", "reminders", "holiday cards", "follow-ups", "birthday emails", "new members", "check-ins"];
/* a hand-drawn line: a gentle wobble, drawn left to right */
function handStrike(len) {
  let d = `M0 ${10 + rnd(-1.5, 1.5)}`;
  for (let x = 0; x < len; x += 28) d += ` Q ${x + 14} ${10 + rnd(-3.5, 3.5)} ${Math.min(len, x + 28)} ${10 + rnd(-2, 2)}`;
  return d;
}
slide("We don't write the emails. Suhanya does. The platform sends them, so she can spend her hours on the part only a person can do: picking up the phone.", [
  V("ui", "One task left", (c) => {
    const x = 560, w = 800, h = 96, gap = 20, all = [...CHORES, "Call Stephen · 10 min"], total = all.length * (h + gap) - gap, y0 = (1080 - total) / 2, items = [];
    all.forEach((s, i) => {
      const last = i === all.length - 1, y = y0 + i * (h + gap), chip = c.bubble(x, y, w, h, s, { bg: last ? COL.green : COL.dim, color: last ? COL.night : COL.mute, size: 44, r: 14 });
      chip.style.opacity = 0; reflow(chip); c.later(() => { chip.style.opacity = 1; }, 100 + i * 90); items.push({ chip, s, last });
    });
    const STEP = 330, T0 = 1300, TT = rhythm(items.length - 1, STEP, T0);
    items.slice(0, -1).forEach((it, i) => {
      const t = TT[i], L = Math.min(660, it.s.length * 25);
      c.later(() => {
        /* tick and strike belong to the chip, so they leave with it */
        const tick = document.createElement("div"); tick.textContent = "✓"; tick.style.cssText = `position:absolute;left:26px;top:24px;width:48px;height:48px;border-radius:12px;background:${COL.green};color:${COL.night};display:grid;place-items:center;font-size:30px;transform:scale(0);transition:transform .35s cubic-bezier(.175,.885,.32,1.1)`;
        const svg = document.createElement("div"); svg.style.cssText = `position:absolute;left:${(w - L) / 2}px;top:${h / 2 - 10}px;width:${L}px;height:20px`;
        svg.innerHTML = `<svg width="${L}" height="20" viewBox="0 0 ${L} 20" style="overflow:visible"><path d="${handStrike(L)}" fill="none" stroke="${COL.mute}" stroke-width="3" stroke-linecap="round"/></svg>`;
        it.chip.appendChild(tick); it.chip.appendChild(svg); reflow(tick); tick.style.transform = "scale(1)";
        const path = svg.querySelector("path"), len = path.getTotalLength(); path.style.strokeDasharray = len; path.style.strokeDashoffset = len; path.style.transition = "stroke-dashoffset .3s ease-out"; reflow(path); c.later(() => { path.style.strokeDashoffset = 0; }, 0);
      }, t);
      c.later(() => { it.chip.style.transition = "transform .5s cubic-bezier(.6,0,.9,.4), opacity .5s"; it.chip.style.transform = "translateX(-160px)"; it.chip.style.opacity = 0; }, t + 650);
    });
    c.later(() => { const last = items[items.length - 1].chip; last.style.transitionDuration = "1.1s"; last.style.top = (1080 - h) / 2 + "px"; last.style.transform = "scale(1.1)"; }, TT[TT.length - 1] + STEP + 450);
  }),
]);

slide("Everyone brings something to the table: money, time, skills. SDC is building a community of hundreds of them. It's a lot like a potluck.\n\nAnd every potluck needs a host: someone who remembers who came, thanks them, and makes sure they get invited back.\n\nWe built the platform that helps the host do that, and we call it Potluck. (Press next when you say \"Potluck\".) It's launching with SDC in early December.", [
  V("scene", "A long table fills up", (c) => {
    const tableY = 905;
    c.box(180, tableY, 1560, 40, { background: "linear-gradient(#2f2d28, #23211d)", borderRadius: "14px", boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 30px 50px rgba(0,0,0,0.5)" });
    const gifts = amounts(6), PT = rhythm(6, 520, 300);
    for (let i = 0; i < 6; i++) {
      /* people bring money or time */
      const left = i % 2 === 0, x = 300 + i * 190, time = i === 1 || i === 4, lab = time ? (2 + Math.floor(rnd(0, 7))) + "h" : "$" + gifts[i];
      const p = c.dot(left ? -90 : 2010, 775, Math.round(104 + (time ? 24 : gifts[i] * 0.4)), PAL[i % 5], { label: lab, fs: 40, lc: COL.night, still: true }); p.style.transitionDuration = "2s";
      c.later(() => { c.moveTo(p, x, 775, 2000); }, PT[i]);
      c.later(() => { const d = c.dot(x, tableY - 26, 100, PAL[(i + 2) % 5], { still: true }); d.style.height = "50px"; d.style.borderRadius = "999px 999px 0 0"; d.style.top = tableY - 50 + "px"; c.pop(d, 0, 0.3); }, PT[i] + 2000);
    }
    const g = c.glow(1560, 770, 900, COL.yellow, 0.3); g.style.zIndex = -1; g.style.opacity = 0; c.later(() => { g.style.opacity = 1; }, 6000);
    const host = c.avatar(1560, 770, 220, "Host", { ground: COL.system, cloth: COL.system, kind: 1 }); c.pop(host, 6000);
    /* the name waits for the presenter: next key when you say "Potluck" */
    const name = c.text("Potluck", { y: 150, size: 230 }); name.style.opacity = 0;
    const sub = c.text("Launching in early December 2026", { y: 410, size: 60, color: COL.mute }); sub.style.opacity = 0;
    c.step(() => { name.style.transform = "translateY(40px)"; reflow(name); name.style.opacity = 1; name.style.transform = "none"; c.later(() => { sub.style.transform = "translateY(24px)"; reflow(sub); sub.style.opacity = 1; sub.style.transform = "none"; }, 700); }, 8400);
  }),
]);
