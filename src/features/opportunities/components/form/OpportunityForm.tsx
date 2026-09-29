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
import { requireOnline } from "@/lib/offline";
import { fieldError, type ActionState } from "@/lib/forms";
import { KIND_NOUN, SDC_ORG } from "../../catalog";
import { copy } from "../../copy";
import type { EventbritePrefill } from "../../eventbrite";
import type { Opportunity, OpportunityActions, OpportunityKind, OrganizationRef, SaveResult, TopicId } from "../../types";
import { BasicsFields } from "./BasicsFields";
import { EventbriteOffer, isEventbriteLink } from "./EventbriteOffer";
import { EventFields } from "./EventFields";
import { BackLink, OutlineLink, Section } from "./FormParts";
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
import { MagicScanArea, type ScanPhase } from "./MagicScanArea";
import { OtherFields } from "./OtherFields";
import { PetitionFields } from "./PetitionFields";
import { ReviewStep } from "./ReviewStep";
import { StepIndicator } from "./StepIndicator";
import { TypeField } from "./TypeField";
import { useFormDraft } from "./useFormDraft";
import { VolunteerFields } from "./VolunteerFields";

/** Fields every type shares; the rest live per type in `byKind`. */
const SHARED_FIELDS = new Set(["organizationId", "title", "summary", "imageUrl", "link"]);

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

/** Eventbrite gets at most this long to answer; then the fill gives up with a "timed out" message. */
const PREFILL_TIMEOUT_MS = 5000;
/** The scan line waits at least this long at the top, so a fast answer doesn't flash. */
const PREFILL_MIN_WAIT_MS = 300;

