"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { keyframes, styled } from "next-yak";
import { Bell, Check, CheckCircle2, CreditCard, Send, Settings, UsersRound, X } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { EmptyState } from "@/components/ui/EmptyState";
import { List, ListRow } from "@/components/ui/ListRow";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { useHoldSidebarOpen } from "@/components/patterns/Sidebar";
import { useToast } from "@/components/ui/Toast";
import type { AdminNotification, NotificationsPage, NotificationsSource } from "./types";
import { describe, fullTime, personHref, relativeTime, titleParts, type NotificationCopy } from "./copy";

/**
 * The bell in the sidebar header and the panel it opens: full height, against the sidebar's right edge, over
 * the page. One flat list, newest first, loaded a page at a time as you scroll.
 *
 * Seen and done are separate (docs/backend/notifications.md):
 * - Seen is per admin. Opening the panel marks everything seen, which clears the red count. The ones that were
 *   new keep their dot until the panel closes, so you can tell which they were.
 * - Done is shared. The check takes a notification off the list for every admin; Undo puts it back.
 *
 * Data comes from `source`: server actions in the admin portal (source.ts), an in-memory demo on the design
 * screens. Any call can fail: the list says it couldn't load and offers Try again; a check or Undo that
 * doesn't save is put back with a toast.
 *
 * Grid (owner: everything on one grid). One inset, `--inset`, for the header and every row, as in the kit's
 * Sheet. Rows are three columns: the 28px icon, the text, the time. Everything centres on the row's middle:
 * the icon, the text block (title and description together), the time and the check that replaces it. The
 * close icon and the times share the right inset.
 */
/**
 * No Suspense boundary or search-params read here: either can make React hide the bell while a page changes.
 * The demo reads `?notifications=empty` itself when the page loads.
 */
export function NotificationsButton(props: { source: NotificationsSource; settingsHref: string }) {
  return <Notifications {...props} />;
}

/** The bell's count is refetched on a page change or focus at most this often. */
const COUNT_REFRESH_MS = 60_000;
/** The check is self-explanatory after one use; its label only shows if you linger on it (owner). */
const DONE_TOOLTIP_DELAY_MS = 1000;
/** The beat, the fade, then the gap closing. Only for the reduced-motion fallback. */
const LEAVE_MS = 100 + 100 + 240;

/** The same icons as the sidebar sections, so a row says which page it's about at a glance. */
const AREA_ICON: Record<NotificationCopy["area"], typeof Send> = {
  Outbox: Send,
  Payments: CreditCard,
  People: UsersRound,
};

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      items: AdminNotification[];
      /** This admin's seenAt from before this open: newer ones get the dot. */
      shownSince: string | null;
      nextCursor: string | null;
      loadingMore: boolean;
      /** The last "load more" failed; the end of the list offers Try again. */
      moreFailed: boolean;
    };

/** Space between the floating sidebar card and the panel (--space-2). */
const FLOAT_GAP = 8;

/** The sidebar is a floating card when it doesn't run the full height of the window. */
function floatingSize(sidebar: HTMLElement | null) {
  const rect = sidebar?.getBoundingClientRect();
  if (!rect || (rect.top <= 0 && rect.bottom >= window.innerHeight - 1)) return null;
  return { height: rect.height };
}

const isNew = (n: AdminNotification, since: string | null) => !since || n.occurredAt > since;

