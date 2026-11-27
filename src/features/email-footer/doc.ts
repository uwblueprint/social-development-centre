/*
 * The footer at the end of every email SDC sends, as a small rich-text document (TipTap JSON, the same shape
 * the email editor stores). Admins edit it in Settings; the sender renders it under each email when it goes
 * out, so anything not sent yet gets the latest footer. Backend: docs/backend/settings.md.
 *
 * Three links are fixed parts of it, as `footerLink` nodes: the unsubscribe link (the law requires a way out in
 * every email), the cancel-membership link, and the refer link to the member's own refer-a-friend page. They can
 * be moved by typing around them, never removed or doubled. The refer link's words are the admins' to choose
 * (`attrs.label`); the other two always say the same thing.
 */

/** TipTap JSON, typed loosely: it comes from the database. */
export type FooterDoc = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: FooterDoc[];
};

export const FOOTER_LINKS = {
  unsubscribe: "Unsubscribe from emails",
  cancel: "Cancel membership",
  refer: "Refer a friend",
} as const;

export type FooterLinkKind = keyof typeof FOOTER_LINKS;

/** Most footers are a few lines; this stops a pasted document, not a long address. */
export const FOOTER_MAX_CHARS = 1000;

const text = (t: string): FooterDoc => ({ type: "text", text: t });
const link = (kind: FooterLinkKind): FooterDoc => ({ type: "footerLink", attrs: { kind } });

// ---------- the refer link's words (from #95) ----------

/** The refer link's words: up to this many characters. The database checks the same (set_email_footer). */
export const REFER_LINK_MAX = 40;

/** Line breaks, tabs and runs of spaces become one space; then trimmed. What gets stored. */
export const normalizeReferText = (value: string) => value.replace(/\s+/g, " ").trim();

// Control and invisible formatting characters (soft hyphen, zero-width, bidi overrides, BOM), and < >.
const UNSAFE = /[<>\p{Cc}\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]/u;
// Text that reads as an address: spam filters flag a link whose text doesn't match where it goes.
const LOOKS_LIKE_ADDRESS = /@|:\/\/|www\./i;

/** The error to show for the refer link's words, or undefined if they can be saved. Expects normalized text. */
export function referTextError(text: string): string | undefined {
  if (!text) return "Enter the link text. The link stays in every email, so it needs words.";
  // Counted in characters as the database counts them, so an emoji is one.
  if ([...text].length > REFER_LINK_MAX) return `Use ${REFER_LINK_MAX} characters or fewer.`;
  if (LOOKS_LIKE_ADDRESS.test(text)) return "Use words, not a web or email address.";
  if (UNSAFE.test(text)) return "Remove the < or > or any hidden characters.";
  return undefined;
}

/** What a fixed link says. The refer link uses its saved words, or the default if they're missing or unusable. */
export function linkLabel(node: FooterDoc): string {
  const kind = node.attrs?.kind as FooterLinkKind;
  if (kind === "refer") {
    const saved = normalizeReferText(typeof node.attrs?.label === "string" ? node.attrs.label : "");
    return saved && !referTextError(saved) ? saved : FOOTER_LINKS.refer;
  }
  return FOOTER_LINKS[kind] ?? "";
}

/** The refer link's words in a footer (its label, or the default). */
export function referText(doc: FooterDoc): string {
  let found: FooterDoc | null = null;
  const walk = (n: FooterDoc) => {
    if (!found && n.type === "footerLink" && n.attrs?.kind === "refer") found = n;
    n.content?.forEach(walk);
  };
  walk(doc);
  return found ? linkLabel(found) : FOOTER_LINKS.refer;
}

/** The footer with the refer link's words set. */
export function withReferText(doc: FooterDoc, label: string): FooterDoc {
  const walk = (n: FooterDoc): FooterDoc =>
    n.type === "footerLink" && n.attrs?.kind === "refer"
      ? { ...n, attrs: { ...n.attrs, label: normalizeReferText(label) } }
      : n.content
        ? { ...n, content: n.content.map(walk) }
        : n;
  return walk(doc);
}

/**
 * A footer saved before the refer link existed gets it, right after Unsubscribe (" · Refer a friend"), so every
 * email has it without anyone re-saving. Anything else is returned as is.
 */
export function withReferLink(doc: FooterDoc): FooterDoc {
  if (countLinks(doc).refer > 0) return doc;
  let added = false;
  const walk = (n: FooterDoc): FooterDoc => {
    if (added || !n.content) return n;
    const i = n.content.findIndex((c) => c.type === "footerLink" && c.attrs?.kind === "unsubscribe");
    if (i >= 0) {
      added = true;
      return { ...n, content: [...n.content.slice(0, i + 1), text(" · "), link("refer"), ...n.content.slice(i + 1)] };
    }
    return { ...n, content: n.content.map(walk) };
  };
  const next = walk(doc);
  // No unsubscribe link to sit beside (not a saveable footer): its own line at the end.
  return added ? next : { ...doc, content: [...(doc.content ?? []), { type: "paragraph", content: [link("refer")] }] };
}

