import * as React from "react";
import type { TopicId } from "@/features/opportunities/types";
import type { YoursEntry } from "./types";

/*
 * Stand-in for the member's saved data so the feed works end to end with no backend: Your opportunities
 * and interests live in this browser's localStorage. Backend: keep the same shapes, store them per member
 * and read them on the server (docs/backend/feed.md), then delete this file.
 * localStorage can be blocked or full, so every read and write is guarded and the views still work in memory.
 */

function persisted<T>(key: string, empty: T, parse: (raw: unknown) => T | undefined) {
  const listeners = new Set<() => void>();
  let raw: string | null | undefined; // undefined: not read yet
  let value = empty;
  let memory: T | undefined; // used when storage is unavailable

  const read = () => {
    let next: string | null = null;
    try {
      next = window.localStorage.getItem(key);
    } catch {
      return memory ?? empty;
    }
    if (next !== raw) {
      raw = next;
      try {
        value = (next ? parse(JSON.parse(next)) : undefined) ?? empty;
      } catch {
        value = empty;
      }
    }
    return value;
  };

  return {
    subscribe(onChange: () => void) {
      listeners.add(onChange);
      const onStorage = (e: StorageEvent) => e.key === key && onChange();
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    get: read,
    set(next: T) {
      memory = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Storage is blocked or full: keep it in memory for this visit.
      }
      listeners.forEach((l) => l());
    },
    getServer: () => empty,
  };
}

const EMPTY_YOURS: YoursEntry[] = [];
const yoursStore = persisted<YoursEntry[]>("nexus.member.yours.v1", EMPTY_YOURS, (raw) =>
  Array.isArray(raw)
    ? raw.filter((e): e is YoursEntry => !!e && typeof e.id === "string" && typeof e.openedAt === "string")
    : undefined,
);

const interestsStore = persisted<TopicId[] | null>("nexus.member.interests.v1", null, (raw) =>
  Array.isArray(raw) ? (raw.filter((t) => typeof t === "string") as TopicId[]) : undefined,
);

/** Everything the member opened, newest first. Empty on the server and until the browser has read it. */
export function useYoursEntries(): YoursEntry[] {
  return React.useSyncExternalStore(yoursStore.subscribe, yoursStore.get, yoursStore.getServer);
}

export function addYours(id: string) {
  const current = yoursStore.get();
  if (current.some((e) => e.id === id)) return;
  yoursStore.set([{ id, openedAt: new Date().toISOString() }, ...current]);
}

/** The saved entry for an id, read now (not from a render), so Undo restores the original time. */
export function getYoursEntry(id: string): YoursEntry | undefined {
  return yoursStore.get().find((e) => e.id === id);
}

export function removeYours(id: string) {
  yoursStore.set(yoursStore.get().filter((e) => e.id !== id));
}

export function restoreYours(entry: YoursEntry) {
  const current = yoursStore.get();
  if (current.some((e) => e.id === entry.id)) return;
  yoursStore.set([entry, ...current].sort((a, b) => b.openedAt.localeCompare(a.openedAt)));
}

/** The member's saved interests, or `initial` (from onboarding) until they edit them. */
export function useInterests(initial: TopicId[]): TopicId[] {
  const saved = React.useSyncExternalStore(interestsStore.subscribe, interestsStore.get, interestsStore.getServer);
  return saved ?? initial;
}

export function setInterests(topics: TopicId[]) {
  interestsStore.set(topics);
}

const noop = () => () => {};
/** False on the server and during hydration, true once the browser's saved data can be trusted. */
export function useStoreReady(): boolean {
  return React.useSyncExternalStore(noop, () => true, () => false);
}
