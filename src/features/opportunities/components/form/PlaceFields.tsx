"use client";

import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AREAS, LIMITS } from "../../catalog";
import { copy } from "../../copy";
import { FieldRow } from "./FormParts";
import { fieldId, type KindFieldsProps } from "./formValues";

const AREA_OPTIONS = AREAS.map((a) => ({ value: a.id, label: a.label }));

/**
 * Area (a fixed list, so listings can be matched to where members live) and an optional address or venue.
 * The address is hidden, and dropped by service.ts, when the area is Online / remote.
 */
export function PlaceFields({ values, set, error }: KindFieldsProps) {
  return (
    <FieldRow>
      <Field label={copy.form.area.label} id={fieldId("area")} error={error("area")} required>
        {(p) => (
          <Select
            {...p}
            name="area"
            options={AREA_OPTIONS}
            placeholder={copy.form.choose}
            value={values.area ?? ""}
            onValueChange={(v) => set("area", v)}
          />
        )}
      </Field>
      {values.area !== "online" && (
        <Field label={copy.form.address.label} id={fieldId("address")} error={error("address")}>
          {(p) => (
            <Input {...p} name="address" maxLength={LIMITS.address} value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} />
          )}
        </Field>
      )}
    </FieldRow>
  );
}

/** Choosing an online or remote format fills Area with Online / remote when it's still empty. */
export function onlineAreaFor(format: string, values: Record<string, string>, set: (name: string, value: string) => void) {
  if ((format === "online" || format === "remote") && !values.area) set("area", "online");
}
