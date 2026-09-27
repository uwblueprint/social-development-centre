"use client";

import * as React from "react";
import { styled } from "next-yak";
import { MailX, MoreHorizontal, Pencil, RotateCw, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { invitationCopy, partnersCopy } from "../_copy";
import type { PartnerPerson } from "../_data/types";
import { adminConfirmCopy, adminPersonHandlers, PersonEditForm } from "./ContactRow";
import { resendLabel } from "./ContactRowParts";
import { usePersonActions } from "./PersonActions";

const copy = partnersCopy.person;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

/**
 * A People row's ⋯ menu (the People view has no side panel). By the person's state:
 * - Invited: Edit details, Resend invitation / Retry / Send new invitation, Cancel invitation.
 * - Has access: Edit details, Remove from organization (disabled for the last person with access).
 * - Removed: Invite again (opens Invite partner filled in).
 * Edit details opens a small dialog with Name and Email, saved through `updateContact`.
 */
export function PersonRowActions({
  person,
  lastWithAccess,
  onInviteAgain,
}: {
  person: PartnerPerson;
  lastWithAccess: boolean;
  onInviteAgain: () => void;
}) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);
  const [editKey, setEditKey] = React.useState(0);
  const actions = usePersonActions(person, adminPersonHandlers, adminConfirmCopy(person.organization.name), (result) => {
    if (result.message) toast({ title: result.message });
  });
  const state = person.invitationState;
  const removed = !!person.removal;

  const removeItem = (
    <DropdownMenuItem
      $variant="danger"
      disabled={lastWithAccess}
      onSelect={(event) => {
        event.preventDefault();
        if (!lastWithAccess) actions.requestRemove();
      }}
    >
      <Icon icon={UserMinus} size={16} />
      {copy.remove}
      {lastWithAccess && <VisuallyHidden> — {copy.lastPersonReason}</VisuallyHidden>}
    </DropdownMenuItem>
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" $variant="ghost" $size="sm" aria-label={copy.rowActions(person.name)}>
            <Icon icon={MoreHorizontal} size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {removed ? (
            <DropdownMenuItem onSelect={onInviteAgain}>
              <Icon icon={UserPlus} size={16} />
              {partnersCopy.personPanel.inviteAgain}
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem
                onSelect={() => {
                  setEditKey((k) => k + 1);
                  setEditOpen(true);
                }}
              >
                <Icon icon={Pencil} size={16} />
                {copy.editDetails}
              </DropdownMenuItem>
              {state && (
                <DropdownMenuItem onSelect={actions.resend}>
                  <Icon icon={RotateCw} size={16} />
                  {resendLabel(state)}
                </DropdownMenuItem>
              )}
              {state ? (
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    actions.requestCancel();
                  }}
                >
                  <Icon icon={MailX} size={16} />
                  {invitationCopy.cancel}
                </DropdownMenuItem>
              ) : lastWithAccess ? (
                <Tooltip content={copy.lastPersonReason}>{removeItem}</Tooltip>
              ) : (
                removeItem
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogTitle>{copy.editDetails}</DialogTitle>
          <PersonEditForm key={editKey} contact={person} inDialog onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
      {actions.dialog}
    </>
  );
}
