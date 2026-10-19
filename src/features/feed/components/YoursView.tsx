"use client";

import * as React from "react";
import { styled } from "next-yak";
import { BookmarkCheck, CalendarDays, Check, ExternalLink, X } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Tooltip } from "@/components/ui/Tooltip";
import { KIND_CATEGORY } from "@/features/opportunities/catalog";
import { ImageMatte } from "@/features/opportunities/components/ImageMatte";
import { KindIcon } from "@/features/opportunities/components/KindIcon";
import { KindBadge } from "@/features/opportunities/components/opportunityColumns";
import { keyDate } from "@/features/opportunities/format";
import { feedCopy } from "../copy";
import { ButtonLink, NavButtonLink } from "./ButtonLink";
import { ctaLabel, whenLabel } from "../details";
import type { Availability, KnownOpportunity, YoursEntry } from "../types";
import { FeedHeader, FeedLead, FeedPage, FeedTitle } from "./FeedPage";
import { useMember } from "./MemberProvider";

const List = styled.ul`
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
`;

/*
 * A row leaves by collapsing (grid rows 1fr to 0fr) and fading, so the rows below glide up rather than jump.
 * The inner wrapper needs min-height 0 and overflow hidden for the collapse to reach zero.
 */
const Row = styled.li<{ $leaving?: boolean }>`
  display: grid;
  grid-template-rows: ${({ $leaving }) => ($leaving ? "0fr" : "1fr")};
  opacity: ${({ $leaving }) => ($leaving ? 0 : 1)};
  transition:
    grid-template-rows var(--duration-slow) var(--ease),
    opacity var(--duration) var(--ease);

  & + & {
    border-top: 1px solid var(--color-border);
  }
`;

const RowInner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  min-height: 0;
  overflow: hidden;
  padding: var(--space-4) 0;

  @media (max-width: 559px) {
    flex-wrap: wrap;
  }
`;

const Thumb = styled.div`
  position: relative;
  flex-shrink: 0;
  width: calc(var(--space-8) * 2);
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-hover);

  @media (max-width: 559px) {
    width: calc(var(--space-8) * 1.5);
  }
`;

const Placeholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-accent-subtle);
  color: var(--card-accent);
`;

const Photo = styled(ImageMatte)`
  position: absolute;
  inset: 0;
`;

const Text = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  min-width: 0;
`;

const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const TitleButton = styled.button`
  all: unset;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  overflow-wrap: anywhere;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  &:focus-visible {
    border-radius: var(--radius-sm);
    box-shadow: var(--focus-ring);
  }
`;

const Meta = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const Side = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-1);

  @media (max-width: 559px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const Skeleton = styled.div`
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4) 0;
  border-top: 1px solid var(--color-border);
`;

const Bar = styled.span<{ $width: string }>`
  display: block;
  height: var(--space-3);
  width: ${({ $width }) => $width};
  border-radius: var(--radius-sm);
  background: var(--color-surface);
`;

const SkeletonThumb = styled.span`
  flex-shrink: 0;
  width: calc(var(--space-8) * 2);
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  background: var(--color-surface);
`;

const SkeletonText = styled.span`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);
  padding-top: var(--space-1);
