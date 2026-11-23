/**
 * Whether the admin sidebar is collapsed on narrow screens (768–1199px). Stored per browser in localStorage
 * and applied as `data-sidebar="collapsed"` on <html>, which the sidebar's CSS reads.
 */
export const SIDEBAR_STORAGE_KEY = "sdc-sidebar";

export function readSidebarCollapsed(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.sidebar === "collapsed";
}

export function applySidebarCollapsed(collapsed: boolean) {
  const root = document.documentElement;
  if (collapsed) root.dataset.sidebar = "collapsed";
  else delete root.dataset.sidebar;
  try {
    if (collapsed) localStorage.setItem(SIDEBAR_STORAGE_KEY, "collapsed");
    else localStorage.removeItem(SIDEBAR_STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode); the choice still applies for this page.
  }
}

/**
 * Re-applies the stored choice. Needed when React re-renders <html> on the client (a 404 does), which drops
 * the attribute the boot script set.
 */
export function syncSidebarCollapsed() {
  try {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY) === "collapsed";
    if (stored !== readSidebarCollapsed()) applySidebarCollapsed(stored);
  } catch {
    // Storage blocked: nothing stored to restore.
  }
}

/** Runs in <head> before first paint, so a collapsed sidebar never flashes open. */
export const sidebarBootScript = `try{if(localStorage.getItem("${SIDEBAR_STORAGE_KEY}")==="collapsed")document.documentElement.setAttribute("data-sidebar","collapsed")}catch(e){}`;
