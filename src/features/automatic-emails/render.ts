import { VARIABLES, variableById } from "@/features/email-editor/variables";
import { EMAIL_FOOTER } from "./footer";
import type { OutgoingEmail } from "./sender";

/** Email Editor JSON (TipTap's JSONContent), as stored. Typed loosely: it comes from the database. */
export type Doc = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: { type: string; attrs?: Record<string, unknown> }[];
  content?: Doc[];
};

export type Delivery = {
  send_id: string;
  to_email: string;
  /** Plain text ("Welcome, [First name]"). Used when there's no subject_doc, e.g. an Outbox edit. */
  subject: string;
  subject_doc: Doc;
  body: Doc;
  /** The member's details by personalized field id ("first_name", "referrer_full_name"). */
  fields: Record<string, string>;
  unsubscribe_token: string;
};

/** Saved backup text by field id; a field with none uses its default from variables.ts. */
export type Fallbacks = Record<string, string>;

/**
 * Literal colours for the email's inline styles: email clients can't read the kit's CSS variables
 * (the editor's emailHighlight extension does the same). Highlight mirrors HIGHLIGHT_HEX there.
 */
const EMAIL_COLORS = {
  text: "#1f1f1f",
  muted: "#6b6b6b",
  quote: "#4a4a4a",
  rule: "#e5e5e5",
  quoteBorder: "#d4d4d4",
  link: "#1a5fb4",
  highlight: "#fef08a",
};

/**
 * One send as an email, filled in for its member. Only what the editor can make is rendered
 * (paragraphs, one heading level, lists, quotes, links, bold, italic, underline, strikethrough,
 * highlight, images and personalized text); anything else is dropped. Every value is escaped.
 */
export function renderDelivery(delivery: Delivery, origin: string, fallbacks: Fallbacks): OutgoingEmail {
  const fill = (id: string) => delivery.fields[id]?.trim() || (fallbacks[id] ?? variableById(id)?.fallback ?? "");
  const unsubscribeUrl = new URL(`/unsubscribe/${delivery.unsubscribe_token}`, origin).toString();

  const subject = isEmpty(delivery.subject_doc)
    ? delivery.subject.replace(/\[([^\]]+)\]/g, (whole, label: string) => {
        const v = VARIABLES.find((x) => x.label === label);
        return v ? fill(v.id) : whole;
      })
    : plain(delivery.subject_doc, fill).replace(/\s+/g, " ").trim();

  const footerLines = [EMAIL_FOOTER.organization, `${EMAIL_FOOTER.address} · ${EMAIL_FOOTER.contact}`];
  return {
    to: delivery.to_email,
    subject,
    unsubscribeUrl,
    text: `${plain(delivery.body, fill).trim()}\n\n--\n${footerLines.join("\n")}\n${EMAIL_FOOTER.reason}\nUnsubscribe: ${unsubscribeUrl}\n`,
    html:
      `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:${EMAIL_COLORS.text};max-width:600px">` +
      html(delivery.body, fill) +
      `<hr style="border:0;border-top:1px solid ${EMAIL_COLORS.rule};margin:24px 0 12px">` +
      `<div style="font-size:12px;line-height:1.5;color:${EMAIL_COLORS.muted}">` +
      footerLines.map((l) => `<p style="margin:0">${escape(l)}</p>`).join("") +
      `<p style="margin:0">${escape(EMAIL_FOOTER.reason)} <a href="${escape(unsubscribeUrl)}" style="color:${EMAIL_COLORS.muted}">Unsubscribe from emails</a></p>` +
      `</div></div>`,
  };
}

function isEmpty(doc: Doc | null | undefined) {
  return !doc?.content?.length;
}

function html(node: Doc, fill: (id: string) => string): string {
  const inner = () => (node.content ?? []).map((c) => html(c, fill)).join("");
  switch (node.type) {
    case "doc":
      return inner();
    case "paragraph":
      return `<p style="margin:0 0 12px">${inner() || "&nbsp;"}</p>`;
    case "heading":
      return `<h1 style="font-size:20px;line-height:1.3;margin:0 0 12px">${inner()}</h1>`;
    case "bulletList":
      return `<ul style="margin:0 0 12px;padding-left:24px">${inner()}</ul>`;
    case "orderedList":
      return `<ol style="margin:0 0 12px;padding-left:24px">${inner()}</ol>`;
    case "listItem":
      return `<li>${inner().replace(/<p style="margin:0 0 12px">/g, '<p style="margin:0">')}</li>`;
    case "blockquote":
      return `<blockquote style="margin:0 0 12px;padding-left:12px;border-left:3px solid ${EMAIL_COLORS.quoteBorder};color:${EMAIL_COLORS.quote}">${inner()}</blockquote>`;
    case "hardBreak":
      return "<br>";
    case "personalizedText":
      return escape(fill(String(node.attrs?.id ?? "")));
    case "emailImage": {
      const src = String(node.attrs?.src ?? "");
      if (!/^https:\/\//.test(src)) return "";
      const width = Math.min(Number(node.attrs?.width) || 600, 600);
      return `<p style="margin:0 0 12px"><img src="${escape(src)}" alt="${escape(String(node.attrs?.alt ?? ""))}" width="${width}" style="max-width:100%;height:auto"></p>`;
    }
    case "text":
      return (node.marks ?? []).reduce((text, mark) => {
        switch (mark.type) {
          case "bold":
            return `<strong>${text}</strong>`;
          case "italic":
            return `<em>${text}</em>`;
          case "underline":
            return `<u>${text}</u>`;
          case "strike":
            return `<s>${text}</s>`;
          case "highlight":
            return `<span style="background-color:${EMAIL_COLORS.highlight}">${text}</span>`;
          case "link": {
            const href = String(mark.attrs?.href ?? "");
            return /^https?:\/\//i.test(href) ? `<a href="${escape(href)}" style="color:${EMAIL_COLORS.link}">${text}</a>` : text;
          }
          default:
            return text;
        }
      }, escape(node.text ?? ""));
    default:
      return "";
  }
}

/** The same content as plain text: one line per paragraph, list items with a dash, links with their address. */
function plain(node: Doc, fill: (id: string) => string): string {
  const inner = (sep = "") => (node.content ?? []).map((c) => plain(c, fill)).join(sep);
  switch (node.type) {
    case "doc":
      return inner("\n");
    case "paragraph":
    case "heading":
    case "blockquote":
      return `${inner()}\n`;
    case "bulletList":
    case "orderedList":
      return `${inner()}`;
    case "listItem":
      return `- ${inner().trim()}\n`;
    case "hardBreak":
      return "\n";
    case "personalizedText":
      return fill(String(node.attrs?.id ?? ""));
    case "text": {
      const link = node.marks?.find((m) => m.type === "link");
      const href = String(link?.attrs?.href ?? "");
      return link && href && href !== node.text ? `${node.text} (${href})` : (node.text ?? "");
    }
    default:
      return inner();
  }
}

function escape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
