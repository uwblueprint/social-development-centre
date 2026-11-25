"use client";

import { Button } from "@/components/ui/Button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";

/** Signed out mid-session (State lab Session expired). It can't be closed without signing in; nothing typed is lost. */
export function SessionExpiredDialog({ open, onSignIn }: { open: boolean; onSignIn: () => void }) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogTitle>You&apos;ve been signed out</AlertDialogTitle>
        <AlertDialogDescription>Sign in again to keep working. Your unsaved edits are kept.</AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogAction asChild>
            <Button onClick={onSignIn}>Sign in</Button>
          </AlertDialogAction>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export type Conflict = { kind: "approve"; dayText: string } | { kind: "edit" } | null;

interface ConflictDialogProps {
  conflict: Conflict;
  /** Edit conflict: save over theirs. */
  onKeepMine: () => void;
  /** Edit conflict: drop the draft and show their version. */
  onUseTheirs: () => void;
  onClose: () => void;
}

/** Someone else got there first (State lab Changed by someone else). Approve just says so; an edit asks which version to keep. */
export function ConflictDialog({ conflict, onKeepMine, onUseTheirs, onClose }: ConflictDialogProps) {
  const edit = conflict?.kind === "edit";
  return (
    <AlertDialog open={!!conflict} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogTitle>{edit ? "Someone else edited this email" : "Already approved"}</AlertDialogTitle>
        <AlertDialogDescription>
          {conflict?.kind === "approve"
            ? `Another admin approved this email a moment ago. It goes out on ${conflict.dayText} at 10:30 AM.`
            : "Your changes weren't saved."}
        </AlertDialogDescription>
        <AlertDialogActions>
          {edit ? (
            <>
              <AlertDialogCancel asChild>
                <Button type="button" $variant="secondary" onClick={onUseTheirs}>
                  Use theirs
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button onClick={onKeepMine}>Keep my version</Button>
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction asChild>
              <Button onClick={onClose}>Got it</Button>
            </AlertDialogAction>
          )}
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}
