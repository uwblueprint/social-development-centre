"use client";

import { useActionState, useState } from "react";
import { CircleAlert } from "lucide-react";
import { styled } from "next-yak";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { FormError } from "@/features/auth/AuthScreen";
import { fieldError, idleState, type ActionState } from "@/lib/forms";
import { deleteAccount, updateName, type NameValues } from "./actions";
import { Cell, Column, FormColumn, Row, RowLabel, Section, SectionTitle, Sections } from "./layout";
import type { Account } from "./queries";

const idleName: ActionState<NameValues> = { status: "idle" };

/* Delete account sits a full section away from the name form. */
const PageColumn = styled(Column)`
  gap: var(--space-7);
`;

export function AccountSettings({ account }: { account: Account }) {
  return (
    <ListPage>
      <PageColumn>
        <NameForm initial={{ firstName: account.firstName, lastName: account.lastName }} />
        <Sections>
          <DeleteAccount onlyAdmin={account.onlyAdmin} />
        </Sections>
      </PageColumn>
    </ListPage>
  );
}

/**
 * Always editable. Nothing is saved until Save, and the Save button only appears once a name has changed.
 * Leaving the page with unsaved edits discards them.
 */
function NameForm({ initial }: { initial: NameValues }) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);

  const [state, formAction] = useActionState(async (prev: ActionState<NameValues>, formData: FormData) => {
    const result = await updateName(prev, formData);
    if (result.status === "success" && result.data) {
      setSaved(result.data);
      setDraft(result.data);
      toast({ title: result.message ?? "Your name is saved." });
    }
    return result;
  }, idleName);

  const dirty = draft.firstName.trim() !== saved.firstName || draft.lastName.trim() !== saved.lastName;
  const formLevelError = state.status === "error" && !state.fieldErrors ? state.message : undefined;

  return (
    <FormColumn action={formAction} noValidate>
      <ListPageHeader title="Settings" actions={dirty ? <SubmitButton>Save</SubmitButton> : undefined} />
      {formLevelError && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {formLevelError}
        </FormError>
      )}
      <Sections>
        <Section aria-labelledby="name">
          <SectionTitle id="name">Your name</SectionTitle>
          <Row>
            <RowLabel>First name</RowLabel>
            <Cell>
              <Field label="First name" error={fieldError(state, "firstName")}>
                {(props) => (
                  <Input
                    {...props}
                    name="firstName"
                    autoComplete="given-name"
                    value={draft.firstName}
                    onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
                  />
                )}
              </Field>
            </Cell>
          </Row>
          <Row>
            <RowLabel>Last name</RowLabel>
            <Cell>
              <Field label="Last name" error={fieldError(state, "lastName")}>
                {(props) => (
                  <Input
                    {...props}
                    name="lastName"
                    autoComplete="family-name"
                    value={draft.lastName}
                    onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
                  />
                )}
              </Field>
            </Cell>
          </Row>
        </Section>
      </Sections>
    </FormColumn>
  );
}

/** Last on the page, apart from everything else. */
function DeleteAccount({ onlyAdmin }: { onlyAdmin: boolean }) {
  return (
    <Section aria-labelledby="delete">
      <SectionTitle id="delete">Delete account</SectionTitle>
      <Row>
        <RowLabel>Permanently delete your account?</RowLabel>
        <div>
          {onlyAdmin ? (
            // The rule from docs/decisions/admins.md (decision 2); the database refuses the last admin too.
            <DisabledReason reason="You’re the only admin. Add another admin before you leave.">
              <Button type="button" $variant="danger" disabled>
                Delete account
              </Button>
            </DisabledReason>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" $variant="danger">
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <DeleteForm />
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </Row>
    </Section>
  );
}

/** Mounted only while the dialog is open, so a failed attempt's error is gone when it reopens. */
function DeleteForm() {
  const [state, formAction] = useActionState(() => deleteAccount(), idleState);

  return (
    <form action={formAction}>
      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
      <AlertDialogDescription>
        You won’t be able to log in anymore. Another admin can invite you back.
      </AlertDialogDescription>
      {state.status === "error" && state.message && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {state.message}
        </FormError>
      )}
      <AlertDialogActions>
        <AlertDialogCancel asChild>
          <Button type="button" $variant="secondary">
            Cancel
          </Button>
        </AlertDialogCancel>
        <SubmitButton $variant="danger">Delete account</SubmitButton>
      </AlertDialogActions>
    </form>
  );
}
