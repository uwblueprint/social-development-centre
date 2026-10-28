# Connecting the backend to the admin UI

The UI is built so the backend plugs in at a few fixed seams. Nothing in `src/components/` fetches data.

## 1. Who is signed in
`src/features/auth/session.ts`: `getSignedInPerson()`, `requireAdmin()`, `requireMember()`. The admin layout uses `getCurrentAdmin()` (`src/app/admin/_data/session.ts`), which wraps them.
- Being an admin is decided by the database's `is_admin()`: a row in `public.admins` and a sign-in less than 7 days old. Pages, server actions and row-level security all use it, so they always agree. See [../auth.md](../auth.md).
- Reading the session makes every admin route dynamic, so no admin page is prerendered or cached.

## 2. Reading data
Each admin page (`src/app/admin/<section>/page.tsx`) is a Server Component. Fetch there (or in a `_data/` function next to it) and pass plain, serializable props to client components. Keep types for each section in `src/app/admin/<section>/_data/types.ts`; the UI is written against those types, so they are the contract.

## 3. Writing data: forms and server actions
- Every kit control submits a native form value by its `name`, so a server action receives a normal `FormData`. See `/components/form-contract`: submit it to see exactly what an action receives (test: `tests/form-contract.spec.ts`).
  - Range sliders submit `name[]` twice (min, max). Multi-select toggle groups submit one `name` per value. Unchecked checkboxes and switches submit nothing.
  - Dates submit as `YYYY-MM-DD`.
- Server actions return `ActionState` from `src/lib/forms.ts`: `{ status, message?, fieldErrors?, data? }`.
  - `fieldErrors` are keyed by control `name`; the UI shows them under the matching field with `fieldError(state, "email")`.
  - `message` is user-facing: what happened and what to do next.
- `SubmitButton` shows the pending state automatically while the action runs (`useFormStatus`).
- Reference implementation: `src/app/components/form-contract/actions.ts` and `ContractForm.tsx`.

## 4. Local development
Without Supabase credentials, `next dev` skips the sign-in redirect (`src/lib/supabase/proxy.ts`) and `getCurrentAdmin()` returns a placeholder admin. With credentials set, local development behaves like production: you sign in for real, and only an address in `public.admins` reaches the admin portal. Production always requires both.

## 5. Accounts
There is no My account screen (owner decision, 28 Sep 2026: logins can be shared, and the app doesn't use the name). The sidebar footer is **Documentation** (`/admin/documentation`, rendered from `docs/user-guide/`) and a red **Sign out**. Only `signOut` (`src/features/auth/actions.ts`) is needed. Profile pictures, name editing and account deletion are **not** needed (that code has been removed).

## Dates and times (owner, 28 Sep 2026)
Every timestamp and date-time the backend sends or stores is UTC, as ISO 8601 with a `Z` (e.g. `2026-10-02T21:30:00Z`). The UI converts to the person's own time zone for display and converts their input back to UTC before saving. Date-only values with no time (e.g. a petition deadline) are plain `yyyy-mm-dd` and mean "until the end of that day in Waterloo Region" (America/Toronto). To avoid server/browser mismatches, the time zone should come from the browser (saved in a cookie on first visit) so server-rendered pages format in the same zone.

## Duplicate submits (owner, 28 Sep 2026)
The UI blocks a second click or Enter while a save is pending (`SubmitButton`: busy state, aria-busy, repeat clicks ignored). The backend should still be idempotent: each form render gets a one-time token sent with the save, and a repeated token returns the first result instead of creating a second record.

## Offline (owner, 28 Sep 2026)
No backend work. When there's no connection, what's on screen stays readable; submits and page changes are stopped with the "Goose stole your wifi." screen; route errors while offline show the same screen.

## Feature requirements
- [Intake form](./intake-form.md) (public, no sign-in)
- [Signup links](./signup-links.md)

## Support address
`BSF_SUPPORT_EMAIL` (`src/lib/contact.ts`) is where admins escalate a page that keeps failing to load. It is still the placeholder `{BSF email}`; set the real address there, and the load-error page turns it into a mailto link automatically.
