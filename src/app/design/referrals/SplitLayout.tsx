"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import Image from "next/image";
import { styled } from "next-yak";
import { DialRoot, useDialKit } from "dialkit";
import "dialkit/styles.css";
import photo from "./referral-photo.jpg";
import skyline from "./waterloo-skyline.png";
import { Clouds } from "./Clouds";
import { DoodlePattern } from "./DoodlePattern";
import { FigmaShade } from "./FigmaShade";

/*
 * The split screen from the join page's first screen: an SDC event photo on the left with the page's
 * heading and lede at the bottom; the page's content on the right. Stacks on screens under 900px,
 * photo first. Three panel treatments (preview others with ?panel=hex or ?panel=overlay):
 *
 * - "figma" (default): copied from the Figma working file (SDC Working File, node 893:13). The photo at
 *   full strength with 8px corners, and a gradient over its lower part from transparent teal to deep
 *   green (angled 188.6°, as in the file); the heading and lede at the bottom left, in the platform's
 *   own heading style.
 * - "hex": the photo at full strength. Only the area behind the text is shaded: dark primary
 *   below a nearly straight diagonal line that starts high on the left and comes down to just above the
 *   heading on the right. The line's edge is softened evenly along its whole length, and a band of
 *   hexagons (the logo's shape) follows it, so the shade breaks up into hexagons the same way all across.
 * - "overlay" (the previous version, saved): a green overlay over the whole photo, darkest at the bottom.
 */

export type PanelVariant = "figma" | "hex" | "overlay";

/**
 * "banner" (default): the photo is a wide banner at the top, with the form underneath, in one centred
 * column. "split": the photo panel on the left and the form on the right (preview with ?layout=split).
 */
export type PanelLayout = "banner" | "split";

/* The page has a margin all round, so the photo panel floats inside the screen's edges. */
const Split = styled.main`
  display: grid;
  /* The photo panel takes a little less than half (45%), giving the form more room. */
  grid-template-columns: minmax(0, 9fr) minmax(0, 11fr);
  min-height: 100vh;
  padding: var(--space-4);

  @media (max-width: 899px) {
    grid-template-columns: minmax(0, 1fr);
    padding: var(--space-3);
  }

  /* One column in the middle of the screen: the photo with the heading on top, the form under it. */
  &[data-layout="banner"] {
    grid-template-columns: minmax(0, 1fr);
    align-content: center;
    gap: var(--space-6);
    width: 100%;
    /* 600px wide; the padding sits outside that. */
    max-width: calc(600px + 2 * var(--space-6));
    /* Centred in the space above the skyline (Screen). */
    align-self: center;
    min-height: 0;
    margin: 0 auto;
    padding: var(--space-6);

    @media (max-width: 599px) {
      padding: var(--space-3) var(--space-3) var(--space-7);
    }
  }
`;

/* Banner layout: the page above, and the skyline along the bottom of the screen. */
const Screen = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;
  grid-template-columns: minmax(0, 1fr);
  min-height: 100dvh;
`;

/*
 * A line drawing of Waterloo Region's skyline along the bottom, as on the sign-in page
 * (gaurav/sign-in-magic-link, SignInParts.tsx; image 1600×182). It's a mask over a token colour: a quiet
 * grey line drawing in light mode, bright white in dark mode. Decorative, so screen readers skip it.
 */
const Skyline = styled.div`
  width: calc(100% - 2 * var(--space-4));
  max-width: 1200px;
  margin: 0 auto;
  aspect-ratio: 1600 / 182;
  background-color: var(--color-border-strong);
  mask-position: center bottom;
  mask-size: contain;
  mask-repeat: no-repeat;
  pointer-events: none;

  /* Dark mode: bright white lines (white would vanish on the light page, so light mode keeps the grey). */
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) & {
      background-color: var(--taupe-50);
    }
  }
  :root[data-theme="dark"] & {
    background-color: var(--taupe-50);
  }
