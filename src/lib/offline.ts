/** Sent by `requireOnline` so OfflineWatcher can show the "Goose stole your wifi." dialog. */
export const OFFLINE_BLOCKED_EVENT = "nexus:offline-blocked";

/**
 * Call at the top of any handler that calls a server action directly (a click handler or transition, not a
 * form submit or a link, which OfflineWatcher already catches). Returns false, and shows the offline dialog,
 * when the browser is offline; the caller should then return without calling the server.
 */
export function requireOnline(): boolean {
  if (typeof navigator === "undefined" || navigator.onLine) return true;
  window.dispatchEvent(new Event(OFFLINE_BLOCKED_EVENT));
  return false;
}
