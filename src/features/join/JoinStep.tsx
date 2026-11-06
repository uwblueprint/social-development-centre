"use client";

import * as React from "react";
import Link from "next/link";
import { styled } from "next-yak";
import { recordSignupLinkClick, recordSignupLinkJoin } from "./actions";

const Heading = styled.h1`
  margin: 0;
  font-size: var(--text-xl);
  font-weight: var(--weight-medium);
  line-height: var(--leading-heading);
  letter-spacing: var(--tracking-tight);
  overflow-wrap: anywhere;
`;

/**
 * The kit's Button renders a <button>, and navigation should be a link, so this is a link drawn as a
 * primary Button (same as `LinkButton` in the sign-in screen). Ask the design-system owner whether the
 * kit should get a link-as-button.
 */
const ContinueLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  padding: 0 var(--space-5);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-size: var(--text-md);
  line-height: 1;
  text-decoration: none;
  transition: background-color var(--duration) var(--ease);

  &:hover {
    background: var(--color-primary-hover);
  }
`;

type Param = string | string[] | undefined;

function first(value: Param): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Keeps the signup link's `source`, and the visit id that ties this visit's join to its click, on every
 * step so joins are attributed to the link. In the URL rather than a cookie (docs/backend/signup-links.md).
 */
function withSource(path: string, source: string | undefined, visit: string | undefined) {
  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (source && visit) params.set("visit", visit);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * One join step: its heading and a Continue link to the next step. `record` counts the visit for the
 * signup link in `source`: "click" on the welcome step, "join" on the thank-you step. Counting runs in
 * the browser after the page shows, so link previews (which don't run scripts) aren't counted, and it
 * never blocks the page.
 */
export function JoinStep({
  title,
  next,
  source,
  visit,
  record,
}: {
  title: string;
  next?: string;
  source: Param;
  /** Made fresh by the welcome step on every load, then carried in the URL to the thank-you step. */
  visit: Param;
  record?: "click" | "join";
}) {
  const sourceValue = first(source);
  const visitValue = first(visit);
  // Strict Mode runs effects twice in development; this keeps each page load to one request. The
  // database also ignores a repeat for the same visit.
  const recorded = React.useRef(false);

  React.useEffect(() => {
    if (!record || !sourceValue || !visitValue || recorded.current) return;
    recorded.current = true;
    const write = record === "click" ? recordSignupLinkClick : recordSignupLinkJoin;
    void write(sourceValue, visitValue).catch(() => {});
  }, [record, sourceValue, visitValue]);

  return (
    <>
      <Heading>{title}</Heading>
      {next && <ContinueLink href={withSource(next, sourceValue, visitValue)}>Continue</ContinueLink>}
    </>
  );
}
