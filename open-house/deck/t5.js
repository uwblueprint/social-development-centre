/* Slides added for the second script: Suhanya's workload, and the platform introduced. Three versions of each. */

Object.assign(ICONS, {
  cal: '<rect x="10" y="14" width="44" height="40" rx="6"/><path d="M10 26 H54 M22 8 V18 M42 8 V18"/>',
  doc: '<path d="M16 8 H38 L48 18 V56 H16 Z"/><path d="M38 8 V18 H48 M24 32 H40 M24 42 H40"/>',
  phone: '<rect x="20" y="6" width="24" height="52" rx="6"/><path d="M29 50 H35"/>',
  people: '<circle cx="24" cy="22" r="8"/><circle cx="43" cy="24" r="6"/><path d="M10 52 a14 14 0 0 1 28 0 M37 50 a10 10 0 0 1 18 0"/>',
  cash: '<circle cx="32" cy="32" r="22"/><path d="M32 18 V46 M26 25 h9 a4 4 0 0 1 0 8 h-6 a4 4 0 0 0 0 8 h9"/>',
});
const iconTile = (c, x, y, s, key, color, ico) => { const t = c.box(x - s / 2, y - s / 2, s, s, { border: `3px solid ${rgba(color, 0.75)}`, borderRadius: Math.round(s * 0.2) + "px", background: COL.night }); t.innerHTML = iconSvg(key, color, ico); t.style.display = "grid"; t.style.placeItems = "center"; return t; };

slide("Suhanya, a staff member at SDC, manages these relationships alongside everything else that comes with running a nonprofit. And that's not easy.", [
  V("people", "Tasks pile up around her", (c) => {
    const who = c.avatar(960, 640, 220, "Suhanya", {}); who.style.zIndex = 3; c.pop(who, 200);
    const items = [["Thank-yous", 520, 400], ["Events", 1340, 350], ["Grant reports", 340, 650], ["Newsletter", 1500, 610], ["Budget", 640, 860], ["Volunteers", 1290, 870], ["Meetings", 960, 290], ["Reminders", 1500, 800], ["Donor stewardship", 960, 470, true]];
    const T = rhythm(items.length, 520, 800);
    items.forEach(([s, x, y, hot], i) => {
      const w = 70 + s.length * 21, e = c.bubble(x - w / 2, -140, w, 80, s, { bg: hot ? COL.yellow : COL.dim, color: hot ? COL.night : COL.ink, size: 36, r: 20 });
      e.style.opacity = 0; e.style.zIndex = hot ? 4 : 2; e.style.transition = "top .9s cubic-bezier(.3,1.3,.5,1), opacity .4s, transform .9s var(--snap)"; e.style.transform = `rotate(${rnd(-10, 10)}deg)`; reflow(e);
      c.later(() => { e.style.top = y - 40 + "px"; e.style.opacity = 1; e.style.transform = `rotate(${rnd(-4, 4)}deg)`; }, T[i]);
    });
  }),
  V("people", "Inbox filling, calendar filling", (c) => {
    const tile = iconTile(c, 450, 520, 300, "mail", COL.blue, 170); c.pop(tile, 200);
    const badge = c.box(500, 330, 120, 80, { background: COL.orange, borderRadius: "40px", display: "grid", placeItems: "center", color: COL.night, fontSize: "44px", fontWeight: 500 }); badge.textContent = "1"; c.pop(badge, 700, 0.4);
    let n = 1; c.later(() => c.every(() => { n += Math.ceil(n * 0.25) + 1; badge.textContent = n > 99 ? "99+" : String(n); if (n > 99) badge.style.width = "150px"; }, 260), 900);
    const cols = 5, rows = 6, gx = 800, gy = 240, cw = 170, ch = 100, cells = [];
    for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) cells.push(c.rect(gx + k * cw + 6, gy + r * ch + 6, cw - 12, ch - 12, rgba(COL.ink, 0.07), 12));
    const order = cells.map((_, i) => i).sort(() => Math.random() - 0.5), T = rhythm(cells.length, 150, 1200);
    order.forEach((idx, i) => c.later(() => { cells[idx].style.background = rgba(PAL[idx % 5], 0.75); }, T[i]));
  }),
  V("people", "Many hats", (c) => {
    const keys = ["mail", "note", "door", "cal", "doc", "phone", "people", "cash"], cols = [COL.blue, COL.yellow, COL.orange, COL.green, COL.lilac, COL.blue, COL.yellow, COL.green];
    const who = c.avatar(960, 540, 230, "Suhanya", {}); who.style.zIndex = 3; c.pop(who, 200);
    const T = rhythm(keys.length, 480, 900);
    keys.forEach((k, i) => {
      const a = (i / keys.length) * Math.PI * 2 - Math.PI / 2, x = 960 + 600 * Math.cos(a), y = 540 + 330 * Math.sin(a);
      c.line(960, 540, x, y, { w: 3, color: rgba(cols[i], 0.5), delay: T[i], ms: 700 });
      const t = iconTile(c, x, y, 140, k, cols[i], 80); t.style.zIndex = 2; c.pop(t, T[i] + 500, 0.5);
    });
  }),
]);

