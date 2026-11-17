import * as React from "react";

export interface LabState {
  id: string;
  label: string;
  /** One line under the switch: what the designer has to design. */
  description?: string;
}

export interface PageStates {
  data: readonly LabState[];
  actions: readonly LabState[];
  /** General state ids this screen has no use for; the panel shows them switched off with a note. */
  notApplicable: readonly string[];
}

export interface LabContext {
  active: ReadonlySet<string>;
  register: (key: symbol, states: PageStates) => () => void;
}

/** Each typed flag on useStateLab and the id of the switch behind it. */
export const FLAG_IDS = {
  loading: "loading",
  slowLoading: "slow-loading",
  loadFailed: "load-failed",
  empty: "empty",
  notFound: "not-found",
  noPermission: "no-permission",
  sessionExpired: "session-expired",
  offline: "offline",
  reconnecting: "reconnecting",
  readOnly: "read-only",
  sectionFailed: "section-failed",
  sectionEmpty: "section-empty",
  partialData: "partial-data",
  staleData: "stale-data",
  manyItems: "many-items",
  singleItem: "single-item",
  longText: "long-text",
  saving: "saving",
  saveFailed: "save-failed",
  conflict: "conflict",
  validationError: "validation-error",
  rateLimited: "rate-limited",
  actionDenied: "action-denied",
  undoExpired: "undo-expired",
} as const;

export type GeneralFlag = keyof typeof FLAG_IDS;

/** The panel's groups, from the whole page down to one action. */
export type LabLevel = "page" | "section" | "action";

/**
 * The states every screen gets, by level, in panel order. Each id is read by a typed flag in
 * useStateLab, so a screen never looks a general state up by string.
 */
export const GENERAL = {
  page: [
    { id: "loading", label: "Loading", description: "First load, no data yet. Show the loading treatment." },
    {
      id: "slow-loading",
      label: "Slow loading",
      description: "Takes about 10s: loading, a \"taking longer\" message after about 4s, then the data.",
    },
    { id: "load-failed", label: "Couldn't load", description: "The page's data failed. Say what happened and offer Try again." },
    { id: "empty", label: "Empty", description: "Nothing exists yet. Say why and what to do first." },
    { id: "not-found", label: "Page not found", description: "This address doesn't exist or has moved." },
    { id: "no-permission", label: "No permission", description: "This person can't open the page at all." },
    {
      id: "session-expired",
      label: "Session expired",
      description: "Signed out mid-session. Keep unsaved work and ask them to sign in again.",
    },
    { id: "offline", label: "Offline", description: "No connection. Loaded content stays readable; changes wait." },
    {
      id: "reconnecting",
      label: "Reconnecting",
      description: "The connection is back and the page is catching up. Say so, then confirm.",
    },
    {
      id: "read-only",
      label: "Read-only",
      description: "A viewer role: see everything, change nothing, and say why controls are off.",
    },
  ],
  section: [
    {
      id: "section-failed",
      label: "One section failed",
      description: "One pane or card couldn't load; the rest works. Retry in place.",
    },
    { id: "section-empty", label: "One section empty", description: "One pane has nothing while the rest has data." },
    {
      id: "partial-data",
      label: "Partial data",
      description: "Some items miss fields (no name, no date). Show a fallback, not a blank.",
    },
    {
      id: "stale-data",
      label: "Stale data",
      description: "The data is old (over a day). Show when it was last updated and a way to refresh.",
    },
    { id: "many-items", label: "Many items", description: "500+ in a list. Check paging, counts, scrolling and speed." },
    { id: "single-item", label: "Single item", description: "Exactly one. Check plurals and layouts that expect more." },
    {
      id: "long-text",
      label: "Long text",
      description: "Long names, emails and messages. Wrap or truncate without breaking the layout.",
    },
  ],
  action: [
    { id: "saving", label: "Saving", description: "An action is in flight (about 5s). Show progress and block double submits." },
    { id: "save-failed", label: "Save failed", description: "The action failed. Keep what they typed and offer Try again." },
    {
      id: "conflict",
      label: "Changed by someone else",
      description: "Someone else changed it first. Say what changed and let them choose.",
    },
    {
      id: "validation-error",
      label: "Validation error",
      description: "The server rejects a value. Show the error on the field and in a summary.",
    },
    { id: "rate-limited", label: "Too many requests", description: "Slow down. Say when they can try again." },
    {
      id: "action-denied",
      label: "One action not allowed",
      description: "They can use the page but not this action. Disable it and say why.",
    },
    {
      id: "undo-expired",
      label: "Undo expired",
      description: "The undo window passed. Say it can't be undone and what to do instead.",
    },
  ],
} satisfies Record<LabLevel, readonly LabState[]>;

export const Context = React.createContext<LabContext | null>(null);
