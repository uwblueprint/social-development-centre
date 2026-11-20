"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ChevronDown, ListFilter, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/Collapsible";
import { Icon } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { SearchField } from "@/components/ui/SearchField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  dayLabel,
  fill,
  isEdited,
  LAST_DAY,
  MEMBERS,
  plural,
  subjectOf,
  TEMPLATE_KEYS,
  TEMPLATES,
  whenLabel,
  type Send,
  type TemplateKey,
} from "./data";
import { GooseIllustration } from "./GooseIllustration";
import type { BulkKind } from "./OutboxPage";

export type PanelMode = "review" | "all" | "failed";

const Panel = styled.aside`
  position: sticky;
  top: 0;
  z-index: var(--z-raised);
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 480px;
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);

  @media (max-width: 899px) {
    position: relative;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--color-border);
  }
`;

const Top = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-4) var(--space-3);
  border-bottom: 1px solid var(--color-border);
`;

const Title = styled.h2`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

const TabRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const TabDivider = styled.span`
  align-self: center;
  width: 1px;
  height: var(--space-4);
  background: var(--color-border-strong);
`;

/* "Couldn't send" reads like the other tabs; the red count badge carries the error. */
const FailBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  margin-left: var(--space-2);
  padding: 0 var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: var(--color-on-danger);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
`;

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);

  & > :first-child {
    flex: 1 1 auto;
    min-width: 0;
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

// The tabs wrap the header and the list; the root adds no box of its own so the panel stays one flex column.
const TabsRoot = styled(Tabs)`
  display: contents;
`;

// The recipient list is the panel the tabs control.
const Scroll = styled(TabsContent)`
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-1) 0 var(--space-3);
`;

const SelectAllRow = styled.div`
  display: flex;
  align-items: center;
  padding: var(--space-2) var(--space-4) var(--space-2) var(--space-5);
  border-bottom: 1px solid var(--color-border);
`;

const Group = styled.section`
  & + & {
    margin-top: var(--space-1);
  }
`;

const DayHead = styled.h3`
  position: sticky;
  top: 0;
  z-index: var(--z-raised);
  margin: 0;
  padding: var(--space-3) var(--space-2) var(--space-1);
  background: var(--color-surface);
`;

const DayToggle = styled(CollapsibleTrigger)`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  width: 100%;
  min-height: 32px;
  padding: var(--space-1) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: var(--color-bg-hover);
  color: var(--color-text-muted);
  font: inherit;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-bg-selected);
    color: var(--color-text);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
  & > span {
    flex: 1 1 auto;
  }
  & svg {
    transition: transform var(--duration) var(--ease);
  }
  &[data-state="closed"] svg {
    transform: rotate(-90deg);
  }
`;

const Rows = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

/* Rows are soft blocks: hover tints, the open email is selected, and failures/past-due carry a status tint. */
const Row = styled.li`
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  margin: var(--space-1) var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);

  &:hover {
    background: var(--color-bg-hover);
  }
  &[data-tone="danger"] {
    background: var(--color-danger-subtle);
  }
  &[data-tone="warning"] {
    background: var(--color-warning-subtle);
  }
  &[data-current] {
    background: var(--color-bg-selected);
  }
`;

const CheckCell = styled.div`
  position: relative;
  z-index: var(--z-raised);
  flex: none;
  padding-top: 2px;
`;

/* The whole row opens the email: the button's hit area stretches over the row, under the checkbox. */
const OpenButton = styled(ListRow)`
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: 0;
  min-width: 0;

  &:hover {
    background: transparent;
  }
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius-md);
  }
`;

const When = styled.span`
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  &[data-tone="danger"] {
    color: var(--color-danger);
    font-weight: var(--weight-medium);
  }
  &[data-tone="warning"] {
    color: var(--color-warning);
    font-weight: var(--weight-medium);
  }
`;

const Name = styled.span`
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
`;

const Snippet = styled.span`
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const ShowMore = styled.div`
  padding: var(--space-1) var(--space-5) var(--space-2);
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-7) var(--space-4);
  text-align: center;
`;

