"use client";

import * as React from "react";
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
import type { ActionState } from "@/lib/forms";
import { useReturnFocus } from "@/lib/useReturnFocus";
import { invitationCopy } from "../_copy";
import type { PartnerContact } from "../_data/types";

/*
 * Resend / cancel / remove for one person, with the two confirmations. Shared by the admin panels and the
 * partner portal's Team list; each passes its own server actions and wording. Radix starts focus on the
 * safe button (Keep …); the confirm button uses danger styling.
 */

export interface PersonActionHandlers<D = undefined> {
  resend: (contactId: string) => Promise<ActionState<D>>;
  cancel: (contactId: string) => Promise<ActionState<D>>;
  remove: (contactId: string) => Promise<ActionState<D>>;
}

export interface PersonConfirmCopy {
  /** Cancel body for an invitation that was never delivered (no link to invalidate). */
  cancelNotSentBody: (name: string) => string;
  removeTitle: (name: string) => string;
  removeBody: (name: string) => string;
  removeKeep: string;
  removeConfirm: string;
}

type Confirm = "cancel" | "remove";

export function usePersonActions<D = undefined>(
  contact: Pick<PartnerContact, "id" | "name" | "invitationState">,
  handlers: PersonActionHandlers<D>,
  copy: PersonConfirmCopy,
  onResult: (result: ActionState<D>) => void,
) {
  const [confirm, setConfirm] = React.useState<Confirm | null>(null);
  const busy = React.useRef(false);
  const keepRef = React.useRef<HTMLButtonElement>(null);
  // The row's ⋯ menu button has closed by the time this dialog opens, so Radix has nothing to return
  // focus to on its own; capture it ourselves (decision: explicit return-focus over relying on Radix timing).
  const { capture: captureFocus, restore: restoreFocus } = useReturnFocus();

  // Keeps the dialog's copy stable while it plays its close animation (by then `confirm` is null).
  const [shown, setShown] = React.useState<Confirm>("cancel");
  if (confirm && confirm !== shown) setShown(confirm);

  async function run(action: (id: string) => Promise<ActionState<D>>) {
    if (busy.current) return;
    busy.current = true;
    try {
      onResult(await action(contact.id));
    } finally {
      busy.current = false;
    }
  }

  const cancelBody =
    contact.invitationState === "notSent"
      ? copy.cancelNotSentBody(contact.name)
      : invitationCopy.cancelConfirm.body(contact.name);

  const dialog = (
    <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          // Start on the safe choice (Keep …), not the dialog's close button.
          event.preventDefault();
          keepRef.current?.focus();
        }}
        onCloseAutoFocus={restoreFocus}
      >
        <AlertDialogTitle>
          {shown === "cancel" ? invitationCopy.cancelConfirm.title : copy.removeTitle(contact.name)}
        </AlertDialogTitle>
        <AlertDialogDescription>{shown === "cancel" ? cancelBody : copy.removeBody(contact.name)}</AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button ref={keepRef} type="button" $variant="secondary">
              {shown === "cancel" ? invitationCopy.cancelConfirm.keep : copy.removeKeep}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              $variant="danger"
              onClick={() => void run(shown === "cancel" ? handlers.cancel : handlers.remove)}
            >
              {shown === "cancel" ? invitationCopy.cancelConfirm.confirm : copy.removeConfirm}
            </Button>
          </AlertDialogAction>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );

  return {
    resend: () => void run(handlers.resend),
    requestCancel: () => {
      captureFocus();
      setConfirm("cancel");
    },
    requestRemove: () => {
      captureFocus();
      setConfirm("remove");
    },
    dialog,
  };
}
