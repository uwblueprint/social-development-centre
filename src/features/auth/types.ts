/**
 * Contract between the admin sign-in page and the backend (docs/backend/auth.md). Admins share one SDC
 * account with an email and password; the other users sign in with email links (`signIn` in
 * src/app/login/actions.ts).
 */
export type AdminSignInResult =
  | { status: "idle" }
  /** Missing or malformed fields; nothing was checked. */
  | { status: "invalid"; email: string; fieldErrors: { email?: true; password?: true } }
  /** Wrong password. `attemptsLeft` before the account pauses (Figma admin screen 5). */
  | { status: "wrong-password"; email: string; attemptsLeft: number }
  /** Too many wrong passwords: sign-in is paused for everyone until `until` (ISO 8601, UTC; admin screen 6). */
  | { status: "paused"; email: string; until: string }
  /** Signed in; the session lasts 30 days on this device. The real action redirects to /admin instead. */
  | { status: "signed-in" };

/** The server action the admin sign-in form submits to. FormData fields: `email`, `password`. */
export type AdminSignInAction = (prev: AdminSignInResult, formData: FormData) => Promise<AdminSignInResult>;

/**
 * Newsletter signup on the public page for a shared opportunity (member screens 8–10). An address that's
 * already on the list is confirmed, never an error, and gets no second email (Figma annotation, screen 9).
 */
export type NewsletterResult =
  | { status: "idle" }
  | { status: "invalid-email"; email: string }
  | { status: "subscribed"; email: string }
  | { status: "already-subscribed"; email: string }
  | { status: "temporary"; email: string };

/** The server action the newsletter box submits to. FormData fields: `email`, `opportunityId` (where they signed up). */
export type NewsletterAction = (prev: NewsletterResult, formData: FormData) => Promise<NewsletterResult>;
