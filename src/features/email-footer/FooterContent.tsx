import { inline, linkLabel, SENT_LINKS, type FooterDoc, type FooterLinkKind } from "./doc";

/**
 * The saved footer as members will see it, for the previews (the automatic email editor, its preview dialog
 * and the Outbox): one line per paragraph, bold, italic and underline kept, and the fixed links shown
 * underlined. Links that don't go out yet are left out, as the sender does (render.ts).
 */
export function FooterContent({ doc }: { doc: FooterDoc }) {
  const sent = Object.fromEntries(SENT_LINKS.map((k) => [k, "#"])) as Partial<Record<FooterLinkKind, string>>;
  return (
    <>
      {(doc.content ?? []).map((p, i) => (
        <p key={i} style={{ margin: 0 }}>
          {inline(p.content, sent).map((n, j) => {
            if (n.type === "hardBreak") return <br key={j} />;
            if (n.type === "footerLink") return <u key={j}>{linkLabel(n)}</u>;
            let out: React.ReactNode = n.text ?? "";
            for (const m of n.marks ?? []) {
              if (m.type === "bold") out = <strong>{out}</strong>;
              else if (m.type === "italic") out = <em>{out}</em>;
              else if (m.type === "underline") out = <u>{out}</u>;
            }
            return <span key={j}>{out}</span>;
          })}
        </p>
      ))}
    </>
  );
}
