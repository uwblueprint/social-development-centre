import type { LabFlag } from "../model";

/**
 * The state checklist, MECE: every case sits under exactly one axis, and the axes together cover how a
 * screen can differ. Axis 1 data, 2 load and save, 3 timing, 4 who else acts, 5 rule conflicts.
 * `flags` are switched on (all others off) when you press Go; `scenario` re-seeds the data first.
 */
export type LabAxis = "Data" | "Load and save" | "Timing" | "Other actors" | "Rule conflicts";

export interface LabCase {
  axis: LabAxis;
  title: string;
  what: string;
  href: string;
  flags?: LabFlag[];
  scenario?: "default" | "busy" | "empty";
  /** Move the clock forward (ms) after re-seeding. */
  advance?: number;
}

const B = "/emails-pm-prototype";

export const LAB_CASES: LabCase[] = [
  { axis: "Data", title: "Outbox, nothing in 30 days", what: "Empty state with no sends.", href: `${B}/outbox`, scenario: "empty" },
  { axis: "Data", title: "Automatic emails, none yet", what: "List empty state.", href: `${B}/automatic`, scenario: "empty" },
  { axis: "Data", title: "One-off emails, none yet", what: "Drafts and Sent empty states.", href: `${B}/one-off`, scenario: "empty" },
  { axis: "Data", title: "Busy Outbox", what: "Many batches, many days, large batches.", href: `${B}/outbox`, scenario: "busy" },
  { axis: "Data", title: "Very long names and subjects", what: "Wrapping and truncation in lists, rows and previews.", href: `${B}/outbox`, flags: ["longText"] },
  { axis: "Data", title: "Members with missing details", what: "Empty first names fall back to “there” in preview.", href: `${B}/editor` },

  { axis: "Load and save", title: "Slow loading", what: "Loading states on every page.", href: `${B}/outbox`, flags: ["slowLoad"] },
  { axis: "Load and save", title: "Data fails to load", what: "Error state with Retry.", href: `${B}/automatic`, flags: ["loadError"] },
  { axis: "Load and save", title: "Slow saves", what: "Pending states on autosave, Update, Publish, Send.", href: `${B}/automatic/new`, flags: ["slowSave"] },
  { axis: "Load and save", title: "Saves fail", what: "“Not saved” with Retry; typed text kept.", href: `${B}/automatic/new`, flags: ["saveError"] },
  { axis: "Load and save", title: "Offline", what: "Actions explain that you’re offline.", href: `${B}/one-off/new`, flags: ["offline"] },

  { axis: "Timing", title: "Day passes with reviews unapproved", what: "Waiting for review moves to Waiting for you with days past due.", href: `${B}/outbox`, advance: 3 * 86_400_000 },
  { axis: "Timing", title: "Send window opens", what: "Scheduled sends go out; sent items leave the Outbox.", href: `${B}/outbox`, advance: 86_400_000 },
  { axis: "Timing", title: "Edit lock about to expire", what: "Open an email to edit, then skip 25 minutes for the warning.", href: `${B}/outbox`, advance: 25 * 60_000 },
  { axis: "Timing", title: "One-off undo window", what: "Send a one-off, then skip 1 minute to see it go.", href: `${B}/one-off/new` },

  { axis: "Other actors", title: "Another admin has a send open", what: "Priya’s lock: no editing, and Unpublish warns.", href: `${B}/outbox`, flags: ["otherAdminEditing"] },
  { axis: "Other actors", title: "Email provider is down", what: "Due sends become Couldn’t send, with Retry and Don’t send.", href: `${B}/outbox`, flags: ["providerDown"], advance: 86_400_000 },

  { axis: "Rule conflicts", title: "Members pass the monthly limit", what: "Warning on publish, approve and one-off send; never blocks.", href: `${B}/one-off/new`, flags: ["overMonthlyLimit"] },
  { axis: "Rule conflicts", title: "Unsubscribed, bounced and spam members", what: "Excluded with a reason in audiences and recipient lists.", href: `${B}/one-off/new` },
];
