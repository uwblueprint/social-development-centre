"use client";

import * as React from "react";
import { styled } from "next-yak";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { feedCopy } from "../copy";
import { NavButtonLink } from "./ButtonLink";

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const Header = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3);
`;

const Heading = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0;
  font-size: var(--text-lg);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
`;

const Lead = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Controls = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-1);
`;

/* Arrows are for mouse users; touch and trackpads swipe, so they hide where hover isn't available. */
const Arrows = styled.div`
  display: flex;
  gap: var(--space-1);

  @media (hover: none) {
    display: none;
  }
`;

/*
 * The row bleeds to the screen edge on phones and snaps card by card, with the next card peeking in as a hint
 * that it scrolls. Vertical padding leaves room for a card's hover lift and shadow, which the scroller would clip.
 */
const Scroller = styled.ul`
  display: flex;
  gap: var(--space-4);
  margin: calc(var(--space-2) * -1) calc(var(--gutter) * -1);
  padding: var(--space-2) var(--gutter) var(--space-4);
  list-style: none;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scroll-padding: 0 var(--gutter);
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Item = styled.li`
  flex: 0 0 auto;
  width: min(calc(var(--space-8) * 4.5), calc(100vw - var(--space-8)));
  scroll-snap-align: start;
`;

/** A titled, horizontally scrolling row of cards. Children are the cards; each is wrapped in a snap item. */
export function Rail({
  title,
  lead,
  seeAll,
  children,
}: {
  title: string;
  lead?: string;
  /** Where "See all" goes, with the accessible name that says what it shows all of. */
  seeAll?: { href: string; label: string };
  children: React.ReactNode[];
}) {
  const scroller = React.useRef<HTMLUListElement>(null);
  const [edges, setEdges] = React.useState({ start: true, end: false });
  const headingId = React.useId();

  React.useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const start = el.scrollLeft <= 1;
        const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
        setEdges((e) => (e.start === start && e.end === end ? e : { start, end }));
      });
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", measure);
      resize.disconnect();
    };
  }, []);

  function scrollBy(direction: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <Section aria-labelledby={headingId}>
      <Header>
        <Heading>
          <Title id={headingId}>{title}</Title>
          {lead && <Lead>{lead}</Lead>}
        </Heading>
        <Controls>
          {seeAll && (
            <NavButtonLink href={seeAll.href} $variant="ghost" $size="sm" aria-label={seeAll.label}>
              {feedCopy.forYou.seeAll}
            </NavButtonLink>
          )}
          <Arrows>
            <Button type="button" $variant="outline" $size="sm" aria-label={feedCopy.forYou.rail.previous} style={{ visibility: edges.start ? "hidden" : "visible" }} onClick={() => scrollBy(-1)}>
              <Icon icon={ChevronLeft} size={16} />
            </Button>
            <Button type="button" $variant="outline" $size="sm" aria-label={feedCopy.forYou.rail.next} style={{ visibility: edges.end ? "hidden" : "visible" }} onClick={() => scrollBy(1)}>
              <Icon icon={ChevronRight} size={16} />
            </Button>
          </Arrows>
        </Controls>
      </Header>
      <Scroller ref={scroller}>
        {children.map((child, i) => (
          <Item key={i}>{child}</Item>
        ))}
      </Scroller>
    </Section>
  );
}
