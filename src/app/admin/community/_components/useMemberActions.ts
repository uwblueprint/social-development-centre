"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { deleteMember, grantPaidAccess, resubscribeMember, revokePaidAccess, unsubscribeMember } from "../_data/actions";
import type { ActionState } from "@/lib/forms";
import type { Member } from "../_data/types";
import { communityCopy as copy } from "../_copy";
import { getMemberById } from "../_lib/emailHistoryAction";

/** Actions that ask first. Convert asks too: it grants paid benefits and emails the person. */
export type MemberConfirmKind = "convert" | "revoke" | "unsubscribe" | "delete";

const RUN: Record<MemberConfirmKind, (id: string) => Promise<ActionState>> = {
  convert: grantPaidAccess,
  revoke: revokePaidAccess,
  unsubscribe: unsubscribeMember,
  delete: deleteMember,
};

/**
 * Shared behavior behind every member action surface (table row menu, panel action row): resubscribe,
 * and the convert / remove paying access / unsubscribe / delete confirmations. Each caller renders its
 * own triggers and passes the confirm state into a shared `<MemberConfirmDialog>`.
 * `onChange` gets the person as they are after the action, or `null` once they're deleted.
 */
export function useMemberActions(member: Member, onChange?: (member: Member | null) => void) {
  const { toast } = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = React.useState<MemberConfirmKind | null>(null);

  // Keeps the dialog's copy stable while it plays its close animation
  // (by then `confirm` is already null); updated during render, not an effect.
  const [shownConfirm, setShownConfirm] = React.useState<MemberConfirmKind>("unsubscribe");
  if (confirm && confirm !== shownConfirm) setShownConfirm(confirm);

  async function finish(result: ActionState) {
    toast({ title: result.message ?? copy.toast.done });
    router.refresh();
    if (onChange) onChange(await getMemberById(member.id));
  }

  /** Only offered for people an admin unsubscribed. No confirmation: it restores emails. */
  async function resubscribe() {
    await finish(await resubscribeMember(member.id));
  }

  async function runConfirm(kind: MemberConfirmKind) {
    const result = await RUN[kind](member.id);
    setConfirm(null);
    await finish(result);
  }

  return { resubscribe, confirm, setConfirm, shownConfirm, runConfirm };
}