function Notifications({ source, settingsHref }: { source: NotificationsSource; settingsHref: string }) {
  const router = useRouter();
  const [newCount, setNewCount] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  // The panel sits beside the sidebar, so the sidebar stays put until the panel closes.
  useHoldSidebarOpen(open);
  const [list, setList] = React.useState<ListState>({ status: "loading" });
  // Mark as done: the row plays its exit, then leaves the list and the Undo bar offers it back.
  const [leaving, setLeaving] = React.useState<Set<string>>(new Set());
  const { toast } = useToast();
  // Rows whose exit has finished, so a second end signal (transition end and the fallback timer) is ignored.
  const finished = React.useRef<Set<string>>(new Set());
  // A row put back by Undo grows back in; every other row just appears.
  const [restoredId, setRestoredId] = React.useState<string | null>(null);
  const [phone, setPhone] = React.useState(false);
  // Between 768px and 1199px the collapsed sidebar floats as a card; the panel matches its height beside it.
  const [floating, setFloating] = React.useState<{ height: number } | null>(null);
  // Where the sidebar ends: the blurred backdrop covers the page from here, so the sidebar stays sharp.
  const [sidebarRight, setSidebarRight] = React.useState(0);
  const [width, setWidth] = React.useState(0);
  const anchorRef = React.useRef<HTMLElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const endRef = React.useRef<HTMLDivElement>(null);

  // The bell only needs a count, so the list itself isn't loaded until the panel opens. The count loads
  // once, then again on a page change or when the window regains focus, at most once a minute: a join
  // mid-session shows without a reload, and moving between pages doesn't call the server each time.
  // A count that can't load just shows no badge; opening the panel says what's wrong.
  const pathname = usePathname();
  const countLoadedAt = React.useRef(0);
  // Only the latest request may set the count; opening the panel also moves this on, so a count fetched
  // before it opened can't bring the badge back.
  const countRequest = React.useRef(0);
  React.useEffect(() => {
    const refresh = () => {
      if (Date.now() - countLoadedAt.current < COUNT_REFRESH_MS) return;
      countLoadedAt.current = Date.now();
      const request = ++countRequest.current;
      source
        .loadNewCount()
        .then((count) => request === countRequest.current && setNewCount(count))
        .catch(() => {
          countLoadedAt.current = 0;
        });
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [source, pathname]);

  async function openPanel() {
    setList({ status: "loading" });
    let page: NotificationsPage;
    try {
      // One call: the first page, and it's now seen (up to the newest shown) for this admin.
      page = await source.openPanel();
    } catch {
      setList({ status: "error" });
      return;
    }
    setList({
      status: "ready",
      items: page.notifications,
      shownSince: page.seenAt,
      nextCursor: page.nextCursor,
      loadingMore: false,
      moreFailed: false,
    });
    countRequest.current++;
    setNewCount(0);
  }

  // The latest list, for the scroll handler (state updaters run later, so they can't hand back the cursor).
  const listRef = React.useRef(list);
  React.useEffect(() => {
    listRef.current = list;
  }, [list]);

  const loadMore = React.useCallback(async () => {
    const l = listRef.current;
    if (l.status !== "ready" || !l.nextCursor || l.loadingMore) return;
    const cursor = l.nextCursor;
    listRef.current = { ...l, loadingMore: true, moreFailed: false };
    setList(listRef.current);
    try {
      const page = await source.loadPage(cursor);
      setList((l) =>
        l.status === "ready"
          ? {
              ...l,
              // A row checked off on another admin's screen can shift a page; never show one twice.
              items: [...l.items, ...page.notifications.filter((n) => !l.items.some((m) => m.id === n.id))],
              nextCursor: page.nextCursor,
              loadingMore: false,
            }
          : l,
      );
    } catch {
      setList((l) => (l.status === "ready" ? { ...l, loadingMore: false, moreFailed: true } : l));
    }
  }, [source]);

  // Load the next page when the end of the list scrolls into view.
  const hasMore = list.status === "ready" && !!list.nextCursor && !list.moreFailed;
  React.useEffect(() => {
    if (!open || !hasMore || !endRef.current) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void loadMore(), {
      root: scrollRef.current,
      rootMargin: "200px",
    });
    observer.observe(endRef.current);
    return () => observer.disconnect();
  }, [open, hasMore, loadMore]);

  // Follow the sidebar while the window resizes; close if the sidebar goes away (e.g. it collapses).
  React.useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.right <= 0) return setOpen(false);
      setPhone(window.matchMedia("(max-width: 767px)").matches);
      setWidth(rect.width);
      setFloating(floatingSize(anchorRef.current));
      setSidebarRight(rect.right);
    };
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  function markDone(id: string, row: HTMLElement | null) {
    const l = listRef.current;
    const index = l.status === "ready" ? l.items.findIndex((n) => n.id === id) : -1;
    const item = l.status === "ready" ? l.items[index] : undefined;
    source.setDone(id, true).catch(() => {
      // Didn't save: put it back where it was, and say so.
      setLeaving((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
      if (item) putBack(item, index);
      toast({ title: item ? `Couldn’t mark “${describe(item).title}” as done. Try again.` : "Couldn’t mark that as done. Try again." });
    });
    // Keep keyboard focus in the list: move it to the next row (or the previous one) before this one goes.
    const next = row?.nextElementSibling ?? row?.previousElementSibling;
    next?.querySelector<HTMLElement>("button")?.focus();
    setLeaving((s) => new Set(s).add(id));
  }

  /** The row's exit has finished: take it out of the list and offer Undo in a toast. */
  function finishLeave(id: string) {
    if (finished.current.has(id)) return;
    finished.current.add(id);
    setLeaving((s) => {
      const next = new Set(s);
      next.delete(id);
      return next;
    });
    const l = listRef.current;
    if (l.status !== "ready") return;
    const index = l.items.findIndex((n) => n.id === id);
    if (index < 0) return;
    const item = l.items[index];
    setList((now) => (now.status === "ready" ? { ...now, items: now.items.filter((n) => n.id !== id) } : now));
    toast({
      title: `“${describe(item).title}” marked as done`,
      actionLabel: "Undo",
      onAction: () => undoDone(item, index),
    });
  }

  function undoDone(item: AdminNotification, index: number) {
    source.setDone(item.id, false).catch(() => {
      setList((l) => (l.status === "ready" ? { ...l, items: l.items.filter((n) => n.id !== item.id) } : l));
      toast({ title: `Couldn’t undo “${describe(item).title}”. Try again.` });
    });
    putBack(item, index);
  }

  /** Puts a notification back in the list at its old place (Undo, or a check that didn't save). */
  function putBack(item: AdminNotification, index: number) {
    finished.current.delete(item.id);
    setList((l) => {
      if (l.status !== "ready" || l.items.some((n) => n.id === item.id)) return l;
      const items = [...l.items];
      items.splice(Math.min(index, items.length), 0, item);
      return { ...l, items };
    });
    setRestoredId(item.id);
  }

  /**
   * Keyboard: ↓ and ↑ move between notifications (from the panel itself, ↓ goes to the first), Home and End to
   * the first and last. Tab still reaches each row's names and check in order; Enter opens; Escape closes.
   */
  function moveBetweenRows(e: React.KeyboardEvent<HTMLElement>) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const rows = Array.from(scrollRef.current?.querySelectorAll<HTMLElement>("[data-row]:not([inert] *)") ?? []);
    if (rows.length === 0) return;
    const active = document.activeElement;
    const current = rows.findIndex((row) => row.parentElement?.contains(active));
    let next: number;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = rows.length - 1;
    else if (current < 0) next = e.key === "ArrowDown" ? 0 : rows.length - 1;
    else next = Math.min(rows.length - 1, Math.max(0, current + (e.key === "ArrowDown" ? 1 : -1)));
    e.preventDefault();
    rows[next].focus();
    rows[next].scrollIntoView({ block: "nearest" });
  }

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          // Sit against the sidebar's right edge; on phones the sidebar is a full-width drawer, so cover it.
          const sidebar = triggerRef.current?.closest<HTMLElement>("[data-sidebar-panel]") ?? null;
          anchorRef.current = sidebar;
          setPhone(window.matchMedia("(max-width: 767px)").matches);
          setWidth(sidebar?.getBoundingClientRect().width ?? 0);
          setFloating(floatingSize(sidebar));
          setSidebarRight(sidebar?.getBoundingClientRect().right ?? 0);
          // Close any tooltip left open behind the panel (a sidebar description, a Settings hint): every
          // Radix tooltip closes itself on this event, the same one it sends when another tooltip opens.
          document.dispatchEvent(new CustomEvent("tooltip.open"));
          void openPanel();
        } else {
          setLeaving(new Set());
          setRestoredId(null);
        }
        setOpen(next);
      }}
    >
      <PopoverAnchor virtualRef={anchorRef as React.RefObject<HTMLElement>} />
      {open &&
        createPortal(
          // Pointer only: the close button and Escape are the keyboard ways out.
          <Backdrop
            aria-hidden="true"
            style={{ left: phone ? 0 : sidebarRight }}
            data-floating={!phone && floating ? "" : undefined}
            onClick={() => setOpen(false)}
          />,
          document.body,
        )}
      <PopoverTrigger asChild>
        <BellButton
          ref={triggerRef}
          type="button"
          $variant="ghost"
          aria-label={newCount ? `Notifications, ${newCount} new` : "Notifications"}
        >
          <Icon icon={Bell} size={16} strokeWidth={1.75} />
          {newCount > 0 && <Count aria-hidden="true">{newCount > 99 ? "99+" : newCount}</Count>}
        </BellButton>
      </PopoverTrigger>

      <Panel
        side="right"
        align="start"
        sideOffset={phone ? -width : floating ? FLOAT_GAP : 0}
        avoidCollisions={false}
        showClose={false}
        data-phone={phone || undefined}
        data-floating={!phone && floating ? "" : undefined}
        style={!phone && floating ? ({ "--panel-height": `${floating.height}px` } as React.CSSProperties) : undefined}
        aria-labelledby="notifications-title"
        onKeyDown={moveBetweenRows}
        onInteractOutside={(e) => {
          // The Undo toast floats above the page: using it keeps the panel open.
          if ((e.target as Element | null)?.closest?.("[data-swipe-direction]")) e.preventDefault();
        }}
        onOpenAutoFocus={(e) => {
          // Open focused on the panel itself, never on a button (owner).
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <Head>
          <Title id="notifications-title">Notifications</Title>
          <Tooltip content="Email alerts" side="bottom">
            <HeadButton type="button" $variant="ghost" $size="sm" aria-label="Email alerts" onClick={() => go(settingsHref)}>
              <Icon icon={Settings} size={16} />
            </HeadButton>
          </Tooltip>
          <HeadButton type="button" $variant="ghost" $size="sm" aria-label="Close" onClick={() => setOpen(false)}>
            <Icon icon={X} size={16} />
          </HeadButton>
        </Head>

        <Scroll ref={scrollRef} aria-busy={list.status === "loading" || (list.status === "ready" && list.loadingMore)}>
          {list.status === "loading" ? (
            <Status role="status">Loading notifications…</Status>
          ) : list.status === "error" ? (
            <Status role="alert">
              Notifications couldn’t load. Check your connection, then try again.
              <Button type="button" $variant="outline" $size="sm" onClick={() => void openPanel()}>
                Try again
              </Button>
            </Status>
          ) : list.items.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="You’re all caught up"
              description="We’ll let you know here when an email needs review, a payment needs a look, or someone joins or leaves."
            />
          ) : (
            <>
              <List>
                {list.items.map((n) => (
                  <Row
                    key={n.id}
                    n={n}
                    isNew={isNew(n, list.shownSince)}
                    leaving={leaving.has(n.id)}
                    restored={restoredId === n.id}
                    onGo={go}
                    onDone={(row) => markDone(n.id, row)}
                    onLeft={() => finishLeave(n.id)}
                  />
                ))}
              </List>
              <div ref={endRef} />
              {list.loadingMore && <Status role="status">Loading more…</Status>}
              {list.moreFailed && (
                <Status role="alert">
                  Older notifications couldn’t load.
                  <Button type="button" $variant="outline" $size="sm" onClick={() => void loadMore()}>
                    Try again
                  </Button>
                </Status>
              )}
            </>
          )}
        </Scroll>

      </Panel>
    </Popover>
  );
}

