"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { uniqueSlug, type SignupLink } from "./data";
import { LinkDetails } from "./LinkDetails";

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;

/**
 * Asks for an event name, then shows the new link in the same dialog: its URL and its QR code.
 * Mount it with a new `key` each time it opens so it starts empty.
 */
export function CreateLinkDialog({
  open,
  onOpenChange,
  existing,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existing: SignupLink[];
  onCreate: (link: SignupLink) => void;
}) {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [created, setCreated] = React.useState<SignupLink | null>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter the event name.");
      return;
    }
    const link: SignupLink = {
      id: crypto.randomUUID(),
      name: trimmed,
      slug: uniqueSlug(trimmed, existing.map((l) => l.slug)),
      clicks: 0,
      joins: 0,
    };
    setCreated(link);
    onCreate(link);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        {created ? (
          <>
            <DialogTitle>{created.name}</DialogTitle>
            <LinkDetails link={created} onDone={() => onOpenChange(false)} />
          </>
        ) : (
          <form onSubmit={submit} noValidate>
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
                      setError(null);
                    }}
                  />
                )}
              </Field>
            </Body>
            <DialogActions>
              <Button type="submit">Create link</Button>
            </DialogActions>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
