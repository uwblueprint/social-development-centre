"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { styled } from "next-yak";
import { ArrowLeft, Check, FilePen, Send } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { fieldError, type ActionState } from "@/lib/forms";
import { KIND_NOUN } from "../../catalog";
import { copy } from "../../copy";
import type { Opportunity, OpportunityActions, OpportunityKind, OrganizationRef, TopicId } from "../../types";
import { BasicsFields } from "./BasicsFields";
import { EventFields } from "./EventFields";
import { BackLink, GhostLink, Section } from "./FormParts";
import { initialModel, type DetailRow, type KindFieldsProps } from "./formValues";
import { JobFields } from "./JobFields";
import { OtherFields } from "./OtherFields";
import { PetitionFields } from "./PetitionFields";
import { VolunteerFields } from "./VolunteerFields";

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

const initialState: ActionState<{ id: string }> = { status: "idle" };

/** First focusable control inside the first element marked invalid, in document order. */
function firstInvalidControl(form: HTMLFormElement | null): HTMLElement | null {
  const marked = form?.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid]');
  if (!marked) return null;
  if (marked.matches("input, textarea, button, [tabindex]")) return marked;
  return marked.querySelector<HTMLElement>('[tabindex="0"], input:not([type="hidden"]), textarea, button');
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
  save: OpportunityActions["save"];
}

/**
 * Full-page create/edit form for every kind. Posts the FormData contract in service.ts:
 * `id` and `kind` (and each selected topic) are appended in the action wrapper, since
 * native hidden inputs are off-limits in feature code; `intent` comes from the clicked button.
 */
export function OpportunityForm({ scope, basePath, kind, opportunity, organizations, save }: OpportunityFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState(save, initialState);
  const [model, setModel] = React.useState(() => initialModel(kind, opportunity));
  const formRef = React.useRef<HTMLFormElement>(null);
  const intentRef = React.useRef("");

  const status = opportunity?.status ?? "draft";
  const isDraft = status === "draft";
  const noun = KIND_NOUN[kind];

  const set = React.useCallback((name: string, value: string) => {
    setModel((m) => ({ ...m, values: { ...m.values, [name]: value } }));
  }, []);
  const setDetails = React.useCallback((details: DetailRow[]) => setModel((m) => ({ ...m, details })), []);
  const toggleTopic = React.useCallback((id: TopicId) => {
    setModel((m) => ({ ...m, topics: m.topics.includes(id) ? m.topics.filter((t) => t !== id) : [...m.topics, id] }));
  }, []);
  const error = (name: string) => fieldError(state, name);

  React.useEffect(() => {
    if (state.status === "success") {
      if (state.message) toast({ title: state.message });
      const intent = intentRef.current;
      const tab = intent === "draft" ? "drafts" : intent === "save" && status === "closed" ? "closed" : "live";
      router.push(`${basePath}?tab=${tab}`);
    } else if (state.status === "error") {
      if (state.message) toast({ title: state.message });
      firstInvalidControl(formRef.current)?.focus();
    }
    // Runs once per submission result.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function submit(fd: FormData) {
    intentRef.current = String(fd.get("intent") ?? "");
    fd.set("kind", kind);
    if (opportunity) fd.set("id", opportunity.id);
    fd.delete("topics");
    for (const topic of model.topics) fd.append("topics", topic);
    formAction(fd);
  }

  const fieldProps: KindFieldsProps = { values: model.values, set, error };

  return (
    <Page>
      <Header>
        <BackLink href={basePath}>
          <Icon icon={ArrowLeft} size={14} />
          {copy.form.back}
        </BackLink>
        <Title>{opportunity ? copy.form.editTitle(noun) : copy.form.newTitle(noun)}</Title>
      </Header>

      <Form ref={formRef} action={submit} noValidate>
        <Section title={copy.form.sections.basics}>
          <BasicsFields
            {...fieldProps}
            scope={scope}
            kind={kind}
            organizations={organizations}
            topics={model.topics}
            onToggleTopic={toggleTopic}
          />
        </Section>

        <Section title={copy.form.sections[kind]}>
          {kind === "event" && <EventFields {...fieldProps} />}
          {kind === "petition" && <PetitionFields {...fieldProps} />}
          {kind === "volunteer" && <VolunteerFields {...fieldProps} />}
          {kind === "job" && <JobFields {...fieldProps} />}
          {kind === "other" && <OtherFields {...fieldProps} details={model.details} setDetails={setDetails} />}
        </Section>

        <ActionBar>
          {/* First in DOM order, so Enter in a field submits this one. */}
          {isDraft ? (
            <SubmitButton name="intent" value="publish">
              <ButtonContent>
                <Icon icon={Send} />
                {copy.form.publish}
              </ButtonContent>
            </SubmitButton>
          ) : (
            <SubmitButton name="intent" value="save">
              <ButtonContent>
                <Icon icon={Check} />
                {copy.form.saveChanges}
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
