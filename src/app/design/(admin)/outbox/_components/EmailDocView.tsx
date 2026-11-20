import * as React from "react";
import { styled } from "next-yak";
import type { JSONContent } from "@tiptap/react";

/*
 * A small, static view of an Email Editor document, for places too light for a read-only editor (the bulk dialog's
 * "Show email"). It draws the same nodes and marks the editor makes, with the editor's text styles. The email view
 * uses it too, with `tight` and `inline`. Personalized text must already be filled in (see `fillFor`).
 */

function marked(node: JSONContent, key: React.Key): React.ReactNode {
  let out: React.ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") out = <strong>{out}</strong>;
    else if (mark.type === "italic") out = <em>{out}</em>;
    else if (mark.type === "underline") out = <u>{out}</u>;
    else if (mark.type === "strike") out = <s>{out}</s>;
    else if (mark.type === "highlight") out = <Highlight>{out}</Highlight>;
    else if (mark.type === "link") {
      out = (
        <a href={String(mark.attrs?.href ?? "")} target="_blank" rel="noopener noreferrer">
          {out}
        </a>
      );
    }
  }
  return <React.Fragment key={key}>{out}</React.Fragment>;
}

function render(node: JSONContent, key: React.Key): React.ReactNode {
  const children = () => (node.content ?? []).map((c, i) => render(c, i));
  switch (node.type) {
    case "text":
      return marked(node, key);
    case "hardBreak":
      return <br key={key} />;
    case "paragraph":
      // An empty paragraph is a blank line.
      return <p key={key}>{node.content?.length ? children() : <br />}</p>;
    case "heading":
      return <h3 key={key}>{children()}</h3>;
    case "bulletList":
      return <ul key={key}>{children()}</ul>;
    case "orderedList":
      return <ol key={key}>{children()}</ol>;
    case "listItem":
      return <li key={key}>{children()}</li>;
    case "blockquote":
      return <blockquote key={key}>{children()}</blockquote>;
    case "emailImage":
      // eslint-disable-next-line @next/next/no-img-element -- the image is the member-facing email's own, at a URL we don't control
      return <img key={key} src={String(node.attrs?.src ?? "")} alt={String(node.attrs?.alt ?? "")} width={node.attrs?.width ?? undefined} />;
    default:
      return <React.Fragment key={key}>{children()}</React.Fragment>;
  }
}

interface EmailDocViewProps {
  doc: JSONContent;
  className?: string;
  /** Plain-text spacing: no margins between blocks, so a paragraph is a line and an empty one is a blank line. */
  tight?: boolean;
  /** For a single line such as a subject: the paragraphs' text runs inline, with no block around it. */
  inline?: boolean;
}

export function EmailDocView({ doc, className, tight, inline }: EmailDocViewProps) {
  const blocks = doc.content ?? [];
  if (inline) {
    return (
      <InlineRoot className={className}>
        {blocks.map((n, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {(n.content ?? []).map((c, j) => render(c, j))}
          </React.Fragment>
        ))}
      </InlineRoot>
    );
  }
  return (
    <Root className={className} data-tight={tight ? "" : undefined}>
      {blocks.map((n, i) => render(n, i))}
    </Root>
  );
}

const InlineRoot = styled.span`
  overflow-wrap: anywhere;

  & a {
    color: var(--color-mention);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
`;

const Highlight = styled.span`
  background-color: var(--color-highlight);
  border-radius: var(--radius-sm);
`;

/* The editor's own text styles (email-editor/components/MessageField.tsx), so a body reads the same here and there. */
const Root = styled.div`
  overflow-wrap: anywhere;

  & > :first-child {
    margin-top: 0;
  }
  & > :last-child {
    margin-bottom: 0;
  }
  & p {
    margin: 0 0 var(--space-4);
  }
  & h3 {
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    line-height: var(--leading-heading);
    margin: var(--space-5) 0 var(--space-2);
  }
  & ul,
  & ol {
    margin: 0 0 var(--space-4);
    padding-left: var(--space-5);
  }
  & li > p {
    margin: 0 0 var(--space-1);
  }
  & blockquote {
    margin: 0 0 var(--space-4);
    padding-left: var(--space-3);
    border-left: 2px solid var(--color-border-strong);
    color: var(--color-text-muted);
  }
  & a {
    color: var(--color-mention);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
  & img {
    display: block;
    max-width: 100%;
    height: auto;
  }

  /* Tight: the spacing plain text had. Blocks sit on consecutive lines. */
  &[data-tight] p,
  &[data-tight] h3,
  &[data-tight] ul,
  &[data-tight] ol,
  &[data-tight] blockquote,
  &[data-tight] li > p {
    margin: 0;
  }
`;
