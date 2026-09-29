"use client";

import { styled } from "next-yak";
import { Checkbox } from "@/components/ui/Checkbox";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ACCESSIBILITY_FEATURES, AREAS, EVENT_FORMAT_LABEL, LIMITS } from "../../catalog";
import { copy } from "../../copy";
import { ChoiceField, CostRow, FieldRow } from "./FormParts";
import { fieldId, listValue, toggleListValue, type KindFieldsProps, type FieldPart } from "./formValues";

const t = copy.form.event;

/* In person or hybrid events pick a real place, so "Online / remote" isn't offered. */
const IN_PERSON_AREAS = AREAS.filter((a) => a.id !== "online").map((a) => ({ value: a.id, label: a.label }));

const Checks = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/** Date, how people attend (and the area unless online), cost (a price or range when paid) and accessibility. */
export function EventFields(props: KindFieldsProps & { part?: FieldPart }) {
  const { values, set, error, part = "all" } = props;
  // Eventbrite gives the date, times and place; cost and accessibility come from the person for now
  // (the real API can supply prices: see docs/backend/opportunities.md, "Eventbrite prefill").
  const fromEventbrite = part !== "yours";
  const fromYou = part !== "eventbrite";
  const paid = values.cost === "paid";
  const features = listValue(values, "accessibility");
  return (
    <>
      {fromEventbrite && (
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
          // The area follows the format: "online" for online events, a real place otherwise.
          if (v === "online") set("area", "online");
          else if (values.area === "online") set("area", "");
        }}
        options={EVENT_FORMAT_LABEL}
        error={error("format")}
        required
      />
      {/* Online: nothing to place. In person or hybrid: just the area, which is what members are matched on. */}
      {values.format && values.format !== "online" && (
        <Field label={copy.form.area.label} id={fieldId("area")} error={error("area")} required>
          {(p) => (
            <Select
              {...p}
              name="area"
              options={IN_PERSON_AREAS}
              placeholder={copy.form.choose}
              value={values.area === "online" ? "" : (values.area ?? "")}
              onValueChange={(v) => set("area", v)}
            />
          )}
        </Field>
      )}
      </>
      )}
      {fromYou && (
      <>
      {/* Cost, From and To on one line (owner); they wrap on narrow screens. One price, or a range: leave "To" empty. */}
      <CostRow>
      <ChoiceField
        label={t.cost}
        name="cost"
        value={values.cost ?? "free"}
        onChange={(v) => set("cost", v)}
        options={{ free: t.free, paid: t.paid }}
        error={error("cost")}
      />
      {paid && (
        <>
          <Field label={t.priceMin.label} id={fieldId("priceMin")} error={error("priceMin")} required>
            {(p) => (
              <Input {...p} name="priceMin" inputMode="decimal" value={values.priceMin ?? ""} onChange={(e) => set("priceMin", e.target.value)} />
            )}
          </Field>
          <Field label={t.priceMax.label} id={fieldId("priceMax")} error={error("priceMax")}>
            {(p) => (
              <Input {...p} name="priceMax" inputMode="decimal" value={values.priceMax ?? ""} onChange={(e) => set("priceMax", e.target.value)} />
            )}
          </Field>
        </>
      )}
      </CostRow>
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
      )}
    </>
  );
}
