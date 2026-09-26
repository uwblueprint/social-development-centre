"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { UserPlus } from "lucide-react";
import { ListPageHeader } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { List } from "@/components/ui/ListRow";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { ORGANIZATION_DESCRIPTION_MAX, type PartnerOrganization } from "@/app/admin/partners/_data/types";
import { fieldError, idleState } from "@/lib/forms";
import { partnerCopy } from "../../_copy";
import { updateMyOrganization } from "../_data/actions";
import { InviteColleagueDialog } from "./InviteColleagueDialog";
import { TeamMemberRow } from "./TeamMemberRow";

const copy = partnerCopy.organization;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  max-width: 640px;
  padding: var(--space-5) var(--space-6);

  @media (max-width: 767px) {
    gap: var(--space-5);
    padding: var(--space-4);
  }
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

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-3);
`;

export function OrganizationView({ org, currentContactId }: { org: PartnerOrganization; currentContactId: string }) {
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = React.useState(false);
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
      <ListPageHeader title={copy.title} />

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
        <SectionHeader>
          <SectionTitle id="team-heading">{copy.teamHeading}</SectionTitle>
          <Button type="button" $variant="secondary" $size="sm" onClick={() => setInviteOpen(true)}>
            <Icon icon={UserPlus} size={16} />
            {copy.inviteButton}
          </Button>
        </SectionHeader>
        <List role="list" aria-labelledby="team-heading">
          {org.contacts.map((c) => (
            <TeamMemberRow key={c.id} contact={c} isSelf={c.id === currentContactId} />
          ))}
        </List>
        <InviteColleagueDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      </Section>
    </Page>
  );
}
