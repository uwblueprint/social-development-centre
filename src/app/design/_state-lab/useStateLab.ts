"use client";

import * as React from "react";
import { Context, type LabState } from "./context";

/** Declare the edge cases that can really happen on this screen. Read the flags and design each one. */
export interface StateLabConfig<D extends string, A extends string> {
  /** Page-specific data states, shown after the general ones. */
  data?: readonly { id: D; label: string }[];
  /** Page-specific action states (a save or create that fails, ...). */
  actions?: readonly { id: A; label: string }[];
}

export interface StateLab<Id extends string> {
  offline: boolean;
  loading: boolean;
  empty: boolean;
  loadFailed: boolean;
  longText: boolean;
  notFound: boolean;
  noPermission: boolean;
  /** True when this page-specific state is switched on. */
  is: (id: Id) => boolean;
}

/**
 * Registers this screen's states with the State lab panel and returns the flags the panel sets.
 * The lab changes nothing on the page by itself; the screen decides what each flag looks like.
 */
export function useStateLab<const D extends string = never, const A extends string = never>(
  config: StateLabConfig<D, A> = {},
): StateLab<D | A> {
  const ctx = React.useContext(Context);
  if (!ctx) throw new Error("useStateLab must be used inside a /design screen.");
  const { active, register } = ctx;

  // Compare by content so an inline config object doesn't re-register on every render.
  const key = JSON.stringify([config.data ?? [], config.actions ?? []]);
  React.useEffect(() => {
    const [data, actions] = JSON.parse(key) as [LabState[], LabState[]];
    return register(Symbol("state-lab-page"), { data, actions });
  }, [key, register]);

  return {
    offline: active.has("offline"),
    loading: active.has("loading"),
    empty: active.has("empty"),
    loadFailed: active.has("load-failed"),
    longText: active.has("long-text"),
    notFound: active.has("not-found"),
    noPermission: active.has("no-permission"),
    is: (id) => active.has(id),
  };
}
