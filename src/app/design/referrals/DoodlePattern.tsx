"use client";

import * as React from "react";
import { styled } from "next-yak";
import { useDialKit } from "dialkit";

/*
 * A tiled pattern of small hand-drawn doodles about what SDC members do, for the referral page's banner,
 * under the green gradient (in place of the photo). Copied from the join page
 * (src/app/design/membership/DoodlePattern.tsx, on justin/membership-design) with its tuned defaults, so the
 * two pages match; keep them in step until one of them merges. Same thin rounded line as the clouds, skyline and
 * membership card, in pale white so the gradient tints it; the gradient's deep green at the bottom fades it
 * out behind the heading. Decorative: screen readers skip it.
 *
 * The doodles (23, each drawn in a 36 by 36 box): a home and a key (housing), a heart, two neighbours, a
 * raised hand and a ballot box (having a say, voting for the board), a megaphone (campaigns), a speech
 * bubble, a leaf, a tree, a sun, a sprout and a flower (climate, growing together), a bus and a bike
 * (getting around), a book (learning), an apple (food), a cup (meeting up), a calendar (events), a map
 * pin (local), an envelope, a star and an umbrella (looking out for each other).
 *
 * Tune it live with the "Doodle pattern" DialKit panel (in SplitLayout's DialKit panel, dev only): opacity, density (how
 * many doodles), doodle size, size mix (how much sizes vary), spacing, line weight, tilt (the most a doodle
 * leans, in degrees), the angle of the whole pattern, and shuffle (a different arrangement). Copy the
 * panel's values and paste them in as the defaults below to keep them.
 */

