/**
 * Local development only: name and profile picture changes made in the My account dialog, kept in
 * memory (lost on restart) and applied on top of the dev sessions in src/app/{admin,partner}/_data/session.ts.
 * The backend replaces this with the profile table and file storage; see docs/backend/README.md, "Accounts".
 */
export interface DevAccountOverride {
  name?: string;
  /** A data URL, or null when the person removed their picture. */
  avatarUrl?: string | null;
}

const store = ((globalThis as { __sdcDevAccounts?: Map<string, DevAccountOverride> }).__sdcDevAccounts ??= new Map());

export function devAccountOverride(email: string): DevAccountOverride | undefined {
  return store.get(email);
}

export function setDevAccountOverride(email: string, next: DevAccountOverride) {
  store.set(email, { ...store.get(email), ...next });
}

/** "Deleting" a dev account resets it, so the dev session still works after signing back in. */
export function resetDevAccount(email: string) {
  store.delete(email);
}

/** "Amara Okafor" → "AO". */
export function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Applies dev changes to a session user. */
export function withDevAccount<U extends { name: string; email: string; initials: string; avatarUrl?: string }>(user: U): U {
  const override = store.get(user.email);
  if (!override) return user;
  const name = override.name ?? user.name;
  const avatarUrl = override.avatarUrl === undefined ? user.avatarUrl : (override.avatarUrl ?? undefined);
  return { ...user, name, initials: initialsOf(name), avatarUrl };
}
