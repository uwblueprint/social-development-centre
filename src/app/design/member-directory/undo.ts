"use client";

import * as React from "react";
import { useToast } from "@/components/ui/Toast";
import type { Member } from "./data";

/** What a change touched, taken before it: each affected member with the index it had, and any members it created. */
export interface Snapshot {
  before: { member: Member; index: number }[];
  created?: string[];
}

export function snapshotOf(list: Member[], ids: Iterable<string>): Snapshot {
  const wanted = new Set(ids);
  return { before: list.flatMap((member, index) => (wanted.has(member.id) ? [{ member, index }] : [])) };
}

/** Puts the snapshot back in one step: kept members are replaced in place, deleted ones return at their old index. */
export function restore(list: Member[], snap: Snapshot): Member[] {
  const created = new Set(snap.created ?? []);
  const byId = new Map(snap.before.map((b) => [b.member.id, b.member]));
  const next = list.filter((m) => !created.has(m.id)).map((m) => byId.get(m.id) ?? m);
  const present = new Set(next.map((m) => m.id));
  [...snap.before]
    .filter((b) => !present.has(b.member.id))
    .sort((a, b) => a.index - b.index)
    .forEach((b) => next.splice(Math.min(b.index, next.length), 0, b.member));
  return next;
}

/**
 * Shows the toast for a change with an Undo button that restores the snapshot, then a short "restored" toast.
 * If a later change touched the same people, Undo still puts the snapshot back (demo: no conflict handling).
 * State lab: with Undo expired on, Undo says the change was already saved and restores nothing.
 */
export function useUndoableUpdate(setMembers: React.Dispatch<React.SetStateAction<Member[]>>, undoExpired: boolean) {
  const { toast } = useToast();
  return React.useCallback(
    (title: string, snap: Snapshot, restored: string, after?: () => void) => {
      toast({
        title,
        actionLabel: "Undo",
        onAction: () => {
          if (undoExpired) return toast({ title: "Couldn't undo. The change was already saved." });
          setMembers((list) => restore(list, snap));
          after?.();
          toast({ title: restored });
        },
      });
    },
    [toast, setMembers, undoExpired],
  );
}
