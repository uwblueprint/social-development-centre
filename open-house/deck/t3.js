/* Slides 12 to 16: the system remembers, the thank-you, the Christmas letter, the approval, the profile */

/* a tag: outlined, small corner radius, no fill, no shadow */
const tagCss = (color, size) => `border:1.5px solid ${rgba(color, color === COL.ink ? 0.3 : 0.75)};border-radius:8px;display:inline-flex;align-items:center;white-space:nowrap;width:auto;height:auto;padding:${Math.round(size * 0.3)}px ${Math.round(size * 0.5)}px;font-size:${size}px;line-height:1.2;letter-spacing:-0.02em;color:${color}`;
/* w and h are ignored: the box hugs its label, with padding in proportion to the type */
function outTag(c, x, y, w, h, str, color = COL.ink, size = 30) {
  const t = c.box(x, y, 0, 0, {}); t.style.cssText += ";" + tagCss(color, size); t.textContent = str;
  /* tags never slide: position changes (like right-aligning after measuring) are instant */
  t.style.transition = "opacity 1s var(--soft), transform 1.15s var(--snap)";
  return t;
}

slide("The answer is a system that remembers for you. Not a bigger spreadsheet. That's what we're building.", [
  V("memory", "Wall of notes", (c) => {
    const cols = 9, rows = 4, S = 196, px = 180, py = 186, x0 = (1920 - (8 * px + S)) / 2, y0 = (1080 - (3 * py + S)) / 2, SPECIAL = 14, BIG = 560, notes = [];
    /* hand-written squiggles that overlap a little, drawn in the note's own units so they scale with it */
    const squig = (size, seed) => {
      const r = seeded(seed); let svg = `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="position:absolute;inset:0">`;
      for (let i = 0; i < 4; i++) { const y = size * (0.31 + i * 0.1), len = size * (0.4 + r() * 0.38), n = Math.max(2, Math.round(len / (size * 0.12))); let d = `M${size * 0.13} ${y}`; for (let k = 0; k < n; k++) d += ` q ${size * 0.03} ${-size * 0.06} ${size * 0.06} 0 t ${size * 0.06} 0`; svg += `<path d="${d}" fill="none" stroke="rgba(19,18,15,0.5)" stroke-width="${3 * size / 196}" stroke-linecap="round" stroke-linejoin="round"/>`; }
      return svg + "</svg>";
    };
    const colors = [COL.note, COL.note, COL.lilac, COL.blue, COL.green];
    let special = null;
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
      const idx = r * cols + k, x = x0 + k * px + rnd(-12, 12), y = y0 + r * py + rnd(-12, 12), rot = rnd(-7, 7), z = 1 + Math.floor(rnd(0, 6));
      if (idx === SPECIAL) {
        const cx = x + S / 2, cy = y + S / 2, sc = S / BIG;
        const n = c.box(cx - BIG / 2, cy - BIG / 2, BIG, BIG, { background: COL.note, borderRadius: "3px", boxShadow: "0 40px 70px rgba(0,0,0,0.45)", transform: `translate(0px, 0px) rotate(${rot}deg) scale(0)`, zIndex: 8 });
        const lines = document.createElement("div"); lines.style.cssText = "position:absolute;inset:0;transition:opacity .7s var(--slow)"; lines.innerHTML = squig(BIG, idx);
        const text = document.createElement("div"); text.textContent = "Ask about her daughter"; text.style.cssText = `position:absolute;inset:64px;font-size:92px;line-height:1.08;letter-spacing:-0.04em;color:${COL.night};opacity:0;transition:opacity .7s var(--slow)`;
        n.appendChild(lines); n.appendChild(text); reflow(n);
        c.later(() => { n.style.transform = `translate(0px, 0px) rotate(${rot}deg) scale(${sc})`; }, 200 + idx * 40);
        special = { n, cx, cy, lines, text }; notes.push(n);
      } else {
        const n = c.box(x, y, S, S, { background: pick(colors), borderRadius: "3px", boxShadow: "0 14px 24px rgba(0,0,0,0.35)", transform: `rotate(${rot}deg) scale(0)`, zIndex: z }); n.innerHTML = squig(S, idx); reflow(n);
        c.later(() => { n.style.transform = `rotate(${rot}deg) scale(1)`; }, 200 + idx * 40); notes.push(n);
      }
    }
    c.later(() => {
      const sp = special;
      notes.forEach((m) => { if (m !== sp.n) { m.style.transitionDuration = "1.1s"; m.style.opacity = 0; } });
      sp.n.style.transitionDuration = "1.8s"; sp.n.style.transitionTimingFunction = "cubic-bezier(.37,.31,0,1)";
      sp.n.style.transform = `translate(${960 - sp.cx}px, ${540 - sp.cy}px) rotate(-2deg) scale(1)`;
      c.later(() => { sp.lines.style.opacity = 0; sp.text.style.opacity = 1; }, 1000);
    }, 3600);
  }),
  V("memory", "Two months later", (c) => {
    const g = c.box(250, 280, 440, 500, {}); let mon;
    c.into(g, () => { c.card(0, 0, 440, 500, { r: 36 }); c.box(0, 0, 440, 130, { background: COL.orange, borderRadius: "36px 36px 0 0" }); mon = c.text("March", { x: 0, w: 440, y: 22, size: 84, color: COL.night }); c.text("4", { x: 0, w: 440, y: 190, size: 230 }); });
    c.rise(g, 100, 40);
    const cap = c.text("Two months later", { x: 160, w: 620, y: 830, size: 46, color: COL.mute }); cap.style.opacity = 0;
    c.later(() => { mon.style.transition = "transform .22s ease"; mon.style.transform = "scaleY(0)"; c.later(() => { mon.textContent = "May"; mon.style.transform = "none"; cap.style.opacity = 1; }, 230); }, 1600);
    const note = c.box(850, 260, 560, 330, { background: COL.note, borderRadius: "12px", boxShadow: "0 30px 60px rgba(0,0,0,0.45)" });
    const nt = document.createElement("div"); nt.textContent = "Ask about her daughter"; nt.style.cssText = `position:absolute;inset:48px;font-size:72px;line-height:1.08;letter-spacing:-0.04em;color:${COL.night}`; note.appendChild(nt); c.pop(note, 2600, 0.6);
    c.pop(c.avatar(930, 800, 130, "Suhanya", {}), 4200);
    const b = c.bubble(1030, 740, 600, 120, "How's your daughter doing?", { bg: COL.system, color: COL.night, size: 38, r: 30 }); c.rise(b, 4600, 30);
  }),
  V("memory", "The note surfaces", (c) => {
    const X = 360, Y = 100, W = 1200, H = 640;
    c.rise(c.card(X, Y, W, H, { r: 32 }), 100, 40);
    const g = c.box(X, Y, W, H, {}); g.style.transition = "opacity 1s ease";
    c.into(g, () => { [0, 1, 2, 3, 4].forEach((i) => { if (i === 2) return; const y = 90 + i * 112; c.rect(70, y - 31, 62, 62, rgba(COL.ink, 0.12), 12); const sq = c.box(160, y - 8, 300, 16, {}); let d = "M0 8"; for (let k = 0; k < 20; k++) d += " q 5 -8 10 0 t 10 0"; sq.innerHTML = `<svg width="300" height="16" style="display:block"><path d="${d}" fill="none" stroke="${rgba(COL.ink, 0.3)}" stroke-width="3" stroke-linecap="round"/></svg>`; }); });
    g.style.opacity = 0; reflow(g); c.later(() => { g.style.opacity = 1; }, 500);
    const cy = Y + 90 + 2 * 112, tile = c.rect(X + 70, cy - 31, 62, 62, COL.note, 12); tile.style.opacity = 0; c.later(() => { tile.style.opacity = 1; }, 500);
    const glow = c.glow(X + 520, cy, 760, COL.note, 0.12); glow.style.opacity = 0; glow.style.transition = "opacity 2s ease"; glow.style.zIndex = 0;
    const chip = c.box(X + 160, cy - 32, 0, 0, { background: COL.note, borderRadius: "12px", boxShadow: "0 14px 24px rgba(0,0,0,0.35)" }); chip.style.cssText += `;width:auto;height:64px;display:flex;align-items:center;padding:0 22px;white-space:nowrap;font-size:32px;letter-spacing:-0.025em;color:${COL.night};transform-origin:0 50%`; chip.textContent = "Daughter starts school in September"; chip.style.opacity = 0; c.later(() => { chip.style.opacity = 1; }, 500);
    c.later(() => { g.style.opacity = 0.25; glow.style.opacity = 1; chip.style.transform = "scale(1.18)"; }, 2200);
    c.pop(c.avatar(560, 910, 120, "Suhanya", {}), 3400);
    c.rise(c.bubble(660, 850, 620, 110, "How's your daughter doing?", { bg: COL.system, color: COL.night, size: 38, r: 30 }), 3800, 30);
  }),
]);

