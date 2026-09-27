"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { styled } from "next-yak";
import { ArrowRight, Ban, Send, UserPlus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { List } from "@/components/ui/ListRow";
import { SheetBody, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { partnersCopy } from "../_copy";
import { removePartner, updateOrganization } from "../_data/actions";
import { ORGANIZATION_DESCRIPTION_MAX, type PartnerOrganization } from "../_data/types";
import { formatDate } from "../_lib/format";
import { useFocusFirstInvalid } from "../_lib/useFocusFirstInvalid";
import { ContactRow } from "./ContactRow";

const copy = partnersCopy.organizationPanel;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const OppsLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  width: fit-content;
  font-size: var(--text-sm);
  color: var(--color-text);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const ProfileForm = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
`;

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const PeopleSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);

  & > * {
    align-self: stretch;
  }
  & > button {
    align-self: flex-start;
  }
`;

export function PartnerSheetContent({
  org,
  onAddPerson,
}: {
  org: PartnerOrganization;
  /** Opens Invite partner for this organization (also how a removed organization is reinvited). */
  onAddPerson: () => void;
}) {
  const { toast } = useToast();
  const [state, action] = useActionState(updateOrganization.bind(null, org.id), idleState);
  // Controlled so a failed save keeps what was typed (React resets uncontrolled forms after an action).
  const [name, setName] = React.useState(org.name);
  const [website, setWebsite] = React.useState(org.website ?? "");
  const [description, setDescription] = React.useState(org.description ?? "");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);
  const keepRef = React.useRef<HTMLButtonElement>(null);
  useFocusFirstInvalid(formRef, state);

  React.useEffect(() => {
    if (state.status !== "idle" && !state.fieldErrors && state.message) toast({ title: state.message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  async function handleRemove() {
    const result = await removePartner(org.id);
    if (result.message) toast({ title: result.message });
  }

  const removed = org.status === "removed";
  const activeCount = org.contacts.filter((c) => c.status === "active").length;
  const profileId = `profile-${org.id}`;
  const peopleId = `people-${org.id}`;

  return (
    <>
      <SheetHeader>
        <SheetTitle>{org.name}</SheetTitle>
        {(removed || org.status === "pending") && (
          <MetaRow>
            {removed ? (
              <>
                <Badge $variant="outline">{partnersCopy.badges.removed}</Badge>
                {org.removedAt && <span>{copy.removedOn(formatDate(org.removedAt))}</span>}
              </>
            ) : (
              <Badge $variant="neutral">{partnersCopy.badges.awaitingResponse}</Badge>
            )}
          </MetaRow>
        )}
        <OppsLink href={`/admin/opportunities?org=${org.id}`}>
          {copy.viewOpportunities(org.opportunityCount)}
          <Icon icon={ArrowRight} size={14} />
        </OppsLink>
      </SheetHeader>

      <SheetBody>
        <Sections>
          <section aria-labelledby={profileId}>
            <SectionTitle id={profileId}>{copy.profileHeading}</SectionTitle>
            <ProfileForm ref={formRef} action={action} aria-labelledby={profileId} noValidate>
              <Field label={copy.nameLabel} error={fieldError(state, "name")} required>
                {(p) => <Input {...p} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
              </Field>
              <Field label={copy.websiteLabel} hint={copy.websiteHint} error={fieldError(state, "website")}>
                {(p) => (
                  <Input
                    {...p}
                    name="website"
                    inputMode="url"
                    autoComplete="off"
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
              <SubmitButton $variant="secondary" $size="sm">
                {copy.save}
              </SubmitButton>
            </ProfileForm>
          </section>

          <PeopleSection aria-labelledby={peopleId} role="region">
            <SectionTitle id={peopleId}>{copy.peopleHeading}</SectionTitle>
            <List>
              {org.contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  organizationName={org.name}
                  lastWithAccess={contact.status === "active" && activeCount === 1}
                  readOnly={removed}
                />
              ))}
            </List>
            {!removed && (
              <Button type="button" $variant="secondary" $size="sm" onClick={onAddPerson}>
                <Icon icon={UserPlus} size={16} />
                {copy.addPerson}
              </Button>
            )}
          </PeopleSection>
        </Sections>
      </SheetBody>

      <SheetFooter>
        {removed ? (
          <Button type="button" $variant="secondary" onClick={onAddPerson}>
            <Icon icon={Send} size={16} />
            {copy.reinvite}
          </Button>
        ) : (
          <Button type="button" $variant="danger" onClick={() => setConfirmOpen(true)}>
            <Icon icon={Ban} size={16} />
            {partnersCopy.removeAccess.action}
          </Button>
        )}
      </SheetFooter>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            // Start on the safe choice (Keep access), not the dialog's close button.
            event.preventDefault();
            keepRef.current?.focus();
          }}
        >
          <AlertDialogTitle>{partnersCopy.removeAccess.title(org.name)}</AlertDialogTitle>
          <AlertDialogDescription>{partnersCopy.removeAccess.body(org.name)}</AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button ref={keepRef} type="button" $variant="secondary">
                {partnersCopy.removeAccess.keep}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" $variant="danger" onClick={() => void handleRemove()}>
                {partnersCopy.removeAccess.confirm}
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
