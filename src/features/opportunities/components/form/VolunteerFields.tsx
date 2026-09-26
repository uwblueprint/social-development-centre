"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { COMMITMENT_LABEL, VOLUNTEER_FORMAT_LABEL } from "../../catalog";
import { copy } from "../../copy";
import { ChoiceField, FieldRow } from "./FormParts";
import type { KindFieldsProps } from "./formValues";

const t = copy.form.volunteer;

/** Role details. Location is hidden for remote roles (service.ts rules). */
export function VolunteerFields({ values, set, error }: KindFieldsProps) {
  return (
    <>
      <ChoiceField
        label={t.commitment}
        name="commitment"
        value={values.commitment ?? ""}
        onChange={(v) => set("commitment", v)}
        options={COMMITMENT_LABEL}
        error={error("commitment")}
        required
      />
      <ChoiceField
        label={t.format}
        name="format"
        value={values.format ?? ""}
        onChange={(v) => set("format", v)}
        options={VOLUNTEER_FORMAT_LABEL}
        error={error("format")}
        required
      />
      {values.format !== "remote" && (
        <Field label={t.location.label} hint={t.location.hint} error={error("location")} required>
          {(p) => <Input {...p} name="location" value={values.location ?? ""} onChange={(e) => set("location", e.target.value)} />}
        </Field>
      )}
      <Field label={t.timeCommitment.label} hint={t.timeCommitment.hint} error={error("timeCommitment")}>
        {(p) => <Input {...p} name="timeCommitment" value={values.timeCommitment ?? ""} onChange={(e) => set("timeCommitment", e.target.value)} />}
      </Field>
      <FieldRow>
        <Field label={t.startDate.label} hint={t.startDate.hint} error={error("startDate")}>
          {(p) => <DatePicker {...p} name="startDate" value={values.startDate ?? ""} onValueChange={(v) => set("startDate", v)} />}
        </Field>
        <Field label={t.applyBy.label} hint={t.applyBy.hint} error={error("applyBy")}>
          {(p) => <DatePicker {...p} name="applyBy" value={values.applyBy ?? ""} onValueChange={(v) => set("applyBy", v)} />}
        </Field>
      </FieldRow>
      <Field label={t.skills.label} hint={t.skills.hint} error={error("skills")}>
        {(p) => <Textarea {...p} name="skills" rows={3} value={values.skills ?? ""} onChange={(e) => set("skills", e.target.value)} />}
      </Field>
      <Field label={t.minimumAge.label} hint={t.minimumAge.hint} error={error("minimumAge")}>
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
