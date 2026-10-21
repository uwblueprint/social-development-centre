"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmRemove, PeopleList } from "@/features/people/PeopleList";
import { displayName, type PersonRow } from "@/features/people/person";
import { AddForm, FormMessage, Muted, PageTitle, PeoplePage, Section, SectionTitle } from "@/features/people/PeoplePage";
import { fieldError } from "@/lib/forms";
import { addPayingMember, removePayingAccess } from "./actions";

export function PayingMembersPage({ members }: { members: PersonRow[] }) {
  return (
    <PeoplePage>
      <header>
        <PageTitle>Paying members</PageTitle>
        <Muted>Paying members can sign in to the members’ area. Add someone once their payment arrives.</Muted>
      </header>

      <Section aria-labelledby="add-paying-member">
        <SectionTitle id="add-paying-member">Add a paying member</SectionTitle>
        <AddPayingMemberForm />
      </Section>

      <PeopleList
        titleId="current-paying-members"
        title="Current paying members"
        people={members}
        emptyText="No paying members yet."
        portal="member"
        renderRemove={(member, removal) => (
          <ConfirmRemove
            label="Remove"
            accessibleLabel={`Remove paying access for ${displayName(member)}`}
            title={`Remove paying access for ${displayName(member)}?`}
            description="They’ll stay on SDC’s list but can’t sign in to the members’ area."
            confirmLabel="Remove paying access"
            doneMessage={`${displayName(member)} is no longer a paying member.`}
            action={() => removePayingAccess(member.id)}
            removal={removal}
          />
        )}
      />
    </PeoplePage>
  );
}

function AddPayingMemberForm() {
  const [state, formAction] = useActionState(addPayingMember, { status: "idle" });

  return (
    <AddForm action={formAction} noValidate>
      <Field label="Full name">
        {(props) => <Input {...props} name="fullName" autoComplete="off" defaultValue={state.data?.fullName} />}
      </Field>
      <Field label="Email address" required error={fieldError(state, "email")}>
        {(props) => (
          <Input {...props} type="email" name="email" autoComplete="off" defaultValue={state.data?.email} />
        )}
      </Field>
      <SubmitButton>Add paying member</SubmitButton>
      <FormMessage state={state} />
    </AddForm>
  );
}
