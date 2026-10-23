"use client";

import { useActionState } from "react";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ConfirmRemove, PeopleList } from "@/features/people/PeopleList";
import { displayName, type PersonRow } from "@/features/people/person";
import { AddForm, FormMessage, Muted, PageTitle, PeoplePage, Section, SectionTitle } from "@/features/people/PeoplePage";
import { fieldError } from "@/lib/forms";
import { addMember, removeMember } from "./actions";

export function MembersPage({ members }: { members: PersonRow[] }) {
  return (
    <PeoplePage>
      <header>
        <PageTitle>Members</PageTitle>
        <Muted>Members can sign in to the members’ area.</Muted>
      </header>

      <Section aria-labelledby="add-member">
        <SectionTitle id="add-member">Add a member</SectionTitle>
        <AddMemberForm />
      </Section>

      <PeopleList
        titleId="current-members"
        title="Current members"
        people={members}
        emptyText="No members yet."
        portal="member"
        renderRemove={(member, removal) => (
          <ConfirmRemove
            label="Remove"
            accessibleLabel={`Remove ${displayName(member)} as a member`}
            title={`Remove ${displayName(member)} as a member?`}
            description="They’ll stay on SDC’s list but can’t sign in to the members’ area."
            confirmLabel="Remove member"
            doneMessage={`${displayName(member)} is no longer a member.`}
            action={() => removeMember(member.id)}
            removal={removal}
          />
        )}
      />
    </PeoplePage>
  );
}

function AddMemberForm() {
  const [state, formAction] = useActionState(addMember, { status: "idle" });

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
      <SubmitButton>Add member</SubmitButton>
      <FormMessage state={state} />
    </AddForm>
  );
}
