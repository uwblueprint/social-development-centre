"use client";

import { styled } from "next-yak";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { SelectableTag, TagList } from "@/components/ui/Tag";
import { Textarea } from "@/components/ui/Textarea";
import { LIMITS, MAX_TOPICS, TOPICS } from "../../catalog";
import { copy } from "../../copy";
import type { OrganizationRef, TopicId } from "../../types";
import { CountedInput } from "./FormParts";
import { fieldId, type KindFieldsProps } from "./formValues";

const t = copy.form;

const LabelWithCount = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--space-2);
`;

const Count = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--color-text-muted);
`;


/**
 * Organization (admins), title, short description and topics. Topics are capped at MAX_TOPICS: at the cap,
 * the unselected ones are unavailable with the owner's reason (decision 21); service.ts enforces it too.
 */
export function BasicsFields({
  scope,
  organizations,
  values,
  set,
  error,
  topics,
  onToggleTopic,
}: KindFieldsProps & {
  scope: "admin" | "partner";
  organizations?: OrganizationRef[];
  topics: TopicId[];
  onToggleTopic: (id: TopicId) => void;
}) {
  const atCap = topics.length >= MAX_TOPICS;
  return (
    <>
      {scope === "admin" && (
        <Field label={t.organization.label} id={fieldId("organizationId")} error={error("organizationId")} required>
          {(p) => (
            <Select
              {...p}
              name="organizationId"
              options={(organizations ?? []).map((o) => ({ value: o.id, label: o.name }))}
              value={values.organizationId ?? ""}
              onValueChange={(v) => set("organizationId", v)}
              placeholder={t.choose}
            />
          )}
        </Field>
      )}
      <Field label={t.title.label} id={fieldId("title")} error={error("title")} required>
        {(p) => <CountedInput {...p} name="title" max={LIMITS.title} value={values.title ?? ""} onChange={(e) => set("title", e.target.value)} />}
      </Field>
      <Field label={t.summary.label} hint={t.summary.hint} id={fieldId("summary")} error={error("summary")} required>
        {(p) => (
          <Textarea {...p} name="summary" rows={3} maxLength={LIMITS.summary} value={values.summary ?? ""} onChange={(e) => set("summary", e.target.value)} />
        )}
      </Field>
      <Field
        label={
          <LabelWithCount>
            {t.topics.label}
            <Count aria-live="polite">{t.topics.count(topics.length, MAX_TOPICS)}</Count>
          </LabelWithCount>
        }
        id={fieldId("topics")}
        error={error("topics")}
        required
      >
        {(p) => (
          <TagList
            id={p.id}
            role="group"
            tabIndex={-1}
            aria-label={t.topics.label}
            aria-describedby={p["aria-describedby"]}
            data-invalid={error("topics") ? "" : undefined}
          >
            {TOPICS.map((topic) => {
              const selected = topics.includes(topic.id);
              if (atCap && !selected) {
                return (
                  <SelectableTag key={topic.id} disabled disabledReason={t.topics.capReason}>
                    {topic.label}
                  </SelectableTag>
                );
              }
              return (
                <SelectableTag key={topic.id} selected={selected} onClick={() => onToggleTopic(topic.id)}>
                  {topic.label}
                </SelectableTag>
              );
            })}
          </TagList>
        )}
      </Field>
    </>
  );
}
