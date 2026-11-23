# Member directory: what the design needs from the backend

Design screens: `src/app/design/member-directory/` (demo data in `data.ts`; the `Member` type there is the
contract the screens read). Product context: the Member Directory PRD in Notion, and the Oct 23 client meeting
notes on it. Existing schema: `docs/backend/directory.md` (PR #40).

Items marked **new** don't exist in the PR #40 schema yet.

## The list
- Per person: first name, last name, email, tags, lifetime value (sum of their payments), subscribed (from
  `can_email`), joined date, and **cancelled date (new)**. Memberships renew on their own, so there is no end date
  and no status: someone is a member until they cancel.
- **Cancelled (new):** a member can cancel. Cancelled people leave the list (and the title count) by default but stay
  findable by ticking Cancelled in the Membership filter. Needs `cancelled_at` on the member.
- Unsubscribed people are still members. The default view shows subscribed members only (the Membership filter adds unsubscribed and cancelled people); an unsubscribed person shows an "Unsubscribed" badge beside their name.
- Search across name, email and tag names.
- Filters: tags, cancelled, subscription (everyone / subscribed only / unsubscribed only), joined date, plus the
  intake-form filters.
- Sort by name, email, lifetime value, or any optional column (default: name).
- Optional columns: joined, location, referred by.
- CSV export of the current list or the selected rows: first name, last name, email, tags, lifetime value, the
  optional columns shown, subscribed, cancelled date.

## Bulk actions
- Tag many: `tag_members(tag, person_ids[])` from a selection, a filtered list, or pasted emails (unknown
  emails are shown and skipped). Creating a tag while tagging: `create_tag(name)`.
- Email many: opens a one-off email to those people (Emails feature).

## One member's panel
- Header: name, email, tags, plus a "Cancelled <date>" badge and an "Unsubscribed" badge when they apply.
  A ⋯ menu holds Edit member and Delete member.
- Tags edit in place: remove (`untag_members`); type a name and press Enter to add it. A name matching an
  existing tag (any case) reuses it, otherwise `create_tag` + `tag_members`.
  **Tag colour (new):** each tag shows in one of the kit's five badge categories or neutral. Needs a `color`
  column on `tags` (nullable, 1–5). The screen shows colours; choosing one isn't designed yet.
- **Note (new):** one running note per member (client): text, last updated at, last updated by. Edited in place;
  saving it empty clears it.
- **Payments (new):** amount, date, method (E-transfer / Cash or cheque / Online), optional note, and who it was
  for when someone pays for another person's membership. Record, edit, delete. The section shows the lifetime
  value (sum of the member's payments, gifts included), how many payments that was, and the total and recipients of
  any gift memberships they paid for. Each payment appears in Activity.
- Activity, newest first, exact dates, filterable by Emails / Member activity, searchable (title, detail, email
  body), 12 at a time with "Show N more" (client, Oct 30: search, filter by type, load more):
  - emails from `email_sends` (title, date, who sent it when an admin did rather than automatically, body without
    the footer). Every email is its own row: the screen never groups emails by template, so no template field is
    needed. No open tracking (client, Oct 23). No reply tracking or flags: replies stay in the inbox.
  - payments (from Payments above), editable from their row;
  - `tag_events` (Tagged / Removed tag);
  - referrals (`referrals`: "X joined from their invite");
  - joined, with how they joined (signup source): "Joined via <source>", "Joined with a gift from <name>",
    "Added by an admin"; cancelled membership.
- Intake form answers (interests, location, time they can give, what they hope for) and when they were answered.
- Edit member: first name, last name, email (unique), address.

## Adding a member
First name, last name, email (unique), an optional first payment (amount and method), join date (backdate only while
adding; PR #40's `add_member(..., p_joined_at)`), and "Send join emails" (default on; PR #40's `join_emails`).

## Bulk import
Design: `ImportMembersDialog.tsx`. An admin picks a CSV (a Ride for Refuge export, an event sign-in sheet), matches
columns (email required; first name, last name and tags optional), reviews, then adds everyone. The file is parsed in
the browser, so the backend never sees the file itself.
- **Bulk create (new):** one action taking up to 1,000 rows of `{ email, first_name?, last_name?, tags[] }`, plus
  `add_tags_to_existing` (bool). Creates people as members, joined today, "Added by an admin", `join_emails` off. Same shape as `add_member`, run in one transaction per batch.
- **Dedupe by email on the server**, case-insensitively, against the directory and within the file. The screen checks
  too, but the server decides: someone may have been added since the dialog opened.
- **Per-row results:** for each input row, `created`, `skipped_existing` (with `tags_added` when the box was ticked),
  `duplicate_in_file` or `invalid` with a reason. The screen shows counts and offers the failed rows as CSV.
- **Tags:** names match existing tags case-insensitively; unknown names are created (`create_tag`) in the same call.
- **Limits:** 1,000 rows per import (the screen refuses larger files with "split the file"); reject over this size
  server-side too. Rate-limit per admin.
- **Audit log:** one entry per import (who, when, file name, counts created / skipped / failed) and the usual
  `tag_events` and "Added by an admin" activity per person. Undo (from the toast) removes the people this import created.

## Deleting people

- Deleting someone stops every email to them, including automatic ones (any trigger).
- Nobody is notified. Staff tell the person themselves if needed.
- Anyone who pays for a membership (recorded payments, not cancelled): deleting them cancels their recurring payment
  with the payment provider. That can't be reversed, so these deletes have no Undo and need "I understand" typed.
  Deletes of people who don't pay keep Undo (soft-delete, or return what was removed).
- Needed: a way to tell whether someone has an active recurring payment (today the design guesses from recorded
  payments and cancelled status), and `delete_people(ids)` that cancels those payments in the same action.

## Tags
Design: `TagManager.tsx`, opened from the page header. Lists every tag with how many people have it.
- **Rename tag (new):** `rename_tag(tag_id, name)`. Names are unique case-insensitively; the server rejects a clash.
  People keep the tag (it's the same row), so their tags and tagged dates follow the new name.
- **Set tag colour (new):** `set_tag_color(tag_id, color | null)`, using the `color` column above.
- **Delete tag (new):** `delete_tag(tag_id)`: removes it from everyone who has it. Undo (from the toast) needs it
  back with the same people and tagged dates, so either soft-delete or return what was removed.
- Per-tag counts of people (members and cancelled people alike, as the list's pool shows them).

## Not here
No phone numbers or call logging (client, Oct 23). No tax receipts (client, Oct 23).

## Open questions
- **A member's private link.** Earlier screens had "Copy their private link" (`/me/<id>`), a no-password
  link to a member self-serve page (update details, change their amount, unsubscribe). It's removed from the
  design until this is decided:
  - Is there a self-serve page at all? The client ranked it low on Oct 23, and Suhanya didn't want members
    making a username and password.
  - If there is: what can a member do there, does the link expire, and how does an admin reset a link
    someone has forwarded? Anyone holding the link gets in.