`;

const relative = new Intl.RelativeTimeFormat("en-CA", { numeric: "auto" });

/** "just now", "3 hours ago", "yesterday", "5 days ago". The opened time comes from this browser, so no hydration concern. */
function openedAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  return relative.format(Math.round(seconds / 86_400), "day");
}

const LEAVE_MS = 240;

function YoursRow({ item, entry, onRemove }: { item: KnownOpportunity; entry: YoursEntry; onRemove: (id: string, title: string) => void }) {
  const { showDetails } = useMember();
  const { opportunity: o, availability } = item;
  const [leaving, setLeaving] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  const category = KIND_CATEGORY[o.kind];
  const placeholder = (
    <Placeholder aria-hidden="true">
      <KindIcon kind={o.kind} size={24} />
    </Placeholder>
  );
  return (
    <Row $leaving={leaving}>
      <RowInner style={{ "--card-accent": `var(--color-category-${category})`, "--card-accent-subtle": `var(--color-category-${category}-subtle)` } as React.CSSProperties}>
        <Thumb>{o.imageUrl ? <Photo src={o.imageUrl} fallback={placeholder} loading="lazy" /> : placeholder}</Thumb>
        <Text>
          <Badges>
            <KindBadge kind={o.kind} />
            {availability !== "open" && <Badge $variant={availability === "ended" ? "neutral" : "warning"}>{feedCopy.yours.availability[availability]}</Badge>}
          </Badges>
          <TitleButton type="button" onClick={() => showDetails(o)}>
            {o.title}
          </TitleButton>
          <Meta>
            <Icon icon={CalendarDays} size={14} />
            {keyDate(o) || o.kind === "event" ? whenLabel(o) : o.organization.name}
          </Meta>
          <Meta>
            <Icon icon={Check} size={14} />
            {feedCopy.yours.openedAgo(openedAgo(entry.openedAt))}
            {" · "}
            {o.organization.name}
          </Meta>
        </Text>
        <Side>
          {availability === "open" && (
            <ButtonLink href={o.link} target="_blank" rel="noopener noreferrer" $variant="outline" $size="sm">
              {ctaLabel(o)}
              <Icon icon={ExternalLink} size={14} />
              <VisuallyHiddenText>{feedCopy.card.opensInNewTab}</VisuallyHiddenText>
            </ButtonLink>
          )}
          <Tooltip content={feedCopy.yours.removeTip}>
            <Button
              type="button"
              $variant="ghost"
              $size="sm"
              aria-label={feedCopy.yours.remove(o.title)}
              onClick={() => {
                setLeaving(true);
                timer.current = setTimeout(() => onRemove(o.id, o.title), LEAVE_MS);
              }}
            >
              <Icon icon={X} size={16} />
            </Button>
          </Tooltip>
        </Side>
      </RowInner>
    </Row>
  );
}

const VisuallyHiddenText = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/**
 * What the member opened from the feed: Upcoming (still open) and Past (ended, closed or gone). Nothing here is
 * confirmed attendance: opening a link is all we can know, because registration happens on the partner's own page.
 */
export function YoursView({ known }: { known: KnownOpportunity[] }) {
  const { entries, ready, remove } = useMember();
  const t = feedCopy.yours;
  const [tab, setTab] = React.useState<"upcoming" | "past">("upcoming");

  const { upcoming, past } = React.useMemo(() => {
    const byId = new Map(known.map((k) => [k.opportunity.id, k]));
    const rows = entries.flatMap((entry) => {
      const item = byId.get(entry.id);
      return item ? [{ item, entry }] : [];
    });
    const isUpcoming = (a: Availability) => a === "open";
    // Soonest date first; open-ended listings after the dated ones, most recently opened first.
    const upcoming = rows
      .filter((r) => isUpcoming(r.item.availability))
      .sort((a, b) => {
        const ka = keyDate(a.item.opportunity);
        const kb = keyDate(b.item.opportunity);
        if (ka && kb) return ka.localeCompare(kb);
        if (ka) return -1;
        if (kb) return 1;
        return b.entry.openedAt.localeCompare(a.entry.openedAt);
      });
    const past = rows.filter((r) => !isUpcoming(r.item.availability)).sort((a, b) => b.entry.openedAt.localeCompare(a.entry.openedAt));
    return { upcoming, past };
  }, [known, entries]);

  const renderList = (rows: typeof upcoming, empty: { title: string; body: string; action?: string }) =>
    !ready ? (
      <div role="status" aria-busy="true">
        <VisuallyHiddenText>Loading</VisuallyHiddenText>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} aria-hidden="true">
            <SkeletonThumb />
            <SkeletonText>
              <Bar $width="30%" />
              <Bar $width="60%" />
              <Bar $width="40%" />
            </SkeletonText>
          </Skeleton>
        ))}
      </div>
    ) : rows.length === 0 ? (
      <EmptyState
        icon={BookmarkCheck}
        title={empty.title}
        description={empty.body}
        action={
          empty.action && (
            <NavButtonLink href="/member/for-you">{empty.action}</NavButtonLink>
          )
        }
      />
    ) : (
      <List>
        {rows.map(({ item, entry }) => (
          <YoursRow key={entry.id} item={item} entry={entry} onRemove={remove} />
        ))}
      </List>
    );

  return (
    <FeedPage>
      <FeedHeader>
        <div>
          <FeedTitle>{t.title}</FeedTitle>
          <FeedLead>{t.lead}</FeedLead>
        </div>
      </FeedHeader>
      <Tabs value={tab} onValueChange={(v) => setTab(v as "upcoming" | "past")}>
        <TabsList aria-label={t.tabsLabel}>
          <TabsTrigger value="upcoming">
            {t.upcoming}
            {ready && <TabsCount>{upcoming.length}</TabsCount>}
          </TabsTrigger>
          <TabsTrigger value="past">
            {t.past}
            {ready && <TabsCount>{past.length}</TabsCount>}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">{renderList(upcoming, t.empty.upcoming)}</TabsContent>
        <TabsContent value="past">{renderList(past, t.empty.past)}</TabsContent>
      </Tabs>
    </FeedPage>
  );
}
