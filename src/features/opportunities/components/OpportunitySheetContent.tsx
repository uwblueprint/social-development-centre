"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { MoreHorizontal } from "lucide-react";
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
import { Icon } from "@/components/ui/Icon";
import { SheetBody, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { Tag, TagList } from "@/components/ui/Tag";
import { useToast } from "@/components/ui/Toast";
import type { ActionState } from "@/lib/forms";
import {
  COMMITMENT_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  EVENT_FORMAT_LABEL,
  KIND_LABEL,
  KIND_NOUN,
  TOPIC_LABEL,
  VOLUNTEER_FORMAT_LABEL,
  WORKPLACE_LABEL,
} from "../catalog";
import { copy } from "../copy";
import { formatDate, formatTime } from "../format";
import type { Opportunity, OpportunityActions } from "../types";
import { KindIcon } from "./KindIcon";
import { formatUpdated, statusLabel } from "./opportunityColumns";

const Title = styled(SheetTitle)`
  overflow-wrap: anywhere;
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const KindLine = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
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
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

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

const DangerMenuItem = styled(DropdownMenuItem)`
  color: var(--color-danger);
`;

type Detail = { label: string; value: string | number | undefined };

const date = (v?: string) => (v ? formatDate(v) : undefined);

/** Kind-specific rows, in form order; empty values are skipped by the caller. */
function kindDetails(o: Opportunity): Detail[] {
  const f = copy.form;
  switch (o.kind) {
    case "event": {
      const d = o.details;
      return [
        { label: f.event.date, value: date(d.date) },
        { label: f.event.startTime, value: d.startTime && formatTime(d.startTime) },
        { label: f.event.endTime, value: d.endTime && formatTime(d.endTime) },
        { label: f.event.format, value: d.format && EVENT_FORMAT_LABEL[d.format] },
        { label: f.event.location.label, value: d.location },
        { label: f.event.cost, value: d.cost && (d.cost === "paid" ? f.event.paid : f.event.free) },
        { label: f.event.costDetails.label, value: d.cost === "paid" ? d.costDetails : undefined },
        { label: f.event.accessibility.label, value: d.accessibility },
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
        { label: f.volunteer.commitment, value: d.commitment && COMMITMENT_LABEL[d.commitment] },
        { label: f.volunteer.format, value: d.format && VOLUNTEER_FORMAT_LABEL[d.format] },
        { label: f.volunteer.location.label, value: d.location },
        { label: f.volunteer.startDate.label, value: date(d.startDate) },
        { label: f.volunteer.timeCommitment.label, value: d.timeCommitment },
        { label: f.volunteer.skills.label, value: d.skills },
        { label: f.volunteer.minimumAge.label, value: d.minimumAge },
        { label: f.volunteer.applyBy.label, value: date(d.applyBy) },
      ];
    }
    case "job": {
      const d = o.details;
      return [
        { label: f.job.employmentType, value: d.employmentType && EMPLOYMENT_TYPE_LABEL[d.employmentType] },
        { label: f.job.workplace, value: d.workplace && WORKPLACE_LABEL[d.workplace] },
        { label: f.job.location.label, value: d.location },
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
  if (o.status === "live") return "success" as const;
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

  function run<T>(action: () => Promise<ActionState<T>>, after?: (result: ActionState<T>) => void) {
    if (pending) return;
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

  return (
    <>
      <SheetHeader>
        <Title>{o.title}</Title>
        <MetaRow>
          <Badge $variant={statusVariant(o)}>{statusLabel(o)}</Badge>
          <KindLine>
            <KindIcon kind={o.kind} size={14} />
            {KIND_LABEL[o.kind]}
          </KindLine>
        </MetaRow>
      </SheetHeader>

      <SheetBody aria-busy={pending || undefined}>
        <Body>
          <DetailsList>
            <DetailRow>
              <DetailLabel>{copy.form.summary.label}</DetailLabel>
              {o.summary ? <DetailValue>{o.summary}</DetailValue> : <MutedValue>{copy.panel.noDescription}</MutedValue>}
            </DetailRow>
            <DetailRow>
              <DetailLabel>{copy.panel.postedBy}</DetailLabel>
              <DetailValue>{o.organization.name}</DetailValue>
            </DetailRow>
            <DetailRow>
              <DetailLabel>{copy.panel.topics}</DetailLabel>
              {o.topics.length > 0 ? (
                <DetailValue>
                  <TagList>
                    {o.topics.map((t) => (
                      <Tag key={t}>{TOPIC_LABEL[t]}</Tag>
                    ))}
                  </TagList>
                </DetailValue>
              ) : (
                <MutedValue>{copy.panel.notSet}</MutedValue>
              )}
            </DetailRow>
            <DetailRow>
              <DetailLabel>{copy.form.link.label[o.kind]}</DetailLabel>
              {o.link ? (
                <DetailValue>
                  <ExternalLink href={o.link} target="_blank" rel="noopener noreferrer">
                    {o.link}
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
          <Updated>{copy.panel.lastUpdated(formatUpdated(o.updatedAt), o.updatedBy.name)}</Updated>
        </Body>
      </SheetBody>

      <SheetFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" $variant="ghost" aria-label={copy.panel.moreActions} aria-busy={pending || undefined}>
              <Icon icon={MoreHorizontal} size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top">
            {o.link && (
              <DropdownMenuItem asChild>
                <a href={o.link} target="_blank" rel="noopener noreferrer">
                  {copy.panel.openLink}
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() =>
                run(
                  () => actions.duplicate(o.id),
                  (result) => result.data && router.push(`${basePath}/${result.data.id}/edit`),
                )
              }
            >
              {copy.panel.duplicate}
            </DropdownMenuItem>
            {o.status === "live" && (
              <DropdownMenuItem onSelect={() => run(() => actions.close(o.id))}>{copy.panel.close}</DropdownMenuItem>
            )}
            {o.status === "closed" && (
              <DropdownMenuItem onSelect={() => run(() => actions.reopen(o.id))}>{copy.panel.reopen}</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DangerMenuItem
              onSelect={(event) => {
                event.preventDefault();
                setConfirmDelete(true);
              }}
            >
              {copy.panel.delete}
            </DangerMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" onClick={() => router.push(`${basePath}/${o.id}/edit`)}>
          {copy.panel.edit}
        </Button>
      </SheetFooter>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogTitle>{copy.confirmDelete.title(noun)}</AlertDialogTitle>
          <AlertDialogDescription>{copy.confirmDelete.body}</AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
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
