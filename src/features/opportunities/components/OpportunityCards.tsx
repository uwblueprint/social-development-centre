"use client";

import { styled } from "next-yak";
import { KIND_CATEGORY } from "../catalog";
import { copy } from "../copy";
import { closesOn } from "../format";
import type { Opportunity } from "../types";
import { ImageMatte } from "./ImageMatte";
import { KindIcon } from "./KindIcon";
import { formatLastChange, KindBadge } from "./opportunityColumns";

/*
 * The partner portal's Published and Drafts tabs: cards led by the listing's image, with only
 * what matters at a glance: type, title, when it closes, and one status line. Closed stays a table.
 */
const Grid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(calc(var(--space-8) * 4), 1fr));
  gap: var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
`;

/* The whole card opens the listing's panel. */
const CardButton = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  cursor: pointer;
  transition:
    border-color var(--duration) var(--ease),
    translate var(--duration) var(--ease);

  &:hover {
    border-color: var(--color-border-strong);
    translate: 0 -1px;
  }
  &:focus-visible {
    box-shadow: var(--focus-ring);
  }
`;

/*
 * Always exactly 16:9 whatever the image's shape. The image sits inside a 4px taupe matte
 * (--color-bg-hover is taupe-100) and is fitted whole, so tall or square pictures get taupe bars too.
 */
const Media = styled.div`
  position: relative;
  aspect-ratio: 16 / 9;
  min-height: 0;
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-hover);
`;

/* Fills Media; ImageMatte draws the 16:9 taupe matte and the image's 4px corners. */
const Photo = styled(ImageMatte)`
  position: absolute;
  inset: 0;
`;

/* No image yet: the type's colour and icon, so the grid still reads by type. */
const Placeholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--card-accent-subtle);
  color: var(--card-accent);
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4) var(--space-4);
`;

const Title = styled.h3`
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  overflow-wrap: anywhere;
`;

const Meta = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const Status = styled(Meta)`
  margin-top: auto;
  padding-top: var(--space-1);
`;

const count = new Intl.NumberFormat("en-CA");

export function OpportunityCards({
  items,
  tab,
  now,
  onOpen,
  label,
}: {
  items: Opportunity[];
  tab: "published" | "drafts";
  /** The server's render time (ISO), for hydration-safe relative times. */
  now: string;
  onOpen: (id: string) => void;
  label: string;
}) {
  return (
    <Grid aria-label={label}>
      {items.map((o) => {
        const { date, time } = closesOn(o);
        const category = KIND_CATEGORY[o.kind];
        // No image, or one that fails to load: the type's colour and icon.
        const placeholder = (
          <Placeholder aria-hidden="true">
            <KindIcon kind={o.kind} size={32} />
          </Placeholder>
        );
        return (
          <li key={o.id}>
            <CardButton
              type="button"
              onClick={() => onOpen(o.id)}
              style={
                {
                  "--card-accent": `var(--color-category-${category})`,
                  "--card-accent-subtle": `var(--color-category-${category}-subtle)`,
                } as React.CSSProperties
              }
            >
              <Media>
                {o.imageUrl ? (
                  <Photo src={o.imageUrl} fallback={placeholder} />
                ) : (
                  placeholder
                )}
              </Media>
              <Body>
                <KindBadge kind={o.kind} />
                <Title>{o.title || copy.cards.untitled}</Title>
                <Meta>{date ? copy.cards.closes(time ? `${date} · ${time}` : date) : copy.table.noCloseDate}</Meta>
                <Status>
                  {tab === "drafts"
                    ? formatLastChange(o, now)
                    : o.performance
                      ? copy.cards.reach(count.format(o.performance.sentTo), count.format(o.performance.clicks))
                      : copy.table.notSent}
                </Status>
              </Body>
            </CardButton>
          </li>
        );
      })}
    </Grid>
  );
}
