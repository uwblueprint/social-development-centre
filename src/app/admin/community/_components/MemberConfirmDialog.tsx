"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import type { Member } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import type { MemberConfirmKind } from "./useMemberActions";

/** Shared "Remove paying access" / "Unsubscribe" confirmation, used by the row menu and the panel. */
export function MemberConfirmDialog({
  member,
  confirm,
  shownConfirm,
  onOpenChange,
  onConfirm,
}: {
  member: Member;
  confirm: MemberConfirmKind | null;
  shownConfirm: MemberConfirmKind;
  onOpenChange: (open: boolean) => void;
  onConfirm: (kind: MemberConfirmKind) => void;
}) {
  const displayName = member.name ?? member.email;
  return (
    <AlertDialog open={confirm !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>
          {shownConfirm === "revoke" ? copy.confirm.revokeTitle(displayName) : copy.confirm.unsubscribeTitle(displayName)}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {shownConfirm === "revoke"
            ? copy.confirm.revokeBody
            : member.tier === "paying"
              ? copy.confirm.unsubscribeBodyPaying
              : copy.confirm.unsubscribeBodyGeneral}
        </AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button type="button" $variant="secondary">
              {shownConfirm === "revoke" ? copy.confirm.revokeCancel : copy.confirm.unsubscribeCancel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" $variant="danger" onClick={() => confirm && onConfirm(confirm)}>
              {shownConfirm === "revoke" ? copy.confirm.revokeConfirm : copy.confirm.unsubscribeConfirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}
