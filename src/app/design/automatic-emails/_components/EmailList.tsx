"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { styled } from "next-yak";
import { CircleAlert, Copy, FilePen, Mail, MoreHorizontal, Plus, RotateCw, Send, Split, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/DropdownMenu";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Pagination } from "@/components/ui/Pagination";
import { SearchField } from "@/components/ui/SearchField";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { ListEmptyState, ListPage, ListPageHeader, ListPageToolbar } from "@/components/patterns/ListPage";
import { SkipLinks } from "@/components/patterns/SkipLinks";
import { type AutomaticEmail, TAGS, dayOf, displayName, effectiveAudience, isDiscardable, tagColor, timingLabel } from "../_data";
import { AudiencePills, TagPill } from "./AudiencePills";
import { SkeletonBlock } from "./Skeleton";

/*
 * Mostly used while setting up: building the program, checking it, duplicating and editing.
 * - Built on the kit's ListPage: header (title, search, New automatic email), tag chips, then tabs.
 * - Search looks in titles, descriptions and tag names. Tabs, chips and search narrow each other, and
 *   every count is what its tab lists. Over 50 emails, a tab pages (kit Pagination).
 * - Tag chips, drawn like the editor's tags: click for "has it" (solid), double-click (or Delete) for
 *   "doesn't have it" (red ban). One tab stop; arrow keys move between chips (toolbar pattern).
 * - The journey as it's set up: what starts it, then when. Each email is its own box. Drafts look the same; their tab is the difference.
 * - Keyboard: a skip link first; coming back from an email puts focus back on that email.
 * - Everything is in the URL (?q, ?tab, ?has, ?not, ?page), so Back retraces every step.
 */

/** Trash lists only emails that were published at least once: a discarded draft (never published) is in
 *  trash on the server but never shown. */
const inTrash = (e: AutomaticEmail) => e.state === "trash" && !!e.wasPublished;

const PAGE_SIZE = 50;

/* One row of chips that scrolls sideways off the page's edges, like YouTube's. The padding keeps focus
   rings clear of the scroll edge; the negative margin gives the ListPage padding back. */
const Chips = styled.div`
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  padding: var(--space-1) var(--space-6);
  margin-inline: calc(var(--space-6) * -1);
  /* 16px between the tabs' divider and the chips. */
  margin-top: var(--space-4);
  scrollbar-width: none;

  & > * {
    flex: none;
  }

  @media (max-width: 767px) {
    padding-inline: var(--space-4);
    margin-inline: calc(var(--space-4) * -1);
  }
`;

/* A chip is the kit Tag inside a kit Button (SelectableTag always shows a plus/check icon, and picked
   chips here have none). Hover: the tag's stronger fill. Picked: solid (see TagPill). */
const ChipButton = styled(Button)`
  height: auto;
  padding: 0;
  border-radius: var(--radius-sm);

  &&:hover,
  &&:active {
    background: transparent;
    transform: none;
  }
  &:hover:not([aria-pressed="true"]) > span {
    background: var(--pill-bg-strong, var(--color-bg-selected));
  }
`;

const ChipsError = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin-top: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Journeys = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
  padding-top: var(--space-4);
`;

const Journey = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const JourneyTitle = styled.h2`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
`;

const Stages = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

const Stage = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const StageTitle = styled.h3`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-regular);
  color: var(--color-text-muted);
`;

/* Every email is its own box in the light divider colour (--color-border), like the tabs' divider.
   Drafts look the same: the tab they're on is the only difference. */
const Row = styled.div`
  position: relative;
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4) var(--space-3) var(--space-4) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  transition: background-color var(--duration) var(--ease);

  &:hover,
  &:focus-within {
    background-color: var(--color-bg-hover);
  }
`;

/* What on the left, who on the right; on a phone, who drops under what. */
const RowMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  gap: var(--space-2) var(--space-6);
  align-items: center;

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const What = styled.div`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const NameRow = styled.div`
  display: flex;
  min-width: 0;
  gap: var(--space-2);
  align-items: center;
`;

