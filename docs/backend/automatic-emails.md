# Automatic Emails: backend

Emails that send themselves when something happens to a member: a thank-you after joining, a
check-in a month later. Every email starts from an event plus a delay; there are no recurring
emails (PM, 9 Nov 2026). Design references: the "Automatic Emails
Prototype" and the conditions prototype (Oct 2026).

**Built:** storage, the draft / published / trash lifecycle, conditions, the Outbox, and the database
half of the daily run (`supabase/migrations/20261111000000_automatic_emails.sql`).
**Also built:** the daily run route and the sender (see [Sending](#sending)).
**Not built yet:** the unsubscribe page, review alerts and the admin UI (see [Next](#next)).

## The model: facts are stored, eligibility is checked live

```
event happens (join, tag added, referral)
        │  database trigger
        ▼
email_occurrences   facts: "this email is due for this member on this date"
        │
        │  automatic_email_matches(email, person): conditions, checked live, never stored
        ▼
Outbox              outbox_upcoming(): everything due in the next 30 days, for whoever matches now
        │
        │  daily run: prepare_due_sends() checks everyone once more, then email_deliveries()
        ▼
email_sends         only what's decided: approved or edited, sending, sent, not sent (with a reason)
```

- **Occurrences are queued the moment the event happens**, by triggers on `memberships`,
  `tag_events` and `referrals`. `add_member`, `tag_members` and the referral code don't know automatic
  emails exist.
- **Overdue events are skipped** (PM, 3 Nov 2026). If an email would already be past due when its
  event is recorded (a member added with an old join date and join emails on), it isn't queued.
- **Conditions are never used to schedule.** The Outbox asks "who matches now", so it's always
  current: someone who gains a qualifying tag appears, someone who loses it disappears. Editing a
  draft's conditions, or tagging members, reschedules nothing.
- **The send-day check handles drift.** If someone was in the Outbox but no longer matches on the
  day, they're recorded as `not_sent` / `no_longer_matched`, and the same happens for unsubscribed
  and bounced members.
- **Emails go out once a day** (PM, 27 Oct 2026: there is no "immediately"). Due dates are calendar
  dates in Waterloo Region (`due_on date`, compared to `toronto_today()`). A delay of 0 means
  "within a day": the next daily run.

## What it replaced

`20261023000000_member_events` (Member Directory, phase 2) had its own `email_sends`, built as one
row per send created up front. This migration drops it, along with `email_send_changes`, its two
triggers, and the unsubscribe step in `subscription_changed()` that cancelled waiting sends (the
send-day check covers that now). `member_events`, notes and subscription history stay.

The member page's views are rebuilt on the new tables with the same columns
(`src/features/members/queries.ts` reads them):
- `member_email_history`: every `email_sends` row. `pending` and `sending` show as `scheduled`, or
  `waiting_for_review` while a review-mode send has no approval. `send_at` is 10:30 on `due_on`.
- `member_timeline`: as before, with its email rows taken from `member_email_history`.

Upcoming sends nobody has approved or edited have no row yet, so they aren't in the member's
history; the Outbox lists them.

## Conditions

Stored on `automatic_emails.conditions` and validated on save (`22023` if malformed):

```json
{ "version": 2,
  "only":  ["<tag id>", "…"],
  "never": ["<tag id>", "…"],
  "joined": { "op": "between", "from": "2025-01-01", "to": "2025-06-30" } }
```

| Rule | Meaning |
|---|---|
| `only` (Has tag) | Has **any** of these tags. Empty = no rule. |
| `never` (Doesn't have tag) | Has **none** of these tags. Always wins over `only`. |
| `joined.op` | `any`; `before` / `after` `from` (exclusive); `between` `from` and `to` (inclusive, either order; with one end it means on or after / on or before). A rule missing its date counts as every member, as the editor shows it. |

- The rules combine with AND. With none set, the email goes to every member. Only members match.
- Tags are stored as **ids**, so renaming a tag doesn't break an email.
- An email triggered by a tag ignores that tag in its own lists, but the member must still have it:
  if it's removed before send day, they drop out of the Outbox and are recorded `no_longer_matched`.
- `delete_tag` returns `'in_use'` while a draft or published email starts from the tag or lists it.
  Emails in trash just lose it from their conditions.
- Roles aren't a condition yet. If they become one, they belong in `automatic_email_matches()`.

## Storage

### `automatic_emails`
| Column | Notes |
|---|---|
| `name`, `subject` | Blank allowed while a draft is set up; publishing requires both. |
| `state` | `draft`, `published`, `trash`. Only drafts can be edited. |
| `trigger` | Events: `join_any`, `join_no_referral`, `join_referral`, `refers`, `referral_joins` (both referral triggers send to the referrer), `tag_added` (with `trigger_tag_id`). |
| `delay_amount`, `delay_unit` | `days` ≤ 365, `weeks` ≤ 52, `months` ≤ 24, `years` ≤ 5. Calendar months and years: 31 Jan + 1 month = 28 Feb. |
| `conditions` | See above. |
| `mode` | `auto`, or `review` (each send waits in the Outbox for approval). |
| `alert_enabled`, `alert_to`, `alert_when` | Review mode only. `alert_to` defaults to suhanya@waterlooregion.org (PM, 3 Nov 2026). `alert_when`: `waiting`, `due_soon`, `past_due`. |
| `body` | Opaque JSON from the Email Editor (its own PRD). |

### `email_occurrences`
One per (email, `key`), so an event that fires twice still queues once. Keys:
`join:<person>:<joined epoch>`, `tag:<tag event id>`, `refers:<referral id>`,
`referral_joins:<referral id>`.

Each row stores `person_id` (who it goes to), `event_at`, `context` (`tag_id`, `referral_id`, …),
`due_on`, `missed`, and `status`: `pending`, `resolved`, `paused` or `cancelled`.

Whether a join counted as referred is checked live too, because how referrals get matched to new
members is still open, and by send day the match has had time to happen.

### `email_sends`
A row exists only once something is decided for one person:

| `status` | Meaning |
|---|---|
| `pending` | An admin approved and/or edited it in the Outbox (`approved_at`, `subject_override`, `body_override`). |
| `sending` | The daily run took it; the sender hasn't confirmed yet. |
| `sent` | Confirmed (`sent_at`, `provider_message_id`). |
| `not_sent` | `not_a_member` (removed before send day), `no_longer_matched`, `unsubscribed`, `bounced`, `trashed`, or `failed` (three attempts). |

**Access:** admins can read all three tables (RLS). Writes go through the functions below.
`email_candidate_state`, the internal view that pairs each occurrence with its member's current state, isn't
readable by `anon` or `authenticated`, because it sees every member's tags.

## Functions

All admin functions raise `42501` for non-admins and `55000` when the email is in the wrong state.

### Lifecycle (admin)
| Function | Effect |
|---|---|
| `create_automatic_email()` → `uuid` | A blank draft. |
| `save_automatic_email(id, patch jsonb)` | Autosave: applies only the fields present in `patch`. Drafts only. An unknown field or bad conditions raise `22023`. |
| `duplicate_automatic_email(id)` → `uuid` | A draft named "Copy of …". History stays with the original. |
| `publish_automatic_email(id)` → `text[]` | Returns what's still missing, in the editor's words (`add a name`, `pick a tag`, `add a subject`, `fix the alert email`). Empty = published. No backfill: only events after publishing count. |
| `unpublish_automatic_email(id)` | Back to draft, and no longer live: nothing sends and new events aren't recorded until it's published again. What was already queued waits, paused. Outbox edits and approvals are deleted. |
| `trash_automatic_email(id)` | Everyone in its Outbox, and anything in flight, is recorded Not sent (`trashed`). Occurrences are cancelled; history is kept. |
| `restore_automatic_email(id)` | Back to Drafts. Nothing from while it was in trash comes back. |

**Publishing again after an unpublish:**
- Paused occurrences from a different trigger or tag are cancelled.
- Event occurrences queued before the unpublish get due dates from the current delay. Any whose
  date has passed are due today with `missed = true`, so they wait for review whatever the mode.
  Events from while it was unpublished were never recorded, so they don't come back.
- Rejoining is a new join: a member who's removed and added again gets the join emails again.

### Outbox (admin)
| Function | Returns |
|---|---|
| `outbox_upcoming(days = 30)` | One row per occurrence due in the next `days`, for people who match now and can be emailed. `status`: `scheduled` (sends on its own), `waiting_review`, `approved`, `past_due` (needed review and its day passed). Also `missed`, `subject` (with any override) and `edited`. |
| `automatic_email_eligible(id)` | The editor's "N members currently eligible": every member the conditions match right now. |
| `approve_send(occurrence_id, person_id)` | Approves one send. Raises `55000` if it's no longer in the Outbox. |
| `edit_send(occurrence_id, person_id, subject, body)` | Overrides one send's subject and/or body (null = use the template's). |

### Daily run (service role)
| Function | Effect |
|---|---|
| `prepare_due_sends(today = toronto_today())` → ready count | For each occurrence due on or before today, checks its member again: if they match and can be emailed it becomes `sending` (in review mode, only once approved); otherwise it's recorded `not_sent` with a reason. An occurrence resolves unless it's waiting for approval. Running it twice does nothing new. |
| `email_deliveries()` | For each `sending` row of a published email: address, first name, subject and body (with overrides), unsubscribe token. |
| `record_send_result(send_id, provider_message_id, error)` | `error` null = `sent`. Otherwise it counts the attempt, and the third failure is `not_sent` / `failed`. |

## Sending

**The daily run:** `src/app/api/automatic-emails/run/route.ts`, at **10:30 am in Waterloo Region** (PM,
3 Nov 2026). It runs `prepare_due_sends()`, sends each `email_deliveries()` row one at a time, and
reports back with `record_send_result()`.
- **Cron:** `vercel.json` calls it at 14:30 and 15:30 UTC, because 10:30 Toronto is one or the other
  depending on daylight saving time. The call outside the 10 o'clock Toronto hour does nothing. On
  Vercel's Hobby plan a cron can start anywhere in its hour, so "10:30" can be 10:00–10:59.
- **Auth:** Vercel sends `Authorization: Bearer $CRON_SECRET`, and the route refuses anything else.
  The route is exempt from the sign-in redirect in `src/lib/supabase/proxy.ts`. Add `?force=1` to
  run it outside 10 am, e.g. `curl -H "Authorization: Bearer $CRON_SECRET" "<url>/api/automatic-emails/run?force=1"`.
- **Limits:** it stops after about 50 seconds (Hobby's 60-second limit). Sends it didn't reach stay
  ready and go in the next run.
- Anything that happens after the day's run (e.g. a join at 2 pm with a delay of 0) goes out the
  next morning.

**The sender:** `src/features/automatic-emails/sender.ts`, using nodemailer over SMTP from
sdcentre@uwblueprint.org, the same Gmail account Supabase Auth uses for sign-in emails.
- Without the `SMTP_*` variables, every send is only logged, and recorded as sent with a `log:` id.
- **Outside production** (`VERCEL_ENV` isn't `production`), only addresses in `EMAIL_TEST_ALLOWLIST`
  really receive mail; everyone else is logged. Previews and local runs read the dev database, so
  this is what keeps them from emailing members.
- **Rendering** (`render.ts`): until the Email Editor defines the body, a body is `{ "text": "..." }`.
  `[First name]` fills in, or "there" when the member has no first name. Every email gets the
  prototype's footer, an unsubscribe link and a `List-Unsubscribe` header.
- SMTP has no idempotency key. If the run dies between sending and recording, that one email can
  go again the next day.

**Environment variables** (Vercel, and `.env` locally):

| Variable | |
|---|---|
| `SUPABASE_SECRET_KEY` | Supabase → Project Settings → API Keys → Secret keys. Sensitive. |
| `CRON_SECRET` | Any long random string. Sensitive. Vercel sends it with each cron call. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` | `smtp.gmail.com`, `465`, `sdcentre@uwblueprint.org`. |
| `SMTP_PASSWORD` | The Gmail app password. Sensitive, so Production and Preview only; set it in `.env` for local runs. |
| `EMAIL_TEST_ALLOWLIST` | Preview and Development only: comma-separated addresses allowed to really receive mail. |

**Bounces:** Gmail doesn't report bounces or spam complaints to us; they arrive as emails in the
sdcentre inbox. Until we move to a sending service with webhooks, someone has to unsubscribe dead
addresses by hand.

## Next
1. **The unsubscribe page**, `/unsubscribe/<token>`, calling `unsubscribe_by_token` and
   `resubscribe_by_token`. Every email links to it already, so it has to exist before production
   sending.
2. **Review alerts** (`alert_when`), sent from the same run.
3. **The admin UI:** the automatic emails list and editor, and the Outbox page (`outbox_upcoming`).

## Open questions
- **Roles as a condition:** mentioned in discussion, not in the conditions prototype.
