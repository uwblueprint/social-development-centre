/**
 * Theme preference: "system" follows the device's light/dark setting; "light" and "dark" override it.
 * Stored per browser in localStorage and applied as `data-theme` on <html> (tokens.ts reads it).
 */
export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "sdc-theme";

export function readTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage can be blocked (private mode); the choice still applies for this page.
  }
}

/** Runs in <head> before first paint, so a saved theme never flashes the other one. */
export const themeBootScript = `try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`;
