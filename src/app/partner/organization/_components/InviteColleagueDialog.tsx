"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { partnerCopy } from "../../_copy";
import { inviteColleague } from "../_data/actions";

const copy = partnerCopy.organization.invite;

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

/** Name + Email → invitation to the signed-in partner's organization. Mirrors the admin InviteDialog. */
export function InviteColleagueDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [state, action] = useActionState(inviteColleague, idleState);
  const { toast } = useToast();

  React.useEffect(() => {
    // Field errors keep the dialog open; anything else (sent, or added but not sent) closes it with a toast.
    if (state.status !== "idle" && !state.fieldErrors) {
      onOpenChange(false);
      if (state.message) toast({ title: state.message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
        <Form action={action} noValidate>
          <Field label={copy.nameLabel} error={fieldError(state, "name")} required>
            {(p) => <Input {...p} name="name" autoComplete="off" />}
          </Field>
          <Field label={copy.emailLabel} error={fieldError(state, "email")} required>
            {(p) => <Input {...p} name="email" type="email" autoComplete="off" />}
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
