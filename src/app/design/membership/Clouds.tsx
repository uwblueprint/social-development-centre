import type { SVGProps } from "react";
import { styled } from "next-yak";

/*
 * Hand-drawn-style clouds, copied from the referral page (/design/referrals, Clouds.tsx) so the two pages
 * match: same thin line, same colour (quiet grey in light mode, white in dark mode). Here they sit across
 * the top of the welcome screen's right side. If an illustrator draws matching ones, swap them in on both.
 *
 * Each cloud is a flat base with a row of bumps, traced twice with a slight offset so the line looks
 * sketched rather than ruled. Everything is seeded, so the clouds look the same on every load.
 * Decorative: screen readers skip them.
 */

/** Small seeded random numbers, so the sketchy wobble is the same every time. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/**
 * One pass of a cloud outline: overlapping puffs of the given widths along a slightly sagging base, with a
 * little wobble. Puffs meet above the base (so they overlap like real cloud lobes), and the middle ones
 * rise highest.
 */
function cloudPath(bumps: number[], height: number, rand: () => number, jitter: number) {
  const j = () => (rand() - 0.5) * jitter;
  const width = bumps.reduce((a, b) => a + b, 0);
  const base = height;
  let x = 0;
  let d = `M ${(j() - 2).toFixed(1)} ${(base + j()).toFixed(1)}`;
  bumps.forEach((w, i) => {
    const middle = Math.sin((Math.PI * (i + 0.5)) / bumps.length);
    const rise = w * (0.62 + 0.42 * middle);
    const x2 = x + w;
    // Where this puff meets the next one: above the base, except at the two ends.
    const y2 = i === bumps.length - 1 ? base : base - w * (0.18 + 0.1 * rand());
    d += ` C ${(x - w * 0.08 + j()).toFixed(1)} ${(base - rise * 1.05 + j()).toFixed(1)}, ${(x2 + w * 0.08 + j()).toFixed(1)} ${(base - rise * 1.05 + j()).toFixed(1)}, ${(x2 + j()).toFixed(1)} ${(y2 + j()).toFixed(1)}`;
    x = x2;
  });
  // Back along the bottom, sagging a little, overshooting the start like a pen stroke.
  d += ` Q ${(width / 2 + j()).toFixed(1)} ${(base + 5 + j()).toFixed(1)}, ${(-4 + j()).toFixed(1)} ${(base + 1 + j()).toFixed(1)}`;
  return d;
}

function Cloud({ bumps, seed, ...rest }: { bumps: number[]; seed: number } & SVGProps<SVGSVGElement>) {
  const width = bumps.reduce((a, b) => a + b, 0);
  const height = Math.max(...bumps) * 1.05;
  const rand = seeded(seed);
  const pad = 8;
  return (
    <svg
      {...rest}
      viewBox={`${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2 + 6}`}
      width={width + pad * 2}
      height={height + pad * 2 + 6}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={cloudPath(bumps, height, rand, 2.6)} strokeWidth={1.7} />
      <path d={cloudPath(bumps, height, rand, 4)} strokeWidth={0.8} opacity={0.65} />
    </svg>
  );
}

/* The layer: across the top of the screen, behind the card, never in the way of clicks. */
const Layer = styled.div`
  position: absolute;
  inset: 0 0 auto;
  height: 260px;
  pointer-events: none;
  color: var(--color-border-strong);

  /* Dark mode: white, like the skyline. */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) & {
      color: var(--taupe-50);
    }
  }
  :root[data-theme="dark"] & {
    color: var(--taupe-50);
  }

  /* Phones: the card fills the width, so only the small cloud at the top right stays. */
  @media (max-width: 719px) {
    & > :not([data-keep]) {
      display: none;
    }
  }
`;

const Placed = styled(Cloud)`
  position: absolute;
`;

/*
 * The form screen's clouds stay in the empty margins either side of the form and the benefits card (each
 * cloud is under 160px wide and pinned near the window's edge). Below 1240px wide those margins get too
 * narrow to hold a cloud without touching the content, so the clouds go.
 */
const MarginLayer = styled(Layer)`
  @media (max-width: 1239px) {
    display: none;
  }
`;

/**
 * Welcome screen: two clouds near the top, one large at the left, a medium one at the right.
 * Form screen (`margins`): two smaller ones in the margins beside the content.
 */
export function Clouds({ margins = false }: { margins?: boolean }) {
  if (margins) {
    return (
      <MarginLayer aria-hidden="true">
        <Placed bumps={[24, 40, 46, 30]} seed={7} style={{ top: 120, left: 24 }} />
        <Placed bumps={[20, 32, 36, 24]} seed={31} style={{ top: 56, right: 24 }} />
      </MarginLayer>
    );
  }
  return (
    <Layer aria-hidden="true">
      <Placed bumps={[30, 46, 58, 40, 26]} seed={7} style={{ top: 48, left: "7%" }} />
      <Placed bumps={[24, 40, 46, 30]} seed={31} style={{ top: 80, right: "8%" }} data-keep="" />
    </Layer>
  );
}
