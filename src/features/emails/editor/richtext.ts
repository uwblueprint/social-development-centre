/*
 * Pure helpers for the email editor: sanitizing pasted/edited HTML to the allowed tag set, turning stored
 * `{{member.firstName}}` tokens into chips and back, and escaping. No React in here.
 *
 * Allowed output tags: p, strong, em, a[href], ul, ol, li, br. Everything else is dropped or unwrapped.
 * Literal "{" in text is stored as the entity &#123; so it can never be mistaken for a variable token.
 */
import { VARIABLES, type VarKey } from "../model";

const MARK_OPEN = "\uE000";
const MARK_CLOSE = "\uE001";
const MARKER_RE = new RegExp(`${MARK_OPEN}([a-zA-Z.]+)${MARK_CLOSE}`, "g");
const TOKEN_RE = /\{\{([a-zA-Z]+\.[a-zA-Z]+)\}\}/g;

export function isVarKey(key: string): key is VarKey {
  return VARIABLES.some((v) => v.key === key);
}

export function varDef(key: string) {
  return VARIABLES.find((v) => v.key === key);
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Escapes text and protects literal braces; chip markers become real tokens afterwards. */
function escapeText(text: string): string {
  return escapeHtml(text)
    .replace(/[{}]/g, (c) => (c === "{" ? "&#123;" : "&#125;"))
    .replace(MARKER_RE, (_m, key: string) => (isVarKey(key) ? `{{${key}}}` : ""));
}

function stripMarkers(s: string) {
  return s.replace(new RegExp(`[${MARK_OPEN}${MARK_CLOSE}\u200B\uFEFF]`, "g"), "");
}

export function safeHref(href: string | null): string | null {
  if (!href) return null;
  const h = href.trim();
  return /^(https?:\/\/|mailto:)[^\s]+$/i.test(h) ? h : null;
}

/** "example.org" becomes "https://example.org"; anything unsafe or malformed returns null. */
export function normalizeLink(input: string): string | null {
  const t = input.trim();
  if (!t) return null;
  if (/^(https?:\/\/|mailto:)/i.test(t)) return safeHref(t);
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return `mailto:${t}`;
  if (/^[^\s:/]+\.[^\s:/]{2,}(\/\S*)?$/.test(t)) return safeHref(`https://${t}`);
  return null;
}

const DROP = new Set(["script", "style", "head", "title", "meta", "link", "img", "svg", "object", "iframe", "noscript", "template", "video", "audio", "canvas", "button", "input", "select", "textarea", "form"]);
const BLOCK = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "pre", "section", "article", "header", "footer", "table", "thead", "tbody", "tr", "td", "th", "figure", "figcaption", "address", "dl", "dt", "dd", "hr", "body", "html"]);

function styleOf(el: Element): { bold: boolean; italic: boolean; normalWeight: boolean } {
  const s = (el.getAttribute("style") ?? "").toLowerCase();
  const w = /font-weight\s*:\s*([a-z0-9]+)/.exec(s)?.[1];
  const bold = w === "bold" || w === "bolder" || (w !== undefined && /^\d+$/.test(w) && Number(w) >= 600);
  const normalWeight = w === "normal" || (w !== undefined && /^\d+$/.test(w) && Number(w) < 600);
  return { bold, italic: /font-style\s*:\s*italic/.test(s), normalWeight };
}

function inline(node: Node, lists: string[][] | null): string {
  if (node.nodeType === 3) return escapeText((node.nodeValue ?? "").replace(/[\s\u00A0]+/g, " "));
  if (node.nodeType !== 1) return "";
  const el = node as Element;
  const tag = el.tagName.toLowerCase();
  if (DROP.has(tag)) return "";
  if (tag === "br") return "<br>";
  const inner = () => Array.from(el.childNodes).map((c) => inline(c, lists)).join("");
  const st = styleOf(el);
  let out: string;
  if (tag === "a") {
    const href = safeHref(el.getAttribute("href"));
    const body = inner();
    out = href && body.trim() ? `<a href="${escapeHtml(href)}">${body}</a>` : body;
  } else {
    out = inner();
  }
  const isBold = (tag === "strong" || tag === "b" ? !st.normalWeight : st.bold) && out.trim() !== "";
  const isItalic = (tag === "em" || tag === "i" || tag === "cite" || st.italic) && out.trim() !== "";
  if (isItalic) out = `<em>${out}</em>`;
  if (isBold) out = `<strong>${out}</strong>`;
  return out;
}

