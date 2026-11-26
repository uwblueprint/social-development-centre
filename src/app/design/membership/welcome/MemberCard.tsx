"use client";

import * as React from "react";
import { styled } from "next-yak";
import "@fontsource/coming-soon/400.css";

/*
 * A hand-drawn membership card for the thank-you page: the new member's name (in the intake form's
 * handwritten font), their tier and the month they joined, inside a sketchy outline in the same thin line
 * as the clouds and skyline (quiet grey in light mode, white in dark mode). Everything is seeded, so it
 * looks the same every time. A stand-in: an illustrator's card can replace the drawing, keeping the text.
 */

/** Small seeded random numbers, so the wobble is the same every time. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/** A rounded rectangle traced by hand: each side and corner nudged a little, overshooting at the end. */
function sketchRect(w: number, h: number, r: number, rand: () => number, jitter: number) {
  const j = () => (rand() - 0.5) * jitter;
  const p = (x: number, y: number) => `${(x + j()).toFixed(1)} ${(y + j()).toFixed(1)}`;
  return [
    `M ${p(r, 0)}`,
    `L ${p(w - r, 0)}`,
    `Q ${p(w, 0)}, ${p(w, r)}`,
    `L ${p(w, h - r)}`,
    `Q ${p(w, h)}, ${p(w - r, h)}`,
    `L ${p(r, h)}`,
    `Q ${p(0, h)}, ${p(0, h - r)}`,
    `L ${p(0, r)}`,
    `Q ${p(0, 0)}, ${p(r + 6, -1)}`,
  ].join(" ");
}

/** A small heart, drawn in one stroke: SDC's "community" mark on the card. */
function heartPath(x: number, y: number, s: number) {
  return `M ${x} ${y + s * 0.35}
    C ${x} ${y}, ${x - s * 0.55} ${y - s * 0.05}, ${x - s * 0.55} ${y + s * 0.3}
    C ${x - s * 0.55} ${y + s * 0.6}, ${x - s * 0.2} ${y + s * 0.8}, ${x} ${y + s}
    C ${x + s * 0.2} ${y + s * 0.8}, ${x + s * 0.55} ${y + s * 0.6}, ${x + s * 0.55} ${y + s * 0.3}
    C ${x + s * 0.55} ${y - s * 0.05}, ${x} ${y}, ${x} ${y + s * 0.35}`;
}

const W = 320;
const H = 200;

/*
 * The card grows with its writing (a long name wraps instead of being cut off): it's at least credit-card
 * shaped, and the hand-drawn outline stretches to whatever size the writing needs, with its line weight
 * unchanged.
 */
const Card = styled.figure`
  position: relative;
  display: flex;
  margin: 0;
  width: 100%;
  max-width: 320px;
  /* Measured, so the writing can ask for at least a card's height (below) and grow past it. */
  container-type: inline-size;
  /* The drawing's line colour: quiet grey, white in dark mode. */
  --card-line: var(--color-border-strong);
  color: var(--card-line);

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) & {
      --card-line: var(--taupe-50);
    }
  }
  :root[data-theme="dark"] & {
    --card-line: var(--taupe-50);
  }

  /* On the photo panel: white lines and writing in every theme, over a soft frosted deep green so the
     writing stays readable wherever the photo shows through. */
  &[data-on-photo] {
    --card-line: var(--taupe-50);
    --color-text: var(--taupe-50);
    --color-text-muted: var(--taupe-200);
    border-radius: var(--radius-lg);
    background: color-mix(in oklch, var(--sdc-950) 55%, transparent);
    backdrop-filter: blur(6px);
  }
`;

const Outline = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
`;

/* The card's writing, in the drawing. */
const Face = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  /* At least credit-card shaped (${W} by ${H}); taller when a long name wraps. */
  min-height: calc(100cqw * ${H} / ${W});
  display: flex;
  flex-direction: column;
  padding: var(--space-4) var(--space-5) var(--space-5);
  color: var(--color-text);
`;

