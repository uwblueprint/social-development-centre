"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ListFilter } from "lucide-react";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { Icon } from "./Icon";
import { Popover, PopoverActions, PopoverContent, PopoverTrigger } from "./Popover";
import { SearchField } from "./SearchField";

/** Copy for column-header filters. */
export const tableFilterCopy = {
  trigger: (label: string, selected: number) => (selected > 0 ? `Filter ${label}, ${selected} selected` : `Filter ${label}`),
  legend: (label: string) => `Show ${label.toLowerCase()}`,
  /** NEW, NEEDS APPROVAL: search inside a long filter list, and its empty result. */
  search: (label: string) => `Search ${label.toLowerCase()}s`,
  noMatches: "Nothing matches that search.",
  /** Selects every option (no filtering) without closing; Apply still commits. */
  clear: "Clear",
  apply: "Apply",
} as const;


export interface TableColumnFilter {
  /** The column's name in the filter's accessible name and heading, e.g. "Status". */
  label: string;
  /** `count` is how many records have that value; shown muted after the option label. */
  options: { value: string; label: string; count?: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
  /**
   * The selection the page starts with (e.g. every status but Unsubscribed). The filter only reads as
   * active, and only keeps an `isEmpty` column visible, when `selected` differs from it. None selected
   * and all selected both mean "no filtering". Default: no filtering.
   */
  defaultSelected?: string[];
}

/** None selected and every option selected both mean "no filtering"; normalized to `null`. */
function effectiveSelection(selected: string[], options: TableColumnFilter["options"]): Set<string> | null {
  if (selected.length === 0 || options.every((o) => selected.includes(o.value))) return null;
  return new Set(selected);
}

/** A filter is active when its selection differs from its default. */
export function isFilterActive(filter: TableColumnFilter | undefined): boolean {
  if (!filter) return false;
  const current = effectiveSelection(filter.selected, filter.options);
  const base = effectiveSelection(filter.defaultSelected ?? [], filter.options);
  if (!current || !base) return current !== base;
  return current.size !== base.size || [...current].some((v) => !base.has(v));
}

/** How many options the filter narrows to; 0 when it doesn't filter (none or all selected). */
function filterCount(filter: TableColumnFilter): number {
  return effectiveSelection(filter.selected, filter.options)?.size ?? 0;
}

/* Like SortButton, it sits in the header's padding (negative margin) so the row height doesn't change. */
const FilterButton = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: calc(var(--space-1) / 2);
  margin: calc(var(--space-1) * -1) 0;
  padding: var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  font: inherit;
  line-height: var(--leading-none);
  color: ${({ $active }) => ($active ? "var(--color-text)" : "var(--color-text-subtle)")};
  cursor: pointer;
  transition:
    background-color var(--duration) var(--ease),
    color var(--duration) var(--ease);

  &:hover,
  &[data-state="open"] {
    background: var(--color-bg-hover);
    color: var(--color-text);
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

const FilterCount = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  font-variant-numeric: tabular-nums;
`;

const FilterFieldset = styled.fieldset`
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
`;

const FilterLegend = styled.legend`
  padding: 0;
  margin-bottom: var(--space-2);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-muted);
`;

/* Fixed width, so long option names truncate instead of stretching the popover. */
const FilterBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  /* At least the search width, and always the popover's full width, so counts end at the Apply button's edge. */
  width: 100%;
  min-width: min(var(--search-width), calc(100vw - var(--space-6)));
`;

/* Each option is one fixed 36px line, so the visible height always lands mid-row. */
const OPTION_HEIGHT = "calc(var(--space-6) + var(--space-1))";

/*
 * Long lists scroll. The height shows 6½ rows, so the last visible row is cut in half and the list
 * reads as scrollable even where scrollbars are hidden (macOS, touch). A thin scrollbar sits in a
 * reserved gutter, so the counts never shift when it appears.
 */
const FilterOptions = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0 calc(var(--space-1) * -1);
  padding: 2px var(--space-1);
  list-style: none;
  max-height: calc(${OPTION_HEIGHT} * 6.5);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-strong) transparent;

  &[data-scrolls] {
    scrollbar-gutter: stable;
  }

  & > li {
    display: flex;
    flex: none;
    align-items: center;
    height: ${OPTION_HEIGHT};
  }
  /* Room between the counts and the scrollbar, only when there is one. */
  &[data-scrolls] > li {
    padding-right: var(--space-2);
  }
  /* Older Chromium and Edge ignore scrollbar-width; give them the same thin, arrowless bar. */
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-button {
    display: none;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: var(--radius-full);
    background: var(--color-border-strong);
  }
  /* The kit Checkbox row fills the line so the label can truncate and the count can align right. */
  & > li > span {
    display: flex;
    flex: 1;
    min-width: 0;
  }
  /* Checkbox and text centred on the same line. */
  & > li > span {
    align-items: center;
  }
  /* The kit nudges the box down to meet a multi-line label's first line; options are one line. */
  & > li button[role="checkbox"] {
    margin-top: 0;
  }
  & > li label {
    display: flex;
    align-self: center;
    align-items: center;
    flex: 1;
    min-width: 0;
    line-height: var(--leading-ui);
  }
