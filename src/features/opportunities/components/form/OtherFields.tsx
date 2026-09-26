"use client";

import { styled } from "next-yak";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { LIMITS } from "../../catalog";
import { copy } from "../../copy";
import { FieldRow } from "./FormParts";
import { newDetailRow, type DetailRow, type KindFieldsProps } from "./formValues";

const t = copy.form.other;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-2);
  align-items: start;
`;

/* Lines the remove button up with the inputs: label line + label margin + Field gap, centred on a 40px input. */
const RemoveSlot = styled.div`
  padding-top: calc(var(--text-sm) * var(--leading-ui) + var(--space-1) + var(--space-2));
`;

const AddRow = styled.div`
  display: flex;
`;

/**
 * Call to action, deadline, and up to LIMITS.customDetails label/value rows.
 * Rows submit as repeated detailLabel/detailValue; errors come back keyed `detailLabel.<i>`.
 */
export function OtherFields({
  values,
  set,
  error,
  details,
  setDetails,
}: KindFieldsProps & { details: DetailRow[]; setDetails: (rows: DetailRow[]) => void }) {
  const update = (i: number, patch: Partial<DetailRow>) => setDetails(details.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const remove = (i: number) => setDetails(details.filter((_, j) => j !== i));
  const canAdd = details.length < LIMITS.customDetails;

  return (
    <>
      <Field label={t.callToAction.label} hint={t.callToAction.hint} error={error("callToAction")} required>
        {(p) => <Input {...p} name="callToAction" value={values.callToAction ?? ""} onChange={(e) => set("callToAction", e.target.value)} />}
      </Field>
      <Field label={t.deadline.label} hint={t.deadline.hint} error={error("deadline")}>
        {(p) => <DatePicker {...p} name="deadline" value={values.deadline ?? ""} onValueChange={(v) => set("deadline", v)} />}
      </Field>
      <Field label={t.details.label} hint={t.details.hint} error={error("details")}>
        {(p) => (
          <Rows
            id={p.id}
            role="group"
            aria-label={t.details.label}
            aria-describedby={p["aria-describedby"]}
            data-invalid={error("details") ? "" : undefined}
          >
            {details.map((d, i) => (
              <Row key={d.key}>
                <FieldRow>
                  <Field label={t.detailLabel} error={error(`detailLabel.${i}`)}>
                    {(lp) => (
                      <Input {...lp} name="detailLabel" maxLength={LIMITS.customLabel} value={d.label} onChange={(e) => update(i, { label: e.target.value })} />
                    )}
                  </Field>
                  <Field label={t.detailValue} error={error(`detailValue.${i}`)}>
                    {(vp) => (
                      <Input {...vp} name="detailValue" maxLength={LIMITS.customValue} value={d.value} onChange={(e) => update(i, { value: e.target.value })} />
                    )}
                  </Field>
                </FieldRow>
                <RemoveSlot>
                  <Button type="button" $variant="ghost" aria-label={t.removeDetail(i + 1)} onClick={() => remove(i)}>
                    <Icon icon={Trash2} />
                  </Button>
                </RemoveSlot>
              </Row>
            ))}
            {canAdd && (
              <AddRow>
                <Button type="button" $variant="outline" onClick={() => setDetails([...details, newDetailRow()])}>
                  <Icon icon={Plus} />
                  {t.addDetail}
                </Button>
              </AddRow>
            )}
          </Rows>
        )}
      </Field>
    </>
  );
}