function tidy(s: string): string {
  let out = s;
  for (let i = 0; i < 2; i++) {
    out = out
      .replace(/<(strong|em)>\s*<\/\1>/g, "")
      .replace(/<\/strong><strong>/g, "")
      .replace(/<\/em><em>/g, "");
  }
  return out
    .replace(/^(\s|<br>)+/, "")
    .replace(/(\s|<br>)+$/, "")
    .replace(/ {2,}/g, " ");
}

function isEmptyInline(s: string) {
  return tidy(s).replace(/<br>|\s/g, "") === "";
}

function listItems(list: Element): string[] {
  const items: string[] = [];
  for (const child of Array.from(list.children)) {
    if (child.tagName.toLowerCase() !== "li") continue;
    let text = "";
    const nested: string[] = [];
    for (const c of Array.from(child.childNodes)) {
      if (c.nodeType === 1 && ["ul", "ol"].includes((c as Element).tagName.toLowerCase())) {
        nested.push(...listItems(c as Element));
      } else if (c.nodeType === 1 && BLOCK.has((c as Element).tagName.toLowerCase())) {
        text += " " + inline(c, null);
      } else {
        text += inline(c, null);
      }
    }
    if (!isEmptyInline(text)) items.push(tidy(text));
    items.push(...nested);
  }
  return items;
}

/** Walks a (already detached) element and returns allowed-tag HTML. */
export function sanitizeNode(root: Node): string {
  const blocks: string[] = [];
  let buf = "";
  const flush = () => {
    if (!isEmptyInline(buf)) blocks.push(`<p>${tidy(buf)}</p>`);
    buf = "";
  };
  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      buf += inline(node, null);
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    if (DROP.has(tag)) return;
    if (tag === "ul" || tag === "ol") {
      flush();
      const items = listItems(el);
      if (items.length) blocks.push(`<${tag}>${items.map((i) => `<li>${i}</li>`).join("")}</${tag}>`);
      return;
    }
    if (BLOCK.has(tag) && tag !== "td" && tag !== "th") {
      flush();
      Array.from(el.childNodes).forEach(walk);
      flush();
      return;
    }
    if (tag === "td" || tag === "th") {
      buf += " ";
      Array.from(el.childNodes).forEach(walk);
      return;
    }
    // Inline-ish elements: if they hold blocks, descend; else treat as inline text.
    if (el.querySelector("p,div,ul,ol,h1,h2,h3,h4,h5,h6,table,blockquote")) {
      Array.from(el.childNodes).forEach(walk);
      return;
    }
    buf += inline(el, null);
  };
  Array.from(root.childNodes).forEach(walk);
  flush();
  return blocks.join("");
}

/** For pasted or untrusted HTML. Strips fonts, colours, images, classes, everything not allowed. */
export function sanitizeHtml(dirty: string): string {
  const clean = stripMarkers(dirty);
  if (typeof DOMParser === "undefined") return `<p>${escapeText(clean.replace(/<[^>]*>/g, " ").trim())}</p>`;
  const doc = new DOMParser().parseFromString(clean, "text/html");
  return sanitizeNode(doc.body);
}

/** Plain text (clipboard text/plain) to paragraphs. */
export function textToHtml(text: string): string {
  const paras = stripMarkers(text)
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return paras.map((p) => `<p>${escapeText(p).replace(/\r?\n/g, "<br>")}</p>`).join("");
}

/* ---------- chips ---------- */

export interface ChipContext {
  /** Keys valid for the current moment. */
  valid: Set<string>;
  fallbackOf?: (key: VarKey) => string;
}

export function chipHtml(key: VarKey, ctx: ChipContext, interactive = true): string {
  const def = varDef(key);
  if (!def) return "";
  const ok = ctx.valid.has(key);
  const label = ok
    ? `${def.label} variable. Example: ${def.example}.${interactive ? " Press Enter to change its fallback." : ""}`
    : `${def.label} variable. It doesn't apply to this email. Remove it.`;
  return (
    `<span data-var="${key}" contenteditable="false" role="button" tabindex="-1"` +
    `${ok ? "" : ' data-invalid="true"'}${interactive ? "" : ' aria-disabled="true"'} aria-label="${escapeHtml(label)}">` +
    `${escapeHtml(def.label)}</span>`
  );
}

