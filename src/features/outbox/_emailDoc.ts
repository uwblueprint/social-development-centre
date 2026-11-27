import type { JSONContent } from "@tiptap/react";
import { VARIABLES } from "@/features/email-editor/variables";

/*
 * The single place the Outbox converts email content. An email's subject and message are the Email Editor's own
 * documents (TipTap JSON), so bold, links, lists, images and "personalized text" chips survive being saved. The
 * automatic emails' templates are authored as plain text with bracketed labels ("Hi [First name],") because that is
 * easy to read in the demo data; `templateDocs` turns them into documents once, and everything downstream deals in documents.
 */

const chip = (id: string): JSONContent => ({ type: "personalizedText", attrs: { id } });

/** "Hi [First name]," as editor JSON: each line is a paragraph (a blank line is an empty one), and a known label becomes a chip. */
export function textToDoc(text: string): JSONContent {
  return {
    type: "doc",
    content: text.split("\n").map((line) => {
      const content = line
        .split(/(\[[^\]]+\])/)
        .filter(Boolean)
        .map((part): JSONContent => {
          const v = VARIABLES.find((x) => `[${x.label}]` === part);
          return v ? chip(v.id) : { type: "text", text: part };
        });
      return content.length ? { type: "paragraph", content } : { type: "paragraph" };
    }),
  };
}

const templateCache = new WeakMap<object, { subject: JSONContent; body: JSONContent }>();

/** A template's subject and message as documents, built once per template. */
export function templateDocs(template: { subject: string; body: string }): { subject: JSONContent; body: JSONContent } {
  let docs = templateCache.get(template);
  if (!docs) {
    docs = { subject: textToDoc(template.subject), body: textToDoc(template.body) };
    templateCache.set(template, docs);
  }
  return docs;
}

/** True for a missing document or one with only empty paragraphs. A chip or an image counts as content. */
export function isEmptyDoc(doc?: JSONContent | null): boolean {
  if (!doc?.content?.length) return true;
  return doc.content.every((node) => node.type === "paragraph" && !node.content?.length);
}

/** A document in one canonical shape: sorted keys, no empty or null attributes, no empty marks, neighbouring text with the same marks joined. */
function canonical(node: JSONContent): unknown {
  const out: Record<string, unknown> = { type: node.type };
  if (node.text != null) out.text = node.text;
  const attrs = Object.entries(node.attrs ?? {}).filter(([, v]) => v != null && v !== "");
  if (attrs.length) out.attrs = Object.fromEntries(attrs.sort(([a], [b]) => a.localeCompare(b)));
  if (node.marks?.length) out.marks = node.marks.map((m) => canonical(m));
  if (node.content?.length) {
    const children: JSONContent[] = [];
    for (const child of node.content) {
      const last = children[children.length - 1];
      if (last?.type === "text" && child.type === "text" && JSON.stringify(canonical({ ...last, text: "" })) === JSON.stringify(canonical({ ...child, text: "" }))) {
        children[children.length - 1] = { ...last, text: (last.text ?? "") + (child.text ?? "") };
      } else children.push(child);
    }
    out.content = children.map(canonical);
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

/** Whether two documents say the same thing. Used to tell an edit that is back to the template from a real one. */
export function docsEqual(a: JSONContent | null | undefined, b: JSONContent | null | undefined): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
}

/** Replaces each personalized-text chip with the text `resolve` gives for it (nothing when empty). Everything else is kept. */
export function fillDoc(doc: JSONContent, resolve: (variableId: string) => string): JSONContent {
  if (!doc.content) return doc;
  const content: JSONContent[] = [];
  for (const node of doc.content) {
    if (node.type === "personalizedText") {
      const text = resolve(String(node.attrs?.id));
      if (text) content.push({ type: "text", text });
    } else content.push(fillDoc(node, resolve));
  }
  return { ...doc, content };
}

/**
 * The document as plain text. Paragraphs are lines; lists get "- " or "1. "; quotes get "> "; a link reads "text (url)".
 * With `resolve`, chips become the member's values; without it they read "[First name]".
 */
export function docToPlainText(doc: JSONContent | null | undefined, resolve?: (variableId: string) => string): string {
  if (!doc) return "";
  const inline = (node: JSONContent): string => {
    if (node.type === "text") {
      const href = node.marks?.find((m) => m.type === "link")?.attrs?.href as string | undefined;
      const text = node.text ?? "";
      return href && href !== text ? `${text} (${href})` : text;
    }
    if (node.type === "hardBreak") return "\n";
    if (node.type === "personalizedText") {
      const id = String(node.attrs?.id);
      return resolve ? resolve(id) : `[${VARIABLES.find((v) => v.id === id)?.label ?? "?"}]`;
    }
    return (node.content ?? []).map(inline).join("");
  };
  const block = (node: JSONContent): string[] => {
    switch (node.type) {
      case "bulletList":
      case "orderedList":
        return (node.content ?? []).map((item, i) => {
          const [first, ...rest] = (item.content ?? []).flatMap(block);
          const bullet = node.type === "orderedList" ? `${i + 1}. ` : "- ";
          return [`${bullet}${first ?? ""}`, ...rest.map((l) => `   ${l}`)].join("\n");
        });
      case "blockquote":
        return (node.content ?? []).flatMap(block).map((l) => `> ${l}`);
      case "emailImage":
        return node.attrs?.alt ? [`[${node.attrs.alt}]`] : [];
      default:
        return [inline(node)];
    }
  };
  return (doc.content ?? []).flatMap(block).join("\n");
}