const DOODLES: Record<string, React.ReactNode> = {
  home: (
    <>
      <path d="M2 18 L18 4.5 L34 18" />
      <path d="M6.5 15.5 V33.5 H29.5 V15.5" />
      <path d="M15 33.5 V25 H21 V33.5" />
    </>
  ),
  heart: <path d="M18 31 C 8 23, 3.5 17, 5.5 11 C 7.5 5.5, 14.5 5, 18 11 C 21.5 5, 28.5 5.5, 30.5 11 C 32.5 17, 28 23, 18 31 Z" />,
  neighbours: (
    <>
      <circle cx="12" cy="10" r="5" />
      <circle cx="25.5" cy="12.5" r="4" />
      <path d="M3 33 C 3 22.5, 21 22.5, 21 33" />
      <path d="M18.5 33 C 18.5 25, 33 25, 33 33" />
    </>
  ),
  ballot: (
    <>
      <path d="M4 18 H32 V34 H4 Z" />
      <path d="M13 18 V5 H23 V18" />
      <path d="M15.5 11.5 L17.5 13.5 L21 9" />
      <path d="M10 18 H26" />
    </>
  ),
  megaphone: (
    <>
      <path d="M4 15 V23 H10 L26 31 V7 L10 15 Z" />
      <path d="M10 23 L12 31 H16 L14.5 24.5" />
      <path d="M30 13 L33 11" />
      <path d="M31 19 H34.5" />
      <path d="M30 25 L33 27" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 31 C 5 15, 15 6, 32 4 C 30 21, 21 31, 5 31 Z" />
      <path d="M5 31 L 23 13" />
    </>
  ),
  bubble: (
    <>
      <path d="M4 6 H32 V24 H16 L9.5 31 V24 H4 Z" />
      <circle cx="12" cy="15" r="1.4" />
      <circle cx="18" cy="15" r="1.4" />
      <circle cx="24" cy="15" r="1.4" />
    </>
  ),
  sun: (
    <>
      <circle cx="18" cy="18" r="6.5" />
      <path d="M18 3 V7 M18 29 V33 M3 18 H7 M29 18 H33 M7.5 7.5 L10.3 10.3 M25.7 25.7 L28.5 28.5 M7.5 28.5 L10.3 25.7 M25.7 10.3 L28.5 7.5" />
    </>
  ),
  sprout: (
    <>
      <path d="M18 34 V19" />
      <path d="M18 23 C 10 23, 6 17, 6 10.5 C 13 10.5, 18 15, 18 23" />
      <path d="M18 19 C 18 12, 23 7, 30 7 C 30 14, 25 19, 18 19" />
    </>
  ),
  tree: (
    <>
      <path d="M18 26 C 8 26, 5 18, 9 13 C 8 7, 14 3, 19 5 C 24 2, 31 7, 29 13 C 33 18, 28 26, 18 26 Z" />
      <path d="M18 26 V34" />
      <path d="M18 30 L22 27" />
    </>
  ),
  book: (
    <>
      <path d="M18 9 C 13 6, 7 6, 3 8 V30 C 7 28, 13 28, 18 31 C 23 28, 29 28, 33 30 V8 C 29 6, 23 6, 18 9 Z" />
      <path d="M18 9 V31" />
    </>
  ),
  bus: (
    <>
      <path d="M6 5 H30 C 31.5 5, 32 6, 32 7.5 V27 H4 V7.5 C 4 6, 4.5 5, 6 5 Z" />
      <path d="M7.5 9 H28.5 V17 H7.5 Z" />
      <path d="M8 22 H10 M26 22 H28" />
      <circle cx="11" cy="30" r="2.5" />
      <circle cx="25" cy="30" r="2.5" />
    </>
  ),
  bike: (
    <>
      <circle cx="8.5" cy="25" r="6.5" />
      <circle cx="27.5" cy="25" r="6.5" />
      <path d="M8.5 25 L14.5 14 H24 L27.5 25 M14.5 14 L19 25 H8.5 M22 10 H26 M12.5 11 H17" />
    </>
  ),
  pin: (
    <>
      <path d="M18 33 C 18 33, 7 21, 7 14 C 7 8, 12 3, 18 3 C 24 3, 29 8, 29 14 C 29 21, 18 33, 18 33 Z" />
      <circle cx="18" cy="14" r="4" />
    </>
  ),
  key: (
    <>
      <circle cx="10" cy="18" r="6" />
      <path d="M16 18 H33 M28 18 V23 M32.5 18 V22" />
    </>
  ),
  cup: (
    <>
      <path d="M6 13 H26 V24 C 26 29, 22 32, 16 32 C 10 32, 6 29, 6 24 Z" />
      <path d="M26 16 H29 C 32 16, 32 23, 29 23 H26" />
      <path d="M12 4 C 10 6, 14 7, 12 9.5 M19 4 C 17 6, 21 7, 19 9.5" />
    </>
  ),
  apple: (
    <>
      <path d="M18 11 C 13 7, 5 9, 5 18 C 5 26, 11 33, 15 32 C 17 31, 19 31, 21 32 C 25 33, 31 26, 31 18 C 31 9, 23 7, 18 11 Z" />
      <path d="M18 11 C 18 7, 19 5, 21 3" />
      <path d="M19.5 8 C 21 4.5, 25.5 4, 27 6 C 25 9, 21.5 9, 19.5 8" />
    </>
  ),
  hand: (
    <path d="M11 34 V21 L7 16 C 5.5 14, 8 12, 9.5 13.5 L12 16.5 V7 C 12 5, 15 5, 15 7 V15 V4.5 C 15 2.5, 18 2.5, 18 4.5 V15 V5.5 C 18 3.5, 21 3.5, 21 5.5 V15 V8.5 C 21 6.5, 24 6.5, 24 8.5 V22 C 24 28, 22.5 31, 21 34" />
  ),
  calendar: (
    <>
      <path d="M5 8 H31 V32 H5 Z M5 14 H31 M11 4 V10 M25 4 V10" />
      <circle cx="12" cy="20.5" r="1.3" />
      <circle cx="18" cy="20.5" r="1.3" />
      <circle cx="24" cy="20.5" r="1.3" />
      <circle cx="12" cy="26.5" r="1.3" />
    </>
  ),
  star: <path d="M18 3 L22 13 L33 13.5 L24.5 20.5 L27.5 31.5 L18 25 L8.5 31.5 L11.5 20.5 L3 13.5 L14 13 Z" />,
  flower: (
    <>
      <circle cx="18" cy="13" r="3" />
      <circle cx="18" cy="6.5" r="3.5" />
      <circle cx="24.2" cy="11" r="3.5" />
      <circle cx="21.8" cy="18.3" r="3.5" />
      <circle cx="14.2" cy="18.3" r="3.5" />
      <circle cx="11.8" cy="11" r="3.5" />
      <path d="M18 22 V34" />
      <path d="M18 29 C 14 29, 11 27, 10 24 C 14 24, 17 26, 18 29" />
    </>
  ),
  envelope: <path d="M4 9 H32 V28 H4 Z M4 9 L18 20 L32 9" />,
  umbrella: (
    <path d="M3 18 C 3 9, 10 4, 18 4 C 26 4, 33 9, 33 18 C 30 15.5, 27 15.5, 25.5 18 C 23.5 15.5, 20 15.5, 18 18 C 16 15.5, 12.5 15.5, 10.5 18 C 9 15.5, 6 15.5, 3 18 Z M18 18 V30 C 18 33, 13.5 33, 13.5 30" />
  ),
};

/** Small seeded random numbers, so a given shuffle always gives the same pattern. */
function seeded(seed: number) {
  let n = seed * 9301 + 49297;
  return () => {
    n = (n * 16807) % 2147483647;
    return n / 2147483647;
  };
}

const NAMES = Object.keys(DOODLES);

/**
 * Where `count` doodles sit in one square tile of side `tile`: evenly spaced, but not in rows. Each new
 * doodle tries 30 random spots and takes the one farthest from the doodles already placed (Mitchell's
 * best-candidate), then they all push apart until the gaps are about equal. Distances are measured across
 * the tile's edges as if it wraps, so the spacing stays even where the pattern repeats too. Each gets a doodle from the set in shuffled order (so neighbours
 * differ), a random tilt and a slightly different size. `seed` picks the arrangement.
 */
