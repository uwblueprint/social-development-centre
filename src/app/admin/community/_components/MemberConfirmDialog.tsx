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

const c = copy.confirm;

/** What each confirmation says. Convert is the only one whose main button isn't destructive. */
function content(kind: MemberConfirmKind, member: Member, name: string) {
  switch (kind) {
    case "convert":
      return { title: c.convertTitle(name), body: c.convertBody(member.subscribed), cancel: c.convertCancel, confirm: c.convertConfirm, danger: false };
    case "revoke":
      return {
        title: c.revokeTitle(name),
        body: member.subscribed ? c.revokeBody : c.revokeBodyUnsubscribed,
        cancel: c.revokeCancel,
        confirm: c.revokeConfirm,
        danger: true,
      };
    case "unsubscribe":
      return {
        title: c.unsubscribeTitle(name),
        body: member.tier === "paying" ? c.unsubscribeBodyPaying : c.unsubscribeBodyGeneral,
        cancel: c.unsubscribeCancel,
        confirm: c.unsubscribeConfirm,
        danger: true,
      };
    case "delete":
      return { title: c.deleteTitle(name), body: c.deleteBody, cancel: c.deleteCancel, confirm: c.deleteConfirm, danger: true };
  }
}

/** Shared confirmation for Convert to paying member, Remove paying access, Unsubscribe and Delete member. */
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
  const shown = content(shownConfirm, member, member.name ?? member.email);
  return (
    <AlertDialog open={confirm !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{shown.title}</AlertDialogTitle>
        <AlertDialogDescription>{shown.body}</AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button type="button" $variant="secondary">
              {shown.cancel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button type="button" $variant={shown.danger ? "danger" : "primary"} onClick={() => confirm && onConfirm(confirm)}>
              {shown.confirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}
