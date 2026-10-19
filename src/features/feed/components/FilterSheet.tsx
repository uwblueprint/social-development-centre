"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Switch";
import { SelectableTag, TagList } from "@/components/ui/Tag";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import {
  ACCESSIBILITY_FEATURES,
  AREAS,
  TOPICS,
} from "@/features/opportunities/catalog";
import { feedCopy } from "../copy";
import { EMPTY_FILTERS, sheetFilterCount } from "../matching";
import type { ExploreFilters, WhenFilter } from "../types";

/* The groups sit in one column with room between them; the sheet body adds none of its own. */
const Sections = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`;

const Group = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
`;

const Legend = styled.legend`
  margin-bottom: var(--space-3);
  padding: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

const SwitchRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
`;

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const SwitchLabel = styled.label`
  font-size: var(--text-sm);
`;

const Footer = styled(SheetFooter)`
  justify-content: space-between;
  gap: var(--space-3);
`;

/* The count swaps with a short fade, so a change reads as "the number moved". */
const Count = styled.span`
  display: inline-block;
  font-variant-numeric: tabular-nums;
`;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

/**
 * Every filter that doesn't fit in the bar. Choices apply live behind the panel, and the button says how many
 * results they give, so nobody has to apply and look. On a phone it fills the screen.
 */
export function FilterSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  resultCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: ExploreFilters;
  onChange: (next: ExploreFilters) => void;
  resultCount: number;
}) {
  const t = feedCopy.filterSheet;
  const freeId = React.useId();
  const hintId = React.useId();
  const active = sheetFilterCount(filters);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <Sections>
            <Group>
              <Legend>{t.topics}</Legend>
              <TagList>
                {TOPICS.map((topic) => (
                  <SelectableTag
                    key={topic.id}
                    selected={filters.topics.includes(topic.id)}
                    onClick={() =>
                      onChange({
                        ...filters,
                        topics: toggle(filters.topics, topic.id),
                      })
                    }
                  >
                    {topic.label}
                  </SelectableTag>
                ))}
              </TagList>
            </Group>
            <Group>
              <Legend>{t.when}</Legend>
              <ToggleGroup
                type="single"
                aria-label={t.when}
                value={filters.when}
                onValueChange={(value) =>
                  value && onChange({ ...filters, when: value as WhenFilter })
                }
              >
                {(Object.keys(t.whenOptions) as WhenFilter[]).map((w) => (
                  <ToggleGroupItem key={w} value={w}>
                    {t.whenOptions[w]}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Group>
            <Group>
              <Legend>{t.where}</Legend>
              <TagList>
                {AREAS.map((area) => (
                  <SelectableTag
                    key={area.id}
                    selected={filters.areas.includes(area.id)}
                    onClick={() =>
                      onChange({
                        ...filters,
                        areas: toggle(filters.areas, area.id),
                      })
                    }
                  >
                    {area.label}
                  </SelectableTag>
                ))}
              </TagList>
            </Group>
            <Group>
              <Legend>{t.cost}</Legend>
              <SwitchRow>
                <Copy>
                  <SwitchLabel htmlFor={freeId}>{t.freeOnly}</SwitchLabel>
                  <Hint id={hintId}>{t.freeOnlyHint}</Hint>
                </Copy>
                <Switch
                  id={freeId}
                  aria-describedby={hintId}
                  checked={filters.freeOnly}
                  onCheckedChange={(freeOnly) =>
                    onChange({ ...filters, freeOnly })
                  }
                />
              </SwitchRow>
            </Group>
            <Group>
              <Legend>{t.accessibility}</Legend>
              <Hint>{t.accessibilityHint}</Hint>
              <TagList>
                {ACCESSIBILITY_FEATURES.map((a) => (
                  <SelectableTag
                    key={a.id}
                    selected={filters.accessibility.includes(a.id)}
                    onClick={() =>
                      onChange({
                        ...filters,
                        accessibility: toggle(filters.accessibility, a.id),
                      })
                    }
                  >
                    {a.label}
                  </SelectableTag>
                ))}
              </TagList>
            </Group>
          </Sections>
        </SheetBody>
        <Footer>
          {active > 0 ? (
            <Button
              type="button"
              $variant="ghost"
              onClick={() =>
                onChange({
                  ...EMPTY_FILTERS,
                  q: filters.q,
                  kinds: filters.kinds,
                  sort: filters.sort,
                })
              }
            >
              {t.clear}
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" onClick={() => onOpenChange(false)}>
            <Count key={resultCount} aria-live="polite">
              {resultCount === 0 ? t.showNone : t.show(resultCount)}
            </Count>
          </Button>
        </Footer>
      </SheetContent>
    </Sheet>
  );
}
