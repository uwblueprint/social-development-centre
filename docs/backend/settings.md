# Settings: backend

`/admin/settings` (the product) and `/design/settings` (the full design on demo data). Decisions: [../decisions/account.md](../decisions/account.md).

## Connected today
Two things on the page work against the database. Everything else in the design has no backend yet.

### Your name
- Table `people`: `first_name`, `last_name` (`full_name` is generated from them).
- Read: `getAccount()` (`src/features/account/queries.ts`) reads the signed-in admin's names.
- Write: server action `updateName` (`src/features/account/actions.ts`) → database function `update_own_name(p_first_name, p_last_name)` (`supabase/migrations/20261110000000_update_own_name.sql`).
  - Both names are required, trimmed, and at most 100 characters. The action checks first and returns `fieldErrors.firstName` / `fieldErrors.lastName`; the function raises `22023` for the same cases and `42501` when there is no signed-in person, so a bad call can't blank a name.
  - It only ever changes the caller's own row.
  - The design asks for the name in one field and splits it before saving (`splitName` in `src/app/design/(admin)/settings/data.ts`): the first word is the first name, the rest is the last name. One word only shows "Enter your first and last name." so the action never gets an empty last name.
  - Revalidates `/admin` so the sidebar and Admins list show the new name.

### Delete account
- Deleting your account is leaving the admin portal: `deleteAccount` → `removeAdmin(you)` → `remove_admin`. Your `admins` row goes; your `people` row and any membership stay. Another admin can invite you back from `/admin/admins` (`add_admin`).
- `remove_admin` returns `last_admin` when you are the only admin, and the action turns that into "You’re the only admin. Add another admin before you leave." The page also disables the button while you are the only admin (`getAccount().onlyAdmin`), so the refusal is a backstop for two admins leaving at once.
- On success the action signs you out of this browser and redirects to `/goodbye` (public: `signInPathFor` lets it through). It never returns on success.
- Any other failure returns "We couldn’t remove this admin. Try again.", shown inside the dialog.

## Design only, no backend yet
These are on `/design/settings` and need storage and server actions before they can ship:
- **Reply-to address**, **email footer**, and the 13 **email alerts** (each is a list of admin emails; an empty list means off). Alerts need a sender per event:
  - Outbox: email waiting for review (48 hours prior), email past due, emails couldn't send (after 3 tries). Sent by the emails engine. The full list and when each is created: [Notifications](./notifications.md).
  - Payments: card declined (PayPal tries again), payments stopped (after 2 declines), payment not matched to a person, refund or chargeback, payment received. Sent from the payment events.
  - Members: someone joins, membership cancelled, membership paused or changed (pause or new tier), unsubscribes from emails, referral joins. Sent from `member_events`.
- The email footer is plain text (a sign-off, a name and SDC's mailing address). The emails engine appends the unsubscribe, cancel and refer links itself.
- Save button label: **Save** when only your name or the email footer changed, **Save for all admins** when a reply-to or an alert changed.
