"use client";

import * as React from "react";

const subscribeNever = () => () => {};
const detectMac = () => /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
const serverIsMac = () => true;

/**
 * Turns "mod+shift+X" into "⌘⇧X" on a Mac or "Ctrl+Shift+X" elsewhere.
 * Renders as Mac on the server so hydration matches, then corrects on the client.
 */
export function useShortcutLabel() {
  const isMac = React.useSyncExternalStore(subscribeNever, detectMac, serverIsMac);
  return React.useCallback(
    (keys: string) =>
      keys
        .split("+")
        .map((k) => (isMac ? ({ mod: "⌘", shift: "⇧", alt: "⌥" } as Record<string, string>)[k] ?? k : ({ mod: "Ctrl", shift: "Shift", alt: "Alt" } as Record<string, string>)[k] ?? k))
        .join(isMac ? "" : "+"),
    [isMac],
  );
}

/** "https://" is added when someone types a bare domain; anything else that isn't a web link is rejected. */
export function normalizeUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!/\.[a-z]{2,}$/i.test(url.hostname)) return null;
    return value;
  } catch {
    return null;
  }
}
