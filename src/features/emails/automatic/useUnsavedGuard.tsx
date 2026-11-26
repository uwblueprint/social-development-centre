"use client";

/*
 * Warns before leaving a page with unsaved changes: the browser's own prompt for reload/close, and a dialog
 * for in-app links (sidebar, back link). The browser Back button can't be intercepted by Next; see the flags doc.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogActions, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";

export function useUnsavedGuard(unsaved: boolean, retry: () => void) {
  const router = useRouter();
  const [href, setHref] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!unsaved) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.origin !== window.location.origin) return;
      if (a.pathname === window.location.pathname && a.search === window.location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setHref(a.pathname + a.search + a.hash);
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [unsaved]);

  const dialog = (
    <AlertDialog open={href !== null} onOpenChange={(o) => !o && setHref(null)}>
      <AlertDialogContent>
        <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
        <AlertDialogDescription>Your latest changes aren&apos;t saved yet.</AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button
              type="button"
              $variant="secondary"
              onClick={() => {
                setHref(null);
                retry();
              }}
            >
              Stay and save
            </Button>
          </AlertDialogCancel>
          <Button
            type="button"
            $variant="danger"
            onClick={() => {
              const target = href;
              setHref(null);
              if (target) router.push(target);
            }}
          >
            Leave without saving
          </Button>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
  return dialog;
}
