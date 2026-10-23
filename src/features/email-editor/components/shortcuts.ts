"use client";

import * as React from "react";

/**
 * Turns "mod+shift+X" into "⌘⇧X" on a Mac or "Ctrl+Shift+X" elsewhere.
 * Starts as Mac on the server so the first render matches, then corrects on the client.
 */
export function useShortcutLabel() {
  const [isMac, setIsMac] = React.useState(true);
  React.useEffect(() => {
    setIsMac(/Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent));
  }, []);
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

/** Opens the system file picker (the repo's pattern: no <input> in the tree). */
export function pickFiles(accept: string, onPick: (files: File[]) => void) {
  const input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = accept;
  input.addEventListener("change", () => onPick(Array.from(input.files ?? [])));
  input.click();
}