/* Back and the primary action, pushed to the right edge. */
const PrimaryGroup = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
`;

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

  // Unsaved work is kept in this browser and restored on return (see useFormDraft).
  const draftKey = `nexus-draft:${scope}:${opportunity?.id ?? "new"}`;
  const { clearDraft } = useFormDraft(draftKey, () => initialModel(initialKind, opportunity, initialOrganizationId), model, setModel);
  const [prefillError, setPrefillError] = React.useState<string>();
  /** Bumped when Eventbrite fills the form: the Details step plays its "filling in" scan once per fill. */
  const [magicFill, setMagicFill] = React.useState(0);
  /** loading: waiting on Eventbrite (the line bounces at the top); scanning: the line sweeps and fields fill. */
  const [scanPhase, setScanPhase] = React.useState<ScanPhase>("idle");
  /** Filled from Eventbrite: Details shows Eventbrite's fields first and what the person adds at the bottom. */
  const [fromEventbrite, setFromEventbrite] = React.useState(false);
  const [prefilling, startPrefill] = React.useTransition();
  // A field id (or the step heading) to focus once the current render lands.
  const pendingFocus = React.useRef<string | null>(null);

  const status = opportunity?.status ?? "draft";
  const isDraft = status === "draft";
  // Type can change until a listing is published (service.ts enforces the same rule).
  const kind = model.kind;
  const noun = KIND_NOUN[kind];

  /**
   * Errors the person has since fixed (owner): changing a field clears its error, inline and in the summary,
   * until the next save attempt re-checks everything. "details" covers the custom detail rows.
   */
  const [fixed, setFixed] = React.useState<ReadonlySet<string>>(() => new Set());
  const markFixed = React.useCallback((key: string) => {
    setFixed((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }, []);

  // Shared fields live in `values`; each type's own fields live in `byKind`, so switching Type and back restores them.
  const set = React.useCallback((name: string, value: string) => {
    markFixed(name);
    setModel((m) =>
      SHARED_FIELDS.has(name)
        ? { ...m, values: { ...m.values, [name]: value } }
        : { ...m, byKind: { ...m.byKind, [m.kind]: { ...m.byKind[m.kind], [name]: value } } },
    );
  }, [markFixed]);
  const setKind = React.useCallback((next: OpportunityKind) => {
    markFixed("kind");
    setModel((m) => ({ ...m, kind: next, byKind: { ...m.byKind, [next]: m.byKind[next] ?? emptyKindValues(next) } }));
  }, [markFixed]);
  const setDetails = React.useCallback(
    (details: DetailRow[]) => {
      markFixed("details");
      setModel((m) => ({ ...m, details }));
    },
    [markFixed],
  );
  const toggleTopic = React.useCallback(
    (id: TopicId) => {
      markFixed("topics");
      setModel((m) => ({ ...m, topics: m.topics.includes(id) ? m.topics.filter((t) => t !== id) : [...m.topics, id] }));
    },
    [markFixed],
  );
  const isFixed = (name: string) => fixed.has(name) || (/^detail(Label|Value)\./.test(name) && fixed.has("details"));
  const error = (name: string) => (isFixed(name) ? undefined : fieldError(state, name));
  // Field errors show inline and in a summary until they're fixed or the next submit; never as a toast.
  const allErrors = state.status === "error" ? orderedErrors(kind, state.fieldErrors) : [];
  const summary = allErrors.filter((e) => !isFixed(e.key));
  // The server's title counts every error ("Fix 3 fields to publish…"); keep the count to what's left.
  const summaryTitle = (state.message ?? "").replace(/\b\d+ fields?\b/, `${summary.length} ${summary.length === 1 ? "field" : "fields"}`);

  function goTo(next: Step, focusId = STEP_HEADING) {
    pendingFocus.current = focusId;
    setStep(next);
  }

  // A new validation result opens the step with its first invalid field (derived at render, not in an effect).
  const [handledState, setHandledState] = React.useState(state);
  if (state !== handledState) {
    setHandledState(state);
    setFixed(new Set());
    // A fresh result: every error counts again, so use the full list, not the "fixed" filter.
    if (state.status === "error" && allErrors.length > 0) setStep(stepOf(allErrors[0].key));
  }

  const handleSaveResult = React.useEffectEvent(() => {
    if (state.status === "success") {
      clearDraft();
      if (state.message) toast({ title: state.message });
      router.push(`${basePath}?tab=${state.data?.tab ?? "published"}`);
    } else if (state.status === "error") {
      if (summary.length > 0) focusField(summary[0].fieldId);
      else if (state.message) toast({ title: state.message });
    }
    // Runs once per submission result.
  });
  React.useEffect(() => {
    handleSaveResult();
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

  /** Enter in a single-line field presses the primary button (Next, Publish or Save changes), except on an Eventbrite link. */
  function onFormKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.defaultPrevented || !(event.target instanceof HTMLInputElement)) return;
    // An event's Eventbrite link: Enter fills the form from it (validating the link) and moves on to Details.
    if (event.target.name === "link" && kind === "event" && isEventbriteLink(event.target.value)) {
      event.preventDefault();
      fillFromEventbrite();
      return;
    }
    const primary = event.currentTarget.querySelector<HTMLButtonElement>("[data-primary]");
    if (!primary) return;
    event.preventDefault();
    event.currentTarget.requestSubmit(primary);
  }

  function submit(fd: FormData) {
    formAction(toFormData(model, String(fd.get("intent") ?? "publish"), opportunity?.id));
  }

  function fillFromEventbrite() {
    const url = (model.values.link ?? "").trim();
    if (prefilling || scanPhase === "loading") return;
    // Offline: show the goose instead of trying (and failing) to reach Eventbrite.
    if (!requireOnline()) return;
    // Owner: go straight to Details; the scan line waits at the top (bouncing) while Eventbrite answers.
    setPrefillError(undefined);
    setScanPhase("loading");
    setMagicFill((n) => n + 1);
    goTo(2);
    startPrefill(async () => {
      const started = Date.now();
      const timeout = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), PREFILL_TIMEOUT_MS));
      const result = await Promise.race([prefill(url), timeout]);
      // At least a short beat on the line, so a fast answer doesn't flash.
      const wait = PREFILL_MIN_WAIT_MS - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      if (result === "timeout" || result.status !== "success" || !result.data) {
        const message = result === "timeout" ? copy.form.eventbrite.timedOut : (result.fieldErrors?.eventbrite ?? result.message);
        setScanPhase("idle");
        setMagicFill(0);
        setPrefillError(message);
        if (message) toast({ title: message });
        goTo(1, fieldId("link"));
        return;
      }
      const d = result.data;
      setModel((m) => ({
        ...m,
        values: { ...m.values, title: d.title, summary: d.summary },
        byKind: {
          ...m.byKind,
          event: {
            ...m.byKind.event,
            date: d.date,
            startTime: d.startTime,
            endTime: d.endTime ?? "",
            area: d.area,
            format: m.byKind.event?.format || "in_person",
          },
        },
      }));
      setFromEventbrite(true);
      // No success toast (owner): the scan itself shows the fill.
      setScanPhase("scanning");
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

      <Form action={submit} onSubmit={onSubmit} onKeyDown={onFormKeyDown} noValidate>
        {summary.length > 0 && (
          <div onClickCapture={onSummaryClick}>
            <ErrorSummary title={summaryTitle} errors={summary} />
          </div>
        )}

        {step === 1 && (
          <Section title={copy.form.steps.type} headingId={STEP_HEADING} hideTitle>
            <TypeField kind={kind} editable={isDraft} onChange={setKind} error={error("kind")} />
            <Field label={copy.form.link.label[kind]} hint={copy.form.link.hint[kind]} id={fieldId("link")} error={error("link")} required>
              {(p) => (
                <Input
                  {...p}
                  inputMode={kind === "volunteer" || kind === "job" ? "email" : "url"}
                  autoComplete="off"
                  spellCheck={false}
                  name="link"
                  value={model.values.link ?? ""}
                  onChange={(e) => set("link", e.target.value)}
                />
              )}
            </Field>
            {kind === "event" && isEventbriteLink(model.values.link) && (
              <EventbriteOffer error={prefillError} busy={prefilling} onFill={fillFromEventbrite} />
            )}
          </Section>
        )}

        {step === 2 && (
          <>
            {fromEventbrite && kind === "event" ? (
              <>
                {/* From Eventbrite first (the only part the scan sweeps); what the API can't tell us sits below. */}
                <MagicScanArea key={magicFill} phase={magicFill > 0 ? scanPhase : "idle"} onDone={() => setScanPhase("idle")}>
                  <Section title={copy.form.sections.fromEventbrite} headingId={STEP_HEADING}>
                    <BasicsFields {...fieldProps} part="eventbrite" scope={scope} organizations={organizations} topics={model.topics} onToggleTopic={toggleTopic} />
                    <EventFields {...fieldProps} part="eventbrite" />
                  </Section>
                </MagicScanArea>
                <Section title={copy.form.sections.fromYou}>
                  <BasicsFields {...fieldProps} part="yours" scope={scope} organizations={organizations} topics={model.topics} onToggleTopic={toggleTopic} />
                  <EventFields {...fieldProps} part="yours" />
                </Section>
              </>
            ) : (
              // While Eventbrite answers, the normal layout waits under the bobbing line.
              <MagicScanArea key={magicFill} phase={magicFill > 0 && scanPhase === "loading" ? "loading" : "idle"} onDone={() => setScanPhase("idle")}>
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
              </MagicScanArea>
            )}
          </>
        )}

        {step === 3 && <ReviewStep preview={previewOpportunity(model, publisher)} headingId={STEP_HEADING} onEdit={(s) => goTo(s)} />}

        {/*
          Right to left: the primary action, then Back beside it; the secondary actions sit apart on the
          left (owner). Enter in a field presses the primary button (onFormKeyDown), not the first in the DOM.
        */}
        <ActionBar>
          {/* Cancel means "throw this away", so the browser's saved draft goes too. */}
          <OutlineLink href={basePath} onClick={() => clearDraft({ stopSaving: true })}>
            {copy.form.cancel}
          </OutlineLink>
          {isDraft && (
            <SubmitButton name="intent" value="draft" $variant="outline">
              <ButtonContent>
                <Icon icon={FilePen} />
                {copy.form.saveDraft}
              </ButtonContent>
            </SubmitButton>
          )}
          {!isDraft && step < 3 && (
            <SubmitButton name="intent" value="save" $variant="outline">
              <ButtonContent>
                <Icon icon={Check} />
                {copy.form.saveChanges}
              </ButtonContent>
            </SubmitButton>
          )}
          <PrimaryGroup>
            {step > 1 && (
              <Button type="button" $variant="ghost" onClick={() => goTo((step - 1) as Step)}>
                <Icon icon={ArrowLeft} size={16} />
                {copy.form.previous}
              </Button>
            )}
            {step < 3 ? (
              <Button type="submit" name="intent" value="next" data-primary="">
                {copy.form.next}
                <Icon icon={ArrowRight} size={16} />
              </Button>
            ) : (
              <SubmitButton name="intent" value={isDraft ? "publish" : "save"} data-primary="">
                <ButtonContent>
                  <Icon icon={isDraft ? Send : Check} />
                  {isDraft ? copy.form.publish : copy.form.saveChanges}
                </ButtonContent>
              </SubmitButton>
            )}
          </PrimaryGroup>
        </ActionBar>
      </Form>
    </Page>
  );
}
