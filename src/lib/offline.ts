/**
 * Offline checks for actions that call the server directly (not a form submit or a link, which
 * OfflineWatcher already catches). Returns false and shows the "Goose stole your wifi." dialog when offline.
 */
export const OFFLINE_BLOCKED_EVENT = "nexus:offline-blocked";

export function requireOnline(): boolean {
  if (typeof navigator === "undefined" || navigator.onLine) return true;
  window.dispatchEvent(new Event(OFFLINE_BLOCKED_EVENT));
  return false;
}
