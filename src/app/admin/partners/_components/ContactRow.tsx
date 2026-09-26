"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { CircleAlert, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { fieldError, idleState } from "@/lib/forms";
import { cancelInvitation, removeContact, resendInvitation, updateContact } from "../_data/actions";
import type { PartnerContact } from "../_data/types";
import { formatDate } from "../_lib/format";

const Row = styled.div<{ $highlighted?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-1);
  border-radius: var(--radius-md);
  transition: background-color var(--duration) var(--ease);

  ${({ $highlighted }) => $highlighted && `background: var(--color-accent-subtle);`}

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const Info = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NameLine = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const Email = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const Muted = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const ErrorLine = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  font-size: var(--text-xs);
  color: var(--color-danger);

  svg {
    flex-shrink: 0;
  }
`;

const MenuTrigger = styled(Button)`
  flex-shrink: 0;
`;

const EditForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-1);
`;

const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

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

type Confirm = "cancel" | "remove";

export function ContactRow({
  contact,
  organizationName,
  onlyContact,
  highlighted,
}: {
  contact: PartnerContact;
  organizationName: string;
  onlyContact: boolean;
  highlighted?: boolean;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [confirm, setConfirm] = React.useState<Confirm | null>(null);
  const [editState, editAction] = useActionState(updateContact.bind(null, contact.id), idleState);
  const rowRef = React.useRef<HTMLDivElement>(null);

  // Keeps the alert dialog's copy stable while it plays its close animation
  // (by then `confirm` is already null); updated during render, not an effect.
  const [shownConfirm, setShownConfirm] = React.useState<Confirm>("cancel");
  if (confirm && confirm !== shownConfirm) setShownConfirm(confirm);

  // Exits edit mode once a save resolves without field errors; derived at
  // render time from the action state instead of mirrored in an effect.
  const [handledEditState, setHandledEditState] = React.useState(editState);
  if (editState !== handledEditState) {
    setHandledEditState(editState);
    if (editState.status !== "idle" && !editState.fieldErrors) setEditing(false);
  }

  React.useEffect(() => {
    if (highlighted) rowRef.current?.focus();
  }, [highlighted]);

  React.useEffect(() => {
    if (editState.status !== "idle" && !editState.fieldErrors && editState.message) {
      toast({ title: editState.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editState]);

  async function handleResend() {
    const result = await resendInvitation(contact.id);
    toast({ title: result.message ?? "Invitation resent." });
  }

  async function handleConfirm(kind: Confirm) {
    const result = kind === "cancel" ? await cancelInvitation(contact.id) : await removeContact(contact.id);
    toast({ title: result.message ?? "Done." });
  }

  if (editing) {
    return (
      <EditForm action={editAction} aria-label={`Edit ${contact.name}`}>
        <Field label="Name" error={fieldError(editState, "name")} required>
          {(p) => <Input {...p} name="name" defaultValue={contact.name} autoComplete="name" />}
        </Field>
        <Field label="Email" error={fieldError(editState, "email")} required>
          {(p) => <Input {...p} name="email" type="email" defaultValue={contact.email} autoComplete="email" />}
        </Field>
        <EditActions>
          <Button type="button" $variant="secondary" $size="sm" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <SubmitButton $size="sm">Save</SubmitButton>
        </EditActions>
      </EditForm>
    );
  }

  const removeItem = (
    <DropdownMenuItem
      disabled={onlyContact}
      onSelect={(event) => {
        if (onlyContact) {
          event.preventDefault();
          return;
        }
        setConfirm("remove");
      }}
    >
      Remove from organization
      {onlyContact && (
        <VisuallyHidden>
          {" "}
          — This is the organization&apos;s only contact. Remove the organization instead.
        </VisuallyHidden>
      )}
    </DropdownMenuItem>
  );

  return (
    <Row ref={rowRef} tabIndex={-1} $highlighted={highlighted}>
      <Info>
        <NameLine>
          {contact.name}
          {contact.status === "pending" && <Badge $variant="neutral">Pending</Badge>}
        </NameLine>
        <Email>{contact.email}</Email>
        {contact.status === "pending" &&
          contact.invitation &&
          (contact.invitation.sendError ? (
            <ErrorLine>
              <Icon icon={CircleAlert} size={13} />
              <span>{contact.invitation.sendError}</span>
              <Button type="button" $variant="ghost" $size="sm" onClick={handleResend}>
                Retry
              </Button>
            </ErrorLine>
          ) : (
            <Muted>Expires {formatDate(contact.invitation.expiresAt)}</Muted>
          ))}
      </Info>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <MenuTrigger type="button" $variant="ghost" $size="sm" aria-label={`Actions for ${contact.name}`}>
            <Icon icon={MoreVertical} size={16} />
          </MenuTrigger>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditing(true)}>Edit</DropdownMenuItem>
          {contact.status === "pending" && (
            <DropdownMenuItem onSelect={handleResend}>Resend invitation</DropdownMenuItem>
          )}
          {contact.status === "pending" ? (
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setConfirm("cancel");
              }}
            >
              Cancel invitation
            </DropdownMenuItem>
          ) : onlyContact ? (
            <Tooltip content="This is the organization's only contact. Remove the organization instead.">
              {removeItem}
            </Tooltip>
          ) : (
            removeItem
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {shownConfirm === "cancel" ? "Cancel this invitation?" : `Remove ${contact.name} from ${organizationName}?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {shownConfirm === "cancel"
              ? `${contact.name} won't be able to use the invitation link already sent.`
              : `${contact.name} loses access to the partner portal now. Their record is kept for history, and their email can be invited under another organization.`}
          </AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                {shownConfirm === "cancel" ? "Keep invitation" : "Keep access"}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                $variant="danger"
                onClick={() => confirm && void handleConfirm(confirm)}
              >
                {shownConfirm === "cancel" ? "Yes, cancel invitation" : "Yes, remove"}
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </Row>
  );
}
