"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import { styled } from "next-yak";
import { ArrowRight, Ban, Copy, MoreHorizontal, Pencil, Plus, Send, UserPlus } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
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
import { dismissHealth, removePartner, saveOrganizationNotes, updateOrganization } from "../_data/actions";
import { ORGANIZATION_DESCRIPTION_MAX, ORGANIZATION_NOTES_MAX, type AdminPartnerOrganization } from "../_data/types";
import { formatDate, formatDateTimeTitle, formatRelativeCell } from "../_lib/format";
import { useFocusFirstInvalid } from "../_lib/useFocusFirstInvalid";
import { ContactRow } from "./ContactRow";
import { copyEmails } from "./CopyableEmail";
import { HealthBadge } from "./HealthBadge";

const copy = partnersCopy.organizationPanel;

/*
 * Layout: the header holds only identity (name, health) and a ⋯ menu for org-wide actions. The body is
 * four sections, each with a heading row whose action sits beside it: Activity, People, Profile, Notes.
 * Sections are separated by a rule so the groups read at a glance.
 */
const Sections = styled.div`
  display: flex;
  flex-direction: column;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-5) 0;

  &:first-child {
    padding-top: 0;
  }
  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  min-height: 32px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const DangerMenuItem = styled(DropdownMenuItem)`
  color: var(--color-danger);

  & > svg {
    color: inherit;
  }
`;

/* One joined strip, cells split by hairlines: reads as a single snapshot rather than three cards. */
const Stats = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);

  & > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: var(--space-3);
    min-width: 0;
  }
  & > div + div {
    border-left: 1px solid var(--color-border);
  }
  & dt {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
  & dd {
    margin: 0;
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
    line-height: var(--leading-heading);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

/* The organization header flows straight into its numbers: no rule and no bottom padding (owner). */
const FlushHeader = styled(SheetHeader)`
  border-bottom: 0;
  padding-bottom: 0;
`;

/* Description, then the badges a clear step below. */
const Identity = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
`;

/* Pulled up so the description sits tight under the name. */
const Description = styled.p`
  margin: calc(var(--space-1) * -1) 0 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

/* A navigation link dressed as the kit's small secondary button. */
const ButtonLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  background: var(--color-secondary);
  color: var(--color-text);
  text-decoration: none;
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-secondary-hover);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const HealthCallout = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-md);
  background: var(--color-warning-subtle);
`;

const CalloutActions = styled.div`
  display: flex;
  margin-top: var(--space-1);
`;

