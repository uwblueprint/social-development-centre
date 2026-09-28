"use client";

import * as React from "react";

/**
 * Restores focus to the control that opened a dialog, sheet or panel. These are opened imperatively (a
 * menu item, a row, a button that isn't a Radix `Trigger`), so there's nothing for Radix to restore focus
 * to on its own. Call `capture()` synchronously in the click/select handler that opens the overlay — while
 * the real trigger still has focus — then pass `restore` to the overlay's `onCloseAutoFocus`. If the
 * captured element is gone by the time it closes (e.g. its row was replaced by a server refresh), focus
 * falls back to calling `onFallback` (e.g. focus a tab or heading that's still there).
 */
export function useReturnFocus(onFallback?: () => void) {
  const capturedRef = React.useRef<HTMLElement | null>(null);

  const capture = React.useCallback(() => {
    capturedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, []);

  const restore = React.useCallback(
    (event: { preventDefault: () => void }) => {
      event.preventDefault();
      const el = capturedRef.current;
      if (el && document.contains(el)) el.focus();
      else onFallback?.();
    },
    [onFallback],
  );

  return { capture, restore };
}
