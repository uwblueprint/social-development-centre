"use client";

import * as React from "react";
import { Context, FLAG_IDS, type GeneralFlag, type LabState } from "./context";

/** Declare the edge cases that can really happen on this screen. Read the flags and design each one. */
export interface StateLabConfig<D extends string, A extends string> {
  /** Page-specific data and section states, shown after the general section states. */
  data?: readonly { id: D; label: string; description?: string }[];
  /** Page-specific action states (a save or create that fails, ...), shown after the general action states. */
  actions?: readonly { id: A; label: string; description?: string }[];
  /**
   * General states that can't happen on this screen (e.g. `["readOnly"]` when there are no viewer roles).
   * They stay in the panel, switched off and marked "Doesn't apply to this screen", and their flags are always false.
   */
  notApplicable?: readonly GeneralFlag[];
}

export interface StateLab<Id extends string> {
  // Page
  loading: boolean;
  /** Loading that takes several seconds. Use `useLabLoad(lab)` for the phases and the real delay. */
  slowLoading: boolean;
  loadFailed: boolean;
  empty: boolean;
  notFound: boolean;
  noPermission: boolean;
  sessionExpired: boolean;
  offline: boolean;
  reconnecting: boolean;
  readOnly: boolean;
  // Section
  sectionFailed: boolean;
  sectionEmpty: boolean;
  partialData: boolean;
  staleData: boolean;
  manyItems: boolean;
  singleItem: boolean;
  longText: boolean;
  // Action
  saving: boolean;
  saveFailed: boolean;
  conflict: boolean;
  validationError: boolean;
  rateLimited: boolean;
  actionDenied: boolean;
  undoExpired: boolean;
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
  const key = JSON.stringify([config.data ?? [], config.actions ?? [], (config.notApplicable ?? []).map((f) => FLAG_IDS[f])]);
  React.useEffect(() => {
    const [data, actions, notApplicable] = JSON.parse(key) as [LabState[], LabState[], string[]];
    return register(Symbol("state-lab-page"), { data, actions, notApplicable });
  }, [key, register]);

  const skipped = new Set<string>((config.notApplicable ?? []).map((f) => FLAG_IDS[f]));
  const on = (id: string) => active.has(id) && !skipped.has(id);
  return {
    loading: on("loading"),
    slowLoading: on("slow-loading"),
    loadFailed: on("load-failed"),
    empty: on("empty"),
    notFound: on("not-found"),
    noPermission: on("no-permission"),
    sessionExpired: on("session-expired"),
    offline: on("offline"),
    reconnecting: on("reconnecting"),
    readOnly: on("read-only"),
    sectionFailed: on("section-failed"),
    sectionEmpty: on("section-empty"),
    partialData: on("partial-data"),
    staleData: on("stale-data"),
    manyItems: on("many-items"),
    singleItem: on("single-item"),
    longText: on("long-text"),
    saving: on("saving"),
    saveFailed: on("save-failed"),
    conflict: on("conflict"),
    validationError: on("validation-error"),
    rateLimited: on("rate-limited"),
    actionDenied: on("action-denied"),
    undoExpired: on("undo-expired"),
    is: (id) => on(id),
  };
}

/** Slow loading: the "taking longer" message appears after this long (ms). */
export const STILL_LOADING_AFTER = 4000;
/** Slow loading: the data arrives after this long (ms). */
export const SLOW_LOAD_ENDS_AFTER = 10000;
/** Saving: how long the action stays in flight before it resolves (ms). */
export const SAVING_FOR = 5000;

/**
 * True from the moment `active` turns on until `ms` has passed; false again once it turns off.
 * Use it to simulate a real delay, e.g. a save that stays in flight for a few seconds.
 */
export function useLabDelay(ms: number, active: boolean): boolean {
  const [done, setDone] = React.useState(false);
  React.useEffect(() => {
    if (!active) return;
    const id = window.setTimeout(() => setDone(true), ms);
    return () => {
      window.clearTimeout(id);
      setDone(false);
    };
  }, [ms, active]);
  return active && !done;
}

/** A committed search: how long the demo "searches" (ms), normally and while Slow loading is on. */
export const SEARCH_FOR = 400;
export const SLOW_SEARCH_FOR = STILL_LOADING_AFTER;

/**
 * Follows `value` after `ms`: `value` out is the previous one until the delay passes, and `pending` is true meanwhile.
 * Use it to keep showing the previous results while a search runs.
 */
export function useLabDeferred<T>(value: T, ms: number): { value: T; pending: boolean } {
  const [applied, setApplied] = React.useState(value);
  React.useEffect(() => {
    if (Object.is(applied, value)) return;
    const id = window.setTimeout(() => setApplied(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms, applied]);
  return { value: applied, pending: !Object.is(applied, value) };
}

export interface LabLoad {
  /** Show the loading treatment: Loading is on, or Slow loading hasn't finished. */
  loading: boolean;
  /** Slow loading is past STILL_LOADING_AFTER: add the reassuring "Still loading..." message. */
  takingLonger: boolean;
}

/**
 * The page's loading phases. Loading stays on until it's switched off. Slow loading plays a real delay:
 * loading, then `takingLonger` after STILL_LOADING_AFTER, then the data after SLOW_LOAD_ENDS_AFTER.
 * Switch Slow loading off and on to replay it.
 */
export function useLabLoad(lab: Pick<StateLab<never>, "loading" | "slowLoading">): LabLoad {
  const slow = useLabDelay(SLOW_LOAD_ENDS_AFTER, lab.slowLoading);
  const early = useLabDelay(STILL_LOADING_AFTER, lab.slowLoading);
  return { loading: lab.loading || slow, takingLonger: !lab.loading && slow && !early };
}
