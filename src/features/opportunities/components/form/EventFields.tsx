"use client";

import { styled } from "next-yak";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { ACCESSIBILITY_FEATURES, EVENT_FORMAT_LABEL, LIMITS } from "../../catalog";
import { copy } from "../../copy";
import { ChoiceField, FieldRow } from "./FormParts";
import { fieldId, listValue, toggleListValue, type KindFieldsProps } from "./formValues";
import { onlineAreaFor, PlaceFields } from "./PlaceFields";

const t = copy.form.event;

const Checks = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/** Date, place, cost and accessibility. Cost details only when paid (service.ts rules). */
export function EventFields(props: KindFieldsProps) {
  const { values, set, error } = props;
  const paid = values.cost === "paid";
  const features = listValue(values, "accessibility");
  return (
    <>
      <Field label={t.date} id={fieldId("date")} error={error("date")} required>
        {(p) => <DatePicker {...p} name="date" value={values.date ?? ""} onValueChange={(v) => set("date", v)} />}
      </Field>
      <FieldRow>
        <Field label={t.startTime} id={fieldId("startTime")} error={error("startTime")} required>
          {(p) => <Input {...p} type="time" name="startTime" value={values.startTime ?? ""} onChange={(e) => set("startTime", e.target.value)} />}
        </Field>
        <Field label={t.endTime} id={fieldId("endTime")} error={error("endTime")}>
          {(p) => <Input {...p} type="time" name="endTime" value={values.endTime ?? ""} onChange={(e) => set("endTime", e.target.value)} />}
        </Field>
      </FieldRow>
      <ChoiceField
        label={t.format}
        name="format"
        value={values.format ?? ""}
        onChange={(v) => {
          set("format", v);
          onlineAreaFor(v, values, set);
        }}
        options={EVENT_FORMAT_LABEL}
        error={error("format")}
        required
      />
      <PlaceFields {...props} />
      <ChoiceField
        label={t.cost}
        name="cost"
        value={values.cost ?? "free"}
        onChange={(v) => set("cost", v)}
        options={{ free: t.free, paid: t.paid }}
        error={error("cost")}
      />
      {paid && (
        <Field label={t.costDetails.label} id={fieldId("costDetails")} error={error("costDetails")} required>
          {(p) => <Input {...p} name="costDetails" value={values.costDetails ?? ""} onChange={(e) => set("costDetails", e.target.value)} />}
        </Field>
      )}
      <Field label={t.accessibility.label} id={fieldId("accessibility")} error={error("accessibility")}>
        {(p) => (
          <Checks id={p.id} role="group" tabIndex={-1} aria-label={t.accessibility.label} aria-describedby={p["aria-describedby"]}>
            {ACCESSIBILITY_FEATURES.map((f) => (
              <Checkbox
                key={f.id}
                id={`${p.id}-${f.id}`}
                label={f.label}
                checked={features.includes(f.id)}
                onCheckedChange={() => set("accessibility", toggleListValue(values, "accessibility", f.id))}
              />
            ))}
          </Checks>
        )}
      </Field>
      <Field label={t.accessibilityNote.label} id={fieldId("accessibilityNote")} error={error("accessibilityNote")}>
        {(p) => (
          <Input
            {...p}
            name="accessibilityNote"
            maxLength={LIMITS.accessibilityNote}
            value={values.accessibilityNote ?? ""}
            onChange={(e) => set("accessibilityNote", e.target.value)}
          />
        )}
      </Field>
    </>
  );
}
