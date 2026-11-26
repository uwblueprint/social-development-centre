"use client";

import * as React from "react";
import type { PlanId } from "./plans";

/*
 * Demo hand-off between the join form, the PayPal stand-in and the thank-you page. The real flow: the
 * server creates a PayPal order for the chosen tier and redirects to PayPal; PayPal sends the person back
 * to the return URL with the order id, and the server captures the payment and looks up who it was for.
 * Here the details wait in sessionStorage instead, so nothing personal goes in a URL. The tier does
 * travel in the URL (it's not personal), so the stand-in can show the amount.
 */

export interface JoinDetails {
  firstName: string;
  lastName: string;
  email: string;
  planId: PlanId | "";
}

const KEY = "sdc-join-demo";
const EMPTY: JoinDetails = { firstName: "", lastName: "", email: "", planId: "" };

export function saveDetails(details: JoinDetails) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(details));
  } catch {
    // Private mode or blocked storage: the thank-you page falls back to generic wording.
  }
}

function read(): string | null {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}

const noSubscribe = () => () => {};

/** The details saved before going to PayPal; empty on the server and when nothing was saved. */
export function useSavedDetails(): JoinDetails {
  const raw = React.useSyncExternalStore(noSubscribe, read, () => null);
  return React.useMemo(() => {
    if (!raw) return EMPTY;
    try {
      return { ...EMPTY, ...(JSON.parse(raw) as Partial<JoinDetails>) };
    } catch {
      return EMPTY;
    }
  }, [raw]);
}

/** Keeps how they arrived (`via`, `ref`) on every hop, so a referral is still credited after PayPal. */
export function withChannel(path: string, params: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
