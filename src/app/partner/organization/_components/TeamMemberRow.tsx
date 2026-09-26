"use client";

import * as React from "react";
import { CircleAlert, MailX, MoreVertical, Send, UserMinus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import {
  ContactEmail,
  ContactErrorLine,
  ContactInfo,
  ContactMenuTrigger,
  ContactMeta,
  ContactName,
  ContactRowFrame,
} from "@/app/admin/partners/_components/ContactRowParts";
import type { PartnerContact } from "@/app/admin/partners/_data/types";
import { formatDate } from "@/app/admin/partners/_lib/format";
import { partnerCopy } from "../../_copy";
import { cancelColleagueInvitation, removeColleague, resendColleagueInvitation } from "../_data/actions";

const copy = partnerCopy.organization;

type Confirm = "cancel" | "remove";

/**
 * One person on the partner's Team list, with the same actions as the admin ContactRow minus Edit.
 * The signed-in person's own row has no Remove item (hidden, not disabled).
 */
export function TeamMemberRow({ contact, isSelf }: { contact: PartnerContact; isSelf: boolean }) {
  const { toast } = useToast();
  const [confirm, setConfirm] = React.useState<Confirm | null>(null);

  // Keeps the alert dialog's copy stable while it plays its close animation (by then `confirm` is null).
  const [shownConfirm, setShownConfirm] = React.useState<Confirm>("cancel");
  if (confirm && confirm !== shownConfirm) setShownConfirm(confirm);

  const pending = contact.status === "pending";
  const showMenu = pending || !isSelf;

  async function handleResend() {
    const result = await resendColleagueInvitation(contact.id);
    if (result.message) toast({ title: result.message });
  }

  async function handleConfirm(kind: Confirm) {
    const result = kind === "cancel" ? await cancelColleagueInvitation(contact.id) : await removeColleague(contact.id);
    if (result.message) toast({ title: result.message });
  }

  const dialog = shownConfirm === "cancel" ? copy.confirmCancel : copy.confirmRemove;

  return (
    <ContactRowFrame role="listitem">
      <ContactInfo>
        <ContactName>
          <span>
            {contact.name}
            {isSelf && ` ${copy.you}`}
          </span>
          {pending && <Badge $variant="warning">{copy.pending}</Badge>}
        </ContactName>
        <ContactEmail>{contact.email}</ContactEmail>
        {pending &&
          contact.invitation &&
          (contact.invitation.sendError ? (
            <ContactErrorLine>
              <Icon icon={CircleAlert} size={13} />
              <span>{contact.invitation.sendError}</span>
              <Button type="button" $variant="ghost" $size="sm" onClick={handleResend}>
                {copy.retry}
              </Button>
            </ContactErrorLine>
          ) : (
            <ContactMeta>{copy.invitationExpires(formatDate(contact.invitation.expiresAt))}</ContactMeta>
          ))}
      </ContactInfo>

      {showMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ContactMenuTrigger type="button" $variant="ghost" $size="sm" aria-label={copy.rowActions(contact.name)}>
              <Icon icon={MoreVertical} size={16} />
            </ContactMenuTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {pending ? (
              <>
                <DropdownMenuItem onSelect={handleResend}>
                  <Icon icon={Send} size={16} />
                  {copy.resendInvitation}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    setConfirm("cancel");
                  }}
                >
                  <Icon icon={MailX} size={16} />
                  {copy.cancelInvitation}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem
                onSelect={(event) => {
                  event.preventDefault();
                  setConfirm("remove");
                }}
              >
                <Icon icon={UserMinus} size={16} />
                {copy.removeFromOrganization}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {shownConfirm === "cancel" ? copy.confirmCancel.title : copy.confirmRemove.title(contact.name)}
          </AlertDialogTitle>
          <AlertDialogDescription>{dialog.body(contact.name)}</AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                {dialog.keep}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" $variant="danger" onClick={() => confirm && void handleConfirm(confirm)}>
                {dialog.confirm}
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </ContactRowFrame>
  );
}
