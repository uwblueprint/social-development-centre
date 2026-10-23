# Member directory: data

Migrations: `supabase/migrations/20261021021813_member_directory.sql`, then
`20261021021938_one_membership.sql` (one kind of member). Reads go through RLS (admins see
everything); every write goes through a function. Product decisions: [../decisions/directory.md](../decisions/directory.md).

## People and memberships
- `people.first_name`, `people.last_name` are stored; `full_name` is generated from them. Functions that
  still take one name (`add_admin`, `add_member`) split it at the first space.
- `memberships.joined_at`: the join date. Defaults to now; `add_member(..., p_joined_at)` backdates a
  new member. Nothing changes it afterwards.
- `memberships.join_emails`: the admin's "Send join emails" choice when adding (default true). The emails
  engine skips the join moment when it's false.

## Email subscription
One state per person, for every email (automatic and one-off). **Check `can_email(person_id)` before every
send.**
- `unsubscribed_at` + `unsubscribe_reason`: `self` (their link), `admin`, `complaint` (spam report),
  `imported` (an uploaded list of existing unsubscribes).
- `bounced_at` + `bounce_detail`: one hard bounce. Cleared automatically when the email changes.
- `unsubscribe_token`: the unsubscribe page's link. `unsubscribe_by_token` / `resubscribe_by_token` work
  signed out and return the first name (`''` when there is none, `null` for an unknown link).
- `unsubscribe_member(id)`: an admin stops someone's emails. There is no admin resubscribe.
- `import_unsubscribes(emails[])`: known addresses are unsubscribed; unknown ones go to `suppressed_emails`
  (hashed), and `add_member` starts that person out unsubscribed if they're added later.
- `record_email_event(email, 'hard_bounce' | 'complaint', detail)`: for the provider's webhook, service role
  only.

## Tags
- `tags` (name unique, case-insensitive), `member_tags` (who has what now), `tag_events` (every add and
  remove, with who and when; kept, with `tag_name`, after the tag is deleted).
- `create_tag(name)` returns the existing tag for a name already in use. `rename_tag` returns `renamed` or
  `taken`. `delete_tag` returns `deleted`; the emails engine adds `in_use` for tags an automatic email uses.
- `tag_members(tag, person_ids[])` / `untag_members(...)`: one person or many. Each change is one
  `tag_events` row (a bulk tag shares one timestamp) and calls `recheck_member`. Returns how many changed.
- `recheck_member(person_id)` does nothing yet. The emails engine fills it in to re-check waiting sends.

## Referrals
`referrals`: one row per invitation (`referrer_id`, `referred_email`, `created_at`), with `referred_id` and
`joined_at` set when that address joins. How invitations are made and matched is still open; nothing writes
to it yet.

## Not here yet
The sends table (scheduled / waiting for review / sent / not sent, with reasons) belongs to the emails engine
(see PR #29's `docs/backend/emails-engine.md`). The directory's email history reads it once it exists.

## For Automatic Emails: `member_events`
Every automatic email trigger is one row in `public.member_events`, written by triggers on
`memberships`, `referrals` and `tag_events`, so no path can skip or double one. Read this table only.

| `kind` | `person_id` | Automatic email trigger |
|---|---|---|
| `joined` | the new member | joins (any way); without a referral when `referral_id` is null; via referral when set |
| `referred_someone` | the referrer | member refers someone |
| `referral_joined` | the referrer | member's referral joins |
| `tag_added` | the tagged member | tag added (`tag_id`, `tag_name`) |

- One send per occurrence: make (automatic email, `member_events.id`) unique on sends.
- Send date: `at` plus the delay. A backdated join has `at` = the join date.
- `join_emails = false` on `joined` and `referral_joined`: join triggers don't fire (backfilled members).
- Adding, removing and re-adding a tag gives two `tag_added` rows. Rejoining after removal gives a
  new `joined` row without a referral.
- Personalization: the referred person's name is on `referrals` (`referred_first_name`,
  `referred_last_name`) until they join, then on `people` via `referrals.referred_id`.
- Still to wire: `recheck_member(person_id)` is an empty stub called after tag changes; fill it in
  when sends exist. `delete_tag` must refuse a tag an automatic email uses once that table exists.

## Notes and timeline
- `member_notes`: `add_note`, `edit_note` (keeps the earlier text in `member_note_revisions`),
  `delete_note` (hides it; the row stays).
- `member_timeline`: one member's joins, referrals, tags added and removed, notes, unsubscribe and
  bounce, for the member page. Email sends join it when they exist.
- `add_members(jsonb, joined_at, join_emails)`: many at once; returns `added`, `already_member` or
  `invalid_email` per row.