const Paragraph = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const NextStep = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  & > strong {
    font-weight: var(--weight-medium);
    color: var(--color-text);
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
  // Remove access is opened from the ⋯ menu, which is gone by the time the confirm closes; the menu's
  // trigger stays mounted (the panel is still open), so focus returns to it directly.
  const moreActionsRef = React.useRef<HTMLButtonElement>(null);

  async function handleRemove() {
    const result = await removePartner(org.id);
    if (result.message) toast({ title: result.message });
  }

  async function handleDismissHealth() {
    const result = await dismissHealth(org.id);
    if (result.message) toast({ title: result.message });
  }

  async function handleCopyEmails() {
    toast({ title: await copyEmails(org.contacts.map((c) => c.email), org.name) });
  }

  const removed = org.status === "removed";
  const activeCount = org.contacts.filter((c) => c.status === "active").length;
  const reason = reasonFor(org);
  const ids = { summary: `summary-${org.id}`, people: `people-${org.id}`, profile: `profile-${org.id}` };

  return (
    <>
      {/* Header: who the organization is. Rare and destructive actions live in the ⋯ menu. */}
      <FlushHeader
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button ref={moreActionsRef} type="button" $variant="ghost" $size="sm" aria-label={copy.moreActions}>
                <Icon icon={MoreHorizontal} size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditing(true)}>
                <Icon icon={Pencil} size={16} />
                {copy.editProfile}
              </DropdownMenuItem>
              {org.contacts.length > 0 && (
                <DropdownMenuItem onSelect={() => void handleCopyEmails()}>
                  <Icon icon={Copy} size={16} />
                  {partnersCopy.emails.copyOrganization}
                </DropdownMenuItem>
              )}
              {!removed && (
                <>
                  <DropdownMenuSeparator />
                  <DangerMenuItem onSelect={() => setConfirmOpen(true)}>
                    <Icon icon={Ban} size={16} />
                    {partnersCopy.removeAccess.action}
                  </DangerMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <SheetTitle>{org.name}</SheetTitle>
        <Identity>
          {org.description && <Description>{org.description}</Description>}
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
        </Identity>
      </FlushHeader>

      <SheetBody>
        <Sections>
          {editing && (
            <Section aria-labelledby={ids.profile}>
              <SectionHeader>
                <SectionTitle id={ids.profile}>{copy.editProfile}</SectionTitle>
              </SectionHeader>
              <ProfileForm key={org.id} org={org} labelledBy={ids.profile} onDone={() => setEditing(false)} />
            </Section>
          )}

          {/* Opportunities: how they're doing, then the two things an admin does next. */}
          {/* Owner: the numbers sit right under the name, so no visible heading here (still a named region). */}
          <Section aria-label={copy.summaryHeading}>
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
            {/* No leading icon (owner): every line starts at the same edge. The health badge in the header
                carries the status in words, so the tint isn't the only signal. */}
            {org.health && reason && (
              <HealthCallout role="note" aria-label={copy.healthHeading}>
                <Paragraph>{reason}</Paragraph>
                <NextStep>
                  <strong>{partnersCopy.health.nextStepLabel}:</strong> {partnersCopy.health.nextSteps[org.health.tag]}
                </NextStep>
                <CalloutActions>
                  <Button type="button" $variant="outline" $size="sm" onClick={() => void handleDismissHealth()}>
                    {partnersCopy.health.dismiss}
                  </Button>
                </CalloutActions>
              </HealthCallout>
            )}
            {/* The two things an admin does next here, as real buttons (owner: not a text link). */}
            <ActionRow>
              {org.opportunityCount > 0 && (
                <ButtonLink href={`/admin/opportunities?org=${org.id}`}>
                  {copy.viewOpportunities(org.opportunityCount)}
                  <Icon icon={ArrowRight} size={16} />
                </ButtonLink>
              )}
              {!removed && (
                <ButtonLink href={`/admin/opportunities/new?org=${org.id}`}>
                  <Icon icon={Plus} size={16} />
                  {copy.postForThem}
                </ButtonLink>
              )}
            </ActionRow>
          </Section>

          <Section aria-labelledby={ids.people}>
            <SectionHeader>
              <SectionTitle id={ids.people}>
                {copy.peopleHeading} ({org.contacts.length})
              </SectionTitle>
              <Button type="button" $variant="ghost" $size="sm" onClick={onAddPerson}>
                <Icon icon={removed ? Send : UserPlus} size={16} />
                {removed ? copy.reinvite : copy.addPerson}
              </Button>
            </SectionHeader>
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
          </Section>

          <Section>
            <NotesForm key={org.id} org={org} now={now} />
          </Section>
        </Sections>
      </SheetBody>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            // Start on the safe choice (Keep access), not the dialog's close button.
            event.preventDefault();
            keepRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            moreActionsRef.current?.focus();
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
/** How long typing must pause before notes save. */
const NOTES_SAVE_DELAY_MS = 800;

/**
 * Owner: notes save themselves (no Save button, no edit history). A save runs once typing pauses and
 * when the field loses focus; a quiet status says Saving… / Saved, and errors show on the field.
 */
function NotesForm({ org }: { org: AdminPartnerOrganization; now: string }) {
  const [notes, setNotes] = React.useState(org.notes?.text ?? "");
  const [status, setStatus] = React.useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = React.useState<string>();
  const saved = React.useRef(org.notes?.text ?? "");
  const timer = React.useRef<number>(undefined);

  const save = React.useCallback(
    async (value: string) => {
      window.clearTimeout(timer.current);
      if (value === saved.current) return;
      setStatus("saving");
      const fd = new FormData();
      fd.set("notes", value);
      const result = await saveOrganizationNotes(org.id, idleState, fd);
      if (result.status === "success") {
        saved.current = value;
        setError(undefined);
        setStatus("saved");
      } else {
        setError(result.fieldErrors?.notes ?? result.message);
        setStatus("idle");
      }
    },
    [org.id],
  );

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Field
      label={copy.notesLabel}
      error={error}
      hint={<span aria-live="polite">{status === "saving" ? copy.notesSaving : status === "saved" ? copy.notesSaved : ""}</span>}
    >
      {(p) => (
        <Textarea
          {...p}
          name="notes"
          rows={4}
          maxLength={ORGANIZATION_NOTES_MAX}
          value={notes}
          onChange={(e) => {
            const value = e.target.value;
            setNotes(value);
            setStatus("idle");
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => void save(value), NOTES_SAVE_DELAY_MS);
          }}
          onBlur={() => void save(notes)}
        />
      )}
    </Field>

  );
}

