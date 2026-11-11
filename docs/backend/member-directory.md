# Member directory: what the design needs from the backend

Design screens: `src/app/design/member-directory/` (demo data in `data.ts`; the `Member` type there is the
contract the screens read). Product context: the Member Directory PRD in Notion, and the Oct 23 client meeting
notes on it. Existing schema: `docs/backend/directory.md` (PR #40).

Items marked **new** don't exist in the PR #40 schema yet.

## The list
- Per person: first name, last name, email, membership end date, tags, subscribed (from `can_email`).
- Search across name, email and tag names.
- Filters, all typed in by the admin: membership end date range, first name, last name, email, any number of
  tags (all must match), status. "Next 30/60/90 days" fills the end-date range from today.
- Sort by name, email or end date (default: end date, soonest first).
- CSV export of the current list or the selected rows: first name, last name, email, status, membership type,
  join date, end date, subscribed, tags.
- **Membership end date (new).** The client needs it (Oct 23); PR #40 only stores `joined_at`. Default: 12 months
  after joining; editable from Change membership.
- Flags column: the "Ends in N days" / "Ended N days ago" tag, shown only within 30 days of the end date or
  after it. The UI computes it from the end date; nothing to store.

## Bulk actions
- Tag many: `tag_members(tag, person_ids[])` from a selection, a filtered list, or pasted emails (unknown
  emails are shown and skipped). Creating a tag while tagging: `create_tag(name)`.
- Email many: opens a one-off email to those people (Emails feature).

## One member's panel
- Header: name, email, status (Member / Waiting for payment / Membership ended), subscribed or unsubscribed, tags.
  A ⋯ menu holds Edit member and Delete member.
- Tags edit in place: remove (`untag_members`); type a name and press Enter to add it. A name matching an
  existing tag (any case) reuses it, otherwise `create_tag` + `tag_members`.
  **Tag colour (new):** each tag shows in one of the kit's five badge categories or neutral. Needs a `color`
  column on `tags` (nullable, 1–5). The screen shows colours; choosing one isn't designed yet.
- **Note (new):** one running note per member (client): text, last updated at, last updated by. Edited in place;
  saving it empty clears it.
- **Membership (new):** type (Paid / Complimentary / Gifted / Sponsored), yearly amount for paid, end date.
  The 3, 6 and 9-month marks are computed from the start of the current membership year (end date minus 12
  months, or the join date if later); nothing to store. Once it has ended, the section says "Membership ended <date>"
  instead (Change still renews it).
- **Payments (new):** amount, date, method (E-transfer / Cash or cheque / Online), optional note, and who it was
  for when someone pays for another person's membership. Record, edit, delete. The section shows only the total
  (sum of the member's payments); each payment appears in Activity. Recording a payment for a "Waiting for
  payment" member makes them a member.
- Activity, newest first, exact dates, filterable by Emails / Member activity, searchable (title, detail, email
  body), 12 at a time with "Show N more" (client, Oct 30: search, filter by type, load more):
  - emails from `email_sends` (title, who sent it when an admin did rather than automatically, body without
    the footer). No open tracking (client, Oct 23). No reply tracking or flags: replies stay in the inbox.
  - payments (from Payments above), editable from their row;
  - `tag_events` (Tagged / Removed tag);
  - referrals (`referrals`: "X joined from their invite");
  - joined, with how they joined (signup source): "Joined via <source>", "Joined with a gift from <name>",
    "Added by an admin"; membership ended.
- Intake form answers (interests, location, time they can give, what they hope for) and when they were answered.
- Edit member: first name, last name, email (unique), address.

## Adding a member
First name, last name, email (unique), type, amount and method for paid, join date (backdate only while
adding; PR #40's `add_member(..., p_joined_at)`), and "Send join emails" (default on; PR #40's `join_emails`).

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
