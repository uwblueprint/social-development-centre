"use client";

import { styled } from "next-yak";
import { Field } from "@/components/ui/Field";
import { RadioGroup, RadioGroupOption } from "@/components/ui/RadioGroup";
import { KIND_LABEL, KINDS } from "../../catalog";
import { copy } from "../../copy";
import type { OpportunityKind } from "../../types";
import { KindIcon } from "../KindIcon";
import { fieldId } from "./formValues";

const t = copy.form.kind;

/* Layout only: the kit's options in a row that wraps (two or three per line at 360px). */
const Options = styled(RadioGroup)`
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-2);

  & > label {
    width: auto;
  }
`;

const OptionLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  white-space: nowrap;
`;

/* Read-only Type for published and closed listings: plain text, never a disabled control. */
const ReadOnly = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ReadOnlyLabel = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

const ReadOnlyValue = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text);
`;

/**
 * The form's first field. New listings and drafts choose a type here (the hint describes the selected one);
 * published and closed listings show it as text, since their type can't change (service.ts enforces it).
 */
export function TypeField({
  kind,
  editable,
  onChange,
  error,
}: {
  kind: OpportunityKind;
  editable: boolean;
  onChange: (kind: OpportunityKind) => void;
  error?: string;
}) {
  if (!editable) {
    return (
      <ReadOnly>
        <ReadOnlyLabel>{t.label}</ReadOnlyLabel>
        <ReadOnlyValue>
          <KindIcon kind={kind} />
          {KIND_LABEL[kind]}
        </ReadOnlyValue>
      </ReadOnly>
    );
  }
  return (
    <Field id={fieldId("kind")} label={t.label} hint={copy.form.kindDescription[kind]} error={error} required>
      {(p) => (
        <Options
          id={p.id}
          value={kind}
          onValueChange={(v) => onChange(v as OpportunityKind)}
          aria-label={t.label}
          aria-describedby={p["aria-describedby"]}
          aria-invalid={p["aria-invalid"]}
        >
          {KINDS.map((k) => (
            <RadioGroupOption
              key={k}
              value={k}
              label={
                <OptionLabel>
                  <KindIcon kind={k} />
                  {KIND_LABEL[k]}
                </OptionLabel>
              }
            />
          ))}
        </Options>
      )}
    </Field>
  );
}
