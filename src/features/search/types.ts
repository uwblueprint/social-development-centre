/** What the search route sends: just enough to find and open each record. */
export interface PersonHit {
  id: string;
  name: string | null;
  email: string;
}

export interface EmailHit {
  id: string;
  name: string;
}

/** Each group loads, or fails, on its own, so one failing never hides the other. */
export type Loaded<T> = { status: "ok"; items: T[] } | { status: "error" };

export interface SearchIndex {
  people: Loaded<PersonHit>;
  emails: Loaded<EmailHit>;
}
