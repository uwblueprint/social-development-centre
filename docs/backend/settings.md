# Settings: backend

`/admin/settings` (the product) and `/design/settings` (the full design on demo data). Decisions: [../decisions/account.md](../decisions/account.md).

## Connected today
Three things on the page work against the database. Everything else in the design has no backend yet. One **Save** saves whatever changed (`saveSettings`, `src/features/account/actions.ts`); it says **Save for all admins** when the refer link text changed.

### Refer link text
Every member email's footer has a **Refer a friend** link next to Unsubscribe, to `/refer/<person token>` (see [referrals.md](referrals.md)). It is always there: admins can change its words, not remove it.
- Table `email_settings`: one row, ever (`id` can only be true; seeded by `supabase/migrations/20261127000000_refer_link_text.sql`; no insert, update or delete for anyone). `refer_link_text` defaults to "Refer a friend". Admins can read it; nobody else can.
- Write: `saveSettings` → `set_refer_link_text(p_text)`. It turns line breaks, tabs and runs of spaces into one space and trims, then raises `22023` for text the footer can't show: empty, over 40 characters, control or invisible characters (zero-width, right-to-left overrides), `<` or `>`, or anything that looks like an address (`@`, `://`, `www.`; spam filters flag link text that doesn't match where it goes). `42501` for non-admins. The table's check repeats these rules. The same rules run first in the browser and the action (`referLinkTextError`, `src/features/automatic-emails/footer.ts`), so the database refusing is a backstop.
- The text is written only when it differs from what the page loaded, so an admin saving their name never undoes another admin's newer link text. Two admins changing the text at once: the last save wins.
- Read: Settings reads it with `getAccount()` and fails loudly, so nobody saves over text that couldn't be read. The portal's layout reads it once (`getReferLinkText`) for every email footer the portal draws (the email editor, the Outbox, the preview); a failed read shows the default there. Saving revalidates `/admin`.
- Sending: the run route reads it with the secret key; if that fails, the link goes out with the default text rather than holding up the day's emails. `email_deliveries()` returns `can_refer` (a current member, the refer page's own test), and an email to someone whose membership ended leaves the link out instead of linking to "This link doesn't work". HTML: `… Unsubscribe from emails · <text>`. Plain text: `<text>: <url>`. The text is escaped.
- Tests: `supabase/tests/refer_link_text.test.sql` (32 checks).

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
- The signature is plain text (a sign-off, a name and SDC's mailing address). The emails engine appends the unsubscribe, cancel and refer links itself. The refer link is sent today; the sender doesn't add a **Cancel membership** link yet, though the editor and Outbox footers show one.
- Save button label: **Save** when only your name or signature changed, **Save for all admins** when a reply-to or an alert changed.
