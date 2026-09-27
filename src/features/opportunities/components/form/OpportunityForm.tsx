"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { ArrowLeft, ArrowRight, Check, FilePen, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorSummary } from "@/components/ui/ErrorSummary";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { fieldError, type ActionState } from "@/lib/forms";
import { KIND_NOUN, SDC_ORG } from "../../catalog";
import { copy } from "../../copy";
import type { EventbritePrefill } from "../../eventbrite";
import type { Opportunity, OpportunityActions, OpportunityKind, OrganizationRef, SaveResult, TopicId } from "../../types";
import { BasicsFields } from "./BasicsFields";
import { EventbriteField } from "./EventbriteField";
import { EventFields } from "./EventFields";
import { BackLink, GhostLink, Section } from "./FormParts";
import {
  emptyKindValues,
  fieldId,
  initialModel,
  orderedErrors,
  previewOpportunity,
  stepOf,
  toFormData,
  type DetailRow,
  type KindFieldsProps,
  type Step,
} from "./formValues";
import { JobFields } from "./JobFields";
import { OtherFields } from "./OtherFields";
import { PetitionFields } from "./PetitionFields";
import { ReviewStep } from "./ReviewStep";
import { StepIndicator } from "./StepIndicator";
import { TypeField } from "./TypeField";
import { VolunteerFields } from "./VolunteerFields";

/** Fields every type shares; the rest live per type in `byKind`. `eventbrite` is never submitted. */
const SHARED_FIELDS = new Set(["organizationId", "title", "summary", "link", "eventbrite"]);
/** The focus target when a step opens: its first heading. */
const STEP_HEADING = "opportunity-step-heading";

const Page = styled.div`
  width: 100%;
  max-width: calc(640px + 2 * var(--space-6));
  margin: 0 auto;
  padding: var(--space-7) var(--space-6) 0;

  @media (max-width: 767px) {
    padding: var(--space-5) var(--space-4) 0;
  }
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
`;

const Title = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

/* Sticky footer: the actions stay in reach on a long form (HoneyBook, Workable). */
const ActionBar = styled.div`
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  background: var(--color-bg);
  border-top: 1px solid var(--color-border);
`;

/* SubmitButton wraps children in a plain span; this lays the icon and label out like Button's own gap. */
const ButtonContent = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const initialState: ActionState<SaveResult> = { status: "idle" };

/** Focuses a field by id; for a group (topics, custom details), its first control. */
function focusField(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const target = el.matches('[tabindex="-1"]')
    ? (el.querySelector<HTMLElement>('button, input:not([type="hidden"]), textarea, [tabindex="0"]') ?? el)
    : el;
  target.scrollIntoView({ block: "center" });
  target.focus({ preventScroll: true });
}

export interface OpportunityFormProps {
  scope: "admin" | "partner";
  /** The list page, e.g. /admin/opportunities. */
  basePath: string;
  kind: OpportunityKind;
  /** Present when editing. */
  opportunity?: Opportunity;
  /** Admin only: who the listing can be posted as (listPublisherOptions). */
  organizations?: OrganizationRef[];
  /** Admin, new listings only: preselects who it's posted as (one of `organizations`). */
  initialOrganizationId?: string;
  save: OpportunityActions["save"];
  /** The portal's Eventbrite prefill action (a dev-mock spike; see eventbrite.ts). */
  prefill: (url: string) => Promise<ActionState<EventbritePrefill>>;
  /** Partner only: their organization, named in the Review step's preview. */
  organizationName?: string;
}

/**
 * Full-page create/edit form for every kind, in three steps on one route: 1 Type (type and links), 2 Details,
 * 3 Review (the email preview, and Publish). Steps live in component state, not the URL. Save as draft works
 * on every step. The FormData contract in service.ts is built from the model (toFormData), since only the
 * current step is rendered; `intent` comes from the clicked button. A server validation error opens the
 * step with the first invalid field, with the error summary on top (its links switch steps too).
 */
