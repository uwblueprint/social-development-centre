"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { CreatableCombobox, type CreatableComboboxValue } from "@/components/ui/CreatableCombobox";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { fieldError, type ActionState } from "@/lib/forms";
import { partnersCopy } from "../_copy";
import { invitePartner } from "../_data/actions";
import type { InviteResult } from "../_data/contacts";
import type { OrganizationOption } from "../_data/types";
import { useFocusFirstInvalid } from "../_lib/useFocusFirstInvalid";

const copy = partnersCopy.invite;
const initialState: ActionState<InviteResult> = { status: "idle" };

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

export interface InvitePreset {
  organization?: { id: string; name: string };
  name?: string;
  email?: string;
}

/**
 * Invite partner: Contact name, Email, Organization (pick one, or add a new one). Inviting someone to a
 * removed organization reinvites it. Field errors keep the dialog open with its values and focus the first
 * invalid field; a saved person closes it (sent, or Invitation not sent with Retry); nothing saved keeps it open.
 */
export function InviteDialog({
  open,
  onOpenChange,
  organizationOptions,
  preset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationOptions: OrganizationOption[];
  preset?: InvitePreset;
}) {
  const [state, action] = useActionState(invitePartner, initialState);
  const { toast } = useToast();
  const [name, setName] = React.useState(preset?.name ?? "");
  const [email, setEmail] = React.useState(preset?.email ?? "");
  const formRef = React.useRef<HTMLFormElement>(null);
  useFocusFirstInvalid(formRef, state);

  React.useEffect(() => {
    if (state.status === "idle" || state.fieldErrors) return;
    if (state.status === "success" || state.data?.saved) onOpenChange(false);
    if (state.message) toast({ title: state.message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const defaultOrganization: CreatableComboboxValue | undefined = preset?.organization
    ? { kind: "existing", value: preset.organization.id, label: preset.organization.name }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
        <Form ref={formRef} action={action} noValidate>
          <Field label={copy.nameLabel} error={fieldError(state, "name")} required>
            {(p) => <Input {...p} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
          </Field>
          <Field label={copy.emailLabel} error={fieldError(state, "email")} required>
            {(p) => (
              <Input {...p} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            )}
          </Field>
          <Field label={copy.organizationLabel} error={fieldError(state, "organization")} required hint={copy.organizationHint}>
            {(p) => (
              <CreatableCombobox
                {...p}
                options={organizationOptions.map((o) => ({ value: o.id, label: o.name }))}
                existingFieldName="organizationId"
                createFieldName="organizationName"
                defaultValue={defaultOrganization}
                placeholder={copy.organizationPlaceholder}
                searchPlaceholder={copy.organizationSearchPlaceholder}
                createLabel={copy.newOrganization}
              />
            )}
          </Field>
          <DialogActions>
            <DialogClose asChild>
              <Button type="button" $variant="secondary">
                {copy.cancel}
              </Button>
            </DialogClose>
            <SubmitButton>{copy.submit}</SubmitButton>
          </DialogActions>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