`;

/* Rounded to match the inputs (--radius-md); the Figma version uses 8px (--radius-lg). */
const Visual = styled.div`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: var(--space-8) var(--space-7);
  background: var(--sdc-950);
  color: var(--taupe-50);

  /* Figma version: 8px corners and 32px side padding (Figma: 31px); the gradient is FigmaShade. SDC green
     under the doodle pattern, as on the join page. */
  &[data-variant="figma"] {
    border-radius: var(--radius-lg);
    padding-inline: var(--space-6);
    background: var(--sdc-700);
  }

  /* Saved version: the whole photo under a green overlay, darkest at the bottom. */
  &[data-variant="overlay"]::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    background: linear-gradient(
      to top,
      color-mix(in oklch, var(--sdc-950) 93%, transparent) 15%,
      color-mix(in oklch, var(--sdc-900) 78%, transparent) 60%,
      color-mix(in oklch, var(--sdc-800) 72%, transparent)
    );
  }

  @media (max-width: 899px) {
    min-height: 400px;
    padding: var(--space-7) var(--space-4) var(--space-6);
  }

  /* Banner: a wide strip above the form, the photo cropped to fit. */
  [data-layout="banner"] & {
    min-height: 240px;
    /* The heading sits close to the banner's corner. Square corners: the card around it rounds the top. */
    padding: var(--space-5);
    border-radius: 0;

    /* With controls: the heading on the left, the controls on the right, both sitting at the bottom. */
    &[data-aside] {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      align-items: end;
      gap: var(--space-6);

      /* The heading and lede sit centred top to bottom beside the message. */
      & > div:has(> h1) {
        align-self: center;
      }

      /* The text and controls cover more of the photo, so it's shaded all over, not just at the bottom. */
      &::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: -1;
        background: color-mix(in oklch, var(--sdc-950) 55%, transparent);
        pointer-events: none;
      }

      @media (max-width: 719px) {
        grid-template-columns: minmax(0, 1fr);
      }
    }

    @media (max-width: 599px) {
      min-height: 220px;
      padding: var(--space-5) var(--space-4);
    }
  }
`;

/*
 * Controls on the banner's dark shade: labels, help text and the "or" divider turn white; the inputs themselves stay as
 * they are (light fields, dark text). Errors use the light danger tint so they stay readable.
 */
const Aside = styled.div`
  --color-text: var(--taupe-50);
  --color-text-muted: var(--taupe-50);
  --color-border: var(--taupe-100);
  --color-danger: var(--color-danger-border);

  /* Fields, the message box and the outline button: a frosted, see-through white fill with white text and a soft white
     border, in light and dark mode alike (the banner is always dark). */
  & input,
  & button,
  & [data-rich-box] {
    --color-bg: color-mix(in oklch, var(--taupe-50) 14%, transparent);
    --color-surface: color-mix(in oklch, var(--taupe-50) 8%, transparent);
    --color-border: color-mix(in oklch, var(--taupe-50) 30%, transparent);
    --color-bg-hover: color-mix(in oklch, var(--taupe-50) 18%, transparent);
    --color-bg-selected: color-mix(in oklch, var(--taupe-50) 26%, transparent);
    --color-outline-hover: color-mix(in oklch, var(--taupe-50) 24%, transparent);
    --color-border-strong: color-mix(in oklch, var(--taupe-50) 45%, transparent);
    --color-text: var(--taupe-50);
    --color-text-muted: var(--taupe-200);
    backdrop-filter: blur(8px);
  }

  /* The B / I / U buttons stay clear until pressed (pressed keeps its fill and outline). */
  & [role="toolbar"] button {
    --color-bg: transparent;
    backdrop-filter: none;
  }

  /* Half-transparent disabled buttons vanish on the dark shade: a solid pale fill instead. */
  & button:disabled {
    opacity: 1;
    background: var(--taupe-200);
    color: var(--taupe-600);
  }
`;

const Photo = styled(Image)`
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;

  [data-variant="overlay"] > & {
    filter: grayscale(0.25);
  }
  /* Figma crops the photo a little right of centre. */
  [data-variant="figma"] > & {
    object-position: 60% center;
  }
`;

/* The shade and hexagons, drawn in the panel's own pixels so the hexagons are never stretched. */
const Curve = styled.svg`
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 100%;
  height: 100%;
  pointer-events: none;
  color: var(--sdc-950);
`;

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  [data-variant="figma"] > & {
    gap: var(--space-3);
  }

  /* Banner: the lede sits close under the heading. */
  [data-layout="banner"] [data-variant] > & {
    gap: var(--space-1);
  }
`;

/* A check mark above the heading: green, in the success colours (pale circle in light mode, dark in dark mode). */
const VisualIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  margin-bottom: var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-success-subtle);
  border: 1px solid var(--color-success-border);
  color: var(--color-success);

  /* Just the glyph, no circle (the thank-you heart after an email invite). */
  &[data-plain] {
    align-self: flex-start;
    justify-content: flex-start;
    width: auto;
    height: auto;
    border: 0;
    border-radius: 0;
    background: none;
  }
`;

/* A little smaller than the display size, and as wide as the panel. */
const VisualTitle = styled.h1`
  margin: 0;
  overflow-wrap: anywhere;
  font-size: calc(var(--text-display) * 0.8);
  font-weight: var(--weight-medium);
  line-height: var(--leading-display);
  color: var(--taupe-50);

  &:focus {
    outline: none;
  }

  [data-layout="banner"] & {
    font-size: var(--text-xl);
    line-height: var(--leading-heading);
  }