slide("Imagine someone joins. A thank-you will go out automatically, in Suhanya's own words, written once.", [
  V("ui", "Written once, sent to each", (c) => {
    const X = 330, Y = 90, W2 = 1260, H2 = 900, P = 50, hair = rgba(COL.ink, 0.1);
    c.card(X, Y, W2, H2, { r: 26 });
    [0, 1, 2].forEach((i) => c.box(X + P + i * 32, Y + P, 16, 16, { borderRadius: "50%", background: rgba(COL.ink, 0.2) }));
    c.rect(X, Y + 104, W2, 1.5, hair); c.rect(X, Y + 214, W2, 1.5, hair); c.rect(X, Y + 740, W2, 1.5, hair);
    c.text("To:", { x: X + P, w: 100, y: Y + 137, size: 40, color: COL.mute, align: "left" });
    /* the recipient is a tag: avatar and name, in an outlined box after "To:" */
    const tag = c.box(X + 150, Y + 120, 340, 76, { border: `1.5px solid ${rgba(COL.ink, 0.3)}`, borderRadius: "10px", transition: "transform .5s var(--soft), border-color .5s ease" });
    const nameEl = c.text("Maya", { x: X + 238, w: 240, y: Y + 138, size: 38, align: "left" }); nameEl.style.transition = "opacity .18s ease, transform .18s ease";
    /* the email stays put: only the person changes */
    const body = c.text("Thank you for joining us. It means a lot to everyone at SDC.\n\nWarm regards,\nSuhanya", { x: X + P, w: W2 - 2 * P, y: Y + 250, size: 42, color: rgba(COL.ink, 0.78), align: "left" }); body.style.whiteSpace = "pre-wrap"; body.style.lineHeight = 1.45;
    let av = null;
    const mkAv = (n) => c.avatar(X + 196, Y + 158, 54, n, n === "Stephen" ? { ground: COL.stephen, cloth: COL.stephen } : {});
    av = mkAv("Maya");
    const setTo = (n) => {
      if (av) av.remove(); av = mkAv(n); av.style.opacity = 0; av.style.transition = "opacity .35s ease"; reflow(av); av.style.opacity = 1;
      nameEl.style.opacity = 0; nameEl.style.transform = "translateY(-8px)";
      c.later(() => { nameEl.textContent = n; nameEl.style.transform = "translateY(8px)"; reflow(nameEl); nameEl.style.opacity = 1; nameEl.style.transform = "none"; }, 180);
      tag.style.transform = "scale(1.025)"; tag.style.borderColor = rgba(COL.ink, 0.55); c.later(() => { tag.style.transform = "none"; tag.style.borderColor = rgba(COL.ink, 0.3); }, 240);
    };
    ["Dana", "Omar", "Priya", "Stephen"].forEach((n, i) => c.later(() => setTo(n), 1400 + i * 1000));
    const send = c.bubble(X + P, Y + 778, 190, 72, "Send", { bg: COL.system, color: COL.night, size: 36, r: 10 });
    /* the cursor rises from the bottom of the screen */
    const cur = cursor(c, X + W2 - 300, 1120);
    c.later(() => cur.go(X + P + 95 - 6, Y + 814 - 4), 5600);
    c.later(() => cur.hand(true), 6800);
    c.later(() => { cur.click(); send.style.transform = "scale(0.94)"; c.later(() => { send.style.transform = "none"; send.style.background = COL.green; send.firstChild.textContent = "Sent ✓"; }, 180); }, 7000);
    c.later(() => { cur.hand(false); cur.go(X + W2 - 200, 1120); }, 8200);
  }),
]);

