"use client";

import * as React from "react";
import { styled } from "next-yak";
import { useDialKit } from "dialkit";

/*
 * The photo overlay from the referral page's banner (/design/referrals, FigmaShade with its banner
 * settings), so both pages read as one: teal fading to deep green at 188.5°, from fully clear at 7.5% to
 * fully deep green at the bottom, over the whole panel.
 *
 * The stops are plain colours computed from the green tokens at runtime: browsers fade a transparent stop
 * through black and lose the teal, and Chromium fails to paint the photo under a gradient built from
 * nested color-mix(). Same approach as the referral page.
 */

/*
 * Tune it live with the "Panel gradient" DialKit panel (bottom right, dev only; the panel itself comes
 * from DoodlePattern's DialRoot): angle, where the fade starts and ends (% of the panel), and how dark
 * the deep green gets (darkness, 0 to 1). The defaults are Justin's tuned values (Nov 25). Copy the panel's values
 * and paste them in as the defaults to keep them.
 */

const Shade = styled.div`
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
`;

type Rgb = [number, number, number];

/** A token's colour, read from the page (tokens.ts defines the green scale as hex values). */
function tokenRgb(name: string): Rgb {
  const hex = getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("#", "");
  const n = parseInt(hex.length === 3 ? [...hex].map((c) => c + c).join("") : hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as Rgb;
const colour = ([r, g, b]: Rgb, alpha: number) =>
  `color(srgb ${(r / 255).toFixed(4)} ${(g / 255).toFixed(4)} ${(b / 255).toFixed(4)} / ${alpha.toFixed(3)})`;

/** Teal (34% from --sdc-500 to --sdc-600) to deep green (16% from --sdc-950 to --sdc-900), as on the referral page. */
function gradient(angle: number, fadeStart: number, fadeEnd: number, darkness: number) {
  const teal = mix(tokenRgb("--sdc-500"), tokenRgb("--sdc-600"), 0.34);
  const deep = mix(tokenRgb("--sdc-950"), tokenRgb("--sdc-900"), 0.16);
  const stops = [0, 0.25, 0.5, 0.75, 1].map(
    (t) => `${colour(mix(teal, deep, t), t * darkness)} ${fadeStart + (fadeEnd - fadeStart) * t}%`,
  );
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

export function PhotoShade() {
  const ref = React.useRef<HTMLDivElement>(null);
  const g = useDialKit("Panel gradient", {
    angle: [188.5, 90, 270, 0.5],
    fadeStart: [7.5, 0, 90, 0.5],
    fadeEnd: [100, 10, 100, 0.5],
    darkness: [1, 0, 1, 0.01],
  });
  // Needs the tokens' resolved colours, so it's applied once the page has them, and again as a dial moves.
  React.useEffect(() => {
    if (ref.current) ref.current.style.backgroundImage = gradient(g.angle, g.fadeStart, g.fadeEnd, g.darkness);
  }, [g.angle, g.fadeStart, g.fadeEnd, g.darkness]);
  return <Shade aria-hidden="true" ref={ref} />;
}