const EmptyTitle = styled.span`
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
`;

const EmptyText = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

/* Appears only once something is selected, floating over the bottom of the list. */
const FloatBar = styled.div`
  position: absolute;
  left: var(--space-3);
  right: var(--space-3);
  bottom: var(--space-3);
  z-index: var(--z-popover);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  box-shadow: var(--shadow-lg);
`;

const FloatTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
`;

const FloatActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);

  & > :nth-last-child(1) {
    margin-left: auto;
  }
`;

const Spacer = styled.div`
  height: 140px;
`;

const PAGE = 10;

interface Props {
  sends: Send[];
  mode: PanelMode;
  onMode: (m: PanelMode) => void;
  selected: Set<string>;
  onSelected: (s: Set<string>) => void;
  openId: string | null;
  onOpen: (id: string) => void;
  pickedDay: number | null;
  closedDays: Set<number>;
  onClosedDays: (s: Set<number>) => void;
  onHoverDay: (day: number | null) => void;
  onBulk: (kind: BulkKind, ids: string[]) => void;
  onResend: (ids: string[]) => void;
}

function tone(s: Send) {
  if (s.status === "couldnt") return "danger";
  if (s.status === "review" && s.day < 0) return "warning";
  return undefined;
}

export function RecipientsPanel({
  sends,
  mode,
  onMode,
  selected,
  onSelected,
  openId,
  onOpen,
  pickedDay,
  closedDays: closed,
  onClosedDays: setClosed,
  onHoverDay,
  onBulk,
  onResend,
}: Props) {
  const [text, setText] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [templates, setTemplates] = React.useState<Set<TemplateKey>>(new Set());
  const [limits, setLimits] = React.useState<Record<string, number>>({});
  const [lastPicked, setLastPicked] = React.useState<string | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const reviewCount = sends.filter((s) => s.status === "review").length;
  const failedCount = sends.filter((s) => s.status === "couldnt").length;
  const allCount = sends.filter((s) => s.day >= 0 && s.day <= LAST_DAY).length;

  const q = query.trim().toLowerCase();
  const shown = sends
    .filter((s) =>
      mode === "review" ? s.status === "review" : mode === "failed" ? s.status === "couldnt" : s.day >= 0 && s.day <= LAST_DAY,
    )
    .filter((s) => templates.size === 0 || templates.has(s.template))
    .filter((s) => {
      if (!q) return true;
      const m = MEMBERS[s.member];
      return `${m.name} ${m.email} ${m.tags.join(" ")} ${TEMPLATES[s.template].name}`.toLowerCase().includes(q);
    })
    .sort((a, b) => a.day - b.day || MEMBERS[a.member].name.localeCompare(MEMBERS[b.member].name));

  // All is grouped by day; For review and Couldn't send are one list each.
  const grouped = mode === "all";
  const groups: { day: number; list: Send[] }[] = [];
  for (const s of shown) {
    const key = grouped ? s.day : 0;
    const g = groups.find((x) => x.day === key);
    if (g) g.list.push(s);
    else groups.push({ day: key, list: [s] });
  }

  // A calendar pick opens that day in All and brings it to the top of the list.
  React.useEffect(() => {
    if (pickedDay == null || mode !== "all") return;
    requestAnimationFrame(() => {
      const el = document.getElementById(`outbox-day-${pickedDay}`);
      const list = scrollRef.current;
      if (el && list) list.scrollTop = el.offsetTop - list.offsetTop;
    });
  }, [pickedDay, mode]);

  const selectedSends = sends.filter((s) => selected.has(s.id));
  const allSelected = shown.length > 0 && shown.every((s) => selected.has(s.id));
  const toggle = (id: string) => {
    const n = new Set(selected);
    if (n.has(id)) n.delete(id);
    else {
      n.add(id);
      setLastPicked(id);
    }
    onSelected(n);
  };

  const last = selectedSends.find((s) => s.id === lastPicked) ?? selectedSends[selectedSends.length - 1];
  const dayGroup = grouped && last ? shown.filter((s) => s.day === last.day) : null;
  const canSelectGroup = !!dayGroup && dayGroup.length < shown.length && dayGroup.some((s) => !selected.has(s.id));
  const reviewIds = selectedSends.filter((s) => s.status === "review").map((s) => s.id);
  const sendIds = selectedSends.filter((s) => s.status === "scheduled" || s.status === "pending").map((s) => s.id);
  const failIds = selectedSends.filter((s) => s.status === "couldnt").map((s) => s.id);

  const emptyTitle =
    q || templates.size
      ? "No recipients match"
      : mode === "review"
        ? "Nothing to review"
        : mode === "failed"
          ? "Nothing failed"
          : "Nothing scheduled";
  const emptyText =
    q || templates.size
      ? "Try another name or clear the filters."
      : mode === "review"
        ? "Everything on the calendar sends on its own."
        : "No emails are going out in the next 30 days.";

  return (
    <Panel aria-labelledby="outbox-title">
      <TabsRoot value={mode} onValueChange={(v) => onMode(v as PanelMode)}>
        <Top>
          <Title id="outbox-title">Outbox</Title>
          <TabRow>
            <TabsList aria-label="Show recipients">
              <TabsTrigger value="review">For review ({reviewCount})</TabsTrigger>
              <TabsTrigger value="all">All ({allCount})</TabsTrigger>
              {failedCount > 0 && <TabDivider aria-hidden="true" />}
              {failedCount > 0 && (
                <TabsTrigger value="failed" aria-label={`Couldn't send, ${plural(failedCount, "email", "emails")}`}>
                  Couldn&apos;t send
                  <FailBadge aria-hidden="true">{failedCount}</FailBadge>
                </TabsTrigger>
              )}
            </TabsList>
          </TabRow>
          <SearchRow>
            <SearchField
              aria-label="Search recipients by name, email, tag or template"
              placeholder="Search recipients or template"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onSearch={setQuery}
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button $variant="outline" $size="sm" aria-label={templates.size ? `Filter, ${templates.size} on` : "Filter"}>
                  <Icon icon={ListFilter} size={16} />
                  Filter{templates.size ? ` (${templates.size})` : ""}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" showClose={false}>
                <FilterList>
                  <FilterLegend>Email template</FilterLegend>
                  {TEMPLATE_KEYS.map((k) => (
                    <Checkbox
                      key={k}
                      label={TEMPLATES[k].name}
                      checked={templates.has(k)}
                      onCheckedChange={(v) => {
                        const n = new Set(templates);
                        if (v === true) n.add(k);
                        else n.delete(k);
                        setTemplates(n);
                      }}
                    />
                  ))}
                  {templates.size > 0 && (
                    <Button $variant="ghost" $size="sm" onClick={() => setTemplates(new Set())}>
                      Clear filters
                    </Button>
                  )}
                </FilterList>
              </PopoverContent>
            </Popover>
          </SearchRow>
        </Top>

        <Scroll value={mode} ref={scrollRef}>
          {!grouped && shown.length > 0 && (
            <SelectAllRow>
              <Checkbox
                label={`Select all ${shown.length}`}
                checked={allSelected}
                onCheckedChange={() => onSelected(allSelected ? new Set() : new Set(shown.map((s) => s.id)))}
              />
            </SelectAllRow>
          )}

          {groups.length === 0 && (
            <Empty>
              {!q && !templates.size && <GooseIllustration />}
              <EmptyTitle>{emptyTitle}</EmptyTitle>
              <EmptyText>{emptyText}</EmptyText>
              {(q || templates.size > 0) && (
                <Button
                  $variant="outline"
                  $size="sm"
                  onClick={() => {
                    setText("");
                    setQuery("");
                    setTemplates(new Set());
                  }}
                >
                  Clear search and filters
                </Button>
              )}
            </Empty>
          )}

          {groups.map(({ day, list }) => {
            const key = `${mode}-${day}`;
            const limit = limits[key] ?? PAGE;
            const rows = (
              <Rows>
                {list.slice(0, limit).map((s) => {
                  const m = MEMBERS[s.member];
                  return (
                    <Row
                      key={s.id}
                      data-tone={tone(s)}
                      data-current={openId === s.id ? "" : undefined}
                      onMouseEnter={() => onHoverDay(s.day)}
                      onMouseLeave={() => onHoverDay(null)}
                    >
                      <CheckCell>
                        <Checkbox
                          aria-label={`Select ${m.name}`}
                          checked={selected.has(s.id)}
                          onCheckedChange={() => toggle(s.id)}
                        />
                      </CheckCell>
                      <OpenButton
                        type="button"
                        aria-current={openId === s.id ? "true" : undefined}
                        onClick={() => onOpen(s.id)}
                        onFocus={() => onHoverDay(s.day)}
                        onBlur={() => onHoverDay(null)}
                      >
                        <When data-tone={tone(s)}>{whenLabel(s)}</When>
                        <Name>{m.name}</Name>
                        <Snippet>
                          {isEdited(s) ? fill(subjectOf(s), m) : `${TEMPLATES[s.template].name} · ${fill(subjectOf(s), m)}`}
                        </Snippet>
                      </OpenButton>
                    </Row>
                  );
                })}
                {list.length > limit && (
                  <ShowMore>
                    <Button $variant="ghost" $size="sm" onClick={() => setLimits({ ...limits, [key]: limit + PAGE * 2 })}>
                      Show {Math.min(PAGE * 2, list.length - limit)} more
                    </Button>
                  </ShowMore>
                )}
              </Rows>
            );
            if (!grouped) return <Group key={key}>{rows}</Group>;
            return (
              <Group key={key} id={`outbox-day-${day}`}>
                <Collapsible
                  open={!closed.has(day)}
                  onOpenChange={(o) => {
                    const n = new Set(closed);
                    if (o) n.delete(day);
                    else n.add(day);
                    setClosed(n);
                  }}
                >
                  <DayHead>
                    <DayToggle>
                      <span>{dayLabel(day)}</span>
                      <Icon icon={ChevronDown} size={14} />
                    </DayToggle>
                  </DayHead>
                  <CollapsibleContent>{rows}</CollapsibleContent>
                </Collapsible>
              </Group>
            );
          })}
          {selected.size > 0 && <Spacer aria-hidden="true" />}
        </Scroll>
      </TabsRoot>

      {selected.size > 0 && (
        <FloatBar role="toolbar" aria-label="Selected emails">
          <FloatTop>
            <span role="status">
              {selectedSends.length}/{shown.length} selected
            </span>
            <Button $variant="ghost" $size="sm" aria-label="Clear selection" onClick={() => onSelected(new Set())}>
              <Icon icon={X} size={14} />
            </Button>
          </FloatTop>
          <FloatActions>
            {!allSelected && (
              <Button $variant="secondary" $size="sm" onClick={() => onSelected(new Set(shown.map((s) => s.id)))}>
                Select all {shown.length}
              </Button>
            )}
            {canSelectGroup && dayGroup && last && (
              <Button
                $variant="secondary"
                $size="sm"
                onClick={() => onSelected(new Set([...selected, ...dayGroup.map((s) => s.id)]))}
              >
                Select all {dayGroup.length} for {last.day === 0 ? "today" : last.day === 1 ? "tomorrow" : dayLabel(last.day)}
              </Button>
            )}
            <Button
              $variant="ghost"
              $size="sm"
              onClick={() =>
                onBulk(
                  "delete",
                  selectedSends.map((s) => s.id),
                )
              }
            >
              Delete
            </Button>
            {reviewIds.length > 0 && (
              <Button $variant="primary" $size="sm" onClick={() => onBulk("approve", reviewIds)}>
                Approve {reviewIds.length}
              </Button>
            )}
            {sendIds.length > 0 && (
              <Button $variant="primary" $size="sm" onClick={() => onBulk("sendnow", sendIds)}>
                Send {sendIds.length} now
              </Button>
            )}
            {failIds.length > 0 && (
              <Button $variant="primary" $size="sm" onClick={() => onResend(failIds)}>
                Resend {failIds.length}
              </Button>
            )}
          </FloatActions>
        </FloatBar>
      )}
    </Panel>
  );
}
