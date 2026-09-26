"use client";

import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SelectableTag, TagList } from "@/components/ui/Tag";
import { Textarea } from "@/components/ui/Textarea";
import { LIMITS, TOPICS } from "../../catalog";
import { copy } from "../../copy";
import type { OpportunityKind, OrganizationRef, TopicId } from "../../types";
import { CountedInput } from "./FormParts";
import type { KindFieldsProps } from "./formValues";

const t = copy.form;

/**
 * Title, description, topics and link, plus the organization picker for admins.
 * Topics stay clickable past MAX_TOPICS: the server returns "Choose up to 3 topics." instead of a
 * disabled state, since there's no approved disabled reason. They're appended to FormData by the form.
 */
export function BasicsFields({
  scope,
  kind,
  organizations,
  values,
  set,
  error,
  topics,
  onToggleTopic,
}: KindFieldsProps & {
  scope: "admin" | "partner";
  kind: OpportunityKind;
  organizations?: OrganizationRef[];
  topics: TopicId[];
  onToggleTopic: (id: TopicId) => void;
}) {
  return (
    <>
      {scope === "admin" && (
        <Field label={t.organization.label} hint={t.organization.hint} error={error("organizationId")} required>
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
      <Field label={t.title.label} hint={t.title.hint} error={error("title")} required>
        {(p) => <CountedInput {...p} name="title" max={LIMITS.title} value={values.title ?? ""} onChange={(e) => set("title", e.target.value)} />}
      </Field>
      <Field label={t.summary.label} hint={t.summary.hint} error={error("summary")} required>
        {(p) => (
          <Textarea {...p} name="summary" rows={3} maxLength={LIMITS.summary} value={values.summary ?? ""} onChange={(e) => set("summary", e.target.value)} />
        )}
      </Field>
      <Field label={t.topics.label} hint={t.topics.hint} error={error("topics")} required>
        {(p) => (
          <TagList
            id={p.id}
            role="group"
            aria-label={t.topics.label}
            aria-describedby={p["aria-describedby"]}
            data-invalid={error("topics") ? "" : undefined}
          >
            {TOPICS.map((topic) => (
              <SelectableTag key={topic.id} selected={topics.includes(topic.id)} onClick={() => onToggleTopic(topic.id)}>
                {topic.label}
              </SelectableTag>
            ))}
          </TagList>
        )}
      </Field>
      <Field label={t.link.label[kind]} hint={t.link.hint} error={error("link")} required>
        {(p) => (
          <Input {...p} type="url" inputMode="url" autoComplete="url" name="link" value={values.link ?? ""} onChange={(e) => set("link", e.target.value)} />
        )}
      </Field>
    </>
  );
}
