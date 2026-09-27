"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { copy } from "../../copy";
import { FieldRow } from "./FormParts";
import { fieldId, type KindFieldsProps } from "./formValues";

const t = copy.form.petition;

export function PetitionFields({ values, set, error }: KindFieldsProps) {
  return (
    <>
      <Field label={t.target.label} id={fieldId("target")} error={error("target")} required>
        {(p) => <Input {...p} name="target" value={values.target ?? ""} onChange={(e) => set("target", e.target.value)} />}
      </Field>
      <FieldRow>
        <Field label={t.deadline.label} hint={t.deadline.hint} id={fieldId("deadline")} error={error("deadline")}>
          {(p) => <DatePicker {...p} name="deadline" value={values.deadline ?? ""} onValueChange={(v) => set("deadline", v)} />}
        </Field>
        <Field label={t.signatureGoal.label} id={fieldId("signatureGoal")} error={error("signatureGoal")}>
          {(p) => (
            <Input
              {...p}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              name="signatureGoal"
              value={values.signatureGoal ?? ""}
              onChange={(e) => set("signatureGoal", e.target.value)}
            />
          )}
        </Field>
      </FieldRow>
    </>
  );
}
