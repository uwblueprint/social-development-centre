"use client";

import { useSyncExternalStore } from "react";

/*
 * A one-second clock shared by every countdown on the page (resend cooldowns, the admin pause).
 * Reads as null on the server and during hydration, so server and client render the same markup.
 */
function subscribeClock(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}
const nowSeconds = () => Math.floor(Date.now() / 1000);

/** Whole seconds left until `until` (epoch ms); 0 once it has passed or when there's nothing to count. */
export function useSecondsLeft(until: number | null | undefined): number {
  const now = useSyncExternalStore(subscribeClock, nowSeconds, () => null);
  if (!until) return 0;
  // Before the clock's first client read, assume the full time is left rather than flashing "0:00".
  if (now === null) return 1;
  return Math.max(0, Math.ceil(until / 1000 - now));
}


/*
 * The email a sign-in link was last sent to, kept for this browser tab only. It lets "This link has
 * expired" offer to resend to the same address (the expired link itself doesn't say who it was for).
 */
const storageKey = (portal: "member" | "partner") => `sdc-sign-in-email:${portal}`;

export function rememberEmail(portal: "member" | "partner", email: string) {
  try {
    window.sessionStorage.setItem(storageKey(portal), email);
  } catch {
    // Private mode or blocked storage: the expired screen asks for the email instead.
  }
}

function readEmail(portal: "member" | "partner") {
  try {
    return window.sessionStorage.getItem(storageKey(portal));
  } catch {
    return null;
  }
}

const noSubscribe = () => () => {};

/** The remembered email, or null (always null on the server). */
export function useRememberedEmail(portal: "member" | "partner"): string | null {
  return useSyncExternalStore(
    noSubscribe,
    () => readEmail(portal),
    () => null,
  );
}
