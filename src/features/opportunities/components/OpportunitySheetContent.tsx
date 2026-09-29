"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { CircleAlert, CircleOff, Copy, ExternalLink as ExternalLinkIcon, Pencil, RotateCcw, Trash2 } from "lucide-react";
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
import { Icon } from "@/components/ui/Icon";
import { SheetBody, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { TagList } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import type { ActionState } from "@/lib/forms";
import {
  ACCESSIBILITY_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  EVENT_FORMAT_LABEL,
  KIND_NOUN,
  SKILL_LABEL,
  TIME_COMMITMENT_LABEL,
  TOPIC_LABEL,
  VOLUNTEER_FORMAT_LABEL,
  WORKPLACE_LABEL,
} from "../catalog";
import { copy } from "../copy";
import { closesOn, daysUntil, formatDate, formatWhenLine, formatWhere } from "../format";
import type { Opportunity, OpportunityActions } from "../types";
import { requireOnline } from "@/lib/offline";
import { ImageMatte } from "./ImageMatte";
import { closedReasonLabel, formatUpdated, KindBadge, statusLabel } from "./opportunityColumns";

const Title = styled(SheetTitle)`
  overflow-wrap: anywhere;
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

const DetailsList = styled.dl`
  margin: 0;
  display: grid;
  gap: var(--space-3);
`;

const DetailRow = styled.div`
  display: grid;
  grid-template-columns: 136px minmax(0, 1fr);
  gap: var(--space-3);

  @media (max-width: 479px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
`;

const WhenRelative = styled.span`
  color: var(--color-text-muted);
`;

const Warning = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-md);
  background: var(--color-warning-subtle);
  color: var(--color-warning);
  font-size: var(--text-sm);
`;

const Stats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
`;

const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
`;

const StatLabel = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const StatValue = styled.span`
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  font-variant-numeric: tabular-nums;
`;

const StatMuted = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
`;

const StatHint = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--color-text-muted);
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const Summary = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;
  white-space: pre-line;
`;

const SummaryMuted = styled(Summary)`
  color: var(--color-text-muted);
`;

const count = new Intl.NumberFormat("en-CA");
const pct = new Intl.NumberFormat("en-CA", { style: "percent", maximumFractionDigits: 1 });

const DetailLabel = styled.dt`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const DetailValue = styled.dd`
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text);
  overflow-wrap: anywhere;
  white-space: pre-line;
`;

const MutedValue = styled(DetailValue)`
  color: var(--color-text-muted);
`;

const ExternalLink = styled.a`
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 2px;

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
    border-radius: var(--radius-sm);
  }
`;

const Updated = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

/* Secondary actions stay visible (no ⋯ menu); Edit is the one primary action. */
/* The listing's image in the same 16:9 taupe matte as partner cards. */
const Photo = styled(ImageMatte)`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-3);
`;

const HeaderTags = styled(TagList)`
  margin-top: var(--space-2);
`;

const FooterTools = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-right: auto;
`;

const IconButton = styled(Button)`
  padding: 0;
  aspect-ratio: 1;
  justify-content: center;
`;

/* Same as the member panel: a secondary icon button with a red icon. */
const DangerIconButton = styled(IconButton)`
  color: var(--color-danger);
`;

const IconLink = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  background: var(--color-secondary);
  color: var(--color-text);
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-secondary-hover);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

type Detail = { label: string; value: string | number | undefined };

const date = (v?: string) => (v ? formatDate(v) : undefined);

/** "$10" or "$10–$25". */
const priceText = (min?: number, max?: number) => (min === undefined ? undefined : max !== undefined ? `$${min}–$${max}` : `$${min}`);

