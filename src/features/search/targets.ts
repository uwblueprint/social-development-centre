/*
 * Where search sends you, and what it marks when you get there. A result's link ends in `#<id>`; the
 * page gives the matching row that id, and `arrive` scrolls to it, focuses it and tints it briefly.
 */

export const personTargetId = (personId: string) => `person-${personId}`;
export const settingTargetId = (key: string) => `setting-${key}`;

export const personHref = (personId: string) => `/admin/members#${personTargetId(personId)}`;
export const emailHref = (emailId: string) => `/admin/automatic-emails/${emailId}`;

/** How long the row stays tinted before fading back. */
const MARK_MS = 1200;
/** How long to wait for the page to show the row (it may still be loading) before giving up. */
const WAIT_MS = 3000;

let arrival = 0;

/**
 * After navigating to `href`: wait for its page, then scroll to the `#id` row, focus it (the
 * row, so Tab goes into its control) and tint it. A link with no `#id`
 * focuses the page heading instead, like the sidebar does. `onMissing` runs when the page loaded but a
 * person's row isn't there: they were removed since the search list loaded.
 */
export function arrive(href: string, onMissing?: () => void) {
  const url = new URL(href, window.location.origin);
  const id = decodeURIComponent(url.hash.slice(1));
  const run = ++arrival;
  const start = performance.now();
  let pathStart = 0;

  const tick = () => {
    if (run !== arrival) return;
    const now = performance.now();
    if (window.location.pathname !== url.pathname) {
      if (now - start < 10_000) requestAnimationFrame(tick);
      return;
    }
    pathStart ||= now;

    const target = id ? document.getElementById(id) : document.querySelector<HTMLElement>("main h1");
    if (target) return land(target, Boolean(id));
    if (now - pathStart < WAIT_MS) return void requestAnimationFrame(tick);
    // Only say someone is missing when their list is on screen; an error page isn't a missing person.
    if (id.startsWith("person-") && document.querySelector('[data-search-list="people"]')) onMissing?.();
  };
  requestAnimationFrame(tick);
}

function land(target: HTMLElement, mark: boolean) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });

  // The row, not the control in it: focusing a combobox would open its menu. Tab goes straight into the row.
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  // Unless a dialog took focus meanwhile (the palette reopened, say): never pull focus out from under it.
  // A dialog that is closing still holds focus for its exit animation, so only open ones count.
  const dialog = '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]';
  if (!document.activeElement?.closest(dialog)) target.focus({ preventScroll: true });
  if (!mark) return;

  document.querySelectorAll("[data-search-arrived]").forEach((el) => el.removeAttribute("data-search-arrived"));
  target.setAttribute("data-search-arrived", "on");
  setTimeout(() => target.setAttribute("data-search-arrived", "off"), MARK_MS);
}
