"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { OFFLINE_BLOCKED_EVENT } from "@/lib/offline";
import { offlineCopy, OfflineState } from "./OfflineState";

/*
 * Offline, per web.dev / Google Design guidance and the owner: don't cut the app off the moment the wifi
 * drops. What's on screen stays readable; a toast says so. Only when someone tries something that needs the
 * server (a form submit, or opening another page) do we stop it and show the goose. Drafts are already kept
 * locally by the opportunity form. When the connection returns, a toast says so.
 */
/* The dialog takes the illustration's ground (taupe-50; taupe-900 in dark), like the 404 page, so the square melts in. */
const GooseDialog = styled(DialogContent)`
  && {
    background: var(--illustration-page-bg);
  }
`;

/* Centred (no room kept for the X), at the dialog title size; the page title size is too big in a dialog. */
const GooseTitle = styled(DialogTitle)`
  && {
    margin: 0;
    padding: 0;
  }
`;

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
    // Safety net: any server action (a POST with a Next-Action header) made while offline shows the goose
    // instead of failing with a generic error. Actions should call requireOnline() first to stop cleanly.
    const realFetch = window.fetch;
    window.fetch = (input, init) => {
      if (!navigator.onLine && new Headers(init?.headers).has("Next-Action")) {
        setBlocked(true);
        return Promise.reject(new TypeError("Offline"));
      }
      return realFetch(input, init);
    };
    window.addEventListener(OFFLINE_BLOCKED_EVENT, blockedByAction);
    window.addEventListener("offline", offline);
    window.addEventListener("online", online);
    document.addEventListener("submit", stop, true);
    document.addEventListener("click", stop, true);
    return () => {
      window.fetch = realFetch;
      window.removeEventListener(OFFLINE_BLOCKED_EVENT, blockedByAction);
      window.removeEventListener("offline", offline);
      window.removeEventListener("online", online);
      document.removeEventListener("submit", stop, true);
      document.removeEventListener("click", stop, true);
    };
  }, [toast]);

  return (
    <Dialog open={blocked} onOpenChange={setBlocked}>
      <GooseDialog aria-describedby={undefined}>
        <OfflineState title={<GooseTitle>{offlineCopy.title}</GooseTitle>} onRetry={() => navigator.onLine && setBlocked(false)} />
      </GooseDialog>
    </Dialog>
  );
}
