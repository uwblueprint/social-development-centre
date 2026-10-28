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
  with the condition check. `delete_tag` must refuse a tag an automatic email uses, and
  `email_sends` needs foreign keys to the automatic and one-off email tables, once those exist.

## For Automatic Emails and One-off Emails: `email_sends`
One row is one email to one member. The Outbox, recipients, email history and Insights all read it.
The sending worker writes it with the service role; admins only read.

- Status: `scheduled`, `waiting_for_review`, `sent`, `not_sent` (with `not_sent_reason`). "Couldn't
  send" is `failed_at` set on a send that isn't sent.
- Set `automatic_email_id` + `member_event_id`, or `one_off_email_id`, and `email_name` (kept as it
  was, for history).
- The database enforces, so the worker can't get them wrong:
  - one send per occurrence (unique `automatic_email_id`, `member_event_id`);
  - the send goes to the member the occurrence happened to;
  - unsubscribed or bounced: inserted as Not sent, waiting sends become Not sent the moment they
    unsubscribe or bounce, and marking one sent fails;
  - sent is final and keeps `sent_subject`, `sent_body`, `sent_at`;
  - Not sent is final, except `unpublished`, which republishing can bring back.
- `email_send_changes` logs every status change and who made it.
- `member_email_history`: one member's sends with what started each one.

## Notes and timeline
- `member_notes`: `add_note`, `edit_note` (keeps the earlier text in `member_note_revisions`),
  `delete_note` (hides it; the row stays).
- `member_timeline`: one member's joins, referrals, tags added and removed, notes, emails (once, at
  the send date, with the current status) and subscription changes, for the member page.
- `subscription_events`: every unsubscribe, resubscribe, bounce and cleared bounce (people only keeps
  the current state).
- `add_members(jsonb, joined_at, join_emails)`: many at once; returns `added`, `already_member` or
  `invalid_email` per row.

## App code (`src/features/members/`)
The contract the directory screens build against. Types in `types.ts`.

- Reads (`queries.ts`): `listMembers()` (with tags, join date, subscription), `getMember(id)` (everything on the
  member page: tags, referrals, who referred them, notes, timeline, email history), `listTags()` (with member
  counts), `getNoteRevisions(noteId)`.
- Writes (`actions.ts`, each returns `ActionState`):
  - `addMember` (form: `fullName`, `email`, optional `joinedAt` YYYY-MM-DD and `joinEmails`), `addMembers`
    (form: `members`, one per line as "Name, email", "Name <email>" or "email"; reports added, already
    members and lines that weren't emails; sends no sign-in links), `removeMember`.
  - Tags: `createTag`, `renameTag`, `deleteTag`, `tagMembers`, `untagMembers`, `tagByEmails` (paste a list:
    the "30 people came to the event" case).
  - Notes: `addNote`, `editNote` (keeps the earlier text), `deleteNote` (hides it).
  - `addReferral`, `unsubscribeMember`, `importUnsubscribes`.
- Dates from forms are YYYY-MM-DD and mean the start of that day in Waterloo Region.


## Links: who acted, from which email
Every email carries its own token (`email_links`), so a click says who it was and which email it came from.

- Every send gets one automatically. Every email goes through our own sender (SMTP, no Mailchimp), so
  there are no links without a send.
- URLs (`src/features/links/urls.ts`): intake `/intake-form?t=<token>`, unsubscribe `/unsubscribe/<token>`,
  referral `/refer/<token>`. None of them need sign-in.
- **Unsubscribe page:** opening it never unsubscribes; the member clicks Unsubscribe, can then pick an
  optional reason (`give_unsubscribe_reason`, stored on `subscription_events.reason` as an id), and can
  resubscribe from the same page. The reasons in `src/features/links/reasons.ts` are placeholders until
  SDC lists theirs. Not built yet: the one-click unsubscribe POST that Gmail and Yahoo need
  (`List-Unsubscribe-Post`); add it with the sender. Also open: whether unsubscribing should offer to end
  the membership too (needs payments; Unsubscribe & Cancel Membership PRD).
- **Referral page:** a placeholder following the PRD (the friend leaves their own name and email). The
  client demo had the member type in their friend's details instead; rework once that's decided.
- No sign-in on these pages; the token is the proof. Functions callable with the public key:
  `open_link(token, page)` (logs the open, returns the first name for a greeting),
  `unsubscribe_by_link`, `resubscribe_by_link` (record which email it came from on
  `subscription_events.send_id`), `give_unsubscribe_reason(token, reason)`, `refer_by_link(token, email, full_name)` (the referrer is whoever the
  link was for), `submit_intake(..., p_link_token)` (attributes the submission: `intake_submissions.person_id`).
- `link_events` logs every open and action per token. Intake opens and submissions show on the member
  timeline.
- Intake analytics: key per-person logs on the same token. `/intake-form` passes it to `IntakeForm` as
  `linkToken` (only when it's a real token); the open link has none and stays anonymous.
