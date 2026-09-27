# Connecting the backend to the admin UI

The UI is built so the backend plugs in at a few fixed seams. Nothing in `src/components/` fetches data.

## 1. Who is signed in
`src/app/admin/_data/session.ts`
- `getCurrentAdmin()`: return the admin (`AdminUser` in `_data/types.ts`) or `null`. **Must check the SDC admin role**, not just sign-in. It throws in production until implemented, so the admin portal fails closed.

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
Without Supabase credentials, `next dev` skips the sign-in redirect (`src/lib/supabase/proxy.ts`) and `getCurrentAdmin()` returns a placeholder admin. Production always requires both.

## 5. Accounts
My account (a dialog in both portals; see `docs/patterns/AccountDialog.md`) and sign-out need these. Actions live in `src/features/account/actions.ts`; each throws in production until implemented. In development they change an in-memory override (`src/features/account/devAccount.ts`) that `getCurrentAdmin()` and `getCurrentPartner()` apply on top of the dev user.

- **Profile picture storage.** `updateAccount` receives `avatar`: a JPG, PNG or WebP file the browser has already scaled (shorter side 512px, well under 1 MB). Store it (e.g. a Supabase Storage bucket, one object per user, replaced on upload), and return its URL as `avatarUrl` on `AdminUser` / `PartnerUser`. `removeAvatar=1` deletes it; the UI falls back to initials. Re-check type and size on the server (the action already does). The avatar crops to a square in CSS, so store the image uncropped.
- **Name.** `name` is required, trimmed, up to 80 characters. It's the person's own display name: for a partner contact it's the same `name` admins see and edit in Partners, so both must write one field.
- **Delete account.** `deleteAccount(portal)` must, for the signed-in user only: remove their sign-in (Supabase auth user) and their access (admin role, or their partner contact), end every session, then redirect to `/login?accountDeleted=1`.
  - **Admins:** keep their past actions (audit entries, created or edited records) and show the actor as "Former admin" instead of their name. Don't cascade-delete their rows; null or anonymize the person reference.
  - **Partners:** remove the contact from their organization's team. Open question for the owner: what happens when they're the organization's last active contact.
- **No email or password changes.** Sign-in is by email link, so there's no password. Email changes aren't offered yet (docs/decisions/platform.md, decision 3).
- **Sign-out.** `signOut(firstName?)` ends the Supabase session and redirects to `/login?signedOut=1&name={first name}`. Nothing else is needed from the backend.

## Feature requirements
- [Partners](./partners.md)
- [Opportunities](./opportunities.md) (both portals, plus the partner session)
- [Community](./community.md)
