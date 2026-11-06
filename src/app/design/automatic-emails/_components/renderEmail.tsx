import { Fragment, type ReactNode } from "react";
import type { JSONContent } from "@tiptap/react";
import { HIGHLIGHT_HEX } from "@/app/design/email-editor/extensions/emailHighlight";
import { variableById } from "@/app/design/email-editor/variables";

/** A member's details by variable id, and the fallbacks for details they don't have. */
type Values = Record<string, string>;

function fill(id: string, values: Values, fallbacks: Values) {
  return values[id] || (fallbacks[id] ?? variableById(id)?.fallback ?? "");
}

/** The editor's message JSON as the member would read it. Only what the editor allows: paragraphs, lists, bold, italic, links. */
export function renderEmailDoc(doc: JSONContent | undefined, values: Values, fallbacks: Values): ReactNode {
  function children(n: JSONContent): ReactNode {
    return (n.content ?? []).map((c, i) => <Fragment key={i}>{node(c)}</Fragment>);
  }
  function node(n: JSONContent): ReactNode {
    switch (n.type) {
      case "paragraph":
        return <p>{children(n)}</p>;
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
          if (m.type === "highlight") return <span style={{ backgroundColor: HIGHLIGHT_HEX }}>{inner}</span>;
          if (m.type === "link") {
            return (
              <a href={String(m.attrs?.href ?? "")} target="_blank" rel="noopener noreferrer">
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
