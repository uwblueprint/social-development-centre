"use client";

import { css, keyframes, styled } from "next-yak";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { KIND_CATEGORY, TOPIC_LABEL } from "@/features/opportunities/catalog";
import { ImageMatte } from "@/features/opportunities/components/ImageMatte";
import { KindIcon } from "@/features/opportunities/components/KindIcon";
import { KindBadge } from "@/features/opportunities/components/opportunityColumns";
import type { Opportunity, TopicId } from "@/features/opportunities/types";
import { feedCopy } from "../copy";
import { costLabel, whenLabel, whereLabel } from "../details";
import { daysLeft } from "../matching";
import { CtaButton } from "./CtaButton";
import { useMember } from "./MemberProvider";

const rise = keyframes`
  from { opacity: 0; transform: translateY(var(--enter-offset)); }
  to { opacity: 1; transform: translateY(0); }
`;

/*
 * A consumer card, not a table row: a big picture, the two facts that decide "is this for me" (when, where),
 * the title, who hosts it, and the button, all visible without opening anything. The title's link covers the
 * whole card (opens the details panel); the button sits above it. `--i` staggers the entrance, capped so a
 * long list never waits.
 */
const Root = styled.article<{ $feature?: boolean }>`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  animation: ${rise} var(--duration-enter) var(--ease) calc(var(--stagger) * var(--i, 0)) both;
  transition:
    border-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease),
    translate var(--duration) var(--ease);

  &:hover {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-md);
    translate: 0 -2px;
  }
  &:has(:focus-visible) {
    box-shadow: var(--focus-ring);
  }
  &:active:not(:has(a:active)) {
    translate: 0 0;
    box-shadow: var(--shadow-sm);
  }

  @media (min-width: 768px) {
    ${({ $feature }) =>
      $feature &&
      css`
        flex-direction: row;
      `}
  }
`;

const Media = styled.div<{ $feature?: boolean }>`
  position: relative;
  flex-shrink: 0;
  aspect-ratio: 16 / 9;
  min-height: 0;
  overflow: hidden;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-hover);

  @media (min-width: 768px) {
    ${({ $feature }) =>
      $feature &&
      css`
      width: 55%;
      aspect-ratio: auto;
      min-height: calc(var(--space-8) * 4.5);
      border-bottom: 0;
      border-right: 1px solid var(--color-border);
    `}
  }
`;

/* The picture zooms a touch on hover. Clipped by Media, so the card's edges never move. */
const Layer = styled.div`
  position: absolute;
  inset: 0;
  transition: transform var(--duration-enter) var(--ease);

  ${Root}:hover & {
    transform: scale(1.03);
  }
`;

const Photo = styled(ImageMatte)`
  position: absolute;
  inset: 0;
`;

/* No image, or one that fails to load: the type's colour and icon, so the feed still reads by type. */
const Placeholder = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-accent-subtle);
  color: var(--card-accent);
`;

/* Badges sit on the picture, so each gets an opaque ground; the badge's own tint would let the photo show through. */
const Overlay = styled.div`
  position: absolute;
  top: var(--space-3);
  display: flex;
  border-radius: var(--radius-sm);
  background: var(--color-bg);
`;

const Left = styled(Overlay)`
  left: var(--space-3);
`;
const Right = styled(Overlay)`
  right: var(--space-3);
`;

const Body = styled.div<{ $feature?: boolean }>`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
  padding: var(--space-4);

  @media (min-width: 768px) {
    ${({ $feature }) =>
      $feature &&
      css`
        justify-content: center;
        gap: var(--space-3);
        padding: var(--space-6);
      `}
  }
`;

/* The feed's one accent: what makes the top pick the top pick. */
const Eyebrow = styled.p`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-accent);
`;

const Meta = styled.p`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  margin: 0;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;

  & > svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const Title = styled.h3<{ $feature?: boolean }>`
  margin: 0;
  font-size: var(--text-md);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  overflow-wrap: anywhere;

  @media (min-width: 768px) {
    ${({ $feature }) =>
      $feature &&
      css`
        font-size: var(--text-xl);
        letter-spacing: var(--tracking-tight);
      `}
  }
`;

