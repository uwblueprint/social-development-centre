"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { EMPLOYMENT_TYPE_LABEL, WORKPLACE_LABEL } from "../../catalog";
import { copy } from "../../copy";
import { ChoiceField } from "./FormParts";
import type { KindFieldsProps } from "./formValues";

const t = copy.form.job;
const EMPLOYMENT_OPTIONS = Object.entries(EMPLOYMENT_TYPE_LABEL).map(([value, label]) => ({ value, label }));

/** Job details. Location is hidden for remote jobs (service.ts rules). */
export function JobFields({ values, set, error }: KindFieldsProps) {
  return (
    <>
      <Field label={t.employmentType} error={error("employmentType")} required>
        {(p) => (
          <Select
            {...p}
            name="employmentType"
            options={EMPLOYMENT_OPTIONS}
            placeholder={copy.form.choose}
            value={values.employmentType ?? ""}
            onValueChange={(v) => set("employmentType", v)}
          />
        )}
      </Field>
      <ChoiceField
        label={t.workplace}
        name="workplace"
        value={values.workplace ?? ""}
        onChange={(v) => set("workplace", v)}
        options={WORKPLACE_LABEL}
        error={error("workplace")}
        required
      />
      {values.workplace !== "remote" && (
        <Field label={t.location.label} hint={t.location.hint} error={error("location")} required>
          {(p) => <Input {...p} name="location" value={values.location ?? ""} onChange={(e) => set("location", e.target.value)} />}
        </Field>
      )}
      <Field label={t.pay.label} hint={t.pay.hint} error={error("pay")}>
        {(p) => <Input {...p} name="pay" value={values.pay ?? ""} onChange={(e) => set("pay", e.target.value)} />}
      </Field>
      <Field label={t.applyBy.label} hint={t.applyBy.hint} error={error("applyBy")}>
        {(p) => <DatePicker {...p} name="applyBy" value={values.applyBy ?? ""} onValueChange={(v) => set("applyBy", v)} />}
      </Field>
      <Field label={t.qualifications.label} hint={t.qualifications.hint} error={error("qualifications")}>
        {(p) => (
          <Textarea {...p} name="qualifications" rows={3} value={values.qualifications ?? ""} onChange={(e) => set("qualifications", e.target.value)} />
        )}
      </Field>
    </>
  );
}
