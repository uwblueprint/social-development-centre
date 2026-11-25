import { Fragment, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/react";
import { HIGHLIGHT_HEX } from "@/features/email-editor/extensions/emailHighlight";
import { variableById } from "@/features/email-editor/variables";

/** A member's details by variable id, and the fallbacks for details they don't have. */
type Values = Record<string, string>;

function fill(id: string, values: Values, fallbacks: Values) {
  return values[id] || (fallbacks[id] ?? variableById(id)?.fallback ?? "");
}

/**
 * The editor's message JSON as the member would read it. Only what the editor allows: paragraphs, one
 * heading level, lists, quotes, images, bold, italic, underline, strikethrough, highlight and links.
 * The sender renders the same nodes (render.ts).
 */
export function renderEmailDoc(doc: JSONContent | undefined, values: Values, fallbacks: Values): ReactNode {
  function children(n: JSONContent): ReactNode {
    return (n.content ?? []).map((c, i) => <Fragment key={i}>{node(c)}</Fragment>);
  }
  function node(n: JSONContent): ReactNode {
    switch (n.type) {
      case "paragraph":
        return <p>{children(n)}</p>;
      case "heading":
        return <h1>{children(n)}</h1>;
      case "blockquote":
        return <blockquote>{children(n)}</blockquote>;
      case "emailImage": {
        const src = String(n.attrs?.src ?? "");
        // Same rule as the sender: only images stored at an https address go out.
        if (!src.startsWith("https://")) return null;
        const width = Math.min(Number(n.attrs?.width) || 600, 600);
        // eslint-disable-next-line @next/next/no-img-element -- an email image, shown as the email will show it
        return <img src={src} alt={String(n.attrs?.alt ?? "")} width={width} style={{ maxWidth: "100%", height: "auto" }} />;
      }
      case "bulletList":
        return <ul>{children(n)}</ul>;
      case "orderedList":
        return <ol>{children(n)}</ol>;
      case "listItem":
        return <li>{children(n)}</li>;
      case "hardBreak":
        return <br />;
      case "personalizedText":
        return fill(String(n.attrs?.id), values, fallbacks);
      case "text":
        return (n.marks ?? []).reduce<ReactNode>((inner, m) => {
          if (m.type === "bold") return <strong>{inner}</strong>;
          if (m.type === "italic") return <em>{inner}</em>;
          if (m.type === "underline") return <u>{inner}</u>;
          if (m.type === "strike") return <s>{inner}</s>;
          if (m.type === "highlight") return <span style={{ backgroundColor: HIGHLIGHT_HEX }}>{inner}</span>;
          if (m.type === "link") {
            const href = String(m.attrs?.href ?? "");
            // Same rule as the sender: only web links stay links.
            if (!/^https?:\/\//i.test(href)) return inner;
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            );
          }
          return inner;
        }, n.text ?? "");
      default:
        return children(n);
    }
  }
  return children(doc ?? {});
}

/** The subject line as plain text, filled in for one member. */
export function renderEmailText(doc: JSONContent | undefined, values: Values, fallbacks: Values): string {
  function walk(n: JSONContent): string {
    if (n.type === "text") return n.text ?? "";
    if (n.type === "personalizedText") return fill(String(n.attrs?.id), values, fallbacks);
    return (n.content ?? []).map(walk).join("");
  }
  return walk(doc ?? {});
}
