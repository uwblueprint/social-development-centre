"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { SearchField } from "@/components/ui/SearchField";
import { Tag } from "@/components/ui/Tag";
import type { Member, TagColor } from "./data";
import { SubmitNote, useSubmit } from "./DialogStates";
import { Skeleton, VisuallyHidden } from "./SheetStates";
import { useLabDelay, type StateLab } from "../_state-lab/useStateLab";

/** How long the tag list "loads" when the popover opens, while Slow loading is on (ms). */
const TAGS_LOAD_FOR = 800;

/* Fits a 360px screen: never wider than the viewport minus a gutter on each side. */
const Content = styled(PopoverContent)`
  &&& {
    width: min(320px, calc(100vw - var(--space-4) * 2));
    padding: var(--space-2);
  }
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  max-height: calc(var(--space-8) * 3);
  margin-top: var(--space-2);
  overflow-y: auto;
`;

/*
 * Two columns shared with the search field above: its magnifier (16px, --space-3 in from the field's edge) and its typed
 * text (--space-3 + 16px + --space-2 in, plus the field's 1px border). The 20px checkbox centres on the magnifier
 * (--space-1 / 2 further left); the Create row's 16px plus sits exactly on it. The pill and the Create label start on
 * the text column; TextColumn adds the field's 1px border, so it snaps to the same device pixel as the field's.
 */
const Row = styled.div`
  display: flex;
  align-items: center;
  gap: calc(var(--space-2) - var(--space-1) / 2);
  min-height: var(--space-6);
  padding: var(--space-1) var(--space-2) var(--space-1) calc(var(--space-3) - var(--space-1) / 2);
  border-radius: var(--radius-md);
  cursor: pointer;

  &:hover,
  &:focus-within {
    background: var(--color-bg-hover);
  }
`;

/* A row like the tag rows: highlighted on hover and when ArrowDown reaches it (the inset ring can't be clipped by the list). */
const CreateRow = styled(Button)`
  &&& {
    justify-content: flex-start;
    gap: var(--space-2);
    width: 100%;
    height: auto;
    min-height: var(--space-6);
    padding: var(--space-1) var(--space-2) var(--space-1) var(--space-3);
    border-width: 0;
    overflow-wrap: anywhere;
    text-align: left;
    white-space: normal;
    line-height: var(--leading-ui);

    &:focus-visible {
      background: var(--color-bg-hover);
      box-shadow: var(--focus-ring-inset);
    }
  }
`;

const TextColumn = styled.span`
  display: flex;
  min-width: 0;
  border-left: 1px solid transparent;
`;

/* A long tag name wraps instead of widening the popover. */
const Pill = styled(Tag)`
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
`;

const Note = styled.p`
  margin: 0;
  padding: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-body);
`;

/* A placeholder row the height and spacing of a real tag row: a checkbox square, then a pill. */
const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: calc(var(--space-2) - var(--space-1) / 2);
  min-height: var(--space-6);
  padding: var(--space-1) var(--space-2) var(--space-1) calc(var(--space-3) - var(--space-1) / 2);
`;

const Gap = styled.div`
  margin-top: var(--space-2);
