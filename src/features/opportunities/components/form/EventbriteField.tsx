"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { copy } from "../../copy";
import { fieldId } from "./formValues";

const t = copy.form.eventbrite;

/* Input and its button side by side; the button drops under the input on narrow screens. */
const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);

  & > :first-child {
    flex: 1 1 240px;
    min-width: 0;
  }
`;

/**
 * Events only, first after Type (decision 18): paste an Eventbrite link and "Fill in details" copies the
 * title, description, date, times and place through the portal's prefillFromEventbrite action (a dev mock;
 * docs/backend/opportunities.md#eventbrite-prefill). Enter in the field fills too, instead of moving on.
 */
export function EventbriteField({
  value,
  onChange,
  onFill,
  pending,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  onFill: () => void;
  pending: boolean;
  error?: string;
}) {
  return (
    <Field label={t.label} hint={t.hint} id={fieldId("eventbrite")} error={error}>
      {(p) => (
        <Row>
          <Input
            {...p}
            inputMode="url"
            spellCheck={false}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (value.trim()) onFill();
              }
            }}
          />
          <Button type="button" $variant="secondary" onClick={onFill} aria-busy={pending || undefined} aria-disabled={pending || undefined}>
            <Icon icon={Sparkles} size={16} />
            {t.fill}
          </Button>
        </Row>
      )}
    </Field>
  );
}
