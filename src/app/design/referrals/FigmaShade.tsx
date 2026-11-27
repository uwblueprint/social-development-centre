"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { styled } from "next-yak";
import { useDialKit } from "dialkit";

/*
 * The Figma panel's gradient (SDC Working File, node 893:15) plus an optional hexagon band, with live
 * DialKit controls for tuning the fade-out (dev only; the panel is hidden in production builds).
 * Every default equals the Figma settings, so the panel looks exactly like the file until a dial moves.
 * Use the panel's Copy button to export tuned values, then paste them back in as the defaults here.
 *
 * Figma: 188.64°, teal at 0% opacity at 17.726%, to deep green at 100% at 95.963%, on a rectangle
 * covering the photo from 314px of 861px (36.47%) down.
 */

/*
 * The gradient. Its two colours are mixed from the green scale to match Figma's. Browsers fade a
 * transparent stop as transparent black, which loses the teal; Figma keeps the teal tint through the
 * fade, so the in-between stops carry the colour and opacity Figma blends. The stops are plain colours
 * computed from the tokens at runtime (figmaGradient): Chromium fails to paint the photo under a gradient
 * built from nested color-mix(), calc(var()) or relative colours.
 */
const Shade = styled.div`
  position: absolute;
  inset: calc(var(--g-top) * 1%) 0 0;
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
const css = ([r, g, b]: Rgb, alpha: number) =>
  `color(srgb ${(r / 255).toFixed(4)} ${(g / 255).toFixed(4)} ${(b / 255).toFixed(4)} / ${alpha.toFixed(3)})`;

/**
 * Figma's two colours, from the green scale: teal is 34% of the way from --sdc-500 to --sdc-600,
 * deep green 16% of the way from --sdc-950 to --sdc-900.
 */
function figmaColours() {
  return {
    teal: mix(tokenRgb("--sdc-500"), tokenRgb("--sdc-600"), 0.34),
    deep: mix(tokenRgb("--sdc-950"), tokenRgb("--sdc-900"), 0.16),
  };
}

/** Plain colour stops (teal to deep green, opacity 0 to `darkness`), blended the way Figma blends. */
function figmaGradient(angle: number, start: number, end: number, darkness: number) {
  const { teal, deep } = figmaColours();
  const steps = [0, 0.25, 0.5, 0.75, 1];
  const stops = steps.map((t) => `${css(mix(teal, deep, t), t * darkness)} ${start + (end - start) * t}%`);
  return `linear-gradient(${angle}deg, ${stops.join(", ")})`;
}

/* Hexagons in deep green over the gradient's area, shown only in a band along the same angle. */
const Hexes = styled.svg`
  --figma-deep: color-mix(in srgb, var(--sdc-950) 84%, var(--sdc-900));
  position: absolute;
  top: calc(var(--g-top) * 1%);
  left: 0;
  z-index: -1;
  width: 100%;
  height: calc(100% - var(--g-top) * 1%);
  pointer-events: none;
  color: var(--figma-deep);
  opacity: var(--h-opacity);
  /* The band's mask is set inline from the dials: Chromium doesn't paint a mask built from calc(var()). */
`;

/** Pointy-top hexagon of radius r, drawn around its centre. */
function hexPath(r: number) {
  const w = (r * Math.sqrt(3)) / 2;
  return `M0 ${-r} L${w} ${-r / 2} L${w} ${r / 2} L0 ${r} L${-w} ${r / 2} L${-w} ${-r / 2} Z`;
}

function HexField({ size, gap, mask }: { size: number; gap: number; mask: string }) {
  const width = size * Math.sqrt(3) + gap; // one hexagon plus the gap
  const row = size * 1.5 + gap * 0.866; // rows interlock, offset by half a hexagon
  const d = hexPath(size);
  return (
    <Hexes aria-hidden="true" focusable="false" style={{ maskImage: mask }}>
      <defs>
        <pattern id="sdc-figma-hexes" width={width} height={row * 2} patternUnits="userSpaceOnUse">
          <path d={d} transform={`translate(${width / 2} ${size})`} fill="currentColor" />
          <path d={d} transform={`translate(0 ${size + row})`} fill="currentColor" />
          <path d={d} transform={`translate(${width} ${size + row})`} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sdc-figma-hexes)" />
    </Hexes>
  );
}

/**
 * Starting values. The side panel uses Figma's exactly. The banner is much shorter, so its shade covers
 * the whole banner and fades in sooner, keeping the heading readable; same angle and colours.
 */
const DEFAULTS = {
  split: { top: 36.47, fadeStart: 17.726, fadeEnd: 95.963 },
  // The join page's tuned gradient (src/app/design/membership/PhotoShade.tsx), so the two pages match.
  banner: { top: 0, fadeStart: 7.5, fadeEnd: 100 },
};

export function FigmaShade({ layout = "split" }: { layout?: "split" | "banner" }) {
  const d = DEFAULTS[layout];
  const p = useDialKit(layout === "banner" ? "Photo banner" : "Photo panel", {
    gradient: {
      angle: [layout === "banner" ? 188.5 : 188.64, 150, 230, 0.5],
      top: [d.top, 0, 80, 0.5],
      fadeStart: [d.fadeStart, 0, 90, 0.5],
      fadeEnd: [d.fadeEnd, 10, 100, 0.5],
      darkness: [1, 0.2, 1, 0.01],
    },
    hexagons: {
      show: false,
      size: [10, 4, 30, 1],
      gap: [4, 0, 16, 1],
      opacity: [1, 0, 1, 0.01],
      bandStart: [10, 0, 100, 0.5],
      bandPeak: [35, 0, 100, 0.5],
      bandEnd: [70, 0, 100, 0.5],
    },
  });

  // The gradient needs the tokens' resolved colours, so it's applied once the page has them.
  const shadeRef = useRef<HTMLDivElement>(null);
  const { angle, fadeStart, fadeEnd, darkness } = p.gradient;
  useEffect(() => {
    if (shadeRef.current) {
      shadeRef.current.style.backgroundImage = figmaGradient(angle, fadeStart, fadeEnd, darkness);
    }
  }, [angle, fadeStart, fadeEnd, darkness]);

  const vars = {
    "--g-top": p.gradient.top,
    "--h-opacity": p.hexagons.opacity,
  } as CSSProperties;

  return (
    // display: contents, so the wrapper never takes a place in the banner's layout (only its absolutely
    // positioned layers show).
    <div style={{ ...vars, display: "contents" }}>
      <Shade aria-hidden="true" ref={shadeRef} />
      {p.hexagons.show && (
        <HexField
          size={p.hexagons.size}
          gap={p.hexagons.gap}
          mask={`linear-gradient(${p.gradient.angle}deg, transparent ${p.hexagons.bandStart}%, var(--sdc-950) ${p.hexagons.bandPeak}%, transparent ${p.hexagons.bandEnd}%)`}
        />
      )}
    </div>
  );
}
