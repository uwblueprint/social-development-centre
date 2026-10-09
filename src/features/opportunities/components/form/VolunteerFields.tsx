"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SelectableTag, TagList } from "@/components/ui/Tag";
import { SKILLS, TIME_COMMITMENTS, VOLUNTEER_FORMAT_LABEL } from "../../catalog";
import { copy } from "../../copy";
import { ChoiceField, FieldRow } from "./FormParts";
import { fieldId, listValue, toggleListValue, type KindFieldsProps } from "./formValues";
import { onlineAreaFor, PlaceFields } from "./PlaceFields";

const t = copy.form.volunteer;
const COMMITMENT_OPTIONS = TIME_COMMITMENTS.map((c) => ({ value: c.id, label: c.label }));

/** Role details, all matchable: time commitment, area and skills come from fixed lists (decision 19). */
export function VolunteerFields(props: KindFieldsProps) {
  const { values, set, error } = props;
  const skills = listValue(values, "skills");
  return (
    <>
      <Field label={t.timeCommitment.label} id={fieldId("timeCommitment")} error={error("timeCommitment")} required>
        {(p) => (
          <Select
            {...p}
            name="timeCommitment"
            options={COMMITMENT_OPTIONS}
            placeholder={copy.form.choose}
            value={values.timeCommitment ?? ""}
            onValueChange={(v) => set("timeCommitment", v)}
          />
        )}
      </Field>
      <ChoiceField
        label={t.format}
        name="format"
        value={values.format ?? ""}
        onChange={(v) => {
          set("format", v);
          onlineAreaFor(v, values, set);
        }}
        options={VOLUNTEER_FORMAT_LABEL}
        error={error("format")}
        required
      />
      <PlaceFields {...props} />
      <FieldRow>
        <Field label={t.startDate.label} id={fieldId("startDate")} error={error("startDate")}>
          {(p) => <DatePicker {...p} name="startDate" value={values.startDate ?? ""} onValueChange={(v) => set("startDate", v)} />}
        </Field>
        <Field label={t.applyBy.label} hint={t.applyBy.hint} id={fieldId("applyBy")} error={error("applyBy")}>
          {(p) => <DatePicker {...p} name="applyBy" value={values.applyBy ?? ""} onValueChange={(v) => set("applyBy", v)} />}
        </Field>
      </FieldRow>
      <Field label={t.skills.label} id={fieldId("skills")} error={error("skills")}>
        {(p) => (
          <TagList id={p.id} role="group" tabIndex={-1} aria-label={t.skills.label} aria-describedby={p["aria-describedby"]}>
            {SKILLS.map((s) => (
              <SelectableTag key={s.id} selected={skills.includes(s.id)} onClick={() => set("skills", toggleListValue(values, "skills", s.id))}>
                {s.label}
              </SelectableTag>
            ))}
          </TagList>
        )}
      </Field>
      <Field label={t.minimumAge.label} id={fieldId("minimumAge")} error={error("minimumAge")}>
        {(p) => (
          <Input
            {...p}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            name="minimumAge"
            value={values.minimumAge ?? ""}
            onChange={(e) => set("minimumAge", e.target.value)}
          />
        )}
      </Field>
    </>
  );
}