function Row({
  n,
  isNew,
  leaving,
  restored,
  onGo,
  onDone,
  onLeft,
}: {
  n: AdminNotification;
  isNew: boolean;
  leaving: boolean;
  restored: boolean;
  onGo: (href: string) => void;
  onDone: (row: HTMLElement | null) => void;
  onLeft: () => void;
}) {
  const c = describe(n);
  const ref = React.useRef<HTMLDivElement>(null);

  // Finish when the height has closed. The timer covers reduced motion, where there's no transition to end.
  React.useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onLeft, LEAVE_MS + 100);
    return () => clearTimeout(timer);
  }, [leaving, onLeft]);

  return (
    <Collapse
      ref={ref}
      data-leaving={leaving || undefined}
      data-restored={restored || undefined}
      inert={leaving || undefined}
      onTransitionEnd={(e) => {
        if (leaving && e.target === e.currentTarget && e.propertyName === "grid-template-rows") onLeft();
      }}
    >
      <RowWrap>
        {/* The whole row: one button under everything, so a click anywhere but a name opens the notification. */}
        <RowButton
          type="button"
          data-row=""
          aria-label={`${isNew ? "New. " : ""}${c.area}: ${c.title}`}
          onClick={() => onGo(c.href)}
        />
        <RowLayout>
          {isNew && <NewDot aria-hidden="true" />}
          <Glyph aria-hidden="true" data-area={c.area}>
            <Icon icon={AREA_ICON[c.area]} size={14} />
          </Glyph>
          <Content>
            <RowTitle>
              {titleParts(c.title, c.people).map((part, i) =>
                typeof part === "string" ? (
                  <React.Fragment key={i}>{part}</React.Fragment>
                ) : (
                  <NameLink
                    key={i}
                    href={personHref(part)}
                    onClick={(e) => {
                      e.preventDefault();
                      onGo(personHref(part));
                    }}
                  >
                    {part.name}
                  </NameLink>
                ),
              )}
            </RowTitle>
            {c.body && <Body>{c.body}</Body>}
          </Content>
          <Time dateTime={n.occurredAt} title={fullTime(n.occurredAt)}>
            {relativeTime(n.occurredAt)}
          </Time>
        </RowLayout>
        <Tooltip content="Mark as done" side="left" delayDuration={DONE_TOOLTIP_DELAY_MS} pinOnClick={false}>
          <DoneButton
            type="button"
            $variant="ghost"
            $size="sm"
            aria-label={`Mark as done: ${c.title}`}
            onClick={() => onDone(ref.current)}
          >
            <Icon icon={Check} size={16} />
          </DoneButton>
        </Tooltip>
      </RowWrap>
    </Collapse>
  );
}

