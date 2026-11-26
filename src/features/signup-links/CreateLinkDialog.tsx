"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { fieldError, type ActionState } from "@/lib/forms";
import { createSignupLink } from "./actions";
import type { SignupLink } from "./links";
import { LinkDialogContent } from "./LinkDialog";

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;

const idle: ActionState<SignupLink> = { status: "idle" };

/**
 * Asks for an event name, then shows the new link in the same dialog: its URL and its QR code.
 * Mount it with a new `key` each time it opens so it starts empty.
 */
export function CreateLinkDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [name, setName] = React.useState("");
  // An empty name is caught here, before a round trip; everything else comes back from the server.
  const [localError, setLocalError] = React.useState<string | null>(null);
  // The result whose field error the admin has since started fixing, so it stops showing as they type.
  const [editedSince, setEditedSince] = React.useState<ActionState<SignupLink> | null>(null);

  const [state, formAction] = React.useActionState(async (prev: ActionState<SignupLink>, formData: FormData) => {
    const next = await createSignupLink(prev, formData);
    if (next.status === "error" && next.message) toast({ title: next.message });
    return next;
  }, idle);

  const created = state.status === "success" ? state.data : undefined;
  const error = localError ?? (editedSince === state ? undefined : fieldError(state, "eventName"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {created ? (
        <LinkDialogContent link={created} />
      ) : (
        <DialogContent aria-describedby={undefined}>
          <form
            action={formAction}
            noValidate
            onSubmit={(event) => {
              if (!name.trim()) {
                event.preventDefault();
                setLocalError("Enter the event name.");
              }
            }}
          >
            <DialogTitle>Create link</DialogTitle>
            <Body>
              <Field label="Event name" required error={error}>
                {(props) => (
                  <Input
                    {...props}
                    name="eventName"
                    autoComplete="off"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setLocalError(null);
                      setEditedSince(state);
                    }}
                  />
                )}
              </Field>
            </Body>
            <DialogActions>
              <SubmitButton>Create link</SubmitButton>
            </DialogActions>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
