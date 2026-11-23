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

/** Typing places keep the browser's own text undo; Ctrl/Cmd+Z only undoes a change when focus is elsewhere. */
function isTextEntry(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || el.matches("input:not([type=checkbox]):not([type=radio]), textarea, select");
}

/**
 * Shows the toast for a change with an Undo button that restores the snapshot, then a short "restored" toast.
 * Ctrl/Cmd+Z undoes the latest change not yet undone, the same as its Undo button, and pressing it again steps further
 * back. Each change undoes once, whichever way. Not while a confirmation is open or while typing in a field.
 * If a later change touched the same people, Undo still puts the snapshot back (demo: no conflict handling).
 * State lab: with Undo expired on, Undo says the change was already saved and restores nothing.
 */
export function useUndoableUpdate(setMembers: React.Dispatch<React.SetStateAction<Member[]>>, undoExpired: boolean) {
  const { toast } = useToast();
  const stack = React.useRef<(() => void)[]>([]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== "z") return;
      if (isTextEntry(e.target) || document.querySelector('[role="alertdialog"]')) return;
      const undo = stack.current.pop();
      if (!undo) return;
      e.preventDefault();
      undo();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return React.useCallback(
    (title: string, snap: Snapshot, restored: string, after?: () => void) => {
      let done = false;
      const undo = () => {
        if (done) return;
        done = true;
        stack.current = stack.current.filter((u) => u !== undo);
        if (undoExpired) return toast({ title: "Couldn't undo because the change was already saved" });
        setMembers((list) => restore(list, snap));
        after?.();
        toast({ title: restored });
      };
      stack.current.push(undo);
      toast({ title, actionLabel: "Undo", onAction: undo });
    },
    [toast, setMembers, undoExpired],
  );
}
