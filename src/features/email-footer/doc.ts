/*
 * The footer at the end of every email SDC sends, as a small rich-text document (TipTap JSON, the same shape
 * the email editor stores). Admins edit it in Settings; the sender renders it under each email when it goes
 * out, so anything not sent yet gets the latest footer. Backend: docs/backend/settings.md.
 *
 * Two links are fixed parts of it, as `footerLink` nodes: the unsubscribe link (the law requires a way out in
 * every email) and the cancel-membership link. They can be moved by typing around them, never removed or doubled.
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
} as const;

export type FooterLinkKind = keyof typeof FOOTER_LINKS;

/** Most footers are a few lines; this stops a pasted document, not a long address. */
export const FOOTER_MAX_CHARS = 1000;

const text = (t: string): FooterDoc => ({ type: "text", text: t });
const link = (kind: FooterLinkKind): FooterDoc => ({ type: "footerLink", attrs: { kind } });

/** The footer before anyone edits it: the one Automatic emails shows today (src/features/automatic-emails/footer.ts). */
export function defaultFooterDoc(): FooterDoc {
  return {
    type: "doc",
    content: [
      { type: "paragraph", content: [text("Social Development Centre Waterloo Region")] },
      { type: "paragraph", content: [text("Mailing address to come · suhanya@waterlooregion.org")] },
      {
        type: "paragraph",
        content: [text("You're getting this because you're an SDC member. "), link("unsubscribe"), text(" · "), link("cancel")],
      },
    ],
  };
}

/** How many of each fixed link a document has. */
export function countLinks(doc: FooterDoc): Record<FooterLinkKind, number> {
  const counts: Record<FooterLinkKind, number> = { unsubscribe: 0, cancel: 0 };
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
  if (counts.unsubscribe !== 1 || counts.cancel !== 1) return "The footer needs its unsubscribe and cancel links. Reload the page to get them back.";
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

/** A paragraph's inline nodes, with any link that has no address dropped along with the " · " before it. */
function inline(nodes: FooterDoc[] = [], urls: FooterUrls): FooterDoc[] {
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
          return `<a href="${escape(urls[kind] ?? "")}" style="color:${MUTED}">${escape(FOOTER_LINKS[kind] ?? "")}</a>`;
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
            return `${FOOTER_LINKS[kind]}: ${urls[kind]}`;
          }
          return n.text ?? "";
        })
        .join("")
        .trimEnd(),
    )
    .join("\n");
}