/* The title is the card's link: its ::after stretches over the whole card. */
const TitleButton = styled.button`
  all: unset;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  cursor: pointer;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
  }
  &:focus-visible {
    outline: none;
  }
`;

const Org = styled.p`
  margin: 0;
  overflow: hidden;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Summary = styled.p`
  display: none;
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--text-md);
  line-height: var(--leading-body);

  @media (min-width: 768px) {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
  }
`;

const Because = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  min-width: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);

  & > span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  & > svg {
    flex-shrink: 0;
  }
`;

const Actions = styled.div<{ $feature?: boolean }>`
  position: relative;
  z-index: var(--z-raised);
  display: flex;
  margin-top: auto;
  padding-top: var(--space-2);

  @media (min-width: 768px) {
    ${({ $feature }) =>
      $feature &&
      css`
        margin-top: var(--space-2);

        & > a {
          width: auto;
        }
      `}
  }
`;

function closesLabel(days: number | undefined): string | undefined {
  if (days === undefined || days < 0 || days > 7) return undefined;
  return days === 0 ? feedCopy.card.closesToday : days === 1 ? feedCopy.card.closesTomorrow : feedCopy.card.closesIn(days);
}

export function FeedCard({
  opportunity: o,
  because,
  feature = false,
  index = 0,
}: {
  opportunity: Opportunity;
  /** The first of the member's interests this opportunity matches; shows "Because you like …". */
  because?: TopicId;
  /** The large top-pick layout (side by side from tablet up). */
  feature?: boolean;
  /** Position in its list, for the staggered entrance. */
  index?: number;
}) {
  const { showDetails, now } = useMember();
  const category = KIND_CATEGORY[o.kind];
  const closes = closesLabel(daysLeft(o, now));
  const where = whereLabel(o);
  const cost = costLabel(o);
  const placeholder = (
    <Placeholder aria-hidden="true">
      <KindIcon kind={o.kind} size={feature ? 48 : 32} />
    </Placeholder>
  );
  return (
    <Root
      $feature={feature}
      style={
        {
          "--i": Math.min(index, 8),
          "--card-accent": `var(--color-category-${category})`,
          "--card-accent-subtle": `var(--color-category-${category}-subtle)`,
        } as React.CSSProperties
      }
    >
      <Media $feature={feature}>
        <Layer>{o.imageUrl ? <Photo src={o.imageUrl} fallback={placeholder} loading="lazy" /> : placeholder}</Layer>
        <Left>
          <KindBadge kind={o.kind} />
        </Left>
        {closes && (
          <Right>
            <Badge $variant="warning">{closes}</Badge>
          </Right>
        )}
      </Media>
      <Body $feature={feature}>
        {feature && (
          <Eyebrow>
            <Icon icon={Sparkles} size={16} />
            {feedCopy.forYou.topPick}
          </Eyebrow>
        )}
        <Meta>
          <Icon icon={CalendarDays} size={14} />
          <span>{whenLabel(o)}</span>
        </Meta>
        {(where || cost) && (
          <Meta>
            <Icon icon={MapPin} size={14} />
            <span>{[where, cost].filter(Boolean).join(" · ")}</span>
          </Meta>
        )}
        <Title $feature={feature}>
          <TitleButton type="button" aria-label={feedCopy.card.details(o.title)} onClick={() => showDetails(o)}>
            {o.title || feedCopy.card.untitled}
          </TitleButton>
        </Title>
        <Org>{o.organization.name}</Org>
        {feature && <Summary>{o.summary}</Summary>}
        {because && (
          <Because>
            <Icon icon={Sparkles} size={14} />
            <span>{feedCopy.card.because(TOPIC_LABEL[because])}</span>
          </Because>
        )}
        <Actions $feature={feature}>
          <CtaButton opportunity={o} block size={feature ? "lg" : "md"} />
        </Actions>
      </Body>
    </Root>
  );
}
