import Highlight from "@tiptap/extension-highlight";

/** The one highlight colour, as a literal hex: email clients can't resolve CSS variables. Mirrors --color-highlight. */
export const HIGHLIGHT_HEX = "#fef08a";
export const HIGHLIGHT_STYLE = `background-color:${HIGHLIGHT_HEX}`;

/**
 * Highlight serialised for email: an inline-styled span, not <mark>, because Outlook desktop
 * doesn't reliably style <mark>. No classes, no variables, so the HTML survives SMTP as is.
 */
export const EmailHighlight = Highlight.extend({
  parseHTML() {
    return [
      { tag: "mark" },
      {
        tag: "span",
        getAttrs: (el) => ((el as HTMLElement).style.backgroundColor === "rgb(254, 240, 138)" ? null : false),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", { ...this.options.HTMLAttributes, ...HTMLAttributes, style: HIGHLIGHT_STYLE }, 0];
  },
});
