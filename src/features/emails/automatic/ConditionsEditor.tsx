"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DatePicker } from "@/components/ui/DatePicker";
import { Icon } from "@/components/ui/Icon";
import { Select } from "@/components/ui/Select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import type { Conditions, Rule } from "../model";
import { FIELD, monthText, newRuleId } from "./summary";

const RULE_TYPES: { value: Rule["type"]; label: string }[] = [
  { value: "has-tag", label: "Has tag" },
  { value: "except-tag", label: "Except tag" },
  { value: "joined-before", label: "Joined before" },
  { value: "joined-after", label: "Joined after" },
  { value: "joined-in", label: "Joined in" },
];

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const MatchRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--text-sm);
`;

const RuleRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr) auto;
  gap: var(--space-2);
  align-items: center;

  @media (max-width: 639px) {
    grid-template-columns: minmax(0, 1fr) auto;
    & > :nth-child(2) {
      grid-column: 1 / 2;
      grid-row: 2;
    }
  }
`;

function blankRule(type: Rule["type"]): Rule {
  const id = newRuleId();
  if (type === "has-tag" || type === "except-tag") return { id, type, tag: "" };
  if (type === "joined-in") return { id, type, month: "" };
  return { id, type, date: "" };
}

/** The Who card's body: nothing until "Add condition". Each condition is one row. */
export function ConditionsEditor({
  value,
  onChange,
  tags,
  now,
  readOnly = false,
}: {
  value: Conditions;
  onChange(next: Conditions): void;
  tags: string[];
  now: Date;
  /** Other flows (one-off audience) still pass these; errors show on their own card or row. */
  readOnly?: boolean;
  readOnlyReason?: string | null;
  errors?: Record<string, string>;
}) {
  const tagOptions = (current: string) => {
    const set = new Set(tags);
    if (current) set.add(current);
    return [...set].sort((a, b) => a.localeCompare(b)).map((t) => ({ value: t, label: t }));
  };
  const monthOptions = (current: string) => {
    const out: { value: string; label: string }[] = [];
    const y = now.getFullYear();
    const m = now.getMonth();
    for (let i = 0; i < 36; i++) {
      const d = new Date(Date.UTC(y, m - i, 1));
      const v = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      out.push({ value: v, label: monthText(v) });
    }
    if (current && !out.some((o) => o.value === current)) out.push({ value: current, label: monthText(current) });
    return out;
  };
  const setRule = (id: string, next: Rule) => onChange({ ...value, rules: value.rules.map((r) => (r.id === id ? next : r)) });

  return (
    <Stack>
      {value.rules.length > 1 && (
        <MatchRow>
          <span id="auto-match-label">Match</span>
          <ToggleGroup type="single" value={value.match} aria-labelledby="auto-match-label" onValueChange={(match) => match && onChange({ ...value, match: match as Conditions["match"] })}>
            <ToggleGroupItem value="all">All</ToggleGroupItem>
            <ToggleGroupItem value="any">Any</ToggleGroupItem>
          </ToggleGroup>
        </MatchRow>
      )}
      {value.rules.map((rule, i) => (
        <RuleRow key={rule.id}>
          <Select disabled={readOnly} aria-label={`Condition ${i + 1} type`} value={rule.type} options={RULE_TYPES} onValueChange={(type) => setRule(rule.id, { ...blankRule(type as Rule["type"]), id: rule.id })} />
          {(rule.type === "has-tag" || rule.type === "except-tag") && (
            <Select disabled={readOnly} id={FIELD.rule(rule.id)} aria-label={`Condition ${i + 1} tag`} value={rule.tag} placeholder="Choose a tag" options={tagOptions(rule.tag)} onValueChange={(tag) => setRule(rule.id, { ...rule, tag })} />
          )}
          {(rule.type === "joined-before" || rule.type === "joined-after") && (
            <DatePicker disabled={readOnly} id={FIELD.rule(rule.id)} aria-label={`Condition ${i + 1} date`} value={rule.date} onValueChange={(date) => setRule(rule.id, { ...rule, date })} />
          )}
          {rule.type === "joined-in" && (
            <Select disabled={readOnly} id={FIELD.rule(rule.id)} aria-label={`Condition ${i + 1} month`} value={rule.month} placeholder="Choose a month" options={monthOptions(rule.month)} onValueChange={(month) => setRule(rule.id, { ...rule, month })} />
          )}
          {!readOnly && <Button type="button" $variant="ghost" $size="sm" aria-label={`Remove condition ${i + 1}`} onClick={() => onChange({ ...value, rules: value.rules.filter((r) => r.id !== rule.id) })}>
            <Icon icon={X} size={16} />
          </Button>}
        </RuleRow>
      ))}
      {!readOnly && <div>
        <Button type="button" $variant="secondary" $size="sm" onClick={() => onChange({ ...value, rules: [...value.rules, blankRule("has-tag")] })}>
          <Icon icon={Plus} size={16} />
          Add condition
        </Button>
      </div>}
    </Stack>
  );
}