export function OpportunityForm({
  scope,
  basePath,
  kind: initialKind,
  opportunity,
  organizations,
  initialOrganizationId,
  save,
  prefill,
  organizationName,
}: OpportunityFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState(save, initialState);
  const [model, setModel] = React.useState(() => initialModel(initialKind, opportunity, initialOrganizationId));
  const [step, setStep] = React.useState<Step>(1);
  const [prefillError, setPrefillError] = React.useState<string>();
  const [prefilling, startPrefill] = React.useTransition();
  // A field id (or the step heading) to focus once the current render lands.
  const pendingFocus = React.useRef<string | null>(null);

  const status = opportunity?.status ?? "draft";
  const isDraft = status === "draft";
  // Type can change until a listing is published (service.ts enforces the same rule).
  const kind = model.kind;
  const noun = KIND_NOUN[kind];

  // Shared fields live in `values`; each type's own fields live in `byKind`, so switching Type and back restores them.
  const set = React.useCallback((name: string, value: string) => {
    setModel((m) =>
      SHARED_FIELDS.has(name)
        ? { ...m, values: { ...m.values, [name]: value } }
        : { ...m, byKind: { ...m.byKind, [m.kind]: { ...m.byKind[m.kind], [name]: value } } },
    );
  }, []);
  const setKind = React.useCallback((next: OpportunityKind) => {
    setModel((m) => ({ ...m, kind: next, byKind: { ...m.byKind, [next]: m.byKind[next] ?? emptyKindValues(next) } }));
  }, []);
  const setDetails = React.useCallback((details: DetailRow[]) => setModel((m) => ({ ...m, details })), []);
  const toggleTopic = React.useCallback((id: TopicId) => {
    setModel((m) => ({ ...m, topics: m.topics.includes(id) ? m.topics.filter((t) => t !== id) : [...m.topics, id] }));
  }, []);
  const error = (name: string) => fieldError(state, name);
  // Field errors show inline and in a summary that stays until the next submit; never as a toast.
  const summary = state.status === "error" ? orderedErrors(kind, state.fieldErrors) : [];

  function goTo(next: Step, focusId = STEP_HEADING) {
    pendingFocus.current = focusId;
    setStep(next);
  }

  React.useEffect(() => {
    if (state.status === "success") {
      if (state.message) toast({ title: state.message });
      router.push(`${basePath}?tab=${state.data?.tab ?? "published"}`);
    } else if (state.status === "error") {
      if (summary.length > 0) goTo(stepOf(summary[0].key), summary[0].fieldId);
      else if (state.message) toast({ title: state.message });
    }
    // Runs once per submission result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  React.useEffect(() => {
    if (!pendingFocus.current) return;
    focusField(pendingFocus.current);
    pendingFocus.current = null;
  });

  /** Error summary links to a field on another step open that step first. */
  function onSummaryClick(event: React.MouseEvent) {
    const href = (event.target as HTMLElement).closest("a")?.getAttribute("href");
    const item = href && summary.find((e) => `#${e.fieldId}` === href);
    if (!item || stepOf(item.key) === step) return;
    event.preventDefault();
    event.stopPropagation();
    goTo(stepOf(item.key), item.fieldId);
  }

  /** Next is a submit button, so Enter in a field moves on; only Save as draft, Publish and Save changes post. */
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.value === "next" || (!submitter && step < 3)) {
      event.preventDefault();
      if (step < 3) goTo((step + 1) as Step);
    }
  }

  function submit(fd: FormData) {
    formAction(toFormData(model, String(fd.get("intent") ?? "publish"), opportunity?.id));
  }

  function fillFromEventbrite() {
    const url = (model.values.eventbrite ?? "").trim();
    if (prefilling) return;
    startPrefill(async () => {
      const result = await prefill(url);
      if (result.status !== "success" || !result.data) {
        setPrefillError(result.fieldErrors?.eventbrite ?? result.message);
        return;
      }
      const d = result.data;
      setPrefillError(undefined);
      setModel((m) => ({
        ...m,
        values: { ...m.values, title: d.title, summary: d.summary, link: m.values.link?.trim() ? m.values.link : d.link },
        byKind: {
          ...m.byKind,
          event: {
            ...m.byKind.event,
            date: d.date,
            startTime: d.startTime,
            endTime: d.endTime ?? "",
            area: d.area,
            address: d.address ?? "",
            format: m.byKind.event?.format || "in_person",
          },
        },
      }));
      if (result.message) toast({ title: result.message });
    });
  }

  const fieldProps: KindFieldsProps = { kind, values: { ...model.values, ...model.byKind[kind] }, set, error };
  const publisher =
    scope === "admin"
      ? (organizations?.find((o) => o.id === model.values.organizationId) ?? SDC_ORG)
      : (opportunity?.organization ?? { id: "", name: organizationName ?? "" });

  return (
    <Page>
      <Header>
        <BackLink href={basePath}>
          <Icon icon={ArrowLeft} size={14} />
          {copy.form.back}
        </BackLink>
        <Title>{opportunity ? copy.form.editTitle(noun) : copy.form.newTitle(noun)}</Title>
        <StepIndicator step={step} />
      </Header>

      <Form action={submit} onSubmit={onSubmit} noValidate>
        {summary.length > 0 && (
          <div onClickCapture={onSummaryClick}>
            <ErrorSummary title={state.message ?? ""} errors={summary} />
          </div>
        )}

        {step === 1 && (
          <Section title={copy.form.steps.type} headingId={STEP_HEADING}>
            <TypeField kind={kind} editable={isDraft} onChange={setKind} error={error("kind")} />
            {kind === "event" && (
              <EventbriteField
                value={model.values.eventbrite ?? ""}
                onChange={(v) => set("eventbrite", v)}
                onFill={fillFromEventbrite}
                pending={prefilling}
                error={prefillError}
              />
            )}
            <Field label={copy.form.link.label} hint={copy.form.link.hint[kind]} id={fieldId("link")} error={error("link")} required>
              {(p) => (
                <Input
                  {...p}
                  inputMode="url"
                  autoComplete="url"
                  spellCheck={false}
                  name="link"
                  value={model.values.link ?? ""}
                  onChange={(e) => set("link", e.target.value)}
                />
              )}
            </Field>
          </Section>
        )}

        {step === 2 && (
          <>
            <Section title={copy.form.sections.basics} headingId={STEP_HEADING}>
              <BasicsFields {...fieldProps} scope={scope} organizations={organizations} topics={model.topics} onToggleTopic={toggleTopic} />
            </Section>
            <Section title={copy.form.sections[kind]}>
              {kind === "event" && <EventFields {...fieldProps} />}
              {kind === "petition" && <PetitionFields {...fieldProps} />}
              {kind === "volunteer" && <VolunteerFields {...fieldProps} />}
              {kind === "job" && <JobFields {...fieldProps} />}
              {kind === "other" && <OtherFields {...fieldProps} details={model.details} setDetails={setDetails} />}
            </Section>
          </>
        )}

        {step === 3 && <ReviewStep preview={previewOpportunity(model, publisher)} headingId={STEP_HEADING} onEdit={(s) => goTo(s)} />}

        <ActionBar>
          {step > 1 && (
            <Button type="button" $variant="ghost" onClick={() => goTo((step - 1) as Step)}>
              <Icon icon={ArrowLeft} size={16} />
              {copy.form.previous}
            </Button>
          )}
          {/* The first submit button in DOM order is what Enter in a field presses: Next, then Publish or Save changes. */}
          {step < 3 && (
            <Button type="submit" name="intent" value="next">
              {copy.form.next}
              <Icon icon={ArrowRight} size={16} />
            </Button>
          )}
          {(step === 3 || !isDraft) && (
            <SubmitButton name="intent" value={isDraft ? "publish" : "save"} $variant={step === 3 ? undefined : "secondary"}>
              <ButtonContent>
                <Icon icon={isDraft ? Send : Check} />
                {isDraft ? copy.form.publish : copy.form.saveChanges}
              </ButtonContent>
            </SubmitButton>
          )}
          {isDraft && (
            <SubmitButton name="intent" value="draft" $variant="secondary">
              <ButtonContent>
                <Icon icon={FilePen} />
                {copy.form.saveDraft}
              </ButtonContent>
            </SubmitButton>
          )}
          <GhostLink href={basePath}>{copy.form.cancel}</GhostLink>
        </ActionBar>
      </Form>
    </Page>
  );
}
