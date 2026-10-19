"use client";

import { keyframes, styled } from "next-yak";

const fade = keyframes`
  from { opacity: 0; transform: translateY(var(--enter-offset)); }
  to { opacity: 1; transform: translateY(0); }
`;

/*
 * The member pages' shared frame: a wide centred column (the feed is a grid, not a form) whose side
 * gutter is `--gutter`, so rails and the filter bar can bleed to the screen edge on phones.
 * `--header-height` is the top bar's height, which the filter bar sticks below.
 */
export const FeedPage = styled.div`
  --gutter: var(--space-6);

  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  width: 100%;
  max-width: calc(var(--space-8) * 19);
  margin: 0 auto;
  padding: var(--space-6) var(--gutter) var(--space-8);
  animation: ${fade} var(--duration-enter) var(--ease) both;

  @media (max-width: 767px) {
    --gutter: var(--space-4);

    gap: var(--space-5);
    padding-top: var(--space-5);
  }
`;

export const FeedHeader = styled.header`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-3) var(--space-5);
`;

export const FeedTitle = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
`;

export const FeedLead = styled.p`
  margin: var(--space-1) 0 0;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

/** Auto-fitting card grid: one column on a phone, two on a tablet, three or four on a desktop. */
export const CardGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, calc(var(--space-8) * 4.5)), 1fr));
  gap: var(--space-5) var(--space-4);
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;