`;

/* Capped at a comfortable reading width, so it doesn't stretch as far as the headline. */
const VisualLede = styled.p`
  margin: 0;
  max-width: 42ch;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--taupe-100);

  [data-layout="banner"] & {
    font-size: var(--text-sm);
  }
`;

/*
 * Banner layout: one card holding everything. The photo banner runs the full width of the card's top,
 * and the form sits under it with space around it. In the split layout this wrapper has no box.
 */
const Card = styled.div`
  display: contents;

  [data-layout="banner"] > & {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface-raised);
    /* The layered drop shadow is set from CardShadow's dials (useCardShadow, below). */
    --card-shadow: var(--taupe-900);
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) [data-layout="banner"] > & {
      --card-shadow: var(--taupe-50);
    }
  }
  :root[data-theme="dark"] [data-layout="banner"] > & {
    --card-shadow: var(--taupe-50);
  }
`;

/*
 * The card's drop shadow, from the portfolio file (Figma node 540:18): five layers, from a tight one close
 * under the card to a wide, faint one far below. Dark in light mode; in dark mode the same layers in white
 * (--card-shadow), since a dark shadow wouldn't show. Live DialKit controls (dev only): Strength scales
 * every layer's opacity, Distance how far down they fall, Softness their blur; each layer's own opacity is
 * under Layers. The layers start from the Figma file; the defaults are Justin's tuned values (Nov 21):
 * a much lighter, softer shadow than Figma's (Figma: strength 1, distance 1, softness 1, layers 0/1/5/9/10).
 */
const SHADOW_LAYERS = [
  { key: "farthest", y: 313, blur: 88, alpha: 0 },
  { key: "far", y: 200, blur: 80, alpha: 1 },
  { key: "middle", y: 113, blur: 68, alpha: 5 },
  { key: "near", y: 50, blur: 50, alpha: 9 },
  { key: "close", y: 13, blur: 28, alpha: 10 },
] as const;

function useCardShadow() {
  const d = useDialKit("Card shadow", {
    strength: [0.25, 0, 3, 0.05],
    distance: [0.8, 0, 2, 0.05],
    softness: [1.5, 0, 2, 0.05],
    layers: {
      farthest: [0, 0, 30, 0.5],
      far: [0, 0, 30, 0.5],
      middle: [5, 0, 30, 0.5],
      near: [7, 0, 30, 0.5],
      close: [10, 0, 30, 0.5],
    },
  });
  return SHADOW_LAYERS.map(({ key, y, blur }) => {
    const alpha = Math.min(d.layers[key] * d.strength, 100);
    return `0 ${(y * d.distance).toFixed(1)}px ${(blur * d.softness).toFixed(1)}px color-mix(in oklch, var(--card-shadow) ${alpha.toFixed(2)}%, transparent)`;
  }).join(", ");
}

const Side = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-8) var(--space-6);

  @media (max-width: 599px) {
    padding: var(--space-6) var(--space-4) var(--space-7);
  }

  [data-layout="banner"] & {
    display: block;
    /* The inputs keep some space from the card's edges. */
    padding: var(--space-5);
  }
`;

const SideInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  max-width: 440px;

  [data-layout="banner"] & {
    max-width: none;
  }