slide("Want to send a Christmas message? You'll write it in November, when you have time, and it will go out on Christmas Eve.", [
  V("atmosphere", "First snow, a Christmas letter", (c) => {
    const flake = () => { const x = rnd(0, 1920), d = rnd(6, 18), e = c.dot(x, -30, d, COL.ink, { still: true }); e.style.opacity = rnd(0.35, 0.95); e.style.zIndex = 3; e.style.transitionDuration = rnd(6, 11) + "s"; e.style.transitionTimingFunction = "linear"; c.later(() => { c.moveTo(e, x + rnd(-200, 200), 1120, 0); }, 40); c.later(() => e.remove(), 11500); };
    c.every(flake, 70);
    const env = c.box(660, 330, 600, 405, { zIndex: 2, transition: "left 2.2s cubic-bezier(.6,0,.1,1), top 2.2s cubic-bezier(.6,0,.1,1), transform 2.2s cubic-bezier(.6,0,.1,1), opacity 1s" });
    const inner = document.createElement("div"); inner.style.cssText = "position:absolute;inset:0;animation:drift 5s ease-in-out infinite alternate";
    /* front of a closed envelope: the flap comes down from the top edge to a gold seal */
    inner.innerHTML = `<svg viewBox="0 0 400 270" width="600" height="405" style="display:block;overflow:visible">
      <defs><clipPath id="envClip"><rect width="400" height="270" rx="16"/></clipPath><radialGradient id="seal" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#d9990f"/></radialGradient><filter id="envShadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="26" stdDeviation="22" flood-color="#000" flood-opacity="0.5"/></filter></defs>
      <rect width="400" height="270" rx="16" fill="#d3402f" filter="url(#envShadow)"/>
      <g clip-path="url(#envClip)"><polygon points="0,0 400,0 200,172" fill="#b3302a"/><path d="M0 270 L150 150 M400 270 L250 150" stroke="rgba(0,0,0,0.12)" stroke-width="3" fill="none"/><path d="M0 0 L200 172 L400 0" stroke="rgba(0,0,0,0.16)" stroke-width="3" fill="none"/></g>
      <circle cx="200" cy="172" r="36" fill="url(#seal)"/><path d="M200 151 l6.2 12.6 13.9 2 -10 9.8 2.4 13.8 -12.5 -6.5 -12.5 6.5 2.4 -13.8 -10 -9.8 13.9 -2 z" fill="#8a5a00"/>
      <path d="M312 240 q 14 -16 30 -2 q -14 14 -30 2 z" fill="#2f8a4b"/><path d="M342 238 q 14 -16 30 -2 q -14 14 -30 2 z" fill="#3ea35d" transform="translate(-4 6)"/><circle cx="340" cy="244" r="6" fill="#ffd23f"/>
    </svg>`;
    env.appendChild(inner); c.pop(env, 600);
    const g = c.glow(960, 535, 1000, COL.yellow, 0.1); g.style.zIndex = 1; g.style.opacity = 0; c.later(() => { g.style.opacity = 1; }, 1600);
    c.later(() => { env.style.left = "1900px"; env.style.top = "-260px"; env.style.transform = "rotate(-16deg) scale(0.45)"; g.style.opacity = 0; }, 4300);
  }),
]);

