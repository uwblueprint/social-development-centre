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
import type { InviteResult } from "@/app/admin/partners/_data/contacts";
import { useFocusFirstInvalid } from "@/app/admin/partners/_lib/useFocusFirstInvalid";
import { fieldError } from "@/lib/forms";
import { partnerCopy } from "../../_copy";
import { inviteColleague, type PartnerResult } from "../_data/actions";
import { useReportBlocked } from "./BlockedNotice";

const copy = partnerCopy.organization.invite;
const initialState: PartnerResult<InviteResult> = { status: "idle" };

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

/**
 * Name + Email → invitation to the signed-in partner's organization.
 * - Field errors: stays open with its values, focus on the first invalid field.
 * - Saved (sent, or saved but not sent): closes with a toast; the row shows its state.
 * - Nothing saved: stays open with its values and says the invitation couldn't be sent.
 * - Signed out or access ended: closes; the page shows a persistent message.
 */
export function InviteColleagueDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [state, action] = useActionState(inviteColleague, initialState);
  const { toast } = useToast();
  const reportBlocked = useReportBlocked();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const formRef = React.useRef<HTMLFormElement>(null);
  useFocusFirstInvalid(formRef, state);

  // Once someone is saved, the next invitation starts empty (derived at render time, not in an effect).
  const [handledState, setHandledState] = React.useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.status === "success" || state.data?.saved) {
      setName("");
      setEmail("");
    }
  }

  React.useEffect(() => {
    if (state.status === "idle" || state.fieldErrors) return;
    if (state.data?.blocked) {
      onOpenChange(false);
      reportBlocked(state.data.blocked);
      return;
    }
    if (state.status === "success" || state.data?.saved) onOpenChange(false);
    if (state.message) toast({ title: state.message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

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