`;

export type TagToggle = { tag: string; action: "add" | "remove" };

/**
 * One popover for adding and removing tags on the selected people. Each tag shows whether all, some or none of
 * them have it; clicking a row adds it to everyone (none, some) or removes it from everyone (all). Typing a new
 * name offers "Create “name”". Every change applies at once, and the parent shows the Undo toast.
 */
export function BulkTagsPopover({
  people,
  allTags,
  tagColors,
  lab,
  onToggle,
  children,
}: {
  people: Member[];
  allTags: string[];
  tagColors: Record<string, TagColor | undefined>;
  lab: Parameters<typeof useSubmit>[0] & Pick<StateLab<never>, "slowLoading">;
  onToggle: (change: TagToggle) => void;
  /** The bar's button. It becomes the popover's trigger. */
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const sub = useSubmit(lab);
  // Slow loading: the tag list is fetched each time the popover opens.
  const loadingTags = useLabDelay(TAGS_LOAD_FOR, open && lab.slowLoading);
  const uid = React.useId();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const popRef = React.useRef<HTMLDivElement>(null);

  const name = query.trim();
  const needle = name.toLowerCase();
  const shown = allTags.filter((t) => t.toLowerCase().includes(needle));
  const canCreate = Boolean(name) && !allTags.some((t) => t.toLowerCase() === needle);

  const stateOf = (tag: string): boolean | "indeterminate" => {
    const n = people.filter((p) => p.tags.includes(tag)).length;
    return n === 0 ? false : n === people.length ? true : "indeterminate";
  };

  function apply(tag: string, action: "add" | "remove") {
    if (sub.busy) return;
    sub.run(() => onToggle({ tag, action }));
  }

  const rows = () => Array.from(popRef.current?.querySelectorAll<HTMLElement>("[data-tag-row]") ?? []);

  function onKeyDown(e: React.KeyboardEvent) {
    const items = rows();
    const at = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[at + 1]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (at > 0) items[at - 1].focus();
      else searchRef.current?.focus();
    } else if (e.key === "Home" && at >= 0) {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === "End" && at >= 0) {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  }

  function create() {
    if (sub.busy) return;
    apply(name, "add");
    setQuery("");
    searchRef.current?.focus();
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <Content
        side="top"
        align="center"
        showClose={false}
        aria-label={`Tags for ${people.length === 1 ? "1 person" : `${people.length} people`}`}
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          searchRef.current?.focus();
        }}
      >
        <div ref={popRef} role="presentation" onKeyDown={onKeyDown}>
        <SearchField
          ref={searchRef}
          aria-label="Search or create a tag"
          placeholder="Search or create a tag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={(v) => setQuery(v)}
          onKeyDown={(e) => {
            if (e.key !== "Enter" || loadingTags || sub.busy) return;
            e.preventDefault();
            if (shown.length === 1 && !canCreate) apply(shown[0], stateOf(shown[0]) === true ? "remove" : "add");
            else if (!shown.length && canCreate) create();
          }}
        />
        <List ref={listRef} role="group" aria-label="Tags" aria-busy={sub.busy || loadingTags || undefined} aria-disabled={sub.busy || undefined}>
          {loadingTags && (
            <>
              <VisuallyHidden role="status">Loading tags</VisuallyHidden>
              <div aria-hidden="true">
                {["40%", "55%", "30%", "45%"].map((width) => (
                  <SkeletonRow key={width}>
                    <Skeleton $width="var(--space-4)" $height="var(--space-4)" />
                    <Skeleton $width={width} $height="var(--space-4)" />
                  </SkeletonRow>
                ))}
              </div>
            </>
          )}
          {!loadingTags && shown.map((tag, i) => {
            const state = stateOf(tag);
            const toggle = () => {
              if (sub.busy) return;
              apply(tag, state === true ? "remove" : "add");
            };
            const labelId = `${uid}-${i}`;
            return (
              <Row key={tag} onClick={toggle}>
                <Checkbox
                  data-tag-row=""
                  tabIndex={-1}
                  checked={state}
                  aria-labelledby={labelId}
                  onCheckedChange={() => {}}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !sub.busy) {
                      e.preventDefault();
                      toggle();
                    }
                  }}
                />
                <TextColumn>
                  <Pill id={labelId} color={tagColors[tag]}>
                    {tag}
                  </Pill>
                </TextColumn>
              </Row>
            );
          })}
          {!loadingTags && !shown.length && !canCreate && <Note>{allTags.length ? "No tags match" : "No tags yet. Type a name to create one."}</Note>}
          {!loadingTags && canCreate && (
            <CreateRow data-tag-row="" tabIndex={-1} type="button" $variant="ghost" onClick={create}>
              <Icon icon={Plus} size={16} />
              <TextColumn>{`Create “${name}”`}</TextColumn>
            </CreateRow>
          )}
        </List>
        {sub.busy && (
          <Note role="status" aria-live="polite">
            Saving…
          </Note>
        )}
        {sub.phase === "error" && (
          <Gap>
            <SubmitNote submit={sub} />
          </Gap>
        )}
        </div>
      </Content>
    </Popover>
  );
}
