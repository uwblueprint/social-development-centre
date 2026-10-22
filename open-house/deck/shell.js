/* Deck shell: slides on left/right, variations on up/down, G compares every variation of a slide live. */
const app = document.getElementById("app");
const hud = document.getElementById("hud");
const notesEl = document.getElementById("notes");
let si = 0, vi = 0, grid = false, labels = true, views = [];

function mountView(host, scale, build, auto) {
  const st = document.createElement("div"); st.className = "stage"; st.style.transform = `scale(${scale})`; host.appendChild(st);
  const leak = document.createElement("div"); leak.className = "leak"; st.appendChild(leak);
  const cam = document.createElement("div"); cam.className = "cam"; st.appendChild(cam);
  const ctx = new Ctx(cam); ctx.auto = !!auto;
  try { build(ctx); } catch (e) { console.error(e); st.textContent = "error: " + e.message; st.style.color = "#ff6b3d"; st.style.fontSize = "40px"; }
  return { st, ctx };
}
function clearViews() { views.forEach((v) => v.ctx.destroy()); views = []; app.innerHTML = ""; }

function render() {
  clearViews();
  const s = SLIDES[si];
  app.className = grid ? "grid" : "";
  if (!grid) {
    const k = Math.min(innerWidth / 1920, innerHeight / 1080);
    const host = document.createElement("div"); host.className = "cell"; host.style.cssText = `width:${1920 * k}px;height:${1080 * k}px;cursor:default;outline:none;`;
    app.appendChild(host); views.push(mountView(host, k, s.variants[vi].build, false));
  } else {
    const cols = 3, cw = Math.floor((innerWidth - 20 - 10 * (cols - 1)) / cols), k = cw / 1920;
    s.variants.forEach((v, i) => {
      const host = document.createElement("div"); host.className = "cell"; host.style.cssText = `width:${cw}px;height:${Math.round(cw * 0.5625)}px;`;
      const tag = document.createElement("b"); tag.textContent = `${i + 1} · ${v.type} · ${v.name}`; host.appendChild(tag);
      host.onclick = () => { vi = i; grid = false; render(); };
      app.appendChild(host); views.push(mountView(host, k, v.build, true));
    });
  }
  const v = s.variants[vi];
  hud.style.display = labels ? "block" : "none";
  const pending = !grid && views[0] && views[0].ctx.steps.length ? " · next reveals" : "";
  hud.textContent = (grid ? `slide ${si + 1}/${SLIDES.length} · compare (click one)` : `slide ${si + 1}/${SLIDES.length} · variation ${vi + 1}/${s.variants.length} · ${v.type} · ${v.name}`) + pending;
  notesEl.textContent = s.notes;
  history.replaceState(null, "", `#${si + 1}.${vi + 1}`);
}
/* next: run the slide's next reveal if it has one, otherwise go to the next slide */
function advance() {
  const ctx = !grid && views[0] && views[0].ctx;
  if (ctx && ctx.steps.length) { ctx.steps.shift()(); if (!ctx.steps.length) hud.textContent = hud.textContent.replace(" · next reveals", ""); return; }
  if (si >= SLIDES.length - 1) return;
  goSlide(si + 1);
}
function goSlide(n) { si = Math.max(0, Math.min(SLIDES.length - 1, n)); vi = 0; render(); }
function goVar(n) { const m = SLIDES[si].variants.length; vi = (n + m) % m; render(); }

addEventListener("keydown", (e) => {
  const k = e.key;
  if (k === "ArrowRight" || k === " " || k === "PageDown") advance();
  else if (k === "ArrowLeft" || k === "PageUp") goSlide(si - 1);
  else if (k === "ArrowDown") goVar(vi + 1);
  else if (k === "ArrowUp") goVar(vi - 1);
  else if (/^[1-9]$/.test(k) && +k <= SLIDES[si].variants.length) { vi = +k - 1; grid = false; render(); }
  else if (k.toLowerCase() === "s") notesEl.classList.toggle("on");
  else if (k.toLowerCase() === "v") { labels = !labels; render(); }
  else if (k.toLowerCase() === "g") { grid = !grid; render(); }
  else if (k.toLowerCase() === "r") render();
  else if (k.toLowerCase() === "t") { const order = ["dark", "navy", "cream"]; setTheme(order[(order.indexOf(THEME) + 1) % 3]); render(); }
  else if (k === "Escape" && grid) { grid = false; render(); }
});
addEventListener("resize", render);
addEventListener("click", (e) => { if (!grid && !e.target.closest("#hud, #notes")) advance(); });

const h = (location.hash.slice(1) || "1.1").split(".");
si = Math.max(0, Math.min(SLIDES.length - 1, (parseInt(h[0]) || 1) - 1));
vi = Math.max(0, Math.min(SLIDES[si].variants.length - 1, (parseInt(h[1]) || 1) - 1));
if (location.search.includes("grid")) grid = true;
if (location.search.includes("notes")) notesEl.classList.add("on");
render();

/* Alignment and colour audit: renders every variation, then measures the content box and the dominant colours. */
window.__audit = async (waitMs = 11500, from = 0, to = SLIDES.length) => {
  const out = [], keys = ["orange", "yellow", "green", "blue", "lilac", "mute", "ink", "dim", "quiet"];
  const near = (css) => { const m = String(css).match(/\d+/g); if (!m || m.length < 3) return null; const [r, g, b] = m.map(Number); let best = null, bd = 1e9; for (const k of keys) { const n = parseInt(COL[k].slice(1), 16), d = (r - (n >> 16)) ** 2 + (g - ((n >> 8) & 255)) ** 2 + (b - (n & 255)) ** 2; if (d < bd) { bd = d; best = k; } } return bd < 6000 ? best : null; };
  grid = true; labels = false;
  for (let s = from; s < to; s++) {
    si = s; vi = 0; render(); await new Promise((r) => setTimeout(r, waitMs));
    views.forEach((v, i) => {
      const st = v.st, rect0 = st.getBoundingClientRect(), k = rect0.width / 1920;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const area = {};
      st.querySelectorAll(".o, .t").forEach((el) => {
        const cs = getComputedStyle(el); if (+cs.opacity < 0.25 || cs.pointerEvents === "none") return;
        let r;
        if (el.classList.contains("t")) { const rg = document.createRange(); rg.selectNodeContents(el); r = rg.getBoundingClientRect(); } else r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const l = (r.left - rect0.left) / k, t = (r.top - rect0.top) / k, rr = (r.right - rect0.left) / k, b = (r.bottom - rect0.top) / k;
        if (rr < 0 || l > 1920 || b < 0 || t > 1080) return;
        const inner = el.firstChild && el.firstChild.tagName === "I" ? cs.getPropertyValue("--bg") : cs.backgroundColor, col = near(inner);
        if (col && el.classList.contains("o")) area[col] = (area[col] || 0) + (r.width / k) * (r.height / k);
        x0 = Math.min(x0, l); y0 = Math.min(y0, t); x1 = Math.max(x1, rr); y1 = Math.max(y1, b);
      });
      const top = Object.entries(area).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([c]) => c);
      out.push({ slide: s + 1, variant: i + 1, name: SLIDES[s].variants[i].name, dx: Math.round((x0 + x1) / 2 - 960), dy: Math.round((y0 + y1) / 2 - 540), w: Math.round(x1 - x0), h: Math.round(y1 - y0), colors: top });
    });
    window.__auditProgress = s + 1;
  }
  window.__auditResult = out;
};
