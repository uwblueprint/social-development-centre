"use client";

import * as React from "react";
import type { SyntheticEvent } from "react";
import { styled } from "next-yak";
import { MailX, MoreVertical, Send } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { partnersCopy as copy } from "../_copy";
import { cancelInvitation, resendInvitation } from "../_data/actions";
import type { PendingInvitation } from "../_data/types";

const Trigger = styled(Button)`
  flex-shrink: 0;
`;

/* Layout-neutral wrapper; see the stopPropagation note below. */
const RowEventBoundary = styled.span`
  display: contents;
`;

const stop = (event: SyntheticEvent) => event.stopPropagation();

/**
 * The Invitations table row's ⋯ menu. The menu and confirm dialog render in portals, but React
 * still bubbles their clicks and key presses to the table row, whose onClick/Enter opens the
 * panel. The boundary stops that.
 */
export function InvitationRowActions({ invitation }: { invitation: PendingInvitation }) {
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  async function handleResend() {
    const result = await resendInvitation(invitation.id);
    toast({ title: result.message ?? copy.invitationMenu.resentFallback });
  }

  async function handleCancel() {
    const result = await cancelInvitation(invitation.id);
    if (result.message) toast({ title: result.message });
  }

  return (
    <RowEventBoundary role="presentation" onClick={stop} onKeyDown={stop}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Trigger type="button" $variant="ghost" $size="sm" aria-label={copy.table.rowActionsLabel(invitation.name)}>
            <Icon icon={MoreVertical} size={16} />
          </Trigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => void handleResend()}>
            <Icon icon={Send} size={16} />
            {copy.invitationMenu.resend}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setConfirmOpen(true);
            }}
          >
            <Icon icon={MailX} size={16} />
            {copy.invitationMenu.cancel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{copy.cancelInvitationConfirm.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.cancelInvitationConfirm.body(invitation.name)}</AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                {copy.cancelInvitationConfirm.keep}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" $variant="danger" onClick={() => void handleCancel()}>
                {copy.cancelInvitationConfirm.confirm}
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </RowEventBoundary>
  );
}
