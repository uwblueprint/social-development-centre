"use client";

import * as React from "react";
import type { EmailHit, Loaded, PersonHit, SearchIndex } from "./types";

export type Remote<T> = Loaded<T> | { status: "loading" } | { status: "offline" };

export interface RemoteIndex {
  people: Remote<PersonHit>;
  emails: Remote<EmailHit>;
}

const LOADING: RemoteIndex = { people: { status: "loading" }, emails: { status: "loading" } };

/** The last list that loaded, kept for the rest of the visit so reopening the palette is instant. */
let cached: SearchIndex | null = null;

/**
 * People and automatic emails for the palette. Loads each time the palette opens: what loaded last time
 * shows at once and is swapped for the fresh list when it arrives. If loading fails and nothing is
 * cached, each group says so (offline or failed) and `retry` tries again. Coming back online retries by
 * itself. Closing the palette cancels a load in flight.
 */
export function useSearchIndex(open: boolean): { index: RemoteIndex; retry: () => void } {
  const [index, setIndex] = React.useState<RemoteIndex>(() => cached ?? LOADING);
  const [attempt, setAttempt] = React.useState(0);

  // Each open (and each retry) starts from the last list that loaded, or from loading.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setIndex(cached ?? LOADING);
  }
  const retry = React.useCallback(() => {
    setIndex(cached ?? LOADING);
    setAttempt((n) => n + 1);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const fail = () => {
      if (controller.signal.aborted) return;
      // A stale list beats an error: keep what loaded last time.
      if (cached) return setIndex(cached);
      const status = navigator.onLine ? "error" : "offline";
      setIndex({ people: { status }, emails: { status } });
    };

    const request = navigator.onLine
      ? fetch("/api/admin-search", { signal: controller.signal, cache: "no-store" })
      : Promise.reject(new Error("Offline"));
    request
      .then((response) => (response.ok ? (response.json() as Promise<SearchIndex>) : Promise.reject(response.status)))
      .then((fresh) => {
        // Keep a group that loaded before rather than replace it with this load's error.
        const merged: SearchIndex = {
          people: fresh.people.status === "ok" || !cached ? fresh.people : cached.people,
          emails: fresh.emails.status === "ok" || !cached ? fresh.emails : cached.emails,
        };
        if (merged.people.status === "ok" && merged.emails.status === "ok") cached = merged;
        if (!controller.signal.aborted) setIndex(merged);
      })
      .catch(fail);

    window.addEventListener("online", retry);
    return () => {
      controller.abort();
      window.removeEventListener("online", retry);
    };
  }, [open, attempt, retry]);

  return { index, retry };
}
