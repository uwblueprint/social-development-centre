/*
 * STATE LAB (disposable). Dev-only switches that make the real code paths misbehave on purpose,
 * so every loading, empty, error and edge state can be audited. Delete src/dev/state-lab and the
 * lines tagged "STATE LAB" to remove it (see README.md).
 *
 * The switches live in server memory (one developer, one dev server), so synchronous stores can
 * read them too. They reset when `pnpm dev` restarts.
 */
export const LAB_FLAGS = [
  "slowLoad",
  "loadError",
  "empty",
  "longText",
  "slowSave",
  "saveError",
  "signedOut",
  "eventbriteTimeout",
  "eventbriteError",
  "offline",
] as const;
export type LabFlag = (typeof LAB_FLAGS)[number];

export const DELAY_MS = 2500;
const lab = globalThis as typeof globalThis & { __stateLab?: Set<LabFlag> };

export function labFlags(): LabFlag[] {
  if (process.env.NODE_ENV === "production") return [];
  return [...(lab.__stateLab ?? [])];
}

export function setLabFlagsInMemory(flags: LabFlag[]) {
  lab.__stateLab = new Set(flags.filter((f) => (LAB_FLAGS as readonly string[]).includes(f)));
}

/** Sync check for stores and queries. Always false in production. */
export function labFlag(flag: LabFlag): boolean {
  return process.env.NODE_ENV !== "production" && !!lab.__stateLab?.has(flag);
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Call at the top of a page's main query: slow loading shows loading.tsx; a failure shows error.tsx. */
export async function labRead() {
  if (labFlag("slowLoad")) await sleep(DELAY_MS);
  if (labFlag("loadError")) throw new Error("State lab: simulated data failure while loading this page.");
}

/** Eventbrite prefill: never answers in time, or answers with an error. */
export async function labEventbrite(): Promise<"error" | null> {
  if (labFlag("eventbriteTimeout")) await sleep(8000);
  return labFlag("eventbriteError") ? "error" : null;
}

const LONG = " with a much longer name than anyone expected, to check wrapping and truncation everywhere it shows";

/** Very long text in names and titles. */
export function labLong(text: string): string {
  return labFlag("longText") ? `${text}${LONG}` : text;
}

/** Stores: "No data" empties the list; "Very long text" lengthens each item's name or title. */
export function labList<T>(items: T[], lengthen: (item: T) => T): T[] {
  if (labFlag("empty")) return [];
  return labFlag("longText") ? items.map(lengthen) : items;
}
