"use client";

import * as React from "react";
import { styled } from "next-yak";
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { adminsCopy } from "../_copy";
import type { AdminRecord } from "../_data/types";

const copy = adminsCopy.remove;

const Form = styled.form`
  display: grid;
  gap: var(--space-4);
`;

/** Compared ignoring case and surrounding spaces; the point is to slow people down, not to trip them on capitals. */
const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Removing an admin means typing their name first. */
export function RemoveAdminDialog({
  admin,
  isYou,
  onOpenChange,
  onRemove,
}: {
  admin: AdminRecord | null;
  isYou: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (admin: AdminRecord) => void;
}) {
  return (
    <AlertDialog open={admin !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        {admin && <RemoveForm key={admin.id} admin={admin} isYou={isYou} onRemove={onRemove} />}
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RemoveForm({ admin, isYou, onRemove }: { admin: AdminRecord; isYou: boolean; onRemove: (admin: AdminRecord) => void }) {
  const [typed, setTyped] = React.useState("");
  const matches = same(typed, admin.name);

  return (
    <>
      <AlertDialogTitle>{copy.title(admin.name)}</AlertDialogTitle>
      <AlertDialogDescription>{isYou ? copy.bodySelf : copy.body}</AlertDialogDescription>
      <Form
        onSubmit={(event) => {
          event.preventDefault();
          if (matches) onRemove(admin);
        }}
        noValidate
      >
        <Field label={copy.confirmLabel(admin.name)} required>
          {(p) => <Input {...p} name="confirmName" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />}
        </Field>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button type="button" $variant="secondary">
              {copy.cancel}
            </Button>
          </AlertDialogCancel>
          {matches ? (
            <Button type="submit" $variant="danger">
              {copy.submit}
            </Button>
          ) : (
            <DisabledReason reason={copy.confirmReason(admin.name)}>
              <Button type="submit" $variant="danger" disabled>
                {copy.submit}
              </Button>
            </DisabledReason>
          )}
        </AlertDialogActions>
      </Form>
    </>
  );
}
