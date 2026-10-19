"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { adminsCopy } from "../_copy";
import { EMAIL_PATTERN } from "../_lib/email";

const copy = adminsCopy.invite;

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

/** Invite admin: Name and Email, both required. Errors keep the dialog open with the values and focus the first invalid field. */
export function InviteAdminDialog({
  open,
  onOpenChange,
  existingEmails,
  onInvite,
  onCloseAutoFocus,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lowercase emails that already have access or a pending invite. */
  existingEmails: string[];
  onInvite: (name: string, email: string) => void;
  onCloseAutoFocus?: (event: Event) => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});
  const nameRef = React.useRef<HTMLInputElement>(null);
  const emailRef = React.useRef<HTMLInputElement>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const next: { name?: string; email?: string } = {};
    if (!trimmedName) next.name = copy.nameRequired;
    if (!trimmedEmail) next.email = copy.emailRequired;
    else if (!EMAIL_PATTERN.test(trimmedEmail)) next.email = copy.emailInvalid;
    else if (existingEmails.includes(trimmedEmail)) next.email = copy.emailTaken;
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.email) return emailRef.current?.focus();
    onInvite(trimmedName, trimmedEmail);
    setName("");
    setEmail("");
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setErrors({});
        onOpenChange(next);
      }}
    >
      <DialogContent onCloseAutoFocus={onCloseAutoFocus}>
        <DialogTitle>{copy.title}</DialogTitle>
        <DialogDescription>{copy.description}</DialogDescription>
        <Form onSubmit={submit} noValidate>
          <Field label={copy.nameLabel} error={errors.name} required>
            {(p) => <Input {...p} ref={nameRef} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
          </Field>
          <Field label={copy.emailLabel} error={errors.email} required>
            {(p) => (
              <Input {...p} ref={emailRef} name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            )}
          </Field>
          <DialogActions>
            <DialogClose asChild>
              <Button type="button" $variant="secondary">
                {copy.cancel}
              </Button>
            </DialogClose>
            <Button type="submit">{copy.submit}</Button>
          </DialogActions>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