const NameButton = styled(Button)`
  position: static;
  align-self: flex-start;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  height: auto;
  padding: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-regular);
  text-align: left;
  white-space: nowrap;

  &&:hover,
  &&:active {
    background: transparent;
    transform: none;
  }
  &&:focus-visible {
    box-shadow: none;
  }
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: var(--radius-md);
  }
  &:focus-visible::after {
    box-shadow: var(--focus-ring-inset);
  }
`;

const Description = styled.span`
  display: block;
  min-width: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
  white-space: nowrap;
`;

const Who = styled.div`
  flex: 0 1 auto;
  max-width: 50%;
  margin-left: auto;

  /* The pills' own row (inside AudiencePills' wrapper) hugs the right edge, so wrapped lines do too. */
  & > span,
  & > span > span[aria-hidden] {
    justify-content: flex-end;
  }

  @media (max-width: 767px) {
    max-width: none;
    margin-left: 0;

    & > span,
    & > span > span[aria-hidden] {
      justify-content: flex-start;
    }
  }
`;

/* Lifts the ⋯ menu above the row's stretched name button so it stays clickable. */
const Above = styled.div`
  position: relative;
  z-index: var(--z-raised);
`;

/* A quiet line at the top of Trash, so it's clear before anyone opens one. */
const TrashNote = styled.p`
  margin: var(--space-4) 0 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Pages = styled.div`
  padding-top: var(--space-5);
`;

/* The skip link's target: the page title, focusable but not in the tab order, with a visible ring. */
const TitleTarget = styled.span`
  border-radius: var(--radius-sm);

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/* Loading: the page's own shape, so nothing jumps when the emails arrive. */
const Loading = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-width: 0;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const LongerNote = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const SkelHeader = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2) var(--space-4);
  min-height: 36px;
`;

const SkelTitle = styled.h1`
  flex: 1 1 auto;
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
`;

const SkelRow = styled.div`
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4) var(--space-3) var(--space-4) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
`;

const SkelLines = styled.span`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
`;

const SkelPills = styled.span`
  display: flex;
  gap: var(--space-2);
`;

const SkelLine = styled.span`
  display: flex;
  gap: var(--space-2);
`;

const SkelTabs = styled(SkelLine)`
  gap: var(--space-5);
  padding-block: var(--space-2);
