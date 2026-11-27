# Settings: backend

`/admin/settings` (the product) and `/design/settings` (the full design on demo data). Decisions: [../decisions/account.md](../decisions/account.md).

## Connected today
Three things on the page work against the database. Everything else in the design has no backend yet.

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

### Email footer
- **One footer for all of SDC, not one per admin** (owner, 21 Nov 2026). Stored once in `email_footer` (a single row; `supabase/migrations/20261124000000_email_footer.sql`), never looked up by the signed-in or sending admin. Any admin can change it.
- It's a small rich-text document (TipTap JSON, `src/features/email-footer/doc.ts`): plain lines with bold, italic and underline, plus three fixed links, Unsubscribe, Refer a friend and Cancel membership, which can be moved but not removed or doubled. No row yet means the default footer (`defaultFooterDoc`). A footer saved before the refer link existed gets it right after Unsubscribe when it's read (`withReferLink`), so no stored data was rewritten.
- Read: `getEmailFooter()` (`src/features/email-footer/queries.ts`). Write: server action `saveEmailFooter` → `set_email_footer(p_doc)`, which checks the caller is an admin and that the document has exactly one of each fixed link (`22023` otherwise), so a bad call can't drop the unsubscribe or refer link.
- **The refer link's words** are the admins' to choose (from #95): click its tag in the footer editor to change them (**Save for all emails** saves just the words, straight away). They're stored on the link (`attrs.label`; none means "Refer a friend"). Rules, checked by `referTextError` and again by `set_email_footer` (`supabase/migrations/20261127000100_footer_refer_link.sql`): 1–40 characters, line breaks and runs of spaces become one space, no control or invisible characters, no `<` or `>`, and nothing that looks like an address (`@`, `://`, `www.`), because spam filters flag link text that doesn't match where it goes.
- **Sends read the current footer when they go out.** Every email sent after a change ends with the new footer, including emails already scheduled or waiting in the Outbox: the daily run reads `email_footer` and `render.ts` renders it, with the unsubscribe link and the member's refer link (`/refer/<people.unsubscribe_token>`) filled in. The refer link goes only to current members (`email_deliveries.can_refer`), so nobody lands on "This link doesn't work". Cancel membership has no page yet, so it's left out of sent emails (`SENT_LINKS`).
- The previews show the same saved footer: the automatic email editor, its preview dialog and the Outbox's email view (`FooterContent`).

## Design only, no backend yet
These are on `/design/settings` and need storage and server actions before they can ship:
- **Reply-to address** and the six **email alerts** (each is a list of admin emails; an empty list means off). Alerts need a sender per event: the member triggers in `member_events`, the Outbox timers in the emails engine, and `add_admin` for a new admin.
- Save button label: **Save** when only your name or the footer changed, **Save for all admins** when a reply-to or an alert changed.
