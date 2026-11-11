/* Demo data for the Admins screen. No backend: everything lives in memory. */

export interface Admin {
  id: string;
  name: string;
  email: string;
  /** False until they open their sign-in link for the first time. */
  signedIn: boolean;
}

/** The signed-in admin in this demo. */
export const ME = "a1";

export const SEED_ADMINS: Admin[] = [
  { id: "a1", name: "Amara Okafor", email: "amara@example.org", signedIn: true },
  { id: "a2", name: "Daniel Reyes", email: "daniel@example.org", signedIn: true },
  { id: "a3", name: "Mei Lin", email: "mei@example.org", signedIn: true },
  { id: "a4", name: "Farah Haddad", email: "farah@example.org", signedIn: false },
];

export function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