function placements(count: number, tile: number, seed: number) {
  const rand = seeded(seed);
  const order = [...NAMES].sort(() => rand() - 0.5);
  const points: { x: number; y: number }[] = [];
  // The shortest distance between two spots on a tile that repeats in both directions.
  const gap = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const dx = Math.min(Math.abs(a.x - b.x), tile - Math.abs(a.x - b.x));
    const dy = Math.min(Math.abs(a.y - b.y), tile - Math.abs(a.y - b.y));
    return Math.hypot(dx, dy);
  };
  for (let i = 0; i < count; i++) {
    let best = { x: rand() * tile, y: rand() * tile };
    let bestGap = -1;
    for (let k = 0; k < 30 && points.length; k++) {
      const c = { x: rand() * tile, y: rand() * tile };
      const g = Math.min(...points.map((p) => gap(p, c)));
      if (g > bestGap) {
        best = c;
        bestGap = g;
      }
    }
    points.push(best);
  }
  // Even out the spacing: every doodle closer than the ideal gap to a neighbour is nudged away from it, a
  // little at a time, until the gaps are close to equal. They settle into an even but irregular spread
  // (like seeds or dots on a ladybird), not rows.
  const ideal = tile / Math.sqrt(count);
  const wrap = (v: number) => ((v % tile) + tile) % tile;
  for (let round = 0; round < 60; round++) {
    const moves = points.map(() => ({ x: 0, y: 0 }));
    for (let a = 0; a < points.length; a++) {
      for (let b = a + 1; b < points.length; b++) {
        let dx = points[a].x - points[b].x;
        let dy = points[a].y - points[b].y;
        if (Math.abs(dx) > tile / 2) dx -= Math.sign(dx) * tile;
        if (Math.abs(dy) > tile / 2) dy -= Math.sign(dy) * tile;
        const dist = Math.hypot(dx, dy) || 0.01;
        if (dist >= ideal) continue;
        const push = ((ideal - dist) / dist) * 0.25;
        moves[a].x += dx * push;
        moves[a].y += dy * push;
        moves[b].x -= dx * push;
        moves[b].y -= dy * push;
      }
    }
    points.forEach((p, i) => {
      p.x = wrap(p.x + moves[i].x);
      p.y = wrap(p.y + moves[i].y);
    });
  }
  return points.map((p, i) => ({
    name: order[i % order.length],
    x: p.x,
    y: p.y,
    tilt: (rand() - 0.5) * 2, // -1 to 1, times the Tilt dial's degrees
    grow: rand() - 0.5, // -0.5 to 0.5, times the Size mix dial
  }));
}

/* Each doodle is drawn again one tile over in each direction, so one that crosses the tile's edge
   continues on the far side instead of being cut off where the pattern repeats. */
const WRAPS = [
  [0, 0],
  [-1, 0],
  [0, -1],
  [-1, -1],
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
  [-1, 1],
] as const;

const Layer = styled.svg`
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  color: var(--taupe-50);
  pointer-events: none;
`;

export function DoodlePattern() {
  const id = `sdc-doodles-${React.useId().replace(/:/g, "")}`;
  const d = useDialKit("Doodle pattern", {
    opacity: [0.4, 0, 1, 0.01],
    density: [42, 2, 60, 1],
    size: [1, 0.5, 2.5, 0.05],
    sizeMix: [1, 0, 1, 0.05],
    spacing: [340, 200, 900, 4],
    lineWeight: [0.8, 0.5, 3.5, 0.1],
    tilt: [3, 0, 60, 1],
    angle: [-15, -45, 45, 1],
    shuffle: [1, 1, 50, 1],
  });
  // Density is how many doodles share one tile; spacing is the tile's size, so together they set how close
  // the doodles sit. Size mix varies each doodle's size around Size. Tilt is the most a doodle leans, in
  // degrees. Shuffle picks a different (repeatable) arrangement. Line weight stays the same on screen
  // whatever a doodle's size.
  const places = React.useMemo(() => placements(d.density, d.spacing, d.shuffle), [d.density, d.spacing, d.shuffle]);
  const half = 18;
  return (
    <>
      <Layer aria-hidden="true" focusable="false" style={{ opacity: d.opacity }}>
        <defs>
          <pattern
            id={id}
            width={d.spacing}
            height={d.spacing}
            patternUnits="userSpaceOnUse"
            patternTransform={`rotate(${d.angle})`}
          >
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              {places.map(({ name, x, y, tilt, grow }, i) => {
                const scale = d.size * (1 + grow * d.sizeMix);
                // Centred on its spot, so wrapped copies line up exactly.
                const at = (dx: number, dy: number) =>
                  `translate(${x + dx * d.spacing - half * scale} ${y + dy * d.spacing - half * scale}) scale(${scale}) rotate(${tilt * d.tilt} ${half} ${half})`;
                return WRAPS.map(([dx, dy]) => (
                  <g key={`${i}-${dx}-${dy}`} transform={at(dx, dy)} strokeWidth={d.lineWeight / scale}>
                    {DOODLES[name]}
                  </g>
                ));
              })}
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
      </Layer>
    </>
  );
}
