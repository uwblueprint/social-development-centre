"use client";

import * as React from "react";
import { styled } from "next-yak";
import type { SignupLink } from "../data";
import { Version01 } from "./Version01";
import { Version02 } from "./Version02";
import { Version03, Version04 } from "./TwoColumns";
import { Version05 } from "./Version05";
import { Version06 } from "./Version06";
import { Version07 } from "./Version07";
import { Version08 } from "./Version08";
import { Version09 } from "./Version09";
import { Version10 } from "./Version10";
import type { VersionProps } from "./shared";
import { useLinkActions } from "./useLinkActions";

/*
 * Ten layouts of the link dialog, to compare. Press 1 to 9 and 0 (version 10) on /design/signup-links
 * to switch; the choice is kept in the URL as ?modal=3. Dev only: delete this folder, the provider and
 * the label once one layout is chosen.
 */
const VERSIONS: Record<number, React.ComponentType<VersionProps>> = {
  1: Version01,
  2: Version02,
  3: Version03,
  4: Version04,
  5: Version05,
  6: Version06,
  7: Version07,
  8: Version08,
  9: Version09,
  10: Version10,
};
const COUNT = 10;

const VersionContext = React.createContext(1);

function parse(value: string | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= COUNT ? n : 1;
}

/* Bottom right, left of Next's dev indicator, and clear of the State lab pill (bottom left). */
const Label = styled.div`
  position: fixed;
  right: calc(var(--space-7) + var(--space-5));
  bottom: var(--space-4);
  z-index: var(--z-nav);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-sm);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text);
  font-variant-numeric: tabular-nums;

  /* Phones: stack above the indicator instead of beside it. */
  @media (max-width: 767px) {
    right: var(--space-4);
    bottom: calc(var(--space-4) + var(--space-7));
  }
`;

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.matches("input, textarea, select") || target.isContentEditable);
}

/** Holds the chosen layout, switches it with the number keys and shows the dev label. */
export function ModalVersionProvider({ initial, children }: { initial?: string; children: React.ReactNode }) {
  const [version, setVersion] = React.useState(() => parse(initial));

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || isTyping(event.target)) return;
      if (!/^[0-9]$/.test(event.key)) return;
      const next = event.key === "0" ? 10 : Number(event.key);
      setVersion(next);
      const url = new URL(window.location.href);
      url.searchParams.set("modal", String(next));
      window.history.replaceState(window.history.state, "", url);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <VersionContext.Provider value={version}>
      {children}
      <Label role="status">{`Modal ${version} of ${COUNT} · press 1–0`}</Label>
    </VersionContext.Provider>
  );
}

/** The link dialog's content in the chosen layout. Render it inside a `Dialog`. `onDone` is for the create result. */
export function LinkModalContent({ link, onDone }: { link: SignupLink; onDone?: () => void }) {
  const version = React.useContext(VersionContext);
  const actions = useLinkActions(link);
  const Layout = VERSIONS[version] ?? Version01;
  return <Layout actions={actions} onDone={onDone} />;
}
