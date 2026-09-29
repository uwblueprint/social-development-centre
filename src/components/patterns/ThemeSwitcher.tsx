"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { styled } from "next-yak";
import { Icon } from "@/components/ui/Icon";
import { applyTheme, readTheme, THEME_STORAGE_KEY } from "@/lib/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

/** The theme on screen: a saved choice, or else the device setting. */
function effectiveTheme(): "light" | "dark" {
  const saved = readTheme();
  if (saved !== "system") return saved;
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

const listeners = new Set<() => void>();
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const query = window.matchMedia(DARK_QUERY);
  const onStorage = (event: StorageEvent) => event.key === THEME_STORAGE_KEY && onChange();
  query.addEventListener("change", onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    query.removeEventListener("change", onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/* Styled like the sidebar's other footer items (Documentation). */
const Item = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  height: 36px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  font-size: var(--text-md);
  line-height: var(--leading-ui);
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease);

  &:hover {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

/**
 * Owner: the app follows the device's light/dark setting by default. This one item names the mode
 * you'd switch to ("Dark mode" while light, "Light mode" while dark); choosing it saves that choice.
 */
export function ThemeSwitcher() {
  // Before hydration we can't know the device setting, so the server renders the light-mode label.
  const theme = React.useSyncExternalStore(subscribe, effectiveTheme, () => "light" as const);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Item
      type="button"
      onClick={() => {
        applyTheme(next);
        listeners.forEach((l) => l());
      }}
    >
      <Icon icon={next === "dark" ? Moon : Sun} size={18} />
      {next === "dark" ? "Dark mode" : "Light mode"}
    </Item>
  );
}
