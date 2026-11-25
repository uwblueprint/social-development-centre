"use client";

import { styled } from "next-yak";
import { ArrowUpRight, ListFilter, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { Popover, PopoverActions, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { tagPill, TagList } from "@/components/ui/Tag";
import { automaticEmailHref, type TemplateKey } from "../_data";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { useOutboxData } from "../_outboxData";

/* Icon-only and square: as tall and wide as the search field beside it. */
const FilterButton = styled(Button)`
  flex: none;
  width: var(--control-height);
  height: var(--control-height);
  padding: 0;

  /* Hover and open match the kit's table filter trigger: the neutral hover fill, not the outline variant's green. && outranks the variant. */
  &&:hover:not(:disabled),
  &&[data-state="open"] {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }
  /* With filters on it keeps the secondary fill. */
  &&[data-active]:hover:not(:disabled),
  &&[data-active][data-state="open"] {
    background: var(--color-secondary-hover);
  }
`;

const FilterList = styled.fieldset`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 220px;
`;

const FilterLegend = styled.legend`
  margin-bottom: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
`;

const ActiveFilters = styled(TagList)`
  align-items: flex-start;
  min-width: 0;
  max-width: 100%;
`;

/* The kit's tag pill, with the link's hit area stretched over it. The remove button comes later in the DOM, so it paints above. */
const Chip = styled.span`
  ${tagPill}
  position: relative;
  align-items: stretch;
  min-width: 0;
  max-width: 100%;
  padding-right: 0;
  height: auto;
  white-space: normal;
  overflow-wrap: anywhere;
  transition: background-color var(--duration-fast) var(--ease-out);

  &:hover {
    background: var(--color-secondary-hover);
  }
`;

/* The text wraps; the arrow stays glued to the last word. */
const ChipLink = styled.a`
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  padding-block: var(--space-1);
  color: inherit;
  text-decoration: none;
  border-radius: var(--radius-sm);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius-sm);
  }
  &:focus-visible {
    outline: none;
  }
  &:focus-visible::after {
    box-shadow: var(--focus-ring);
  }
`;

const LastWord = styled.span`
  white-space: nowrap;

  & svg {
    margin-left: var(--space-1);
    vertical-align: middle;
  }
`;

/* The whole right end of the pill, top to bottom and out to the edge, removes the filter, not just the icon. */
const ChipRemove = styled(Button)`
  position: relative;
  flex: none;
  align-self: stretch;
  width: auto;
  height: auto;
  min-height: 0;
  align-items: flex-start;
  /* Top padding puts the x on the first line of text, however tall the chip grows. */
  padding: var(--space-2) var(--space-2) 0;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--color-text-muted);

  &:hover:not(:disabled) {
    background: var(--color-bg-selected);
    color: var(--color-text);
  }
`;

/* A filter chip that isn't a link (the calendar days): plain text, the same height as the template chips. */
const ChipText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  padding-block: var(--space-1);
`;

interface TemplateFilterProps {
  templates: Set<TemplateKey>;
  onTemplates: (templates: Set<TemplateKey>) => void;
  /** Disables the filter and says why. */
  disabledReason?: string | null;
}

/** The square icon button that opens the template checklist. */
export function TemplateFilterButton({ templates, onTemplates, disabledReason = null }: TemplateFilterProps) {
  const { templates: names } = useOutboxData();
  if (disabledReason) {
    return (
      <DisabledReason reason={disabledReason}>
        <FilterButton $variant="outline" disabled aria-label="Filter by automatic email">
          <Icon icon={ListFilter} size={16} />
        </FilterButton>
      </DisabledReason>
    );
  }
  return <StagedFilter templates={templates} onTemplates={onTemplates} names={names} />;
}

/** The popover: ticking only stages; nothing applies until Apply. Cancel and Esc drop what was staged. */
function StagedFilter({
  templates,
  onTemplates,
  names,
}: {
  templates: Set<TemplateKey>;
  onTemplates: (templates: Set<TemplateKey>) => void;
  names: Record<TemplateKey, { name: string }>;
}) {
  const [open, setOpen] = React.useState(false);
  const [staged, setStaged] = React.useState<Set<TemplateKey>>(templates);
  const apply = (next: Set<TemplateKey>) => {
    onTemplates(next);
    setOpen(false);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        // Every open starts from what is applied, so a cancelled change never lingers.
        if (o) setStaged(new Set(templates));
        setOpen(o);
      }}
    >
      <PopoverTrigger asChild>
        <FilterButton
          $variant={templates.size ? "secondary" : "outline"}
          data-active={templates.size ? "" : undefined}
          aria-label={templates.size ? `Filter by automatic email, ${templates.size} on` : "Filter by automatic email"}
        >
          <Icon icon={ListFilter} size={16} />
        </FilterButton>
      </PopoverTrigger>
      {/* Wider than the kit's 280px so Cancel, Clear filters and Apply fit on one row. */}
      <PopoverContent align="end" showClose={false} style={{ width: 320 }}>
        <FilterList>
          <FilterLegend>Automatic email</FilterLegend>
          {Object.keys(names)
            .sort((a, b) => names[a].name.localeCompare(names[b].name))
            .map((k) => (
            <Checkbox
              key={k}
              label={names[k].name}
              checked={staged.has(k)}
              onCheckedChange={(v) => {
                const next = new Set(staged);
                if (v === true) next.add(k);
                else next.delete(k);
                setStaged(next);
              }}
            />
          ))}
        </FilterList>
        <PopoverActions>
          <PopoverClose asChild>
            <Button type="button" $variant="secondary">
              Cancel
            </Button>
          </PopoverClose>
          {(staged.size > 0 || templates.size > 0) && (
            <Button $variant="secondary" onClick={() => apply(new Set())}>
              Clear filters
            </Button>
          )}
          <Button onClick={() => apply(staged)}>Apply</Button>
        </PopoverActions>
      </PopoverContent>
    </Popover>
  );
}

/**
 * The filters that are on. The days picked on the calendar come first (only the x removes them); then each
 * automatic email, whose chip opens it in a new tab.
 */
export function TemplateChips({
  templates,
  onTemplates,
  daysLabel,
  onClearDays,
}: TemplateFilterProps & { daysLabel?: string | null; onClearDays?: () => void }) {
  const { templates: names } = useOutboxData();
  return (
    <ActiveFilters>
      {daysLabel && (
        <Chip>
          <ChipText>{daysLabel}</ChipText>
          <ChipRemove type="button" $variant="ghost" $size="sm" aria-label={`Remove the ${daysLabel} filter`} onClick={onClearDays}>
            <Icon icon={X} size={12} />
          </ChipRemove>
        </Chip>
      )}
      {[...templates].map((k) => (
        <Chip key={k}>
          <ChipLink
            href={automaticEmailHref(k)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${names[k].name}, opens in a new tab`}
          >
            {names[k].name.slice(0, names[k].name.lastIndexOf(" ") + 1)}
            <LastWord>
              {names[k].name.slice(names[k].name.lastIndexOf(" ") + 1)}
              <Icon icon={ArrowUpRight} size={14} />
            </LastWord>
          </ChipLink>
          <ChipRemove
            type="button"
            $variant="ghost"
            $size="sm"
            aria-label={`Remove ${names[k].name}`}
            onClick={() => {
              const next = new Set(templates);
              next.delete(k);
              onTemplates(next);
            }}
          >
            <Icon icon={X} size={12} />
          </ChipRemove>
        </Chip>
      ))}
    </ActiveFilters>
  );
}