const BellButton = styled(Button)`
  position: relative;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--color-text-muted);

  &:hover:not(:disabled) {
    color: var(--color-text);
  }
`;

/** Red count on the bell. Never announced alone: the button's label says what it counts. */
const Count = styled.span`
  position: absolute;
  top: -3px;
  right: -5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: var(--color-on-danger);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  line-height: var(--leading-none);
  font-variant-numeric: tabular-nums;
  box-shadow: 0 0 0 2px var(--color-surface);
`;

/*
 * The panel slides out from behind the sidebar and back behind it when it closes. It moves left while a clip
 * keeps it from showing past the sidebar's edge, so it looks like it's tucking under the sidebar.
 */
const slideFromNav = keyframes`
  from {
    transform: translateX(-100%);
    clip-path: inset(0 0 0 100%);
  }
  to {
    transform: translateX(0);
    clip-path: inset(0 0 0 0);
  }
`;

const slideBehindNav = keyframes`
  from {
    transform: translateX(0);
    clip-path: inset(0 0 0 0);
  }
  to {
    transform: translateX(-100%);
    clip-path: inset(0 0 0 100%);
  }
`;

const backdropIn = keyframes`
  from {
    backdrop-filter: blur(0);
  }
  to {
    backdrop-filter: blur(var(--overlay-blur));
  }
`;