`;

/* Tuning for the hex panel, in pixels. */
const SOFT_EDGE = 26; // how far the shade's edge fades (blur radius)
const BAND = 120; // how thick the hexagon band along the line is
const BAND_LIFT = 46; // how far above the line the band's middle sits
const CLEARANCE = 56; // the line's lowest point stays this far above the heading's top

/** Pointy-top hexagon, radius 13, drawn around its centre. */
const HEX = "M0 -13 L11.26 -6.5 L11.26 6.5 L0 13 L-11.26 6.5 L-11.26 -6.5 Z";

interface Box {
  width: number;
  height: number;
  /** Top of the heading, from the top of the panel. */
  textTop: number;
  textHeight: number;
}

/**
 * The edge line (red line in the design review): high on the left, down to just above the heading on
 * the right. Nearly straight, with only a slight ease at each end. Extends past the panel's sides so the
 * soft edge never shows a seam.
 */
function edgePath({ width: w, textTop, textHeight }: Box) {
  const right = Math.max(textTop - CLEARANCE, 0);
  const left = Math.max(textTop - CLEARANCE - textHeight * 1.1, right * 0.25);
  const drop = right - left;
  return `M -80 ${left} C ${w * 0.33} ${left + drop * 0.22}, ${w * 0.67} ${left + drop * 0.78}, ${w + 80} ${right}`;
}

function HexShade({ box }: { box: Box }) {
  const edge = edgePath(box);
  const below = `${edge} L ${box.width + 80} ${box.height + 80} L -80 ${box.height + 80} Z`;
  return (
    <Curve aria-hidden="true" focusable="false">
      <defs>
        <filter id="sdc-soft-edge" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={SOFT_EDGE} />
        </filter>
        <filter id="sdc-band-fade" x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation={BAND / 4} />
        </filter>
        <pattern id="sdc-hex-field" width="26.5" height="45.9" patternUnits="userSpaceOnUse">
          <path d={HEX} transform="translate(13.25 11.5)" fill="currentColor" />
          <path d={HEX} transform="translate(0 34.4)" fill="currentColor" />
          <path d={HEX} transform="translate(26.5 34.4)" fill="currentColor" />
        </pattern>
        {/* The band follows the line: a thick, blurred stroke of it, lifted a little above. Alpha only. */}
        <mask id="sdc-hex-band" style={{ maskType: "alpha" }}>
          <path
            d={edge}
            transform={`translate(0 ${-BAND_LIFT})`}
            fill="none"
            stroke="currentColor"
            strokeWidth={BAND}
            filter="url(#sdc-band-fade)"
          />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#sdc-hex-field)" mask="url(#sdc-hex-band)" />
      <path d={below} fill="currentColor" filter="url(#sdc-soft-edge)" />
    </Curve>
  );
}

export function SplitLayout({
  title,
  lede,
  icon,
  plainIcon = false,
  headingRef,
  variant = "figma",
  layout = "banner",
  aside,
  children,
}: {
  /** Banner only: shown to the right of the heading, inside the banner (stacks under it on narrow screens). */
  aside?: ReactNode;
  title: string;
  lede: ReactNode;
  /** Shown above the heading in a light circle, e.g. a check mark once something's done. */
  icon?: ReactNode;
  /** The icon without its circle. */
  plainIcon?: boolean;
  /** Pass to move focus to the heading, e.g. after a form is sent. */
  headingRef?: RefObject<HTMLHeadingElement | null>;
  variant?: PanelVariant;
  layout?: PanelLayout;
  children?: ReactNode;
}) {
  const visualRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);
  const cardShadow = useCardShadow();

  // The line is drawn from the panel's and the text's real sizes, so it hugs the heading at any width.
  useEffect(() => {
    if (variant !== "hex") return;
    const visual = visualRef.current;
    const text = textRef.current;
    if (!visual || !text) return;
    const measure = () => {
      const v = visual.getBoundingClientRect();
      const t = text.getBoundingClientRect();
      setBox({ width: v.width, height: v.height, textTop: t.top - v.top, textHeight: t.height });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(visual);
    observer.observe(text);
    return () => observer.disconnect();
  }, [variant]);

  const page = (
    <Split data-layout={layout}>
      {/* Live controls for the Figma panel's fade and hexagons (dev only). */}
      {(variant === "figma" || layout === "banner") && <DialRoot position="bottom-right" />}
      <Card style={layout === "banner" ? { boxShadow: cardShadow } : undefined}>
      <Visual ref={visualRef} data-variant={variant} data-aside={aside ? "" : undefined}>
        {/* The Figma version uses the join page's doodle pattern instead of a photo, so the two pages match.
            The older versions (?panel=hex, ?panel=overlay) keep the photo. */}
        {variant === "figma" ? (
          <DoodlePattern />
        ) : (
          <Photo src={photo} alt="" fill sizes={layout === "banner" ? "600px" : "(max-width: 899px) 100vw, 50vw"} priority />
        )}
        {variant === "hex" && box && <HexShade box={box} />}
        {variant === "figma" && <FigmaShade layout={layout} />}
        <TextBlock ref={textRef}>
          {icon && (
            <VisualIcon aria-hidden="true" data-plain={plainIcon ? "" : undefined}>
              {icon}
            </VisualIcon>
          )}
          <VisualTitle ref={headingRef} tabIndex={headingRef ? -1 : undefined}>
            {title}
          </VisualTitle>
          {lede && <VisualLede>{lede}</VisualLede>}
        </TextBlock>
        {aside && <Aside>{aside}</Aside>}
      </Visual>
      {children && (
      <Side>
        <SideInner>{children}</SideInner>
      </Side>
      )}
      </Card>
    </Split>
  );

  if (layout !== "banner") return page;
  return (
    <Screen>
      <Clouds />
      {page}
      <Skyline aria-hidden="true" style={{ maskImage: `url(${skyline.src})`, WebkitMaskImage: `url(${skyline.src})` }} />
    </Screen>
  );
}
