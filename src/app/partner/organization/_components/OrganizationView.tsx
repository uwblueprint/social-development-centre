"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { UserPlus } from "lucide-react";
import { contentIn, ListPageHeader } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { List } from "@/components/ui/ListRow";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { ORGANIZATION_DESCRIPTION_MAX, type PartnerOrganization } from "@/app/admin/partners/_data/types";
import { useFocusFirstInvalid } from "@/app/admin/partners/_lib/useFocusFirstInvalid";
import { fieldError } from "@/lib/forms";
import { partnerCopy } from "../../_copy";
import { updateMyOrganization, type Blocked, type PartnerResult } from "../_data/actions";
import { BlockedNotice, ReportBlockedContext } from "./BlockedNotice";
import { InviteColleagueDialog } from "./InviteColleagueDialog";
import { TeamMemberRow } from "./TeamMemberRow";

const copy = partnerCopy.organization;
const initialState: PartnerResult = { status: "idle" };

/*
 * One flat, centred column (owner, after Mobbin: Loops, Basecamp, Firecrawl): no cards, no tabs.
 * Profile's fields with their own Save right under them; a hairline; then Team, whose actions
 * (invite, remove) take effect right away. Teams are 1–10 people, so a plain list, not a table.
 */
const Page = styled.div`
  display: flex;
  flex-direction: column;
  /* 16px between blocks, like ListPage (owner). */
  gap: var(--space-4);
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: var(--space-7) var(--space-6) var(--space-8);

  /* Like ListPage: sections animate in after loading; the title stays put. */
  & > :not(:first-child) {
    animation: ${contentIn} var(--duration-slow) var(--ease) backwards;
  }

  @media (max-width: 767px) {
    padding: var(--space-5) var(--space-4) var(--space-7);
  }
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  & + & {
    padding-top: var(--space-4);
    border-top: 1px solid var(--color-border);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: var(--space-6);
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
  align-items: stretch;
  gap: var(--space-5);
`;

const Actions = styled.div`
  display: flex;
`;

export function OrganizationView({ org, currentContactId }: { org: PartnerOrganization; currentContactId: string }) {
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = React.useState(false);
  // Not opened through a Radix Trigger, so Radix has nothing to return focus to on close; this button
  // stays mounted, so we can return focus to it directly.
  const inviteTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [blocked, setBlocked] = React.useState<Blocked | null>(null);
  const [state, action] = useActionState(updateMyOrganization, initialState);
  // Controlled so a failed save keeps what the person typed (React resets uncontrolled forms after an action).
  const [name, setName] = React.useState(org.name);
  const [website, setWebsite] = React.useState(org.website ?? "");
  const [description, setDescription] = React.useState(org.description ?? "");
  const formRef = React.useRef<HTMLFormElement>(null);
  useFocusFirstInvalid(formRef, state);

  // Field errors show inline only; signed out / access ended show a persistent message; success is a toast.
  // The message follows each result, derived at render time rather than mirrored in an effect.
  const [handledState, setHandledState] = React.useState(state);
  if (state !== handledState) {
    setHandledState(state);
    if (state.data?.blocked) setBlocked(state.data.blocked);
    else if (state.status === "success") setBlocked(null);
  }

  const onResult = React.useEffectEvent(() => {
    if (state.status === "success" && state.message) toast({ title: state.message });
  });
  React.useEffect(() => {
    onResult();
  }, [state]);

  return (
    <ReportBlockedContext.Provider value={setBlocked}>
      <Page>
        <ListPageHeader title={copy.title} />
        {blocked && <BlockedNotice blocked={blocked} />}

        <Section aria-labelledby="profile-heading">
          <SectionHeader>
            <SectionTitle id="profile-heading">{copy.profileHeading}</SectionTitle>
          </SectionHeader>
          <Form ref={formRef} action={action} noValidate>
            <Field label={copy.nameLabel} error={fieldError(state, "name")} required>
              {(p) => <Input {...p} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="organization" />}
            </Field>
            <Field label={copy.websiteLabel} error={fieldError(state, "website")}>
              {(p) => (
                <Input {...p} name="website" inputMode="url" autoComplete="url" value={website} onChange={(e) => setWebsite(e.target.value)} />
              )}
            </Field>
            <Field label={copy.descriptionLabel} error={fieldError(state, "description")}>
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
            <Button ref={inviteTriggerRef} type="button" $variant="secondary" $size="sm" onClick={() => setInviteOpen(true)}>
              <Icon icon={UserPlus} size={16} />
              {copy.inviteButton}
            </Button>
          </SectionHeader>
          <List role="list" aria-labelledby="team-heading">
            {org.contacts.map((c) => (
              <TeamMemberRow key={c.id} contact={c} isSelf={c.id === currentContactId} />
            ))}
          </List>
          <InviteColleagueDialog
            open={inviteOpen}
            onOpenChange={setInviteOpen}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              inviteTriggerRef.current?.focus();
            }}
          />
        </Section>
      </Page>
    </ReportBlockedContext.Provider>
  );
}