/* a pointer: an arrow, a pointing hand over buttons, and a click ripple */
function cursor(c, x, y) {
  const ARROW = `<svg width="60" height="70" viewBox="0 0 60 70"><path d="M6 4 L6 54 L19 42 L28 64 L38 60 L29 39 L47 38 Z" fill="${COL.ink}" stroke="${COL.night}" stroke-width="4" stroke-linejoin="round"/></svg>`;
  const HAND = `<svg width="60" height="70" viewBox="0 0 60 70"><path d="M20 9 a5 5 0 0 1 10 0 V30 a5 5 0 0 1 10 0 a5 5 0 0 1 10 3 a5 5 0 0 1 8 5 V46 a16 16 0 0 1 -16 16 H34 a18 18 0 0 1 -15 -8 L8 38 a5 5 0 0 1 8 -6 L20 38 Z" fill="${COL.ink}" stroke="${COL.night}" stroke-width="3" stroke-linejoin="round"/></svg>`;
  const e = c.box(x, y, 60, 70, { zIndex: 20, transition: "left 1.1s cubic-bezier(.37,.31,0,1), top 1.1s cubic-bezier(.37,.31,0,1), transform .2s, opacity .4s" });
  e.innerHTML = `<div style="margin-left:0">${ARROW}</div>`;
  /* the fingertip sits where the arrow's tip was */
  e.hand = (on) => { e.innerHTML = `<div style="margin-left:${on ? -19 : 0}px">${on ? HAND : ARROW}</div>`; };
  e.click = () => { e.style.transform = "scale(.86)"; const r = c.ring(parseFloat(e.style.left) + 6, parseFloat(e.style.top) + 4, 50, COL.ink, 3); r.style.transition = "transform .9s ease-out, opacity .9s ease-out"; r.style.zIndex = 19; reflow(r); r.style.transform = "scale(2.4)"; r.style.opacity = 0; c.later(() => { e.style.transform = "none"; r.remove(); }, 400); };
  e.go = (px, py) => { e.style.left = px + "px"; e.style.top = py + "px"; };
  return e;
}
slide("For your biggest supporters, the email will wait for you first, so you can add the one line only a person could write.", [
  V("ui", "Typed, then approved", (c) => {
    const CX = 360, CY = 130, CW = 1200, CH = 820, P = 80, L = CX + P, R = CX + CW - P, T = CY + P, B = CY + CH - P;
    /* everything is simply there; only the typing, the cursor and the button change */
    c.card(CX, CY, CW, CH, { r: 26 });
    c.avatar(L + 32, T + 32, 64, "Stephen", ST);
    c.text("To: Stephen", { x: L + 88, w: 600, y: T + 12, size: 40, color: COL.mute, align: "left" });
    const tag = outTag(c, 0, T + 5, 0, 0, "Waiting for you", COL.yellow, 30); tag.style.left = R - tag.offsetWidth + "px";
    [0, 1, 2].forEach((i) => c.rect(L, T + 130 + i * 44, R - L - i * 190, BAR, rgba(COL.ink, 0.25), 4));
    c.rect(L, T + 300, R - L, 120, rgba(COL.system, 0.16), 14);
    const t = c.text("", { x: L + 30, w: R - L - 60, y: T + 330, size: 54, align: "left", color: COL.system });
    const bw = 400, bh = 92, btn = c.bubble(R - bw, B - bh, bw, bh, "Approve & send", { bg: COL.system, color: COL.night, size: 40, r: 12 }); btn.firstChild.style.whiteSpace = "nowrap";
    const cur = cursor(c, 1560, 960);
    c.later(() => cur.go(L + 104, T + 356), 1000);
    c.later(() => cur.click(), 2200);
    c.later(() => c.type(t, "Thinking of you and the kids this winter.", 50, 0), 2700);
    c.later(() => cur.go(R - bw / 2 - 6, B - bh / 2 - 4), 5400);
    c.later(() => cur.hand(true), 6550);
    c.later(() => { cur.click(); btn.style.transform = "scale(.95)"; c.later(() => { btn.style.transform = "none"; }, 220); }, 6700);
    c.later(() => { tag.style.transition = "none"; tag.style.opacity = 0; btn.style.background = COL.green; btn.firstChild.textContent = "Sent ✓"; cur.style.opacity = 0; }, 7000);
  }),
]);

