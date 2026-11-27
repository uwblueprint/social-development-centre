"use client";

import * as React from "react";
import { offlineReason, type OfflineAction } from "./_offline";

/** An action in flight (the State lab's Saving): which one, and what its button says meanwhile. */
export interface Busy {
  kind: "approve" | "resend" | "delete" | "save";
  label: string;
}

interface LockState {
  offline: boolean;
  sessionExpired: boolean;
  reconnecting: boolean;
  busy: Busy | null;
}

const NONE: LockState = { offline: false, sessionExpired: false, reconnecting: false, busy: null };
const LockContext = React.createContext<LockState>(NONE);

/** The page provides why changes are unavailable right now; controls read it instead of taking a prop each. */
export const OutboxLockProvider = LockContext.Provider;

/** `reason(action)` is the disabled reason for a change right now, or null when changes are allowed. */
export function useOutboxLock() {
  const state = React.useContext(LockContext);
  const locked = state.offline || state.sessionExpired || state.reconnecting || !!state.busy;
  const reason = (action: OfflineAction): string | null => {
    if (state.sessionExpired) return `Your session expired. Sign in to ${action}.`;
    if (state.offline) return offlineReason(action);
    if (state.reconnecting) return `Reconnecting. Try again in a moment.`;
    if (state.busy) return "Saving your last change.";
    return null;
  };
  return { ...state, locked, reason };
}
