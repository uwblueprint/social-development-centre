"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { styled } from "next-yak";
import { ArrowRight, Ban, Copy, Pencil, Plus, Send, UserPlus } from "lucide-react";
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
import { SheetBody, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { fieldError, idleState } from "@/lib/forms";
import { partnersCopy } from "../_copy";
import { removePartner, saveOrganizationNotes, updateOrganization } from "../_data/actions";
import { ORGANIZATION_DESCRIPTION_MAX, ORGANIZATION_NOTES_MAX, type AdminPartnerOrganization } from "../_data/types";
import { formatDate, formatDateTimeTitle, formatRelativeCell, formatRelativeInSentence } from "../_lib/format";
import { useFocusFirstInvalid } from "../_lib/useFocusFirstInvalid";
import { ContactRow } from "./ContactRow";
import { copyEmails } from "./CopyableEmail";
import { HealthBadge } from "./HealthBadge";

const copy = partnersCopy.organizationPanel;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

/* Visible under the title (not tucked beside the close button); wraps at 360px. */
const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-top: var(--space-2);
`;

const TextLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  width: fit-content;
  font-size: var(--text-sm);
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--color-border-strong);

  &:hover {
    text-decoration-color: currentColor;
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

const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);

  & > * {
    max-width: 100%;
  }
`;

const Paragraph = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text);
`;

const Muted = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const NextStep = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);

  & > strong {
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
`;