`;

const SKEL_CHIPS = ["44px", "72px", "88px", "64px", "96px", "80px"];
const SKEL_TABS = ["72px", "56px", "48px"];
const SKEL_JOURNEYS: { title: string; rows: [string, string, number][] }[] = [
  { title: "140px", rows: [["55%", "38%", 1], ["48%", "32%", 2], ["60%", "44%", 1]] },
  { title: "200px", rows: [["42%", "30%", 2], ["58%", "40%", 1], ["50%", "35%", 1]] },
];

/** The list's loading skeleton: the header, chip row, tabs and two journeys, in the real rows' boxes. */
function EmailListSkeleton({ takingLonger }: { takingLonger: boolean }) {
  const text = takingLonger ? "Still loading. This is taking longer than usual." : "Loading automatic emails";
  return (
    <ListPage aria-busy="true">
      <VisuallyHidden role="status">{text}</VisuallyHidden>
      <Loading aria-hidden="true">
        <SkelHeader>
          <SkelTitle>Automatic emails</SkelTitle>
          <SkeletonBlock $width="var(--search-width)" $height="36px" $radius="var(--radius-md)" />
          <SkeletonBlock $width="168px" $height="36px" $radius="var(--radius-md)" />
        </SkelHeader>
        <SkelTabs>
          {SKEL_TABS.map((w, i) => (
            <SkeletonBlock key={i} $width={w} />
          ))}
        </SkelTabs>
        <SkelLine>
          {SKEL_CHIPS.map((w, i) => (
            <SkeletonBlock key={i} $width={w} $height="24px" $radius="var(--radius-full)" />
          ))}
        </SkelLine>
        <Journeys>
          {SKEL_JOURNEYS.map((j, i) => (
            <Journey key={i}>
              <SkeletonBlock $width={j.title} $height="var(--space-4)" />
              <Stages>
                {j.rows.map(([name, desc, pills], k) => (
                  <SkelRow key={k}>
                    <SkelLines>
                      <SkeletonBlock $width={name} $height="var(--space-4)" />
                      <SkeletonBlock $width={desc} />
                    </SkelLines>
                    <SkelPills>
                      {Array.from({ length: pills }, (_, n) => (
                        <SkeletonBlock key={n} $width="64px" $height="20px" $radius="var(--radius-full)" />
                      ))}
                    </SkelPills>
                  </SkelRow>
                ))}
              </Stages>
            </Journey>
          ))}
        </Journeys>
        {takingLonger && <LongerNote>{text}</LongerNote>}
      </Loading>
    </ListPage>
  );
}

type Filter = Record<string, "has" | "not">;

/**
 * The chips' filter.
 * - Picked tags ("has"): the journey of someone who has exactly those tags. An email shows if its rule
 *   lets them in; an email that starts when a tag is added shows for a picked tag.
 * - Excluded tags ("not"): only emails that explicitly leave that tag out.
 * Both together narrow each other.
 */
function shows(e: AutomaticEmail, f: Filter) {
  const has = Object.keys(f).filter((t) => f[t] === "has");
  const not = Object.keys(f).filter((t) => f[t] === "not");
  const a = effectiveAudience(e);
  if (not.some((t) => !a.never.includes(t))) return false;
  if (!has.length) return true;
  if (e.trigger === "tag" && !has.includes(e.tag)) return false;
  if (a.never.some((t) => has.includes(t))) return false;
  if (!a.require.every((t) => has.includes(t))) return false;
  if (a.only.length && !a.only.some((t) => has.includes(t))) return false;
  return true;
}

/** Search: the title, the description, and the names of every tag the email mentions. */
function matchesSearch(e: AutomaticEmail, q: string) {
  if (!q) return true;
  const a = e.audience;
  const tags = [...(e.trigger === "tag" ? [e.tag] : []), ...a.only, ...a.require, ...a.never];
  const haystack = [displayName(e), e.description ?? "", ...tags].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

const groupKey = (e: AutomaticEmail) =>
  e.trigger.startsWith("join") ? "0" : e.trigger === "refers" ? "1" : e.trigger === "ref_joins" ? "2" : `3-${e.tag}`;

/** The journey order: what starts it, then when. Pages cut this order, so a page continues the journey. */
function journeyOrder(emails: AutomaticEmail[]) {
  return [...emails].sort((a, b) => groupKey(a).localeCompare(groupKey(b)) || dayOf(a) - dayOf(b));
}

interface Group {
  key: string;
  title: ReactNode;
  stages: { label: string; emails: AutomaticEmail[] }[];
}

/** Already in journey order: group by what starts it, then by when. */
function journeys(ordered: AutomaticEmail[]): Group[] {
  const groups: Group[] = [];
  for (const e of ordered) {
    const key = groupKey(e);
    let g = groups[groups.length - 1];
    if (g?.key !== key) {
      const title = e.trigger.startsWith("join") ? (
        "When someone joins"
      ) : e.trigger === "refers" ? (
        "When someone refers a friend"
      ) : e.trigger === "ref_joins" ? (
        "When someone's referral joins"
      ) : (
        <>
          When
          <Tag color={tagColor(e.tag)}>{e.tag}</Tag>
          is added
        </>
      );
      g = { key, title, stages: [] };
      groups.push(g);
    }
    const label = timingLabel(e);
    const last = g.stages[g.stages.length - 1];
    if (last?.label === label) last.emails.push(e);
    else g.stages.push({ label, emails: [e] });
  }
  return groups;
}

export function EmailList({
  emails,
  onCreate,
  onOpen,
  onDuplicate,
  onSplit,
  onTrash,
  loading,
  loadFailed,
  onRetry,
  tagsFailed,
  onRetryTags,
  banner,
}: {
  emails: AutomaticEmail[];
  onCreate: () => void;
  onOpen: (id: string) => void;
  onDuplicate: (e: AutomaticEmail) => void;
  onSplit: (e: AutomaticEmail) => void;
  onTrash: (e: AutomaticEmail) => void;
  /** The page's own loading phases (State lab): first load, and "taking longer". */
  loading?: { loading: boolean; takingLonger: boolean };
  /** The list couldn't load (State lab): offer Try again. */
  loadFailed?: boolean;
  onRetry?: () => void;
  /** The tag list couldn't load: the chips say so; the list still works. */
  tagsFailed?: boolean;
  onRetryTags?: () => void;
  /** An action's failure, shown above the list with its own Try again. */
  banner?: ReactNode;
}) {
  /* The tab, tag filter, search and page live in the URL, so the browser's back button steps back
     through them, and back from an email returns to the list as it was. */
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const go = (next: URLSearchParams, replace = false) => {
    const qs = next.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    if (replace) router.replace(href, { scroll: false });
    else router.push(href, { scroll: false });
  };
  /** Any change to what's listed starts again at page 1. */
  const edit = (change: (next: URLSearchParams) => void, replace = false) => {
    const next = new URLSearchParams(params.toString());
    change(next);
    next.delete("page");
    go(next, replace);
  };

  // Published is the default tab, so it keeps the URL clean.
  const tab = params.get("tab") ?? "published";
  const setTab = (t: string) =>
    edit((n) => {
      if (t === "published") n.delete("tab");
      else n.set("tab", t);
      n.delete("has");
      n.delete("not");
    });
  const q = params.get("q") ?? "";
  // Typing replaces the history entry instead of adding one per keystroke.
  const setQuery = (value: string) => edit((n) => (value.trim() ? n.set("q", value.trim()) : n.delete("q")), true);
  const page = Math.max(1, Number(params.get("page")) || 1);
  const setPage = (p: number) => {
    const next = new URLSearchParams(params.toString());
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    go(next);
    document.getElementById("automatic-emails-title")?.focus();
  };

  const filter: Filter = Object.fromEntries([
    ...params.getAll("has").map((t) => [t, "has"] as const),
    ...params.getAll("not").map((t) => [t, "not"] as const),
  ]);
  const setFilter = (f: Filter) =>
    edit((n) => {
      n.delete("has");
      n.delete("not");
      for (const [t, state] of Object.entries(f)) n.append(state, t);
    });
  const filtering = Object.keys(filter).length > 0;
  const setTagState = (t: string, state: "has" | "not" | null) => {
    const next = { ...filter };
    if (state) next[t] = state;
    else delete next[t];
    setFilter(next);
  };

  /* One click toggles "has"; a second click within 300ms is a double-click: "doesn't have". A double
     tap or pressing Enter twice does the same; Delete (or Backspace) excludes straight away. */
  const clickTimer = useRef<{ tag: string; id: ReturnType<typeof setTimeout> } | null>(null);
  const clickChip = (t: string) => {
    if (clickTimer.current?.tag === t) {
      clearTimeout(clickTimer.current.id);
      clickTimer.current = null;
      setTagState(t, filter[t] === "not" ? null : "not");
      return;
    }
    if (clickTimer.current) clearTimeout(clickTimer.current.id);
    const id = setTimeout(() => {
      clickTimer.current = null;
      setTagState(t, filter[t] ? null : "has");
    }, 300);
    clickTimer.current = { tag: t, id };
  };

  /* The chips are one tab stop (WAI-ARIA toolbar): Tab lands on the last-used chip, arrows move,
     Home and End jump to the ends. */
  const chipsRef = useRef<HTMLDivElement>(null);
  // The chips' one tab stop: the first chosen tag, or All when none is.
  const stopChip = TAGS.find((t) => filter[t]) ?? "*";
  const chipKeys = (event: KeyboardEvent<HTMLDivElement>) => {
    const chips = [...(chipsRef.current?.querySelectorAll<HTMLButtonElement>("[data-chip]") ?? [])];
    const at = chips.indexOf(document.activeElement as HTMLButtonElement);
    if (at < 0) return;
    const to =
      event.key === "ArrowRight" ? Math.min(at + 1, chips.length - 1)
      : event.key === "ArrowLeft" ? Math.max(at - 1, 0)
      : event.key === "Home" ? 0
      : event.key === "End" ? chips.length - 1
      : null;
    if (to !== null) {
      event.preventDefault();
      chips.forEach((c, i) => (c.tabIndex = i === to ? 0 : -1));
      chips[to].focus();
      chips[to].scrollIntoView({ block: "nearest", inline: "nearest" });
      return;
    }
    const tag = chips[at].dataset.chip;
    if ((event.key === "Delete" || event.key === "Backspace") && tag && tag !== "*") {
      event.preventDefault();
      setTagState(tag, filter[tag] === "not" ? null : "not");
    }
  };

  /* The tag filter belongs to the tab it was set on (switching tabs clears it), and the tab counts are
     each tab's total: filtering or searching never changes them. */
  const totals = {
    published: emails.filter((e) => e.state === "published").length,
    drafts: emails.filter((e) => e.state === "draft").length,
    trash: emails.filter(inTrash).length,
  };
  const shown = (list: AutomaticEmail[]) => journeyOrder(list.filter((e) => matchesSearch(e, q) && (!filtering || shows(e, filter))));
  const lists = {
    published: shown(emails.filter((e) => e.state === "published")),
    drafts: shown(emails.filter((e) => e.state === "draft")),
    trash: shown(emails.filter(inTrash)),
  };
  type TabId = keyof typeof lists;
  const current = lists[(tab in lists ? tab : "published") as TabId];
  const pageCount = Math.max(1, Math.ceil(current.length / PAGE_SIZE));
  const onPage = Math.min(page, pageCount);
  const paged = (t: TabId) => (t === tab || (t === "published" && !(tab in lists)) ? lists[t].slice((onPage - 1) * PAGE_SIZE, onPage * PAGE_SIZE) : lists[t]);

  /* Moving an email to trash removes its row, and focus with it. Put focus on the next row's name
     (else the previous one's, else the tabs) once the row has gone. */
  const visibleIds = paged((tab in lists ? tab : "published") as TabId).map((e) => e.id);
  const idsKey = visibleIds.join("|");
  const lastFocused = useRef<string | null>(null);
  const prevIds = useRef<string[]>(visibleIds);
  useEffect(() => {
    const before = prevIds.current;
    prevIds.current = visibleIds;
    const gone = lastFocused.current;
    if (!gone || !before.includes(gone) || visibleIds.includes(gone)) return;
    const at = before.indexOf(gone);
    const target = before.slice(at + 1).find((id) => visibleIds.includes(id)) ?? [...before.slice(0, at)].reverse().find((id) => visibleIds.includes(id));
    lastFocused.current = null;
    // Wait a beat: the menu hands focus back to its trigger as it closes, and that row is already gone.
    const timer = setTimeout(() => {
      const active = document.activeElement;
      if (active && active !== document.body && document.contains(active)) return;
      const next = target ? document.querySelector<HTMLElement>(`[data-email-id="${CSS.escape(target)}"]`) : null;
      (next ?? document.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]'))?.focus();
    }, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  const row = (e: AutomaticEmail) => (
    <Row key={e.id} onFocus={() => (lastFocused.current = e.id)}>
      <RowMain>
        <What>
          <NameRow>
            <NameButton $variant="ghost" data-email-id={e.id} onClick={() => onOpen(e.id)}>
              <TruncatedText tooltip>{displayName(e)}</TruncatedText>
            </NameButton>
          </NameRow>
          {e.description && (
            <Description>
              <TruncatedText tooltip>{e.description}</TruncatedText>
            </Description>
          )}
        </What>
        <Who>
          <AudiencePills email={e} />
        </Who>
      </RowMain>
      {/* Trash is read-only: it opens to read, nothing else. */}
      {e.state !== "trash" && (
        <Above>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button $variant="ghost" $size="sm" aria-label={`More actions for ${displayName(e)}`}>
                <Icon icon={MoreHorizontal} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onDuplicate(e)}>
                <Icon icon={Copy} size={16} />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onSplit(e)}>
                <Icon icon={Split} size={16} />
                Split by a tag
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem $variant="danger" onSelect={() => onTrash(e)}>
                <Icon icon={Trash2} size={16} />
                {isDiscardable(e) ? "Discard" : "Move to trash"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Above>
      )}
    </Row>
  );

  const journeyView = (list: AutomaticEmail[], total: number) => (
    <>
      <Journeys>
        {journeys(list).map((g, i) => (
          <Journey key={`${g.key}-${i}`}>
            <JourneyTitle>{g.title}</JourneyTitle>
            <Stages>
              {g.stages.map((s) => (
                <Stage key={s.label}>
                  {/* "Within 24 hours" is the default: say it only when the journey also has later emails. */}
                  {(g.stages.length > 1 || s.label !== "Within 24 hours") && <StageTitle>{s.label}</StageTitle>}
                  {s.emails.map(row)}
                </Stage>
              ))}
            </Stages>
          </Journey>
        ))}
      </Journeys>
      <Pages>
        <Pagination page={onPage} pageCount={Math.ceil(total / PAGE_SIZE)} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </Pages>
    </>
  );

  /* Empty tabs say what goes there and how to fill it (NN/g). Search and filters that hide everything
     offer to clear them (the kit's ListEmptyState). */
  const SCOPE: Record<TabId, string> = { published: "published ", drafts: "draft ", trash: "trashed " };
  const EMPTY: Record<TabId, { icon: typeof Mail; title: string; description: string; action?: ReactNode }> = {
    published: {
      icon: Send,
      title: "Nothing published yet",
      description: "Publish a draft to start sending it.",
      action:
        lists.drafts.length > 0 ? (
          <Button $variant="secondary" onClick={() => setTab("drafts")}>
            Go to drafts
          </Button>
        ) : undefined,
    },
    drafts: {
      icon: FilePen,
      title: "No drafts",
      description: "Emails you're still working on show here until you publish them.",
      action: (
        <Button $variant="secondary" onClick={onCreate}>
          <Icon icon={Plus} size={16} />
          New automatic email
        </Button>
      ),
    },
    trash: { icon: Trash2, title: "Trash is empty", description: "Emails you move to trash show here to read. They can't be restored." },
  };
  const emptyTab = (t: TabId) => (
    <ListEmptyState
      items={`${SCOPE[t]}emails`}
      query={q}
      searchedFields="titles, descriptions and tags"
      onClearSearch={() => setQuery("")}
      filtered={filtering ? `${SCOPE[t]}emails for these tags` : undefined}
      onClearFilters={() => setFilter({})}
      onClearSearchAndFilters={() =>
        edit((n) => {
          n.delete("q");
          n.delete("has");
          n.delete("not");
        })
      }
      empty={EMPTY[t]}
    />
  );

  const newButton = (
    <Button onClick={onCreate}>
      <Icon icon={Plus} />
      New automatic email
    </Button>
  );
  const title = (
    <TitleTarget id="automatic-emails-title" tabIndex={-1}>
      Automatic emails
    </TitleTarget>
  );
  const skip = <SkipLinks links={[{ targetId: "automatic-emails-title", label: "Skip to main content" }]} />;

  if (loading?.loading) return <EmailListSkeleton takingLonger={loading.takingLonger} />;

  if (loadFailed) {
    return (
      <ListPage>
        <ListPageHeader title="Automatic emails" />
        <div role="alert">
          <EmptyState
            icon={CircleAlert}
            title="Couldn't load automatic emails"
            description="Check your connection and try again."
            action={
              <Button $variant="outline" $size="sm" onClick={onRetry}>
                <Icon icon={RotateCw} size={16} />
                Try again
              </Button>
            }
          />
        </div>
      </ListPage>
    );
  }

  // First use: nothing exists yet, so there's nothing to search, filter or switch between.
  if (emails.length === 0) {
    return (
      <ListPage>
        {skip}
        <ListPageHeader title={title} actions={newButton} />
        <EmptyState
          icon={Mail}
          title="No automatic emails yet"
          description="Set one up once and it sends itself, like a thank-you when someone joins."
          action={
            <Button $variant="secondary" onClick={onCreate}>
              <Icon icon={Plus} size={16} />
              New automatic email
            </Button>
          }
        />
      </ListPage>
    );
  }

  return (
    <ListPage>
      {skip}
      <ListPageHeader
        title={title}
        search={
          <SearchField
            aria-label="Search by title, description or tag"
            placeholder="Search by title, description or tag"
            defaultValue={q}
            onSearch={setQuery}
          />
        }
        actions={newButton}
        results={{ query: q, count: current.length, pending: false }}
      />

      {banner}


      <Tabs value={tab in lists ? tab : "published"} onValueChange={setTab}>
        <ListPageToolbar
          tabs={
            <TabsList aria-label="Automatic emails by status">
              <TabsTrigger value="published">
                Published <TabsCount>({totals.published})</TabsCount>
              </TabsTrigger>
              <TabsTrigger value="drafts">
                Drafts <TabsCount>({totals.drafts})</TabsCount>
              </TabsTrigger>
              <TabsTrigger value="trash">
                Trash <TabsCount>({totals.trash})</TabsCount>
              </TabsTrigger>
            </TabsList>
          }
        />
      {tagsFailed ? (
        <ChipsError role="alert">
          Couldn&apos;t load your tags, so you can&apos;t filter by tag right now.
          <Button $variant="outline" $size="sm" onClick={onRetryTags}>
            Try again
          </Button>
        </ChipsError>
      ) : (
        <Chips
          ref={chipsRef}
          role="toolbar"
          aria-label="Filter by tag. Choose tags to see the journey of someone with all of them. Press Delete or double-click to see emails that leave a tag out."
          onKeyDown={chipKeys}
        >
          <ChipButton $variant="ghost" data-chip="*" tabIndex={stopChip === "*" ? 0 : -1} aria-pressed={!filtering} onClick={() => setFilter({})}>
            <Tag style={!filtering ? { background: "var(--color-text)", color: "var(--color-bg)", fontWeight: "var(--weight-medium)" } : undefined}>
              All
            </Tag>
          </ChipButton>
          {TAGS.map((t) => {
            const state = filter[t];
            return (
              <ChipButton
                key={t}
                $variant="ghost"
                data-chip={t}
                tabIndex={stopChip === t ? 0 : -1}
                aria-pressed={!!state}
                aria-label={state === "has" ? `${t}: has this tag` : state === "not" ? `${t}: emails that leave it out` : t}
                onClick={() => clickChip(t)}
              >
                <TagPill tag={t} mark={state === "not" ? "not" : undefined} selected={!!state} />
              </ChipButton>
            );
          })}
        </Chips>
      )}
        {(["published", "drafts"] as const).map((t) => (
          <TabsContent key={t} value={t} tabIndex={-1}>
            {lists[t].length ? journeyView(paged(t), lists[t].length) : emptyTab(t)}
          </TabsContent>
        ))}
        {/* Panels aren't Tab stops: Tab goes straight to the first email (WAI-ARIA: a panel is only
            focusable when it holds nothing focusable, and these always hold emails or a button). */}
        <TabsContent value="trash" tabIndex={-1}>
          {lists.trash.length ? (
            <>
              <TrashNote>Emails in trash don&apos;t send and can&apos;t be restored.</TrashNote>
              <Journeys>{paged("trash").map(row)}</Journeys>
              <Pages>
                <Pagination page={onPage} pageCount={Math.ceil(lists.trash.length / PAGE_SIZE)} pageSize={PAGE_SIZE} total={lists.trash.length} onPageChange={setPage} />
              </Pages>
            </>
          ) : (
            emptyTab("trash")
          )}
        </TabsContent>
      </Tabs>
    </ListPage>
  );
}
