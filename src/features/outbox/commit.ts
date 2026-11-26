"use client";

import * as React from "react";
import type { JSONContent } from "@tiptap/react";

/** One Outbox change, as the commit route takes it. */
export type OutboxChange =
  | { kind: "approve" | "remove"; items: { occurrence_id: string; person_id: string }[] }
  | { kind: "edit"; occurrence_id: string; person_id: string; subject: string | null; body: JSONContent | null };

export interface OutboxCommitResult {
  kind: OutboxChange["kind"];
  /** How many had already left the Outbox (another admin, the daily run) and were skipped. */
  gone: number;
}

/** A toast with Undo stays up 8 seconds (components/ui/Toast.tsx); a change is held a little longer than that. */
const HOLD_FOR = 9000;

const send = (changes: OutboxChange[], keepalive = false) =>
  fetch("/api/outbox/commit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ changes }),
    keepalive,
  });

/**
 * Undo lives on the client (design decision, Nov 2026): a change is held while its toast's Undo is offered and
 * only sent once that runs out. Leaving the page (another page, closing the tab) sends whatever is held at once.
 * `hold` returns `undo`, which is false once the change was already sent.
 */
export function useHeldChanges(onSaved: (results: OutboxCommitResult[]) => void, onFailed: (retry: () => void) => void) {
  const held = React.useRef(new Map<number, { change: OutboxChange; timer: number }>());
  const nextId = React.useRef(0);
  const callbacks = React.useRef({ onSaved, onFailed });
  React.useEffect(() => {
    callbacks.current = { onSaved, onFailed };
  });

  const commit = React.useCallback((changes: OutboxChange[]) => {
    const run = () =>
      send(changes)
        .then(async (res) => {
          if (!res.ok) throw new Error(String(res.status));
          callbacks.current.onSaved(((await res.json()) as { results: OutboxCommitResult[] }).results);
        })
        .catch(() => callbacks.current.onFailed(run));
    void run();
  }, []);

  const hold = React.useCallback(
    (change: OutboxChange) => {
      const id = nextId.current++;
      const timer = window.setTimeout(() => {
        held.current.delete(id);
        commit([change]);
      }, HOLD_FOR);
      held.current.set(id, { change, timer });
      return {
        undo: () => {
          const h = held.current.get(id);
          if (!h) return false;
          window.clearTimeout(h.timer);
          held.current.delete(id);
          return true;
        },
      };
    },
    [commit],
  );

  // Leaving: send everything still held. On a tab close only a keepalive request survives.
  React.useEffect(() => {
    const map = held.current;
    const drain = () => {
      const changes = [...map.values()].map((h) => h.change);
      map.forEach((h) => window.clearTimeout(h.timer));
      map.clear();
      return changes;
    };
    const onPageHide = () => {
      const changes = drain();
      if (changes.length) void send(changes, true);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      const changes = drain();
      if (changes.length) void send(changes, true);
    };
  }, []);

  return { hold };
}
