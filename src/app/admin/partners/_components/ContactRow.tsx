"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { MailX, MoreVertical, Pencil, RotateCw, UserMinus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DialogActions, DialogClose } from "@/components/ui/Dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { invitationCopy, partnersCopy } from "../_copy";
import { cancelInvitation, removeContact, resendInvitation, updateContact } from "../_data/actions";
import type { PartnerContact } from "../_data/types";
import { useFocusFirstInvalid } from "../_lib/useFocusFirstInvalid";
import {
  ContactEmail,
  ContactInfo,
  ContactMenuTrigger,
  ContactName,
  ContactRowFrame,
  InvitationStatus,
  resendLabel,
} from "./ContactRowParts";
import { usePersonActions, type PersonConfirmCopy } from "./PersonActions";

const copy = partnersCopy.person;

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

export const adminPersonHandlers = { resend: resendInvitation, cancel: cancelInvitation, remove: removeContact };

export const adminConfirmCopy = (organizationName: string): PersonConfirmCopy => ({
  cancelNotSentBody: copy.cancelNotSentBody,
  removeTitle: (name) => copy.removeConfirm.title(name, organizationName),
  removeBody: (name) => copy.removeConfirm.body(name, organizationName),
  removeKeep: copy.removeConfirm.keep,
  removeConfirm: copy.removeConfirm.confirm,
});

const DialogForm = styled.form`
  display: grid;
  gap: var(--space-4);
`;

/**
 * Name + email edit form for one person (admin only). Controlled, so a failed save keeps what was typed.
 * `inDialog` lays it out for a kit Dialog (the People row's Edit details), with Cancel closing the dialog.
 */
export function PersonEditForm({
  contact,
  onDone,
  inDialog,
}: {
  contact: PartnerContact;
  onDone?: () => void;
  inDialog?: boolean;
}) {
  const { toast } = useToast();
  const [state, action] = useActionState(updateContact.bind(null, contact.id), idleState);
  const [name, setName] = React.useState(contact.name);
  const [email, setEmail] = React.useState(contact.email);
  const formRef = React.useRef<HTMLFormElement>(null);
  useFocusFirstInvalid(formRef, state);

  React.useEffect(() => {
    if (state.status === "idle" || state.fieldErrors) return;
    if (state.message) toast({ title: state.message });
    if (state.status === "success") onDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const Form = inDialog ? DialogForm : EditForm;
  return (
    <Form ref={formRef} action={action} noValidate aria-label={`${copy.edit} ${contact.name}`}>
      <Field label={partnersCopy.personPanel.nameLabel} error={fieldError(state, "name")} required>
        {(p) => <Input {...p} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
      </Field>
      <Field label={partnersCopy.personPanel.emailLabel} error={fieldError(state, "email")} required>
        {(p) => (
          <Input {...p} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
        )}
      </Field>
      {inDialog ? (
        <DialogActions>
          <DialogClose asChild>
            <Button type="button" $variant="secondary">
              {copy.cancelEdit}
            </Button>
          </DialogClose>
          <SubmitButton>{copy.saveEdit}</SubmitButton>
        </DialogActions>
      ) : (
      <EditActions>
        {onDone && (
          <Button type="button" $variant="secondary" $size="sm" onClick={onDone}>
            <Icon icon={X} size={16} />
            {copy.cancelEdit}
          </Button>
        )}
        <SubmitButton $size="sm">{copy.saveEdit}</SubmitButton>
      </EditActions>
      )}
    </Form>
  );
}

/** One person in the organization panel's People list. `readOnly` for a removed organization. */
export function ContactRow({
  contact,
  organizationName,
  lastWithAccess,
  readOnly,
}: {
  contact: PartnerContact;
  organizationName: string;
  /** The only person at the organization with access: they can't be removed on their own. */
  lastWithAccess: boolean;
  readOnly?: boolean;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const actions = usePersonActions(contact, adminPersonHandlers, adminConfirmCopy(organizationName), (result) => {
    if (result.message) toast({ title: result.message });
  });

  if (editing) return <PersonEditForm contact={contact} onDone={() => setEditing(false)} />;

  const state = contact.invitationState;
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
    <ContactRowFrame>
      <ContactInfo>
        <ContactName>{contact.name}</ContactName>
        <ContactEmail>{contact.email}</ContactEmail>
        {!readOnly && <InvitationStatus contact={contact} onRetry={actions.resend} />}
      </ContactInfo>

      {!readOnly && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ContactMenuTrigger type="button" $variant="ghost" $size="sm" aria-label={copy.rowActions(contact.name)}>
              <Icon icon={MoreVertical} size={16} />
            </ContactMenuTrigger>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditing(true)}>
              <Icon icon={Pencil} size={16} />
              {copy.edit}
            </DropdownMenuItem>
            {state && (
              <DropdownMenuItem onSelect={actions.resend}>
                <Icon icon={RotateCw} size={16} />
                {resendLabel(state)}
              </DropdownMenuItem>
            )}
            {state ? (
              <DropdownMenuItem
                $variant="danger"
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
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {actions.dialog}
    </ContactRowFrame>
  );
}
