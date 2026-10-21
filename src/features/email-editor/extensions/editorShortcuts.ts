import { Extension, type Editor } from "@tiptap/react";

/**
 * Shortcuts that differ from TipTap's defaults (design decisions):
 * - Quote is ⌘> (Ctrl+> on Windows); ⌘⇧B toggles Chrome's bookmarks bar.
 * - Heading inside a list turns that item into a heading and splits the list around it.
 * Lists start from Markdown-style typing ("- ", "* ", "1. "), which StarterKit already handles.
 */
export const EditorShortcuts = Extension.create({
  name: "emailEditorShortcuts",

  addKeyboardShortcuts() {
    return {
      "Mod->": () => this.editor.commands.toggleBlockquote(),
      "Mod-Shift-.": () => this.editor.commands.toggleBlockquote(),
      "Mod-Alt-1": () => toggleHeading(this.editor),
    };
  },
});

/** Heading on a list item lifts it out of the list first. */
export function toggleHeading(editor: Editor): boolean {
  if (editor.isActive("listItem")) {
    return editor.chain().focus().liftListItem("listItem").setHeading({ level: 1 }).run();
  }
  return editor.chain().focus().toggleHeading({ level: 1 }).run();
}