/* One person's record: profile on the left, a vertical timeline on the right. Emails sent, tasks with checkboxes, and notes. */
function personRecord(c, withCard) {
  if (withCard) c.rise(c.card(180, 80, 1560, 920, { r: 32 }), 100, 40);
  /* left: who */
  c.pop(c.avatar(470, 390, 230, "Stephen", { ground: COL.stephen, cloth: COL.stephen }), 400);
  c.rise(c.text("Stephen", { x: 270, w: 400, y: 520, size: 88 }), 650, 30);
  const row = c.box(170, 650, 600, 60, { display: "flex", justifyContent: "center", alignItems: "center", gap: "14px" });
  ["Donor", "Housing", "Workshops"].forEach((t, i) => { const g = document.createElement("div"); g.style.cssText = tagCss(COL.ink, 28) + ";opacity:0;transform:scale(.8);transition:opacity .5s,transform .6s cubic-bezier(.2,1.45,.35,1)"; g.textContent = t; row.appendChild(g); reflow(g); c.later(() => { g.style.opacity = 1; g.style.transform = "none"; }, 1000 + i * 230); });
  /* right: the timeline */
  const X = 990, ink = COL.ink, ys = [210, 340, 470, 600, 730, 860];
  c.line(X, 170, X, 910, { w: 3, color: rgba(ink, 0.25), delay: 700, ms: 2200 }).style.transformOrigin = "0 50%";
  const squig = (len) => { let d = "M0 8"; for (let i = 0; i < len / 20; i++) d += " q 5 -8 10 0 t 10 0"; return `<svg width="${len}" height="16" viewBox="0 0 ${len} 16" style="display:block"><path d="${d}" fill="none" stroke="rgba(243,241,234,0.3)" stroke-width="3" stroke-linecap="round"/></svg>`; };
  const entries = [
    { t: "joined", title: "Member joined", date: "Mar 4" },
    { t: "email", title: "Thank-you email sent", date: "Mar 4", d: [230, 150] },
    { t: "task", title: "Check-in call scheduled", date: "Apr 3", done: true, d: [200, 120] },
    { t: "note", title: "Daughter just turned 3", date: "Apr 3" },
    { t: "task", title: "Invited to tenants' rights workshop", date: "Jun 12", done: false, d: [260, 160] },
    { t: "note", title: "Daughter starts school in September", date: "Jun 12" },
  ];
  entries.forEach((e, i) => {
    const y = ys[i], t0 = 1100 + i * 480;
    c.later(() => {
      /* the node */
      let node;
      if (e.t === "joined") node = c.avatar(X, y, 62, "Stephen", { ground: COL.stephen, cloth: COL.stephen, shape: "square" });
      else {
        node = c.box(X - 31, y - 31, 62, 62, { transition: "opacity .5s, transform .6s cubic-bezier(.175,.885,.32,1.1)" });
        if (e.t === "email") node.innerHTML = `<svg viewBox="0 0 62 62" width="62" height="62"><rect width="62" height="62" rx="12" fill="${COL.blue}"/><rect x="14" y="19" width="34" height="24" rx="4" fill="none" stroke="${COL.night}" stroke-width="3" stroke-linejoin="round"/><path d="M15 22 L31 35 L47 22" stroke="${COL.night}" stroke-width="3" stroke-linejoin="round" fill="none"/></svg>`;
        else if (e.t === "task") node.innerHTML = `<svg viewBox="0 0 62 62" width="62" height="62"><rect x="1.5" y="1.5" width="59" height="59" rx="12" fill="${COL.night}" stroke="${rgba(ink, 0.7)}" stroke-width="3"/><path class="tick" d="M18 32 L28 42 L45 21" stroke="${COL.green}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60" stroke-dashoffset="${e.done ? 60 : 60}" style="transition:stroke-dashoffset .5s ease-out"/></svg>`;
        else node.innerHTML = `<svg viewBox="0 0 62 62" width="62" height="62"><rect width="62" height="62" rx="12" fill="${COL.note}"/><path d="M15 25 q 4 -7 8 0 t 8 0 t 8 0 M15 38 q 4 -7 8 0 t 8 0" stroke="rgba(19,18,15,0.55)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
        c.pop(node, 0, 0.4);
      }
      if (e.t === "task" && e.done) c.later(() => { const tk = node.querySelector(".tick"); if (tk) tk.style.strokeDashoffset = 0; }, 900);
      /* the content */
      if (e.t === "note") { const chip = c.box(X + 66, y - 32, 0, 0, { background: COL.note, borderRadius: "12px", boxShadow: "0 14px 24px rgba(0,0,0,0.35)" }); chip.style.cssText += `;width:auto;height:64px;display:flex;align-items:center;padding:0 22px;white-space:nowrap;font-size:32px;letter-spacing:-0.025em;color:${COL.night}`; chip.textContent = e.title; c.rise(chip, 100, 16); }
      else { c.rise(c.text(e.title, { x: X + 66, w: 640, y: y - 30, size: 40, align: "left" }), 100, 16); if (e.d) { const q = c.box(X + 66, y + 24, 300, 16, {}); q.innerHTML = squig(e.d[0]) ; const q2 = c.box(X + 66 + e.d[0] + 18, y + 24, 200, 16, {}); q2.innerHTML = squig(e.d[1]); [q, q2].forEach((z) => c.rise(z, 100, 16)); } }
      c.rise(c.text(e.date, { x: X + 640, w: 130, y: y - 20, size: 28, color: COL.mute, align: "right" }), 200, 12);
      const rule = c.rect(X + 66, y + 62, 700, 1.5, rgba(ink, 0.1)); rule.style.opacity = 0; reflow(rule); c.later(() => { rule.style.opacity = 1; }, 300);
    }, t0);
  });
}
slide("And every person will have a page: when they joined, every message they've received, and your notes. What they told you on the phone, what they care about.\n\nSo two months later, you'll remember to ask about Stephen's daughter.", [
  V("ui", "Record: profile left, timeline right", (c) => personRecord(c, false)),
  V("ui", "Record, in a card", (c) => personRecord(c, true)),
]);