/**
 * Blurs the page beside the sidebar while the panel is open (no dimming, like the sidebar's own overlay).
 * A click on it closes the panel and nothing underneath gets pressed. Beside the floating sidebar the page is
 * already blurred, so this only catches the click.
 */
const Backdrop = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--z-popover) - 1);
  backdrop-filter: blur(var(--overlay-blur));
  animation: ${backdropIn} var(--duration) var(--ease-out);

  &[data-floating] {
    backdrop-filter: none;
    animation: none;
  }
`;

/** Full height, square, flush with the sidebar: an edge-to-edge sheet rather than a floating card. */
const Panel = styled(PopoverContent)`
  /* One inset for the header and every row (the kit's Sheet does the same). */
  --inset: var(--space-5);
  /* The row's icon circle; the title's first line and the time centre on it. */
  --glyph: 28px;

  width: 400px;
  height: 100dvh;
  padding: 0;
  display: flex;
  flex-direction: column;
  border-radius: 0;
  /* No border or shadow on the left, where it meets the sidebar; a soft shadow onto the page on the right. */
  border-width: 0 1px 0 0;
  box-shadow: var(--shadow-edge);

  /* Beside the floating sidebar card: the same height, outline, corners and shadow, sliding out from it. */
  &[data-floating] {
    height: var(--panel-height);
    border-width: 1px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    overflow: hidden;
  }

  /* Out from behind the sidebar, and back behind it on close (leaving is quicker). */
  &&[data-state="open"] {
    animation: ${slideFromNav} var(--duration-slow) var(--ease-out);
  }
  &&[data-state="closed"] {
    animation: ${slideBehindNav} var(--duration) var(--ease-in) forwards;
  }

  &[data-phone] {
    --inset: var(--space-4);
    width: 100vw;
    border-width: 0;
    box-shadow: none;
  }
  /* The kit popover's arrow points at a trigger; this panel is attached to the sidebar instead. */
  & > span:has(> svg) {
    display: none;
  }