/** Stored body (tokens) to editor HTML (chips). Input is already sanitized stored HTML. */
export function bodyToEditorHtml(stored: string, ctx: ChipContext, interactive = true): string {
  return stored.replace(TOKEN_RE, (m, key: string) => (isVarKey(key) ? chipHtml(key, ctx, interactive) : m));
}

export function subjectToEditorHtml(stored: string, ctx: ChipContext, interactive = true): string {
  return escapeHtml(stored).replace(TOKEN_RE, (m, key: string) => (isVarKey(key) ? chipHtml(key, ctx, interactive) : m));
}

function withMarkers(root: HTMLElement): HTMLElement {
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll("[data-var]").forEach((chip) => {
    const key = chip.getAttribute("data-var") ?? "";
    chip.replaceWith(document.createTextNode(`${MARK_OPEN}${key}${MARK_CLOSE}`));
  });
  return clone;
}

/** Editor surface DOM to stored body HTML. */
export function editorToBody(root: HTMLElement): string {
  const clone = withMarkers(root);
  // Remove zero-width spaces used to park the caret after a chip.
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) n.nodeValue = (n.nodeValue ?? "").replace(/[\u200B\uFEFF]/g, "");
  return sanitizeNode(clone);
}

/** Editor surface DOM to a stored plain-text subject. */
export function editorToSubject(root: HTMLElement): string {
  const clone = withMarkers(root);
  const text = (clone.textContent ?? "").replace(/[\u200B\uFEFF]/g, "").replace(/\s+/g, " ").trim();
  return text.replace(/[{}]/g, "").replace(MARKER_RE, (_m, key: string) => (isVarKey(key) ? `{{${key}}}` : ""));
}

/** Cleans text pasted into the subject. */
export function cleanSubjectPaste(text: string): string {
  return stripMarkers(text).replace(/\s+/g, " ").replace(/[{}]/g, "");
}

/* ---------- reading stored content ---------- */

export function tokensIn(s: string): VarKey[] {
  const keys: VarKey[] = [];
  for (const m of s.matchAll(TOKEN_RE)) {
    const k = m[1];
    if (isVarKey(k) && !keys.includes(k)) keys.push(k);
  }
  return keys;
}

export function plainText(bodyHtml: string): string {
  return bodyHtml
    .replace(/<\/(p|li)>/g, " ")
    .replace(/<br>/g, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&#123;/g, "{")
    .replace(/&#125;/g, "}")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Messy HTML like Word or Google Docs puts on the clipboard, for the sandbox demo. */
export const WORD_SAMPLE_HTML = [
  "<html xmlns:o=\"urn:schemas-microsoft-com:office:office\"><head><meta charset=\"utf-8\"><style>p.MsoNormal{font-family:\"Calibri\"}</style></head><body>",
  "<!--[if gte mso 9]><xml><o:OfficeDocumentSettings></o:OfficeDocumentSettings></xml><![endif]-->",
  "<p class=\"MsoNormal\" style=\"font-family:Calibri;font-size:14pt;color:#C00000\"><span style=\"font-family:'Comic Sans MS';color:red\">Welcome to the <b>Social Development Centre</b>!</span><o:p></o:p></p>",
  "<div style=\"background:yellow\"><span style=\"font-weight:700\">We are glad</span> you are here. <i>Here is what happens next:</i> <a href=\"https://example.org/start\" style=\"color:blue\" target=\"_blank\">read our start guide</a>.</div>",
  "<img src=\"https://example.org/banner.png\" width=\"600\" height=\"200\">",
  "<ul style=\"margin-left:36pt\"><li style=\"font-size:11pt\"><span style=\"font-family:Arial\">Pick a volunteer opportunity</span></li><li>Come to a welcome night</li></ul>",
  "<p><a href=\"javascript:alert(1)\">A sneaky link</a> and <script>alert(1)</script>some text.</p>",
  "</body></html>",
].join("\n");

/** A subject for lists and titles: each variable shows as its label in brackets, never as raw {{token}} syntax. */
export function plainSubject(subject: string): string {
  return subject.replace(/\{\{([\w.]+)\}\}/g, (m, key: string) => {
    const def = varDef(key);
    return def ? `[${def.label}]` : m;
  });
}
