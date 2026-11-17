/*
 * Shared guards for the directory's keyboard shortcuts, mirroring the Outbox's selection bar: a shortcut
 * never fires while someone is typing, or while a dialog, menu or list of options has the keyboard.
 */

const TYPING = 'input, textarea, select, [contenteditable="true"], [role="combobox"]';

/** Whether the element is somewhere text is typed. */
export const isTyping = (el: EventTarget | null) => el instanceof HTMLElement && Boolean(el.closest(TYPING));

/** Whether the element is inside a menu, list of options or tab list, which own their own keys. */
export const inOwnWidget = (el: EventTarget | null) =>
  el instanceof HTMLElement && Boolean(el.closest('[role="menu"], [role="listbox"], [role="tablist"]'));

/** Whether a dialog, menu or list of options is open (one still animating shut doesn't count). The member sheet is a dialog too, so it can be let through. */
export const overlayOpen = (allowSheet = false) =>
  Array.from(
    document.querySelectorAll(
      `[role="alertdialog"], [role="menu"], [role="listbox"], [role="dialog"]${allowSheet ? ":not([data-member-sheet])" : ""}`,
    ),
  ).some((el) => el.getAttribute("data-state") !== "closed");

/** True for a plain key press: no Ctrl, Cmd or Alt (Shift is the caller's call). */
export const plain = (e: KeyboardEvent | React.KeyboardEvent) => !e.ctrlKey && !e.metaKey && !e.altKey;