`;

/**
 * Matches the sidebar's header: same top padding (--space-3) and a 40px row, so "Notifications" sits on the
 * same line as the product name and the bell. The close icon's right edge sits on the inset line.
 */
const Head = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-shrink: 0;
  min-height: calc(40px + 2 * var(--space-3));
  padding: var(--space-3) calc(var(--inset) - var(--space-2)) var(--space-3) var(--inset);
  border-bottom: 1px solid var(--color-border);
  /* Reserve the same gutter as the list's scrollbar, so the close icon and the times share one right edge. */
  overflow: hidden;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
`;

const Title = styled.h2`
  flex: 1;
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
`;

const HeadButton = styled(Button)`
  width: 32px;
  padding: 0;
  color: var(--color-text-muted);
`;

const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
`;

const Status = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-3);
  margin: 0;
  padding: var(--space-4) var(--inset);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

/**
 * The check takes the time's place on hover or keyboard focus. On touch screens, with no hover, it stays and
 * the row makes room for it. The hover fill is on the whole row, so it stays while the pointer is on a name.
 */
const RowWrap = styled.div`
  position: relative;

  &:hover > button:first-child {
    background: var(--color-bg-hover);
  }

  @media (hover: hover) {
    & > :last-child {
      opacity: 0;
    }
    &:hover > :last-child,
    &:focus-within > :last-child {
      opacity: 1;
    }
    &:hover time,
    &:focus-within time {
      opacity: 0;
    }
  }
  @media (hover: none) {
    & > div:nth-child(2) {
      padding-right: calc(var(--inset) + 32px);
    }
  }
`;

/** The kit's row, stretched under the content: it takes every click except the ones on a name. */
const RowButton = styled(ListRow)`
  position: absolute;
  inset: 0;
  padding: 0;

  /* Drawn inside the row: an outside ring is cut off by the list's edges and the rows around it. */
  &:focus-visible {
    box-shadow: inset 0 0 0 2px var(--color-focus);
  }
