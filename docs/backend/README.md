# Connecting the backend to the admin UI

The UI is built so the backend plugs in at a few fixed seams. Nothing in `src/components/` fetches data.

## 1. Who is signed in
`src/app/admin/_data/session.ts`
- `getCurrentAdmin()`: return the admin (`AdminUser` in `_data/types.ts`) or `null`. **Must check the SDC admin role**, not just sign-in. It throws in production until implemented, so the admin portal fails closed.
- `getAdminNavCounts()`: badge counts per sidebar section (e.g. `{ partners: 3 }` for pending invitations needing attention). Return `{}` for none.

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

## Feature requirements
- [Partners](./partners.md)
- [Opportunities](./opportunities.md) (both portals, plus the partner session)
- [Community](./community.md)