slide("So how do we make it easier to build those relationships? We're building a platform that simplifies donor stewardship and takes the administrative work off SDC's plate.", [
  V("product", "Two parts", (c) => {
    c.rise(c.text("How do we make it easier?", { y: 110, size: 96 }), 300, 40);
    [["people", "Member directory", COL.blue, 220], ["mail", "Automated emails", COL.yellow, 1000]].forEach(([ic, label, col, x], i) => {
      const t = 2200 + i * 1400, card = c.card(x, 330, 700, 520, { r: 32 });
      c.rise(card, t, 50);
      const tile = iconTile(c, x + 350, 560, 200, ic, col, 110); c.pop(tile, t + 300, 0.5);
      c.rise(c.text(label, { x, w: 700, y: 720, size: 64, color: col }), t + 500, 30);
    });
  }),
  V("product", "A window opens", (c) => {
    const X = 220, Y = 110, W = 1480, H = 860, EX = X + 620, EW = W - 670;
    c.rise(c.card(X, Y, W, H, { r: 32 }), 100, 40);
    [0, 1, 2].forEach((i) => c.box(X + 50 + i * 32, Y + 40, 16, 16, { borderRadius: "50%", background: rgba(COL.ink, 0.2) }));
    c.rect(X, Y + 96, W, 1.5, rgba(COL.ink, 0.1)); c.rect(X + 560, Y + 96, 1.5, H - 96, rgba(COL.ink, 0.1));
    /* the people */
    const sel = c.rect(X + 30, Y + 190 + 4 * 130 - 56, 500, 112, rgba(COL.system, 0.14), 16); sel.style.opacity = 0; c.later(() => { sel.style.opacity = 1; }, 3000);
    ["Maya", "Dana", "Omar", "Priya", "Stephen"].forEach((n, i) => {
      const y = Y + 190 + i * 130, t = 900 + i * 330, g = c.avatar(X + 100, y, 72, n, n === "Stephen" ? { ground: COL.stephen, cloth: COL.stephen, shape: "square" } : { shape: "square" });
      const l1 = c.rect(X + 170, y - 14, 260, BAR, rgba(COL.ink, 0.3), 4), l2 = c.rect(X + 170, y + 10, 170, BAR, rgba(COL.ink, 0.16), 4);
      [g, l1, l2].forEach((e) => { e.style.opacity = 0; c.later(() => { e.style.opacity = 1; }, t); });
    });
    /* the email window */
    const mail = c.card(EX, Y + 150, EW, 640, { r: 24, bg: "linear-gradient(180deg, #2a2823, #1d1c19)" }); mail.style.opacity = 0; c.later(() => { mail.style.opacity = 1; }, 3400);
    const parts = [];
    parts.push(c.text("To:", { x: EX + 40, w: 100, y: Y + 197, size: 34, color: COL.mute, align: "left" }));
    parts.push(c.box(EX + 120, Y + 180, 270, 64, { border: `${HAIR}px solid ${rgba(COL.ink, 0.3)}`, borderRadius: "10px" }));
    parts.push(c.avatar(EX + 160, Y + 212, 44, "Stephen", { ground: COL.stephen, cloth: COL.stephen }));
    parts.push(c.text("Stephen", { x: EX + 200, w: 190, y: Y + 195, size: 32, align: "left" }));
    parts.push(c.rect(EX, Y + 270, EW, 1.5, rgba(COL.ink, 0.1)));
    const body = c.text("", { x: EX + 40, w: EW - 80, y: Y + 300, size: 38, color: rgba(COL.ink, 0.78), align: "left" }); body.style.lineHeight = 1.35;
    parts.push(c.rect(EX, Y + 650, EW, 1.5, rgba(COL.ink, 0.1)));
    const send = c.bubble(EX + 40, Y + 680, 150, 64, "Send", { bg: COL.system, color: COL.night, size: 32, r: 10 }); parts.push(send);
    parts.forEach((e) => { e.style.opacity = 0; c.later(() => { e.style.opacity = 1; }, 3700); });
    c.later(() => c.type(body, "Thank you for joining us. It means a lot to everyone at SDC.", 40, 0, false), 4300);
  }),
  V("product", "The work lifts off", (c) => {
    const who = c.avatar(360, 780, 220, "Suhanya", {}); who.style.zIndex = 3; c.pop(who, 200);
    const tile = iconTile(c, 1500, 560, 340, "people", COL.blue, 190); tile.style.background = rgba(COL.blue, 0.14); c.pop(tile, 500, 0.6);
    const items = ["Thank-yous", "Reminders", "Holiday emails", "Follow-ups", "Record keeping"], chips = [];
    items.forEach((s, i) => { const w = 70 + s.length * 21, e = c.bubble(360 - w / 2, 250 + i * 88, w, 76, s, { bg: COL.dim, color: COL.ink, size: 34, r: 18 }); e.style.opacity = 0; c.later(() => { e.style.opacity = 1; }, 300 + i * 110); chips.push(e); });
    const T = rhythm(items.length, 800, 1800);
    chips.forEach((e, i) => {
      c.later(() => { e.style.zIndex = 4; c.moveTo(e, 1500, 560, 1100); e.style.transform = "scale(0.35)"; }, T[i]);
      c.later(() => { e.style.opacity = 0; tile.style.transform = "scale(1.06)"; c.later(() => { tile.style.transform = "none"; }, 220); }, T[i] + 950);
    });
  }),
]);
