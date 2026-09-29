"use client";

import * as React from "react";
import { styled } from "next-yak";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "./Tooltip";

/*
 * Block-level so it fills its container (a table cell, a flex child with min-width: 0) and clips
 * there. Inside a table, give the column a `width` so the cell has a width to clip to.
 */
const Text = styled.span`
  display: block;
  min-width: 0;
  max-width: 100%;
  /* Room for descenders inside the clip, without changing the line's height. */
  margin-block: -2px;
  padding-block: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

function isTruncated(el: HTMLElement | null) {
  return !!el && el.scrollWidth > el.clientWidth;
}

/**
 * One line of text that ends in an ellipsis when it doesn't fit. With `tooltip`, hovering it shows the
 * full text in a kit tooltip, but only when the text is actually cut off. The full text is always in
 * the DOM, so screen readers read all of it.
 */
export function TruncatedText({ children, tooltip = false }: { children: string; tooltip?: boolean }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);

  if (!tooltip) return <Text>{children}</Text>;

  return (
    <TooltipRoot open={open} onOpenChange={(next) => setOpen(next && isTruncated(ref.current))}>
      <TooltipTrigger asChild>
        <Text ref={ref}>{children}</Text>
      </TooltipTrigger>
      {/* The trigger's text already names it; the tooltip is a visual repeat, so hide it from AT. */}
      <TooltipContent aria-hidden="true">{children}</TooltipContent>
    </TooltipRoot>
  );
}

const EmailRoot = styled.span`
  display: flex;
  min-width: 0;
  max-width: 100%;
  /* Room for descenders (g, p, y) inside the clip, without changing the line's height. */
  margin-block: -2px;
  padding-block: 2px;
  overflow: hidden;
  white-space: nowrap;
`;

/*
 * The local part shrinks first (its flex-shrink dwarfs the domain's), down to a sliver that still shows
 * the ellipsis; only then does the domain shrink and end-truncate.
 */
const EmailLocal = styled.span`
  flex: 0 100000 auto;
  /* Room for the ellipsis itself (content-relative, not a spacing value). */
  min-width: 1.5ch;
  margin-block: -2px;
  padding-block: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const EmailDomain = styled.span`
  flex: 0 1 auto;
  min-width: 0;
  margin-block: -2px;
  padding-block: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/**
 * An email address that truncates in the middle: the local part ends in an ellipsis and `@domain`
 * stays whole, so "ada.lovelace.long@northside.org" reads "ada.lov…@northside.org". If the domain alone
 * doesn't fit, it end-truncates. Pure CSS, no tooltip: people copy emails rather than read them, and
 * selecting and copying gets the whole address.
 */
export function TruncatedEmail({ email }: { email: string }) {
  const at = email.lastIndexOf("@");
  if (at <= 0) return <Text>{email}</Text>;
  return (
    <EmailRoot>
      <EmailLocal>{email.slice(0, at)}</EmailLocal>
      <EmailDomain>{email.slice(at)}</EmailDomain>
    </EmailRoot>
  );
}
