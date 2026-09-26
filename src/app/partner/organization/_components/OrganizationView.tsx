"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { Badge } from "@/components/ui/Badge";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { List } from "@/components/ui/ListRow";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { ORGANIZATION_DESCRIPTION_MAX, type PartnerOrganization } from "@/app/admin/partners/_data/types";
import { fieldError, idleState } from "@/lib/forms";
import { partnerCopy } from "../../_copy";
import { updateMyOrganization } from "../_data/actions";

const copy = partnerCopy.organization;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  max-width: 640px;
  padding: var(--space-7) var(--space-6);

  @media (max-width: 767px) {
    gap: var(--space-6);
    padding: var(--space-5) var(--space-4);
  }
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

const Muted = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

const Actions = styled.div`
  display: flex;
`;

const Person = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-3);
  padding: var(--space-3) var(--space-1);
`;

const PersonInfo = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PersonName = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const PersonEmail = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

export function OrganizationView({ org }: { org: PartnerOrganization }) {
  const { toast } = useToast();
  const [state, action] = useActionState(updateMyOrganization, idleState);
  // Controlled so a failed save keeps what the person typed (React resets uncontrolled forms after an action).
  const [name, setName] = React.useState(org.name);
  const [website, setWebsite] = React.useState(org.website ?? "");
  const [description, setDescription] = React.useState(org.description ?? "");

  React.useEffect(() => {
    if (state.status !== "idle" && state.message) toast({ title: state.message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Page>
      <Header>
        <Title>{copy.title}</Title>
        <Muted>{copy.description}</Muted>
      </Header>

      <Section aria-labelledby="profile-heading">
        <SectionTitle id="profile-heading">{copy.profileHeading}</SectionTitle>
        <Form action={action} noValidate>
          <Field label={copy.nameLabel} error={fieldError(state, "name")} required>
            {(p) => <Input {...p} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" />}
          </Field>
          <Field label={copy.websiteLabel} hint={copy.websiteHint} error={fieldError(state, "website")}>
            {(p) => (
              <Input
                {...p}
                name="website"
                type="url"
                inputMode="url"
                autoComplete="url"
                placeholder={copy.websitePlaceholder}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            )}
          </Field>
          <Field label={copy.descriptionLabel} hint={copy.descriptionHint} error={fieldError(state, "description")}>
            {(p) => (
              <Textarea
                {...p}
                name="description"
                rows={3}
                maxLength={ORGANIZATION_DESCRIPTION_MAX}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            )}
          </Field>
          <Actions>
            <SubmitButton>{copy.save}</SubmitButton>
          </Actions>
        </Form>
      </Section>

      <Section aria-labelledby="team-heading">
        <SectionTitle id="team-heading">{copy.teamHeading}</SectionTitle>
        <Muted>{copy.teamNote}</Muted>
        <List role="list">
          {org.contacts.map((c) => (
            <Person key={c.id} role="listitem">
              <PersonInfo>
                <PersonName>{c.name}</PersonName>
                <PersonEmail>{c.email}</PersonEmail>
              </PersonInfo>
              {c.status === "pending" && <Badge $variant="neutral">{copy.pending}</Badge>}
            </Person>
          ))}
        </List>
      </Section>
    </Page>
  );
}
