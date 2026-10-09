"use client";

import type * as React from "react";
import { styled } from "next-yak";
import { RadioCard, RadioCardGroup } from "@/components/ui/RadioGroup";
import { KIND_CATEGORY, KIND_LABEL, KINDS } from "../../catalog";
import { copy } from "../../copy";
import type { OpportunityKind } from "../../types";
import { KindIcon } from "../KindIcon";
import { fieldId } from "./formValues";

const t = copy.form.kind;

const Cards = RadioCardGroup;

/* The type's icon in its own tile, in the type's colour (the table's badge colours). Selected cards are
   filled with the light shade, so the tile steps up one shade to stay distinct. */
const IconTile = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 32px;
  height: 32px;
  /* Smaller than the card's radius, so the corners nest (inner radius = outer minus the inset). */
  border-radius: var(--radius-sm);
  background: var(--card-accent-subtle);
  color: var(--card-accent);
  transition: background-color var(--duration) var(--ease);

  [data-state="checked"] > & {
    background: var(--card-accent-strong);
  }
`;

const CardName = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const ErrorText = styled.p`
  margin: var(--space-2) 0 0;
  font-size: var(--text-sm);
  color: var(--color-danger);
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
 * The form's first field. New listings and drafts pick a type card (icon and name; owner: no descriptions);
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
  // The step's "Type" heading is the visible label; the cards carry each type's description.
  return (
    <div>
      <Cards
        id={fieldId("kind")}
        value={kind}
        onValueChange={(v) => onChange(v as OpportunityKind)}
        aria-label={t.label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId("kind")}-error` : undefined}
      >
        {KINDS.map((k) => (
          <RadioCard
            key={k}
            value={k}
            style={
              {
                "--card-accent": `var(--color-category-${KIND_CATEGORY[k]})`,
                "--card-accent-subtle": `var(--color-category-${KIND_CATEGORY[k]}-subtle)`,
                "--card-accent-strong": `var(--color-category-${KIND_CATEGORY[k]}-border)`,
                "--card-accent-line": `var(--color-category-${KIND_CATEGORY[k]}-line)`,
              } as React.CSSProperties
            }
          >
            <IconTile>
              <KindIcon kind={k} size={18} />
            </IconTile>
            <CardName>{KIND_LABEL[k]}</CardName>
          </RadioCard>
        ))}
      </Cards>
      {error && (
        <ErrorText id={`${fieldId("kind")}-error`} role="alert">
          {error}
        </ErrorText>
      )}
    </div>
  );
}
