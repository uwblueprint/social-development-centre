"use client";

import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signOut } from "@/features/auth/actions";
import { FormError } from "@/features/auth/AuthScreen";
import { formatDate } from "@/lib/date";
import { fieldError, idleState } from "@/lib/forms";
import { addAdmin, resendAdminLink } from "./actions";
import type { AdminRow } from "./queries";

const Page = styled.main`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-4);
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
`;

const Title = styled.h1`
  margin: 0 0 var(--space-2);
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-none);
  letter-spacing: var(--tracking-tight);
`;

const Muted = styled.p`
  margin: 0;
  color: var(--color-text-muted);
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
`;

const AddForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
  max-width: 400px;
`;

const Success = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-success);
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
`;

const Person = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const Details = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const ResendForm = styled.form`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

export function AdminsPage({ admins, currentAdminId }: { admins: AdminRow[]; currentAdminId: string }) {
  return (
    <Page>
      <Header>
        <div>
          <Title>Admins</Title>
          <Muted>Every admin can manage SDC and add other admins.</Muted>
        </div>
        <form action={signOut.bind(null, "admin")}>
          <Button type="submit" $variant="outline">
            Sign out
          </Button>
        </form>
      </Header>

      <Section aria-labelledby="add-admin">
        <SectionTitle id="add-admin">Add an admin</SectionTitle>
        <AddAdminForm />
      </Section>

      <Section aria-labelledby="current-admins">
        <SectionTitle id="current-admins">Current admins</SectionTitle>
        <List>
          {admins.map((admin) => (
            <AdminListItem key={admin.id} admin={admin} isYou={admin.id === currentAdminId} />
          ))}
        </List>
      </Section>
    </Page>
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
      <Success role="status">{state.status === "success" && state.message}</Success>
      {state.status === "error" && state.message && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {state.message}
        </FormError>
      )}
    </AddForm>
  );
}

function AdminListItem({ admin, isYou }: { admin: AdminRow; isYou: boolean }) {
  return (
    <Row>
      <Person>
        <span>
          {admin.name ?? admin.email}
          {isYou && " (you)"}
        </span>
        <Details>
          {admin.email} · Added {formatDate(admin.addedAt)}
        </Details>
      </Person>
      <RowActions>
        {!admin.hasSignedIn && <ResendLink email={admin.email} />}
        <Badge $variant={admin.hasSignedIn ? "success" : "neutral"}>{admin.hasSignedIn ? "Active" : "Invited"}</Badge>
      </RowActions>
    </Row>
  );
}

function ResendLink({ email }: { email: string }) {
  const [state, formAction] = useActionState(resendAdminLink.bind(null, email), idleState);

  return (
    <ResendForm action={formAction}>
      <Details role="status">{state.message}</Details>
      <SubmitButton $variant="outline" $size="sm">
        Resend link
      </SubmitButton>
    </ResendForm>
  );
}
