"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { OFFLINE_BLOCKED_EVENT } from "@/lib/offline";
import { offlineCopy, OfflineState } from "./OfflineState";

/**
 * Offline handling. What is on screen stays readable, and a toast says so, rather than cutting the app
 * off the moment the wifi drops. Only when someone tries something that needs the server does the goose
 * dialog stop them: a form submit or a same-site link click (caught here), or an action that calls the
 * server directly, which calls `requireOnline()` first. A toast says when the connection returns.
 */
export function OfflineWatcher() {
  const { toast } = useToast();
  const [blocked, setBlocked] = React.useState(false);

  React.useEffect(() => {
    const offline = () => toast({ title: offlineCopy.wentOffline });
    const online = () => {
      setBlocked(false);
      toast({ title: offlineCopy.backOnline });
    };
    const stop = (event: Event) => {
      if (navigator.onLine) return;
      if (event.type === "click") {
        const link = (event.target as Element | null)?.closest?.("a[href]");
        const href = link?.getAttribute("href") ?? "";
        if (!href.startsWith("/") || link?.getAttribute("target") === "_blank") return;
      }
      event.preventDefault();
      event.stopPropagation();
      setBlocked(true);
    };
    const blockedByAction = () => setBlocked(true);
    window.addEventListener(OFFLINE_BLOCKED_EVENT, blockedByAction);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    document.addEventListener("submit", stop, true);
    document.addEventListener("click", stop, true);
    return () => {
      window.removeEventListener(OFFLINE_BLOCKED_EVENT, blockedByAction);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
      document.removeEventListener("submit", stop, true);
      document.removeEventListener("click", stop, true);
    };
  }, [toast]);

  return (
    <Dialog open={blocked} onOpenChange={setBlocked}>
      <DialogContent $variant="illustration" aria-describedby={undefined}>
        <OfflineState title={<DialogTitle $flush>{offlineCopy.title}</DialogTitle>} onRetry={() => navigator.onLine && setBlocked(false)} />
      </DialogContent>
    </Dialog>
  );
}
