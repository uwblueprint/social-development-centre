"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, CookingPot, Mail, RotateCw, SearchX, Settings, UsersRound, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  CommandPalette,
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteLoading,
  CommandPaletteMatch,
  CommandPaletteMessage,
} from "@/components/ui/CommandPalette";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { rank, type Range } from "./rank";
import { readRecent, saveRecent, type RecentResult, type ResultKind } from "./recent";
import { settingsFor } from "./settings";
import { arrive, emailHref, personHref } from "./targets";
import { useSearchIndex, type Remote } from "./useSearchIndex";

export interface SearchPage {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Other words that should find the page. Never shown. */
  keywords?: readonly string[];
}

interface Result {
  kind: ResultKind;
  id: string;
  label: string;
  detail?: string;
  href: string;
  icon: LucideIcon;
  range?: Range | null;
}


const PER_GROUP = 5;

/**
 * Ctrl K / ⌘K search across pages, settings, people and automatic emails. Pages and settings are
 * searched in the browser and show at once; people and emails come from one small list loaded when the
 * palette opens (see useSearchIndex), each with its own loading and error state.
 */
export function SearchPalette({
  from,
  pages,
  open,
  onOpenChange,
  onPersonMissing,
}: {
  /** Which portal's links to use: the built pages, or the design screens. */
  from: "admin" | "design";
  pages: SearchPage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when a person opened from search isn't on the People page anymore. */
  onPersonMissing?: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [selected, setSelected] = React.useState("");
  const [recent, setRecent] = React.useState<RecentResult[]>([]);
  const navigated = React.useRef(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { index, retry } = useSearchIndex(open);
  const settings = React.useMemo(() => settingsFor(from), [from]);

  useShortcut(open, onOpenChange);

  // Every open starts fresh: empty search, current recents. The shortcut and the sidebar open it from outside.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSearch("");
      setSelected("");
      setRecent(readRecent());
    }
  }
  React.useEffect(() => {
    if (open) navigated.current = false;
  }, [open]);

  const pageResult = (p: SearchPage, range?: Range | null): Result => ({
    kind: "page",
    id: p.href,
    label: p.label,
    href: p.href,
    icon: p.icon,
    range,
  });
  const settingResult = (s: (typeof settings)[number], range?: Range | null): Result => ({
    kind: "setting",
    id: s.key,
    label: s.label,
    detail: s.section,
    href: s.href,
    icon: Settings,
    range,
  });
  const people = index.people.status === "ok" ? index.people.items : [];
  const emails = index.emails.status === "ok" ? index.emails.items : [];
  const personResult = (p: (typeof people)[number], range?: Range | null): Result => ({
    kind: "person",
    id: p.id,
    label: p.name ?? p.email,
    detail: p.name ? p.email : undefined,
    href: personHref(p.id),
    icon: UsersRound,
    range,
  });
  const emailResult = (e: (typeof emails)[number], range?: Range | null): Result => ({
    kind: "email",
    id: e.id,
    label: e.name,
    href: emailHref(e.id),
    icon: Mail,
    range,
  });

  /** A recent result, as it is now: renamed if it changed, dropped if it's gone. */
  function resolveRecent(r: RecentResult): Result | null {
    if (r.kind === "page") {
      const page = pages.find((p) => p.href === r.id);
      return page ? pageResult(page) : null;
    }
    if (r.kind === "setting") {
      const setting = settings.find((s) => s.key === r.id);
      return setting ? settingResult(setting) : null;
    }
    const list = r.kind === "person" ? index.people : index.emails;
    if (list.status === "ok") {
      if (r.kind === "person") {
        const person = people.find((p) => p.id === r.id);
        return person ? personResult(person) : null;
      }
      const email = emails.find((e) => e.id === r.id);
      return email ? emailResult(email) : null;
    }
    // Not loaded yet (or failed): show what we stored; arriving handles a person who's gone.
    return r.kind === "person"
      ? { kind: "person", id: r.id, label: r.label, href: personHref(r.id), icon: UsersRound }
      : { kind: "email", id: r.id, label: r.label, href: emailHref(r.id), icon: Mail };
  }

  const query = search.trim();
  const groups: { heading: string; results: Result[] }[] = query
    ? [
        {
          heading: "Pages",
          results: rank(pages, query, PER_GROUP).map(({ item, range }) => pageResult(item, range)),
        },
        {
          heading: "Settings",
          results: rank(settings, query, PER_GROUP).map(({ item, range }) => settingResult(item, range)),
        },
        {
          heading: "People",
          results: rank(
            people.map((p) => ({ ...p, label: p.name ?? p.email, detail: p.name ? p.email : undefined })),
            query,
            PER_GROUP,
          ).map(({ item, range }) => personResult(item, range)),
        },
        {
          heading: "Automatic emails",
          results: rank(
            emails.map((e) => ({ ...e, label: e.name })),
            query,
            PER_GROUP,
          ).map(({ item, range }) => emailResult(item, range)),
        },
      ]
    : [
        {
          heading: "Recent",
          results: recent.map(resolveRecent).filter((r): r is Result => r !== null),
        },
        { heading: "Jump to", results: pages.map((p) => pageResult(p)) },
      ];

  const remote: { heading: string; noun: string; state: Remote<unknown> }[] = [
    { heading: "People", noun: "people", state: index.people },
    { heading: "Automatic emails", noun: "automatic emails", state: index.emails },
  ];
  const failed = remote.filter((g) => g.state.status === "error" || g.state.status === "offline");
  const offline = failed.some((g) => g.state.status === "offline");
  const loading = (heading: string) => remote.find((g) => g.heading === heading)?.state.status === "loading";
  const hasRows = groups.some((g) => g.results.length > 0 || (query && loading(g.heading)));
  const empty = query && !hasRows && failed.length === 0;

  function go(result: Result) {
    saveRecent({ kind: result.kind, id: result.id, label: result.label });
    navigated.current = true;
    onOpenChange(false);
    router.push(result.href);
    arrive(result.href, result.kind === "person" ? onPersonMissing : undefined);
  }

  const all = groups.flatMap((g) => g.results.map((r) => ({ value: valueOf(g.heading, r), result: r })));

  return (
    <CommandPalette
      open={open}
      onOpenChange={onOpenChange}
      label="Search"
      placeholder="Search pages, people, settings and emails"
      search={search}
      onSearchChange={setSearch}
      value={selected}
      onValueChange={setSelected}
      inputRef={inputRef}
      restoreFocus={() => !navigated.current}
      onKeyDown={(event) => {
        // Ctrl+Enter (⌘+Enter on a Mac) opens the result in a new tab and keeps the palette open.
        if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey)) return;
        const hit = all.find((a) => a.value === selected);
        if (!hit) return;
        event.preventDefault();
        window.open(hit.result.href, "_blank", "noopener");
      }}
      empty={
        empty ? (
          <EmptyState
            icon={CookingPot}
            title={`Nothing on the menu for “${truncate(query, 40)}”`}
            description="Try a first name, an email address or a page"
            action={
              <Button
                type="button"
                $variant="secondary"
                onClick={() => {
                  setSearch("");
                  inputRef.current?.focus();
                }}
              >
                <Icon icon={SearchX} />
                Clear search
              </Button>
            }
          />
        ) : undefined
      }
    >
      {query && failed.length > 0 && (
        <CommandPaletteGroup>
          <CommandPaletteMessage icon={offline ? WifiOff : CircleAlert} tone={offline ? "neutral" : "danger"}>
            {offline
              ? "You’re offline. Pages and settings still work"
              : `Couldn’t load ${failed.map((g) => g.noun).join(" and ")}`}
          </CommandPaletteMessage>
          <CommandPaletteItem value="retry" icon={RotateCw} label="Try again" onSelect={retry} />
        </CommandPaletteGroup>
      )}
      {groups.map((group) =>
        group.results.length > 0 ? (
          <CommandPaletteGroup key={group.heading} heading={group.heading}>
            {group.results.map((r) => (
              <CommandPaletteItem
                key={valueOf(group.heading, r)}
                value={valueOf(group.heading, r)}
                icon={r.icon}
                label={<CommandPaletteMatch text={r.label} range={r.range ?? null} />}
                detail={r.detail}
                onSelect={() => go(r)}
              />
            ))}
          </CommandPaletteGroup>
        ) : query && loading(group.heading) ? (
          <CommandPaletteGroup key={group.heading} heading={group.heading}>
            <CommandPaletteLoading label={`Finding ${group.heading.toLowerCase()}…`} rows={group.heading === "People" ? 2 : 1} />
          </CommandPaletteGroup>
        ) : null,
      )}
    </CommandPalette>
  );
}

const valueOf = (heading: string, r: Result) => `${heading}:${r.kind}:${r.id}`;

const truncate = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/**
 * Ctrl K (⌘K on a Mac) toggles the palette from anywhere in the portal, including inside a field.
 * Left alone when something on the page already used the keys (the email editor's link shortcut) or
 * another dialog is open, so the palette never stacks on a half-finished task.
 */
function useShortcut(open: boolean, onOpenChange: (open: boolean) => void) {
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
      if (event.defaultPrevented || event.isComposing) return;
      if (!open && document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]')) return;
      event.preventDefault();
      onOpenChange(!open);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);
}