`;

/** The row's content, laid over the button. Clicks pass through to it, except on the name links. */
const RowLayout = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--inset);
  pointer-events: none;
`;

/** A name: plain until hovered or focused (owner), then underlined and darker. */
const NameLink = styled(Link)`
  pointer-events: auto;
  color: inherit;
  text-decoration: none;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);
  transition:
    color var(--duration-fast) var(--ease-out),
    text-decoration-color var(--duration-fast) var(--ease-out);

  &:hover,
  &:focus-visible {
    color: var(--color-text);
    text-decoration: underline;
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/** On the row's middle, its icon's right edge on the inset line like the close button above it. */
const DoneButton = styled(Button)`
  position: absolute;
  top: 50%;
  right: calc(var(--inset) - var(--space-2));
  width: 32px;
  padding: 0;
  color: var(--color-text-muted);
  transform: translateY(-50%);
`;

/** Not seen yet: a dot half cut off by the panel's left edge, on the row's middle. Screen readers hear "New.". */
const NewDot = styled.span`
  position: absolute;
  top: calc(50% - 4px);
  left: -4px;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
`;

/** Which page it's about: a plain outlined circle, the icon and border the same grey, no fill (owner). */
const Glyph = styled.span`
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--glyph);
  height: var(--glyph);
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-strong);
  background: transparent;
  color: var(--color-border-strong);

  /* The paper plane's weight sits low and left of its box; nudge it so it looks centred. */
  &[data-area="Outbox"] svg {
    transform: translate(0.5px, -0.5px);
  }
`;


/** Title and description as one block, so the block (not just its first line) centres on the icon. */
const Content = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

/** The same type as the sidebar's items (size, weight and colour), so the two surfaces read as one. */
const RowTitle = styled.span`
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const Body = styled.span`
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-subtle);
  overflow-wrap: anywhere;
`;

const Time = styled.time`
  flex-shrink: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-subtle);
  white-space: nowrap;
`;

/**
 * Mark as done (docs/design/motion.md: opacity first, a 4px nudge, leaving is quick):
 * 1. the check turns green for a beat, so the click lands;
 * 2. the row fades and nudges 4px left (--duration-fast, --ease-in);
 * 3. then the gap closes (--duration-slow), so the rows below slide up instead of jumping.
 * A row put back by Undo grows and fades back in. Reduced motion is handled globally.
 */
const Collapse = styled.div`
  display: grid;
  grid-template-rows: 1fr;
  transition:
    grid-template-rows var(--duration-slow) var(--ease-out),
    border-color var(--duration-fast) var(--ease-in);

  & > * {
    min-height: 0;
    overflow: hidden;
    transition:
      opacity var(--duration-fast) var(--ease-in),
      transform var(--duration-fast) var(--ease-in);
  }

  &[data-leaving] {
    grid-template-rows: 0fr;
    border-color: transparent;
    transition:
      grid-template-rows var(--duration-slow) var(--ease-out) calc(2 * var(--duration-fast)),
      border-color var(--duration-fast) var(--ease-in) var(--duration-fast);
  }
  &[data-leaving] > * {
    opacity: 0;
    transform: translateX(-4px);
    transition:
      opacity var(--duration-fast) var(--ease-in) var(--duration-fast),
      transform var(--duration-fast) var(--ease-in) var(--duration-fast);
  }
  &[data-leaving] button[aria-label^="Mark as done"] {
    color: var(--color-primary);
  }

  &[data-restored] {
    transition: grid-template-rows var(--duration-slow) var(--ease-out);
    @starting-style {
      grid-template-rows: 0fr;
    }
  }
  &[data-restored] > * {
    transition: opacity var(--duration) var(--ease-out) var(--duration-fast);
    @starting-style {
      opacity: 0;
    }
  }
`;
