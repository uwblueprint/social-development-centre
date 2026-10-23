import { Extension, type Editor } from "@tiptap/react";

/**
 * Backspace or Delete on an empty bullet or number removes the bullet: the line becomes a plain paragraph.
 * Lists start from Markdown-style typing ("- ", "* ", "1. "), which StarterKit already handles.
 */
export const EditorShortcuts = Extension.create({
  name: "emailEditorShortcuts",
  // Ahead of StarterKit's list keymap, which would join an empty item into the one above.
  priority: 1000,

  addKeyboardShortcuts() {
    return {
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
