"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { grantPaidAccess, revokePaidAccess, unsubscribeMember } from "../_data/actions";
import type { Member } from "../_data/types";
import { communityCopy as copy } from "../_copy";

export type MemberConfirmKind = "revoke" | "unsubscribe";

/**
 * Shared behavior behind every member action surface (table row menu, panel
 * header + menu): copy email, convert/remove paying access, and the
 * unsubscribe/remove confirmation. Each caller renders its own trigger UI and
 * passes the confirm state into a shared `<MemberConfirmDialog>`.
 */
export function useMemberActions(member: Member, onDone?: () => void) {
  const { toast } = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = React.useState<MemberConfirmKind | null>(null);

  // Keeps the alert dialog's copy stable while it plays its close animation
  // (by then `confirm` is already null); updated during render, not an effect.
  const [shownConfirm, setShownConfirm] = React.useState<MemberConfirmKind>("unsubscribe");
  if (confirm && confirm !== shownConfirm) setShownConfirm(confirm);

  function copyEmail() {
    void navigator.clipboard.writeText(member.email).then(
      () => toast({ title: copy.toast.emailCopied }),
      () => toast({ title: copy.toast.emailCopied }),
    );
  }

  async function convert() {
    const result = await grantPaidAccess(member.id);
    toast({ title: result.message ?? copy.toast.done });
    router.refresh();
    onDone?.();
  }

  async function runConfirm(kind: MemberConfirmKind) {
    const result = kind === "revoke" ? await revokePaidAccess(member.id) : await unsubscribeMember(member.id);
    toast({ title: result.message ?? copy.toast.done });
    setConfirm(null);
    router.refresh();
    onDone?.();
  }

  return { copyEmail, convert, confirm, setConfirm, shownConfirm, runConfirm };
}
