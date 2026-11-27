"use client";

import dynamic from "next/dynamic";
import { styled } from "next-yak";
import type { FooterEditorProps } from "./FooterEditor";

/*
 * The footer editor without its weight up front: Tiptap and ProseMirror (about 0.7 MB in development) load in
 * their own chunk after the page, so Settings shows and responds first. Until then, an empty box the size of
 * the editor holds its place, so nothing jumps when it arrives.
 */
const FooterEditor = dynamic(() => import("./FooterEditor").then((m) => m.FooterEditor), {
  ssr: false,
  loading: () => <Placeholder aria-hidden="true" />,
});

export function LazyFooterEditor(props: FooterEditorProps) {
  return <FooterEditor {...props} />;
}

/* The editor's outline and roughly its height (toolbar plus three lines), with nothing in it. */
const Placeholder = styled.div`
  min-height: calc(var(--control-height) * 4);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
`;
