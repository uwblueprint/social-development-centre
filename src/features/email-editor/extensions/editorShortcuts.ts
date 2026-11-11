import { Blockquote } from "@tiptap/extension-blockquote";
import { Extension, type Editor } from "@tiptap/react";

/** Quote without TipTap's ⌘⇧B, which toggles Chrome's bookmarks bar. ⌘> is bound in EditorShortcuts. */
export const EmailBlockquote = Blockquote.extend({
  addKeyboardShortcuts() {
    return {};
  },
});

/**
 * Shortcuts that differ from TipTap's defaults (design decisions):
 * - Quote is ⌘> (Ctrl+> on Windows); ⌘⇧B toggles Chrome's bookmarks bar, so EmailBlockquote drops it.
 * - Highlight is ⌘⇧H.
 * - Strikethrough is ⌘⇧X, as the toolbar tooltip says (TipTap's own ⌘⇧S keeps working too).
 * - Heading inside a list turns that item into a heading and splits the list around it.
 * - Backspace or Delete on an empty bullet or number removes the bullet: the line becomes a plain paragraph.
 * Lists start from Markdown-style typing ("- ", "* ", "1. "), which StarterKit already handles.
 */
export const EditorShortcuts = Extension.create({
  name: "emailEditorShortcuts",
  // Ahead of StarterKit's list keymap, which would join an empty item into the one above.
  priority: 1000,

  addKeyboardShortcuts() {
    return {
      // ProseMirror matches a shifted letter by its capital, so this must be "X", not "x".
      "Mod-Shift-X": () => this.editor.commands.toggleStrike(),
      "Mod-Shift-H": () => this.editor.commands.toggleHighlight(),
      "Mod->": () => this.editor.commands.toggleBlockquote(),
      "Mod-Shift-.": () => this.editor.commands.toggleBlockquote(),
      "Mod-Alt-1": () => toggleHeading(this.editor),
      Backspace: () => removeEmptyListItem(this.editor),
      Delete: () => removeEmptyListItem(this.editor),
    };
  },
});

/** On an empty list item, lift it out of the list. Otherwise let the default key behaviour run. */
function removeEmptyListItem(editor: Editor): boolean {
  const { selection } = editor.state;
  const { $from } = selection;
  if (!selection.empty || $from.depth < 2) return false;
  const inItem = $from.node(-1).type.name === "listItem";
  const emptyLine = $from.parent.content.size === 0;
  if (!inItem || !emptyLine) return false;
  return editor.chain().liftListItem("listItem").run();
}

/** Heading on a list item lifts it out of the list first. */
export function toggleHeading(editor: Editor): boolean {
  if (editor.isActive("listItem")) {
    return editor.chain().focus().liftListItem("listItem").setHeading({ level: 1 }).run();
  }
  return editor.chain().focus().toggleHeading({ level: 1 }).run();
}