/** Kind-specific rows, in form order; empty values are skipped by the caller. */
function kindDetails(o: Opportunity): Detail[] {
  const f = copy.form;
  switch (o.kind) {
    case "event": {
      const d = o.details;
      return [
        { label: f.event.format, value: d.format && EVENT_FORMAT_LABEL[d.format] },
        { label: f.area.label, value: formatWhere(o) },
        { label: f.event.cost, value: d.cost && (d.cost === "paid" ? f.event.paid : f.event.free) },
        { label: f.event.price, value: d.cost === "paid" ? priceText(d.priceMin, d.priceMax) : undefined },
        { label: f.event.accessibility.label, value: d.accessibility?.map((a) => ACCESSIBILITY_LABEL[a]).join(", ") },
        { label: f.event.accessibilityNote.label, value: d.accessibilityNote },
      ];
    }
    case "petition": {
      const d = o.details;
      return [
        { label: f.petition.target.label, value: d.target },
        { label: f.petition.deadline.label, value: date(d.deadline) },
        { label: f.petition.signatureGoal.label, value: d.signatureGoal?.toLocaleString("en-CA") },
      ];
    }
    case "volunteer": {
      const d = o.details;
      return [
        { label: f.volunteer.timeCommitment.label, value: d.timeCommitment && TIME_COMMITMENT_LABEL[d.timeCommitment] },
        { label: f.volunteer.format, value: d.format && VOLUNTEER_FORMAT_LABEL[d.format] },
        { label: f.area.label, value: formatWhere(o) },
        { label: f.volunteer.startDate.label, value: date(d.startDate) },
        { label: f.volunteer.skills.label, value: d.skills?.map((x) => SKILL_LABEL[x]).join(", ") },
        { label: f.volunteer.minimumAge.label, value: d.minimumAge },
        { label: f.volunteer.applyBy.label, value: date(d.applyBy) },
      ];
    }
    case "job": {
      const d = o.details;
      return [
        { label: f.job.employmentType, value: d.employmentType && EMPLOYMENT_TYPE_LABEL[d.employmentType] },
        { label: f.job.workplace, value: d.workplace && WORKPLACE_LABEL[d.workplace] },
        { label: f.area.label, value: formatWhere(o) },
        { label: f.job.pay.label, value: d.pay },
        { label: f.job.applyBy.label, value: date(d.applyBy) },
        { label: f.job.qualifications.label, value: d.qualifications },
      ];
    }
    case "other": {
      const d = o.details;
      return [
        { label: f.other.callToAction.label, value: d.callToAction },
        { label: f.other.deadline.label, value: date(d.deadline) },
        ...(d.details ?? []).map((x) => ({ label: x.label, value: x.value })),
      ];
    }
  }
}

function statusVariant(o: Opportunity) {
  if (o.status === "published") return "success" as const;
  if (o.status === "draft") return "neutral" as const;
  return "outline" as const;
}

/**
 * Read-only details for one opportunity, shown in the list's side panel. One primary action (Edit);
 * everything else lives in the ⋯ menu. Results show as toasts.
 */
