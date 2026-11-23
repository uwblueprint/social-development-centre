"use client";

import * as React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { applyTheme, readTheme, THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";

const listeners = new Set<() => void>();
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const onStorage = (event: StorageEvent) => event.key === THEME_STORAGE_KEY && onChange();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

const OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

/**
 * The theme setting, on the Settings page (owner: not in the sidebar). System follows the device's light or
 * dark setting and is the default; Light and Dark override it. It applies at once and is saved in this
 * browser (src/lib/theme.ts), so it isn't part of the page's Save. Render it inside `Field` and spread its props.
 */
export function ThemeChoice(props: { id?: string; "aria-describedby"?: string; "aria-labelledby"?: string }) {
  // Before hydration the saved choice can't be read, so the server renders System.
  const theme = React.useSyncExternalStore(subscribe, readTheme, () => "system" as const);
  return (
    <Select
      {...props}
      options={OPTIONS}
      value={theme}
      onValueChange={(next) => {
        applyTheme(next as ThemePreference);
        listeners.forEach((l) => l());
      }}
    />
  );
}
