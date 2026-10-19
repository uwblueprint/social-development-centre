"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { ErrorIcon } from "@/components/ui/Field";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { adminsCopy } from "../_copy";
import type { AdminRecord } from "../_data/types";
import { EMAIL_PATTERN } from "../_lib/email";

const copy = adminsCopy.checkEmail;

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

const ConfirmError = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-1);
  margin: var(--space-1) 0 0;
  font-size: var(--text-xs);
  color: var(--color-danger);
`;

/**
 * Resending an invite that wasn't sent: the address is shown to edit, and the person must tick that they've
 * checked it before anything goes out. `onResend` returns whether the invite was sent; if not, the dialog stays
 * open with a message.
 */
export function CheckEmailDialog({
  admin,
  onOpenChange,
  existingEmails,
  onResend,
}: {
  /** The "Not sent" admin being fixed, or null when closed. */
  admin: AdminRecord | null;
  onOpenChange: (open: boolean) => void;
  existingEmails: string[];
  onResend: (admin: AdminRecord, email: string) => boolean;
}) {
  return (
    <Dialog open={admin !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {admin && (
          <CheckEmailForm key={admin.id} admin={admin} existingEmails={existingEmails} onResend={onResend} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckEmailForm({
  admin,
  existingEmails,
  onResend,
  onDone,
}: {
  admin: AdminRecord;
  existingEmails: string[];
  onResend: (admin: AdminRecord, email: string) => boolean;
  onDone: () => void;
}) {
  const [email, setEmail] = React.useState(admin.email);
  const [confirmed, setConfirmed] = React.useState(false);
  const [emailError, setEmailError] = React.useState<string>();
  const [confirmError, setConfirmError] = React.useState<string>();
  const emailRef = React.useRef<HTMLInputElement>(null);
  const confirmId = React.useId();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    let nextEmail: string | undefined;
    if (!trimmed) nextEmail = adminsCopy.invite.emailRequired;
    else if (!EMAIL_PATTERN.test(trimmed)) nextEmail = adminsCopy.invite.emailInvalid;
    else if (trimmed !== admin.email && existingEmails.includes(trimmed)) nextEmail = adminsCopy.invite.emailTaken;
    setEmailError(nextEmail);
    setConfirmError(confirmed ? undefined : copy.confirmRequired);
    if (nextEmail) return emailRef.current?.focus();
    if (!confirmed) return document.getElementById(confirmId)?.focus();
    if (onResend(admin, trimmed)) onDone();
    else {
      setEmailError(copy.stillFailing);
      setConfirmed(false);
      emailRef.current?.focus();
    }
  }

  return (
    <>
      <DialogTitle>{copy.title}</DialogTitle>
      <DialogDescription>{copy.description(admin.name)}</DialogDescription>
      <Form onSubmit={submit} noValidate>
        <Field label={copy.emailLabel} error={emailError} required>
          {(p) => (
            <Input {...p} ref={emailRef} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
          )}
        </Field>
        <div>
          <Checkbox
            id={confirmId}
            label={copy.confirmLabel}
            checked={confirmed}
            onCheckedChange={(v) => {
              setConfirmed(v === true);
              if (v === true) setConfirmError(undefined);
            }}
            aria-invalid={confirmError ? true : undefined}
          />
          {confirmError && (
            <ConfirmError role="alert">
              <ErrorIcon />
              <span>{confirmError}</span>
            </ConfirmError>
          )}
        </div>
        <DialogActions>
          <DialogClose asChild>
            <Button type="button" $variant="secondary">
              {copy.cancel}
            </Button>
          </DialogClose>
          <Button type="submit">{copy.submit}</Button>
        </DialogActions>
      </Form>
    </>
  );
}