export function OpportunitySheetContent({
  opportunity: o,
  basePath,
  actions,
  onDeleted,
}: {
  opportunity: Opportunity;
  basePath: string;
  actions: OpportunityActions;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = React.useTransition();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const noun = KIND_NOUN[o.kind];
  // The confirm isn't opened through a Radix trigger, so focus returns to the Delete button directly.
  const deleteRef = React.useRef<HTMLButtonElement>(null);
  const keepRef = React.useRef<HTMLButtonElement>(null);

  function run<T>(action: () => Promise<ActionState<T>>, after?: (result: ActionState<T>) => void) {
    if (pending || !requireOnline()) return;
    startTransition(async () => {
      const result = await action();
      if (result.message) toast({ title: result.message });
      if (result.status === "success") {
        router.refresh();
        after?.(result);
      }
    });
  }

  const details = kindDetails(o).filter((d) => d.value !== undefined && d.value !== "");
  const when = formatWhenLine(o);
  const closing = closesOn(o).ymd;
  const days = closing ? daysUntil(closing) : undefined;
  // Worth worrying about: published, happening within a week, and no one has been emailed yet.
  const soonNotSent = o.status === "published" && !o.performance && days !== undefined && days >= 0 && days <= 7;

  return (
    <>
      <SheetHeader>
        {o.imageUrl && <Photo src={o.imageUrl} />}
        <Title>{o.title}</Title>
        {o.summary ? <Summary>{o.summary}</Summary> : <SummaryMuted>{copy.panel.noDescription}</SummaryMuted>}
        {/* Status and type use the table's badge styles; topics stay plain tags. */}
        <HeaderTags aria-label={copy.panel.tagsLabel}>
          <Badge $variant={statusVariant(o)}>{statusLabel(o)}</Badge>
          {o.status === "closed" && o.closedReason !== "closed" && <Badge $variant="outline">{closedReasonLabel(o)}</Badge>}
          <KindBadge kind={o.kind} />
          {o.topics.map((t) => (
            // Same size as the status and type badges; plain outline so they read as topics, not state.
            <Badge key={t} $variant="outline">
              {TOPIC_LABEL[t]}
            </Badge>
          ))}
        </HeaderTags>
      </SheetHeader>

      <SheetBody aria-busy={pending || undefined}>
        <Body>
          {soonNotSent && days !== undefined && (
            <Warning role="status">
              <Icon icon={CircleAlert} size={16} />
              {copy.panel.soonNotSent(days)}
            </Warning>
          )}
          {o.status !== "draft" && (
            <Stats>
              <Stat>
                <StatLabel>{copy.panel.sentTo}</StatLabel>
                {o.performance ? (
                  <StatValue>{copy.panel.people(count.format(o.performance.sentTo))}</StatValue>
                ) : (
                  <StatMuted>{copy.panel.notSentYet}</StatMuted>
                )}
              </Stat>
              <Stat>
                <StatLabel>{copy.panel.clicks}</StatLabel>
                {o.performance ? (
                  <>
                    {/* The rate sits beside the count; screen readers get what it's a rate of. */}
                    <StatValue>
                      {count.format(o.performance.clicks)}{" "}
                      <StatHint>
                        ({pct.format(o.performance.sentTo ? o.performance.clicks / o.performance.sentTo : 0)})
                        <VisuallyHidden> {copy.panel.clickRateOf}</VisuallyHidden>
                      </StatHint>
                    </StatValue>
                  </>
                ) : (
                  <StatMuted>{copy.panel.notSentYet}</StatMuted>
                )}
              </Stat>
            </Stats>
          )}
          <Section>
            <SectionTitle>{copy.panel.details}</SectionTitle>
            <DetailsList>
              {when && (
                <DetailRow>
                  <DetailLabel>{copy.panel.when}</DetailLabel>
                  <DetailValue>
                    {when}
                    {days !== undefined && days >= 0 && <WhenRelative> · {copy.panel.whenIn(days)}</WhenRelative>}
                  </DetailValue>
                </DetailRow>
              )}
              {o.topics.length === 0 && (
                <DetailRow>
                  <DetailLabel>{copy.panel.topics}</DetailLabel>
                  <MutedValue>{copy.panel.notSet}</MutedValue>
                </DetailRow>
              )}
              <DetailRow>
                <DetailLabel>{copy.panel.postedBy}</DetailLabel>
                <DetailValue>{o.organization.name}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>{copy.form.link.label[o.kind]}</DetailLabel>
                {o.link ? (
                  <DetailValue>
                    <ExternalLink href={o.link} target="_blank" rel="noopener noreferrer">
                      {o.link.replace(/^https?:\/\//, "")}
                    </ExternalLink>
                  </DetailValue>
                ) : (
                  <MutedValue>{copy.panel.notSet}</MutedValue>
                )}
              </DetailRow>
              {details.map((d, i) => (
                <DetailRow key={`${d.label}-${i}`}>
                  <DetailLabel>{d.label}</DetailLabel>
                  <DetailValue>{d.value}</DetailValue>
                </DetailRow>
              ))}
            </DetailsList>
          </Section>
          <Updated>{copy.panel.lastUpdated(formatUpdated(o.updatedAt), o.updatedBy.name)}</Updated>
        </Body>
      </SheetBody>

      <SheetFooter>
        <FooterTools role="group" aria-label={copy.panel.moreActions}>
          {o.link && (
            <Tooltip content={copy.panel.openLink} pinOnClick={false}>
              <IconLink href={o.link} target="_blank" rel="noopener noreferrer" aria-label={copy.panel.openLink}>
                <Icon icon={ExternalLinkIcon} size={16} />
              </IconLink>
            </Tooltip>
          )}
          <Tooltip content={copy.panel.duplicate} pinOnClick={false}>
            <IconButton
              type="button"
              $variant="secondary"
              $size="sm"
              aria-label={copy.panel.duplicate}
              aria-busy={pending || undefined}
              onClick={() =>
                run(
                  () => actions.duplicate(o.id),
                  (result) => result.data && router.push(`${basePath}/${result.data.id}/edit`),
                )
              }
            >
              <Icon icon={Copy} size={16} />
            </IconButton>
          </Tooltip>
          {o.status === "published" && (
            <Tooltip content={copy.panel.close} pinOnClick={false}>
              <IconButton type="button" $variant="secondary" $size="sm" aria-label={copy.panel.close} onClick={() => run(() => actions.close(o.id))}>
                <Icon icon={CircleOff} size={16} />
              </IconButton>
            </Tooltip>
          )}
          {o.status === "closed" && (
            <Tooltip content={copy.panel.reopen} pinOnClick={false}>
              <IconButton type="button" $variant="secondary" $size="sm" aria-label={copy.panel.reopen} onClick={() => run(() => actions.reopen(o.id))}>
                <Icon icon={RotateCcw} size={16} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip content={copy.panel.delete} pinOnClick={false}>
            <DangerIconButton ref={deleteRef} type="button" $variant="secondary" $size="sm" aria-label={copy.panel.delete} onClick={() => setConfirmDelete(true)}>
              <Icon icon={Trash2} size={16} />
            </DangerIconButton>
          </Tooltip>
        </FooterTools>
        <Button type="button" onClick={() => router.push(`${basePath}/${o.id}/edit`)}>
          <Icon icon={Pencil} size={16} />
          {copy.panel.edit}
        </Button>
      </SheetFooter>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            // Start on the safe choice (Keep), not the dialog's close button.
            event.preventDefault();
            keepRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            deleteRef.current?.focus();
          }}
        >
          <AlertDialogTitle>{copy.confirmDelete.title(noun)}</AlertDialogTitle>
          <AlertDialogDescription>{copy.confirmDelete.body}</AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button ref={keepRef} type="button" $variant="secondary">
                {copy.confirmDelete.cancel}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" $variant="danger" onClick={() => run(() => actions.remove(o.id), onDeleted)}>
                {copy.confirmDelete.confirm}
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
