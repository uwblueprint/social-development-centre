"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { CreatableCombobox, type CreatableComboboxValue } from "@/components/ui/CreatableCombobox";
import {
  Dialog,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { invitePartner } from "../_data/actions";
import type { OrganizationOption } from "../_data/types";

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

export function InviteDialog({
  open,
  onOpenChange,
  organizationOptions,
  presetOrganization,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationOptions: OrganizationOption[];
  presetOrganization?: { id: string; name: string };
}) {
  const [state, action] = useActionState(invitePartner, idleState);
  const { toast } = useToast();

  React.useEffect(() => {
    if (state.status === "success") {
      onOpenChange(false);
      toast({ title: state.message ?? "Invitation sent." });
    } else if (state.status === "error" && !state.fieldErrors) {
      onOpenChange(false);
      toast({ title: state.message ?? "The invitation wasn't sent." });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const defaultOrganization: CreatableComboboxValue | undefined = presetOrganization
    ? { kind: "existing", value: presetOrganization.id, label: presetOrganization.name }
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Invite partner</DialogTitle>
        <DialogDescription>
          Add a contact and give them access to their organization&apos;s opportunities.
        </DialogDescription>
        <Form action={action} noValidate>
          <Field label="Name" error={fieldError(state, "name")} required>
            {(p) => <Input {...p} name="name" placeholder="Ada Lovelace" autoComplete="name" />}
          </Field>
          <Field label="Email" error={fieldError(state, "email")} required>
            {(p) => (
              <Input {...p} name="email" type="email" placeholder="ada@example.org" autoComplete="email" />
            )}
          </Field>
          <Field
            label="Organization"
            error={fieldError(state, "organization")}
            required
            hint="Search existing organizations, or create a new one"
          >
            {(p) => (
              <CreatableCombobox
                {...p}
                options={organizationOptions.map((o) => ({ value: o.id, label: o.name }))}
                existingFieldName="organizationId"
                createFieldName="organizationName"
                defaultValue={defaultOrganization}
                placeholder="Search or create an organization…"
              />
            )}
          </Field>
          <DialogActions>
            <DialogClose asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <SubmitButton>Send invitation</SubmitButton>
          </DialogActions>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
