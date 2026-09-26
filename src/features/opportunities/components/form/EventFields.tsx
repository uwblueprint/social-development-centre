"use client";

import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EVENT_FORMAT_LABEL } from "../../catalog";
import { copy } from "../../copy";
import { ChoiceField, FieldRow } from "./FormParts";
import type { KindFieldsProps } from "./formValues";

const t = copy.form.event;

/** Date and place. Location is hidden for online events; cost details only when paid (service.ts rules). */
export function EventFields({ values, set, error }: KindFieldsProps) {
  const showLocation = values.format !== "online";
  const paid = values.cost === "paid";
  return (
    <>
      <Field label={t.date} error={error("date")} required>
        {(p) => <DatePicker {...p} name="date" value={values.date ?? ""} onValueChange={(v) => set("date", v)} />}
      </Field>
      <FieldRow>
        <Field label={t.startTime} error={error("startTime")} required>
          {(p) => <Input {...p} type="time" name="startTime" value={values.startTime ?? ""} onChange={(e) => set("startTime", e.target.value)} />}
        </Field>
        <Field label={t.endTime} error={error("endTime")}>
          {(p) => <Input {...p} type="time" name="endTime" value={values.endTime ?? ""} onChange={(e) => set("endTime", e.target.value)} />}
        </Field>
      </FieldRow>
      <ChoiceField
        label={t.format}
        name="format"
        value={values.format ?? ""}
        onChange={(v) => set("format", v)}
        options={EVENT_FORMAT_LABEL}
        error={error("format")}
        required
      />
      {showLocation && (
        <Field label={t.location.label} hint={t.location.hint} error={error("location")} required>
          {(p) => <Input {...p} name="location" value={values.location ?? ""} onChange={(e) => set("location", e.target.value)} />}
        </Field>
      )}
      <ChoiceField
        label={t.cost}
        name="cost"
        value={values.cost ?? "free"}
        onChange={(v) => set("cost", v)}
        options={{ free: t.free, paid: t.paid }}
        error={error("cost")}
      />
      {paid && (
        <Field label={t.costDetails.label} hint={t.costDetails.hint} error={error("costDetails")} required>
          {(p) => <Input {...p} name="costDetails" value={values.costDetails ?? ""} onChange={(e) => set("costDetails", e.target.value)} />}
        </Field>
      )}
      <Field label={t.accessibility.label} hint={t.accessibility.hint} error={error("accessibility")}>
        {(p) => (
          <Textarea {...p} name="accessibility" rows={3} value={values.accessibility ?? ""} onChange={(e) => set("accessibility", e.target.value)} />
        )}
      </Field>
    </>
  );
}
