"use client";

import * as React from "react";
import { useToast } from "@/components/ui/Toast";
import { copy } from "../../copy";

/** "today at 3:42 p.m.", "yesterday at 9:05 a.m." or "Mon, Sep 28 at 3:42 p.m.", in the person's time zone. */
export function draftWhen(iso: string) {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return undefined;
  const time = at.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" });
  const day = new Date(at).setHours(0, 0, 0, 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const days = Math.round((today - day) / 86_400_000);
  const date = days === 0 ? "today" : days === 1 ? "yesterday" : at.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
  return `${date} at ${time}`;
}

/** localStorage can throw (private mode, quota, disabled); a draft is a convenience, so failures are ignored. */
function removeStored(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

/**
 * Keeps unsaved form work in this browser. Every change is saved after a short pause; coming back to the
 * same form restores it and shows a toast with a Discard action. The saved copy is dropped when the model
 * matches what the form started with. Call `clearDraft` once the listing saves, or when the person cancels
 * (which also stops further autosaves).
 *
 * @param storageKey Identifies the form, e.g. one per portal and listing.
 * @param initial Builds the form's starting model; a saved copy that equals it is not a draft.
 * @param options `base` is the version the form started from: a draft saved against another version is dropped,
 *   so restoring it never undoes someone else's save. `strip` removes anything that changes on every load (React
 *   keys) before the model is stored or compared; `revive` puts it back when a draft is restored.
 */
export function useFormDraft<T>(
  storageKey: string,
  initial: () => T,
  model: T,
  setModel: (model: T) => void,
  options: { base?: string; strip?: (model: T) => T; revive?: (model: T) => T } = {},
) {
  const { base, strip = (m: T) => m, revive = (m: T) => m } = options;
  const { toast } = useToast();
  const pristine = React.useRef("");
  const ready = React.useRef(false);
  const cancelled = React.useRef(false);
  const restoredFor = React.useRef<string>(undefined);
  // Read inside the restore effect, which must run once per key, not whenever these change identity.
  const latest = React.useRef({ initial, toast, strip, revive });
  React.useEffect(() => {
    latest.current = { initial, toast, strip, revive };
  });

  React.useEffect(() => {
    // Effects run twice in development; restore (and toast) only once per form.
    if (restoredFor.current === storageKey) return;
    restoredFor.current = storageKey;
    const start = latest.current.initial();
    pristine.current = JSON.stringify(latest.current.strip(start));
    try {
      const raw = localStorage.getItem(storageKey);
      const saved = raw ? (JSON.parse(raw) as { model?: T; savedAt?: string; base?: string }) : null;
      if (saved && saved.base !== base) removeStored(storageKey);
      else if (saved?.model && JSON.stringify(saved.model) !== pristine.current) {
        setModel(latest.current.revive(saved.model));
        latest.current.toast({
          title: copy.form.draft.restored(saved.savedAt ? draftWhen(saved.savedAt) : undefined),
          actionLabel: copy.form.draft.discard,
          onAction: () => {
            removeStored(storageKey);
            setModel(start);
          },
        });
      }
    } catch {}
    ready.current = true;
  }, [storageKey, setModel, base]);

  React.useEffect(() => {
    if (!ready.current || cancelled.current) return;
    const timer = window.setTimeout(() => {
      // Saved (or cancelled) while this write was waiting: don't bring the draft back.
      if (cancelled.current) return;
      try {
        const stripped = latest.current.strip(model);
        if (JSON.stringify(stripped) === pristine.current) localStorage.removeItem(storageKey);
        else localStorage.setItem(storageKey, JSON.stringify({ model: stripped, savedAt: new Date().toISOString(), base }));
      } catch {}
    }, 400);
    return () => window.clearTimeout(timer);
  }, [model, storageKey, base]);

  /** Deletes the saved draft. With `stopSaving`, later changes are no longer saved either. */
  const clearDraft = React.useCallback(
    (options?: { stopSaving?: boolean }) => {
      if (options?.stopSaving) cancelled.current = true;
      removeStored(storageKey);
    },
    [storageKey],
  );

  return { clearDraft };
}