`;

const OptionLabel = styled.span`
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
`;

const OptionName = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OptionCount = styled.span`
  flex: none;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const FilterEmpty = styled.p`
  margin: 0;
  padding: var(--space-3) 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const FILTER_ICON_SIZE = 14;

/* Search appears once a list is long enough that scanning it is slower than typing (e.g. organizations). */
const SEARCH_THRESHOLD = 8;

/**
 * Staged selection: checking options only changes a draft. Apply commits it (onChange) and closes;
 * Clear selects every option (no filtering) without closing; closing any other way discards the draft.
 * Long lists get a search box, and options already selected when the popover opened are pinned to the
 * top (pinned at open, not as you check, so rows don't jump under the pointer).
 */
export function ColumnFilter({ filter }: { filter: TableColumnFilter }) {
  const { label, options, selected, onChange } = filter;
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<string[]>(selected);
  const [query, setQuery] = React.useState("");
  const [pinned, setPinned] = React.useState<string[]>([]);
  const count = filterCount(filter);
  const searchable = options.length > SEARCH_THRESHOLD;
  const toggle = (value: string, checked: boolean) =>
    setDraft((prev) => (checked ? [...prev.filter((v) => v !== value), value] : prev.filter((v) => v !== value)));

  const q = query.trim().toLowerCase();
  const shown = options
    .filter((o) => !q || o.label.toLowerCase().includes(q))
    .sort((a, b) => Number(pinned.includes(b.value)) - Number(pinned.includes(a.value)));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft(selected);
          setQuery("");
          // "No filtering" (nothing or everything selected) pins nothing.
          setPinned(effectiveSelection(selected, options) ? selected : []);
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <FilterButton type="button" aria-label={tableFilterCopy.trigger(label, count)} $active={isFilterActive(filter)}>
          <Icon icon={ListFilter} size={FILTER_ICON_SIZE} />
          {count > 0 && <FilterCount aria-hidden="true">{count}</FilterCount>}
        </FilterButton>
      </PopoverTrigger>
      <PopoverContent align="start" showClose={false}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            // Keep the page's option order, whatever order the boxes were checked in.
            onChange(options.map((o) => o.value).filter((v) => draft.includes(v)));
            setOpen(false);
          }}
        >
          <FilterFieldset>
            <FilterLegend>{tableFilterCopy.legend(label)}</FilterLegend>
            <FilterBody>
              {searchable && (
                <SearchField
                  aria-label={tableFilterCopy.search(label)}
                  placeholder={tableFilterCopy.search(label)}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onSearch={setQuery}
                  // Enter searches as you type already; don't let it submit (Apply) the form.
                  onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
                  autoFocus
                />
              )}
              {shown.length === 0 ? (
                <FilterEmpty role="status">{tableFilterCopy.noMatches}</FilterEmpty>
              ) : (
                <FilterOptions data-scrolls={shown.length > 6 ? "" : undefined}>
                  {shown.map((option) => (
                    <li key={option.value}>
                      <Checkbox
                        checked={draft.includes(option.value)}
                        onCheckedChange={(checked) => toggle(option.value, checked === true)}
                        label={
                          <OptionLabel title={option.label}>
                            <OptionName>{option.label}</OptionName>
                            {option.count !== undefined && <OptionCount>{option.count}</OptionCount>}
                          </OptionLabel>
                        }
                      />
                    </li>
                  ))}
                </FilterOptions>
              )}
            </FilterBody>
          </FilterFieldset>
          <PopoverActions>
            <Button type="button" $variant="ghost" $size="sm" onClick={() => setDraft(options.map((o) => o.value))}>
              {tableFilterCopy.clear}
            </Button>
            <Button type="submit" $variant="primary" $size="sm">
              {tableFilterCopy.apply}
            </Button>
          </PopoverActions>
        </form>
      </PopoverContent>
    </Popover>
  );
}
