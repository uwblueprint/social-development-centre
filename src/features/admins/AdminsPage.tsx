"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmRemove, PeopleList } from "@/features/people/PeopleList";
import { displayName, type PersonRow } from "@/features/people/person";
import { AddForm, FormMessage, Muted, PageTitle, PeoplePage, Section, SectionTitle } from "@/features/people/PeoplePage";
import { fieldError } from "@/lib/forms";
import { addAdmin, removeAdmin } from "./actions";

export function AdminsPage({ admins, currentAdminId }: { admins: PersonRow[]; currentAdminId: string }) {
  // The last admin can't leave (the database refuses too), so SDC is never locked out.
  const canLeave = admins.length > 1;

  return (
    <PeoplePage>
      <header>
        <PageTitle>Admins</PageTitle>
        <Muted>Every admin can manage SDC and add other admins.</Muted>
      </header>

      <Section aria-labelledby="add-admin">
        <SectionTitle id="add-admin">Add an admin</SectionTitle>
        <AddAdminForm />
      </Section>

      <PeopleList
        titleId="current-admins"
        title="Current admins"
        people={admins}
        emptyText="No admins yet."
        portal="admin"
        currentPersonId={currentAdminId}
        renderRemove={(admin, removal) => {
          if (admin.id !== currentAdminId) {
            return (
              <ConfirmRemove
                label="Remove"
                accessibleLabel={`Remove ${displayName(admin)}`}
                title={`Remove ${displayName(admin)} as an admin?`}
                description="They’ll lose access to the admin portal right away."
                confirmLabel="Remove admin"
                doneMessage={`${displayName(admin)} is no longer an admin.`}
                action={() => removeAdmin(admin.id)}
                removal={removal}
              />
            );
          }
          if (!canLeave) return null;
          return (
            <ConfirmRemove
              label="Leave"
              accessibleLabel="Leave the admin portal"
              title="Leave the admin portal?"
              description="You’ll lose access right away. Another admin can add you back."
              confirmLabel="Leave"
              doneMessage=""
              action={() => removeAdmin(admin.id)}
              removal={removal}
            />
          );
        }}
      />
    </PeoplePage>
  );
}

function AddAdminForm() {
  const [state, formAction] = useActionState(addAdmin, { status: "idle" });

  return (
    <AddForm action={formAction} noValidate>
      <Field label="Full name" required error={fieldError(state, "fullName")}>
        {(props) => <Input {...props} name="fullName" autoComplete="off" defaultValue={state.data?.fullName} />}
      </Field>
      <Field label="Email address" required error={fieldError(state, "email")}>
        {(props) => (
          <Input {...props} type="email" name="email" autoComplete="off" defaultValue={state.data?.email} />
        )}
      </Field>
      <SubmitButton>Send invite</SubmitButton>
      <FormMessage state={state} />
    </AddForm>
  );
}
