# Settings: backend

`/admin/settings` (the product) and `/design/settings` (the full design on demo data). Decisions: [../decisions/account.md](../decisions/account.md).

## Connected today
Two things on the page work against the database. Everything else in the design has no backend yet.

### Your name
- Table `people`: `first_name`, `last_name` (`full_name` is generated from them).
- Read: `getAccount()` (`src/features/account/queries.ts`) reads the signed-in admin's names.
- Write: server action `updateName` (`src/features/account/actions.ts`) → database function `update_own_name(p_first_name, p_last_name)` (`supabase/migrations/20261110000000_update_own_name.sql`).
  - First name is required; last name is optional (one-word names are stored with `last_name` null, and an empty one is saved as null). Both are trimmed and at most 100 characters. The action checks first and returns `fieldErrors.firstName` / `fieldErrors.lastName`; the function raises `22023` for the same cases and `42501` when there is no signed-in person, so a bad call can't blank a name.
  - It only ever changes the caller's own row.
  - Revalidates `/admin` so the sidebar and Admins list show the new name.

### Delete account
- Deleting your account is leaving the admin portal: `deleteAccount` → `removeAdmin(you)` → `remove_admin`. Your `admins` row goes; your `people` row and any membership stay. Another admin can invite you back from `/admin/admins` (`add_admin`).
- `remove_admin` returns `last_admin` when you are the only admin, and the action turns that into "You’re the only admin. Add another admin before you leave." The page also disables the button while you are the only admin (`getAccount().onlyAdmin`), so the refusal is a backstop for two admins leaving at once.
- On success the action signs you out of this browser and redirects to `/goodbye` (public: `signInPathFor` lets it through). It never returns on success.
- Any other failure returns "We couldn’t remove this admin. Try again.", shown inside the dialog.

## Design only, no backend yet
These are on `/design/settings` and need storage and server actions before they can ship:
- **Reply-to address**, **email signature**, and the six **email alerts** (each is a list of admin emails; an empty list means off). Alerts need a sender per event: the member triggers in `member_events`, the Outbox timers in the emails engine, and `add_admin` for a new admin.
- The signature is plain text (a sign-off, a name and SDC's mailing address). The emails engine appends the unsubscribe, cancel and refer links itself.
- Save button label: **Save** when only your name or signature changed, **Save for all admins** when a reply-to or an alert changed.
