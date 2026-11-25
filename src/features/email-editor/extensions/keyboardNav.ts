import { suggestionKey } from "./personalizedText";
import { Extension } from "@tiptap/react";
import { Selection } from "@tiptap/pm/state";

/** The editor's DOM element gets these events; the host component listens (keeps refs out of the extension setup). */
export const LEAVE_TO_SUBJECT = "email-leave-to-subject";
export const FOCUS_TOOLBAR = "email-focus-toolbar";

/**
 * Keyboard path through the email (design decisions):
 * - Subject: Enter or Tab moves into the body (caret at the start). Shift+Tab is the browser's.
 * - Body: Shift+Tab at the very start returns to the subject (caret at the end).
 *   Tab indents inside lists; elsewhere it moves to the toolbar's first button (no tab characters).
 *   Escape blurs the editor so Tab continues from here. In the toolbar: arrows/Home/End rove, Shift+Tab or Escape return to the body, Tab leaves.
 */
export const BodyKeyboard = Extension.create({
  name: "emailBodyKeyboard",
  // Ahead of the list keymap, so Shift+Tab at the very start leaves instead of lifting a list item.
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      "Shift-Tab": ({ editor }) => {
        const { selection, doc } = editor.state;
        if (!selection.empty || selection.from > Selection.atStart(doc).from) return false;
        editor.view.dom.dispatchEvent(new CustomEvent(LEAVE_TO_SUBJECT));
        return true;
      },
      Tab: ({ editor }) => {
        // While the "@" list is open, Tab accepts the highlighted detail.
        if (suggestionKey.getState(editor.state)?.active) return false;
        // In a list item that can indent, Tab indents; everywhere else it moves to the toolbar.
        if (editor.can().sinkListItem("listItem")) return false;
        editor.view.dom.dispatchEvent(new CustomEvent(FOCUS_TOOLBAR));
        return true;
      },
    };
  },
});

/** Escape blurs. Runs after the "@" list, which uses Escape to close itself. */
export const EscapeBlur = Extension.create({
  name: "emailEscapeBlur",
  priority: 50,
  addKeyboardShortcuts() {
    return {
      Escape: ({ editor }) => {
        editor.commands.blur();
        return true;
      },
    };
  },
});
