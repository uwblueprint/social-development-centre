"use client";

import * as React from "react";
import { styled } from "next-yak";
import { DoodlePattern } from "./DoodlePattern";
import { PhotoShade } from "./PhotoShade";

/*
 * The join page's welcome screen panel: a narrower floating panel on the left (inset from the window's
 * edges, rounded corners) with a pattern of SDC doodles under the referral page's green gradient, and the
 * page's content on the right. Stacked on smaller screens. (It held an event photo before; the photo,
 * join-photo.jpg, is still in the folder.)
 */

/** The two columns: the panel (about 40%) and the page's content. */
export const Split = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
  min-height: 100vh;

  @media (max-width: 899px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/* SDC green under the doodles: the gradient leaves it showing at the top and deepens it towards the heading. */
const Visual = styled.div`
  position: relative;
  isolation: isolate;
  overflow: hidden;
  margin: var(--space-4);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: var(--space-4);
  padding: var(--space-8) var(--space-7);
  background: var(--sdc-700);
  color: var(--taupe-50);

  @media (max-width: 899px) {
    min-height: 460px;
    padding: var(--space-7) var(--space-4) var(--space-6);
  }
`;

/** The doodles under the gradient, with whatever goes on top of it (white, like all text on the panel). */
export function PhotoPanel({ children }: { children: React.ReactNode }) {
  return (
    <Visual>
      <DoodlePattern />
      <PhotoShade />
      {children}
    </Visual>
  );
}
