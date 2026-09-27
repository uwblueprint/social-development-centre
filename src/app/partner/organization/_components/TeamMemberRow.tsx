"use client";

import { MailX, MoreVertical, RotateCw, UserMinus } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import {
  ContactEmail,
  ContactInfo,
  ContactMenuTrigger,
  ContactName,
  ContactRowFrame,
  InvitationStatus,
  resendLabel,
} from "@/app/admin/partners/_components/ContactRowParts";
import { usePersonActions, type PersonConfirmCopy } from "@/app/admin/partners/_components/PersonActions";
import type { PartnerContact } from "@/app/admin/partners/_data/types";
import { partnerCopy } from "../../_copy";
import { cancelColleagueInvitation, removeColleague, resendColleagueInvitation, type PartnerResult } from "../_data/actions";
import { useReportBlocked } from "./BlockedNotice";

const copy = partnerCopy.organization;

const handlers = { resend: resendColleagueInvitation, cancel: cancelColleagueInvitation, remove: removeColleague };

const confirmCopy: PersonConfirmCopy = {
  cancelNotSentBody: copy.cancelNotSentBody,
  removeTitle: copy.confirmRemove.title,
  removeBody: copy.confirmRemove.body,
  removeKeep: copy.confirmRemove.keep,
  removeConfirm: copy.confirmRemove.confirm,
};

/**
 * One person on the partner's Team list: name (+ "(you)"), email, invitation state, and a menu named
 * "Actions for {name}". Pending, not sent and expired invitations can be resent or cancelled; people with
 * access can be removed, except on the signed-in person's own row (hidden; the server refuses it too).
 */
export function TeamMemberRow({ contact, isSelf }: { contact: PartnerContact; isSelf: boolean }) {
  const { toast } = useToast();
  const reportBlocked = useReportBlocked();
  const actions = usePersonActions(contact, handlers, confirmCopy, (result: PartnerResult) => {
    if (result.data?.blocked) reportBlocked(result.data.blocked);
    else if (result.message) toast({ title: result.message });
  });

  const state = contact.invitationState;
  const showMenu = !!state || !isSelf;

  return (
    <ContactRowFrame role="listitem">
      <ContactInfo>
        <ContactName>
          <span>
            {contact.name}
            {isSelf && ` ${copy.you}`}
          </span>
        </ContactName>
        <ContactEmail>{contact.email}</ContactEmail>
        <InvitationStatus contact={contact} onRetry={actions.resend} />
      </ContactInfo>

      {showMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ContactMenuTrigger type="button" $variant="ghost" $size="sm" aria-label={copy.rowActions(contact.name)}>
              <Icon icon={MoreVertical} size={16} />
            </ContactMenuTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {state ? (
              <>
                <DropdownMenuItem onSelect={actions.resend}>
                  <Icon icon={RotateCw} size={16} />
                  {resendLabel(state)}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    actions.requestCancel();
                  }}
                >
                  <Icon icon={MailX} size={16} />
                  {copy.invitation.cancel}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  actions.requestRemove();
                }}
              >
                <Icon icon={UserMinus} size={16} />
                {copy.removeFromOrganization}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {actions.dialog}
    </ContactRowFrame>
  );
}