const Top = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);

  & strong {
    font-weight: var(--weight-medium);
    color: var(--color-text);
  }
`;

/* The hand-drawn stripe under "SDC  Member", like the line across a card. */
const Stripe = styled.svg`
  display: block;
  width: 100%;
  height: 6px;
  margin-top: var(--space-2);
  overflow: visible;
  color: var(--card-line);
`;

/* A hand-drawn happy face above the name, in the drawing's line. */
const Smiley = styled.svg`
  flex: none;
  margin-top: auto;
  padding-top: var(--space-4);
  box-sizing: content-box;
  margin-bottom: var(--space-2);
  color: var(--card-line);
`;

const Name = styled.p`
  margin: 0 0 var(--space-2);
  font-family: var(--font-intake-display);
  font-size: var(--text-xl);
  line-height: var(--leading-heading);
  overflow-wrap: anywhere;
`;

const Bottom = styled.div`
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);

  & > svg {
    flex: none;
    margin-left: auto;
    color: var(--card-line);
  }
`;

const Details = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-5);
  margin: 0;
  font-size: var(--text-xs);

  & dt {
    color: var(--color-text-muted);
  }
  & dd {
    margin: 0;
    font-weight: var(--weight-medium);
  }
`;

export function MemberCard({
  name,
  tier,
  since,
  onPhoto = false,
}: {
  name: string;
  tier: string;
  since: string;
  /** Drawn on the photo panel: white, on a frosted backing. */
  onPhoto?: boolean;
}) {
  const rand = seeded(11);
  const outer = sketchRect(W, H, 16, rand, 3);
  const second = sketchRect(W, H, 16, rand, 4.5);
  const stripe = `M 0 ${3 + (rand() - 0.5) * 2} Q 50 ${2 + (rand() - 0.5) * 3}, 100 ${3.5 + (rand() - 0.5) * 2}`;
  const line = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <Card aria-label={`Membership card: ${name}, ${tier}, member since ${since}`} data-on-photo={onPhoto ? "" : undefined}>
      {/* Stretches to the card; non-scaling strokes keep the line the same weight at any size. */}
      <Outline viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false" {...line}>
        <path d={outer} strokeWidth={1.7} vectorEffect="non-scaling-stroke" />
        <path d={second} strokeWidth={0.8} opacity={0.65} vectorEffect="non-scaling-stroke" />
      </Outline>
      <Face aria-hidden="true">
        <Top>
          <strong>SDC</strong>
          <span>Member</span>
        </Top>
        <Stripe viewBox="0 0 100 6" preserveAspectRatio="none" {...line}>
          <path d={stripe} strokeWidth={1} opacity={0.6} vectorEffect="non-scaling-stroke" />
        </Stripe>
        <Smiley width={30} height={30} viewBox="0 0 32 32" {...line}>
          {/* A slightly open circle, two dots for eyes and a smile, as if drawn in one go. */}
          <path d="M 17 2.6 C 8.5 2 2.4 8.4 2.7 16.3 C 3 24 9.2 29.6 16.6 29.3 C 24.3 29 29.6 22.8 29.3 15.4 C 29 8.6 24 3.4 18.6 2.8" strokeWidth={1.7} />
          <path d="M 11.2 12.4 L 11.3 13.6" strokeWidth={2.4} />
          <path d="M 20.6 12.2 L 20.7 13.4" strokeWidth={2.4} />
          <path d="M 9.6 19 C 12 23.4 19.8 23.8 22.6 18.6" strokeWidth={1.7} />
        </Smiley>
        <Name>{name}</Name>
        <Bottom>
          <Details>
            <div>
              <dt>Tier</dt>
              <dd>{tier}</dd>
            </div>
            <div>
              <dt>Since</dt>
              <dd>{since}</dd>
            </div>
          </Details>
          <svg width={24} height={24} viewBox="-14 -2 28 28" {...line}>
            <path d={heartPath(0, 0, 22)} strokeWidth={1.5} />
          </svg>
        </Bottom>
      </Face>
    </Card>
  );
}