/** The footer before anyone edits it: the one Automatic emails shows today (src/features/automatic-emails/footer.ts). */
export function defaultFooterDoc(): FooterDoc {
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [text("Social Development Centre Waterloo Region")] },
      { type: "paragraph", content: [text("Mailing address to come · suhanya@waterlooregion.org")] },
      {
        type: "paragraph",
        content: [
          text("You're getting this because you're an SDC member. "),
          link("unsubscribe"),
          text(" · "),
          link("refer"),
          text(" · "),
          link("cancel"),
        ],
      },
    ],
  };
}

/** How many of each fixed link a document has. */
export function countLinks(doc: FooterDoc): Record<FooterLinkKind, number> {
  const counts: Record<FooterLinkKind, number> = { unsubscribe: 0, cancel: 0, refer: 0 };
  const walk = (n: FooterDoc) => {
    const kind = n.type === "footerLink" ? (n.attrs?.kind as FooterLinkKind) : null;
    if (kind && kind in counts) counts[kind] += 1;
    n.content?.forEach(walk);
  };
  walk(doc);
  return counts;
}

/** The footer's words, without the fixed links. */
export function footerWords(doc: FooterDoc): string {
  const out: string[] = [];
  const walk = (n: FooterDoc) => {
    if (n.type === "text" && n.text) out.push(n.text);
    n.content?.forEach(walk);
  };
  walk(doc);
  return out.join("").replace(/[·\s]+/g, " ").trim();
}

/** Null when the footer can be saved, or why not. The same check runs in the editor and on the server. */
export function footerProblem(doc: FooterDoc): string | null {
  if (doc?.type !== "doc" || !Array.isArray(doc.content)) return "The footer couldn’t be read. Reload the page and try again.";
  const counts = countLinks(doc);
  if (counts.unsubscribe !== 1 || counts.cancel !== 1 || counts.refer !== 1)
    return "The footer needs its unsubscribe, refer and cancel links. Reload the page to get them back.";
  const refer = referTextError(normalizeReferText(referText(doc)));
  if (refer) return refer;
  if (!footerWords(doc)) return "Write the footer members see at the end of every email.";
  if (footerWords(doc).length > FOOTER_MAX_CHARS) return `Keep the footer under ${FOOTER_MAX_CHARS} characters.`;
  return null;
}

/** Where each fixed link goes for one email. A link with no address yet is left out of the email. */
export type FooterUrls = Partial<Record<FooterLinkKind, string>>;

/** Literal colours: email clients can't read the kit's CSS variables (render.ts does the same). */
const MUTED = "#6b6b6b";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/**
 * The fixed links that go out today, each with the page it opens. Cancel membership has no page yet, so the
 * sender leaves it out (and so do the previews, so they show what members get). The refer link goes to members
 * only (`email_deliveries.can_refer`).
 */
export const SENT_LINKS: FooterLinkKind[] = ["unsubscribe", "refer"];

/** A paragraph's inline nodes, with any link that has no address dropped along with the " · " before it. */
export function inline(nodes: FooterDoc[] = [], urls: FooterUrls): FooterDoc[] {
  const out: FooterDoc[] = [];
  for (const n of nodes) {
    if (n.type === "footerLink" && !urls[n.attrs?.kind as FooterLinkKind]) {
      const prev = out.at(-1);
      if (prev?.type === "text" && prev.text) out[out.length - 1] = { ...prev, text: prev.text.replace(/\s*·\s*$/, " ") };
      continue;
    }
    out.push(n);
  }
  return out;
}

/** The footer as email HTML: small, muted lines; bold, italic and underline kept; the fixed links as links. */
export function footerHtml(doc: FooterDoc, urls: FooterUrls): string {
  const paragraphs = (doc.content ?? []).map((p) => {
    const body = inline(p.content, urls)
      .map((n) => {
        if (n.type === "hardBreak") return "<br>";
        if (n.type === "footerLink") {
          const kind = n.attrs?.kind as FooterLinkKind;
          return `<a href="${escape(urls[kind] ?? "")}" style="color:${MUTED}">${escape(linkLabel(n))}</a>`;
        }
        let out = escape(n.text ?? "");
        for (const m of n.marks ?? []) {
          if (m.type === "bold") out = `<strong>${out}</strong>`;
          else if (m.type === "italic") out = `<em>${out}</em>`;
          else if (m.type === "underline") out = `<u>${out}</u>`;
        }
        return out;
      })
      .join("");
    return `<p style="margin:0">${body || "&nbsp;"}</p>`;
  });
  return `<div style="font-size:12px;line-height:1.5;color:${MUTED}">${paragraphs.join("")}</div>`;
}

/** The footer as plain text, each fixed link written out with its address. */
export function footerText(doc: FooterDoc, urls: FooterUrls): string {
  return (doc.content ?? [])
    .map((p) =>
      inline(p.content, urls)
        .map((n) => {
          if (n.type === "hardBreak") return "\n";
          if (n.type === "footerLink") {
            const kind = n.attrs?.kind as FooterLinkKind;
            return `${linkLabel(n)}: ${urls[kind]}`;
          }
          return n.text ?? "";
        })
        .join("")
        .trimEnd(),
    )
    .join("\n");
}