const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  width: 100%;
  margin: 0;

  & > div {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }
  & dt {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
  & dd {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
`;

const Details = styled.dl`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;

  & dt {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
  & dd {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text);
    overflow-wrap: anywhere;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  width: 100%;

  & > * {
    align-self: stretch;
  }
  & > [data-form-actions] {
    align-self: flex-start;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: var(--space-2);
`;

function reasonFor(org: AdminPartnerOrganization): string | null {
  const r = partnersCopy.health.reasons;
  switch (org.health?.tag) {
    case "notOnboarded":
      return r.notOnboarded(org.name);
    case "noRecentPosts":
      return org.health.since === "lastPost" ? r.noRecentPostsLastPost(org.name) : r.noRecentPostsJoined(org.name);
    case "notEmailed":
      return r.notEmailed(org.name);
    case "noClicks":
      return r.noClicks(org.name);
    default:
      return null;
  }
}

/**
 * An organization's panel: health (reason and next step), summary, people (at least one: the last person
 * with access can't be removed), SDC notes and profile. Actions sit under the title.
 */
export function PartnerSheetContent({
  org,
  now,
  onAddPerson,
}: {
  org: AdminPartnerOrganization;
  /** The server's render time, for hydration-safe relative times. */
  now: string;
  /** Opens Invite partner for this organization (also how a removed organization is reinvited). */
  onAddPerson: () => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const keepRef = React.useRef<HTMLButtonElement>(null);

  async function handleRemove() {
    const result = await removePartner(org.id);
    if (result.message) toast({ title: result.message });
  }

  async function handleCopyEmails() {
    toast({ title: await copyEmails(org.contacts.map((c) => c.email)) });
  }

  const removed = org.status === "removed";
  const activeCount = org.contacts.filter((c) => c.status === "active").length;
  const reason = reasonFor(org);
  const ids = { health: `health-${org.id}`, summary: `summary-${org.id}`, people: `people-${org.id}`, profile: `profile-${org.id}` };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{org.name}</SheetTitle>
        {(removed || org.health) && (
          <MetaRow>
            {removed ? (
              <>
                <Badge $variant="outline">{partnersCopy.badges.removed}</Badge>
                {org.removedAt && <span>{copy.removedOn(formatDate(org.removedAt))}</span>}
              </>
            ) : (
              org.health && <HealthBadge tag={org.health.tag} />
            )}
          </MetaRow>
        )}
        <ActionBar role="group" aria-label={copy.actionsLabel}>
          <Button type="button" $variant="secondary" $size="sm" onClick={() => setEditing(true)}>
            <Icon icon={Pencil} size={16} />
            {copy.editDetails}
          </Button>
          {removed ? (
            <Button type="button" $variant="secondary" $size="sm" onClick={onAddPerson}>
              <Icon icon={Send} size={16} />
              {copy.reinvite}
            </Button>
          ) : (
            <Button type="button" $variant="secondary" $size="sm" onClick={onAddPerson}>
              <Icon icon={UserPlus} size={16} />
              {copy.addPerson}
            </Button>
          )}
          {org.contacts.length > 0 && (
            <Button type="button" $variant="secondary" $size="sm" onClick={() => void handleCopyEmails()}>
              <Icon icon={Copy} size={16} />
              {partnersCopy.emails.copyOrganization}
            </Button>
          )}
          {!removed && (
            <Button type="button" $variant="danger" $size="sm" onClick={() => setConfirmOpen(true)}>
              <Icon icon={Ban} size={16} />
              {partnersCopy.removeAccess.action}
            </Button>
          )}
        </ActionBar>
      </SheetHeader>

      <SheetBody>
        <Sections>
          {org.health && reason && (
            <section aria-labelledby={ids.health}>
              <SectionTitle id={ids.health}>{copy.healthHeading}</SectionTitle>
              <Stack>
                <Paragraph>{reason}</Paragraph>
                <NextStep>
                  <strong>{partnersCopy.health.nextStepLabel}:</strong> {partnersCopy.health.nextSteps[org.health.tag]}
                </NextStep>
              </Stack>
            </section>
          )}

          <section aria-labelledby={ids.summary}>
            <SectionTitle id={ids.summary}>{copy.summaryHeading}</SectionTitle>
            <Stack>
              <Stats>
                <div>
                  <dt>{copy.published}</dt>
                  <dd>{org.opportunityCount}</dd>
                </div>
                <div>
                  <dt>{copy.totalClicks}</dt>
                  <dd>{org.totalClicks}</dd>
                </div>
                <div>
                  <dt>{copy.lastPosted}</dt>
                  <dd>
                    {org.lastPostedAt ? (
                      <time dateTime={org.lastPostedAt} title={formatDateTimeTitle(org.lastPostedAt)}>
                        {formatRelativeCell(org.lastPostedAt, now)}
                      </time>
                    ) : (
                      partnersCopy.table.never
                    )}
                  </dd>
                </div>
              </Stats>
              <TextLink href={`/admin/opportunities?org=${org.id}`}>
                {copy.viewOpportunities(org.opportunityCount)}
                <Icon icon={ArrowRight} size={14} />
              </TextLink>
              {!removed && (
                <TextLink href={`/admin/opportunities/new?org=${org.id}`}>
                  <Icon icon={Plus} size={14} />
                  {copy.postForThem}
                </TextLink>
              )}
            </Stack>
          </section>

          <section aria-labelledby={ids.people}>
            <SectionTitle id={ids.people}>{copy.peopleHeading}</SectionTitle>
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
          </section>

          <NotesForm key={org.id} org={org} now={now} />

          <section aria-labelledby={ids.profile}>
            <SectionTitle id={ids.profile}>{copy.profileHeading}</SectionTitle>
            {editing ? (
              <ProfileForm key={org.id} org={org} labelledBy={ids.profile} onDone={() => setEditing(false)} />
            ) : (
              <Details>
                <div>
                  <dt>{copy.nameLabel}</dt>
                  <dd>{org.name}</dd>
                </div>
                <div>
                  <dt>{copy.websiteLabel}</dt>
                  <dd>{org.website ? org.website.replace(/^https:\/\//, "") : copy.notAdded}</dd>
                </div>
                <div>
                  <dt>{copy.descriptionLabel}</dt>
                  <dd>{org.description || copy.notAdded}</dd>
                </div>
              </Details>
            )}
          </section>
        </Sections>
      </SheetBody>

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

/** Edit details: name, website, description. Opens focused on the name; closes after a successful save. */
function ProfileForm({ org, labelledBy, onDone }: { org: AdminPartnerOrganization; labelledBy: string; onDone: () => void }) {
  const { toast } = useToast();
  const [state, action] = useActionState(updateOrganization.bind(null, org.id), idleState);
  // Controlled so a failed save keeps what was typed (React resets uncontrolled forms after an action).
  const [name, setName] = React.useState(org.name);
  const [website, setWebsite] = React.useState(org.website ?? "");
  const [description, setDescription] = React.useState(org.description ?? "");
  const formRef = React.useRef<HTMLFormElement>(null);
  useFocusFirstInvalid(formRef, state);

  React.useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, []);

  React.useEffect(() => {
    if (state.status === "idle" || state.fieldErrors) return;
    if (state.message) toast({ title: state.message });
    if (state.status === "success") onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Form ref={formRef} action={action} aria-labelledby={labelledBy} noValidate>
      <Field label={copy.nameLabel} error={fieldError(state, "name")} required>
        {(p) => <Input {...p} name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />}
      </Field>
      <Field label={copy.websiteLabel} hint={copy.websiteHint} error={fieldError(state, "website")}>
        {(p) => <Input {...p} name="website" inputMode="url" autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />}
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
      <FormActions data-form-actions="">
        <SubmitButton $size="sm">{copy.save}</SubmitButton>
        <Button type="button" $variant="ghost" $size="sm" onClick={onDone}>
          {copy.cancel}
        </Button>
      </FormActions>
    </Form>
  );
}

/** SDC notes: admins only, saved with who edited them and when. */
function NotesForm({ org, now }: { org: AdminPartnerOrganization; now: string }) {
  const { toast } = useToast();
  const [state, action] = useActionState(saveOrganizationNotes.bind(null, org.id), idleState);
  const [notes, setNotes] = React.useState(org.notes?.text ?? "");
  const formRef = React.useRef<HTMLFormElement>(null);
  useFocusFirstInvalid(formRef, state);

  React.useEffect(() => {
    if (state.status !== "idle" && !state.fieldErrors && state.message) toast({ title: state.message });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const edited = org.notes ? copy.notesEdited(org.notes.editedBy, formatRelativeInSentence(org.notes.editedAt, now)) : undefined;

  return (
    <Form ref={formRef} action={action} noValidate>
      <Field label={copy.notesLabel} error={fieldError(state, "notes")}>
        {(p) => (
          <Textarea
            {...p}
            name="notes"
            rows={4}
            maxLength={ORGANIZATION_NOTES_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        )}
      </Field>
      {edited && org.notes && <Muted title={formatDateTimeTitle(org.notes.editedAt)}>{edited}</Muted>}
      <FormActions data-form-actions="">
        <SubmitButton $variant="secondary" $size="sm">
          {copy.notesSave}
        </SubmitButton>
      </FormActions>
    </Form>
  );
}
