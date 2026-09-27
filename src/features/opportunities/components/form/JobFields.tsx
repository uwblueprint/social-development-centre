"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { EMPLOYMENT_TYPE_LABEL, WORKPLACE_LABEL } from "../../catalog";
import { copy } from "../../copy";
import { ChoiceField } from "./FormParts";
import { fieldId, type KindFieldsProps } from "./formValues";
import { onlineAreaFor, PlaceFields } from "./PlaceFields";

const t = copy.form.job;
const EMPLOYMENT_OPTIONS = Object.entries(EMPLOYMENT_TYPE_LABEL).map(([value, label]) => ({ value, label }));

/** Job details. Area comes from a fixed list (decision 19). */
export function JobFields(props: KindFieldsProps) {
  const { values, set, error } = props;
  return (
    <>
      <Field label={t.employmentType} id={fieldId("employmentType")} error={error("employmentType")} required>
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
        onChange={(v) => {
          set("workplace", v);
          onlineAreaFor(v, values, set);
        }}
        options={WORKPLACE_LABEL}
        error={error("workplace")}
        required
      />
      <PlaceFields {...props} />
      <Field label={t.pay.label} id={fieldId("pay")} error={error("pay")}>
        {(p) => <Input {...p} name="pay" value={values.pay ?? ""} onChange={(e) => set("pay", e.target.value)} />}
      </Field>
      <Field label={t.applyBy.label} hint={t.applyBy.hint} id={fieldId("applyBy")} error={error("applyBy")}>
        {(p) => <DatePicker {...p} name="applyBy" value={values.applyBy ?? ""} onValueChange={(v) => set("applyBy", v)} />}
      </Field>
      <Field label={t.qualifications.label} id={fieldId("qualifications")} error={error("qualifications")}>
        {(p) => (
          <Textarea {...p} name="qualifications" rows={3} value={values.qualifications ?? ""} onChange={(e) => set("qualifications", e.target.value)} />
        )}
      </Field>
    </>
  );
}
