"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { useEmails } from "../store";
import type { ActionResult, Send } from "../model";
import { plural } from "./helpers";

/**
 * Approve, Send now, Don't send, Retry and Undo with their toasts. The kit toast closes after a few
 * seconds and only carries one action, so rows inside the 1-minute window also show their own Undo.
 */
export function useSendActions() {
  const api = useEmails();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<ActionResult>, done: () => void): Promise<boolean> => {
      setBusy(true);
      setError(null);
      const res = await fn();
      setBusy(false);
      if (!res.ok) {
        setError(res.error);
        return false;
      }
      done();
      return true;
  };

  const ids = (sends: Send[]) => sends.map((s) => s.id);

  const undo = (sends: Send[], label: string) =>
    run(
      () => api.undo(ids(sends)),
      () => toast({ title: `Undone: ${label}` }),
    );

  return {
    busy,
    error,
    clearError: () => setError(null),
    undo,
    approve: (sends: Send[], name: string, opts?: { now?: boolean }) =>
      run(
        () => api.approve(ids(sends), opts),
        () =>
          toast({
            title: opts?.now ? `Sending “${name}” to ${plural(sends.length, "member")}` : `Approved “${name}” for ${plural(sends.length, "member")}`,
            actionLabel: "Undo",
            onAction: () => void api.undo(ids(sends)),
          }),
      ),
    sendNow: (sends: Send[], name: string) =>
      run(
        () => api.sendNow(ids(sends)),
        () =>
          toast({
            title: `Sending “${name}” to ${plural(sends.length, "member")}`,
            actionLabel: "Undo",
            onAction: () => void api.undo(ids(sends)),
          }),
      ),
    dontSend: (sends: Send[], name: string) =>
      run(
        () => api.dontSend(ids(sends)),
        () =>
          toast({
            title: `Removed “${name}” for ${plural(sends.length, "member")}`,
            actionLabel: "Undo",
            onAction: () => void api.undo(ids(sends)),
          }),
      ),
    retry: (send: Send, name: string) =>
      run(
        () => api.retry(send.id),
        () => toast({ title: `Retrying “${name}”` }),
      ),
  };
}
