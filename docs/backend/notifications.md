# Notifications: backend

The bell in the admin sidebar and the panel it opens. 13 kinds of notification, the same 13 keys as the
email alerts in Settings.

**Built:** storage, every writer that this branch's data can feed (joins, referred joins, unsubscribes,
the Outbox), reading, seen and done, paging, the panel wired to server actions in the admin portal, and
tests (`supabase/tests/admin_notifications.test.sql`).
**Waiting on other features:** the payment and membership-change notifications (see
[Requirements from other features](#requirements-from-other-features)) and the email alerts (see
[Next](#next)).

## The model: stored, written when things happen

```
something happens                                   writes
─────────────────                                   ──────
a member joins (any way)          trigger on member_events ──┐
someone unsubscribes              trigger on subscription_events ──┤
daily run, 10:30 Toronto          refresh_outbox_notifications() ──┼──▶ admin_notifications
PayPal webhook, cancel flow       notifyAdmins() (server, later) ──┘         │
                                                                           │ reads
the bell                          admin_notifications_new_count() ◀────────┤
opening the panel                 open_admin_notifications(): first page + marks it seen
older pages                       admin_notifications_page()
✓ and Undo                        set_admin_notification_done()
```

- **Stored, not computed when the panel opens.** Opening or refreshing the panel is one small indexed
  read, whatever the number of kinds. Data can be up to a day old (owner, 23 Nov 2026), which is what the
  Outbox ones are: the daily run refreshes them.
- **One row per situation.** `group_key` is unique: a webhook PayPal sends twice, or the daily run run
  twice, updates the row instead of adding one.
- **Facts, not sentences.** `data` holds ids, names, counts and cents. The panel writes the words
  (`src/features/notifications/copy.ts`), so changing wording never needs a migration or a backfill.
- **A notification never blocks the work.** The triggers catch their own errors (a warning in the
  database log), so a join or an unsubscribe always goes through. `notifyAdmins()` never throws.

## Tables

`admin_notifications` (`supabase/migrations/20261123000000_admin_notifications.sql`)

| Column | Notes |
|---|---|
| `id` | uuid |
| `type` | One of the 13 keys (check constraint), `NOTIFICATION_TYPES` in `types.ts` |
| `group_key` | Unique: `memberJoins:<member event id>`, `outboxFailed:<date>`, `paymentDeclined:<PayPal event id>` |
| `data` | jsonb object, facts only; shape per type is `NotificationData` in `types.ts` |
| `occurred_at` | When it happened, or when the situation last grew. Indexed with `id` for paging |
| `done_at`, `done_by` | Shared done. `done_by` null with `done_at` set = the daily run closed it (nothing waiting any more) |

`admin_notification_seen`: one row per admin, `person_id` and `seen_at`, the last time they opened the panel.

Row-level security: admins read notifications; each admin reads only their own `seen_at`. Nobody writes
either table directly; every write goes through a function.

## Seen and done

| | Seen | Done |
|---|---|---|
| Whose | Each admin's own | Shared by every admin |
| Set by | Opening the panel: `open_admin_notifications()` returns the first page and, in the same call, marks seen up to its newest notification (one written while it runs stays new); never moves backwards | ✓ (`set_admin_notification_done(id, true)`); Undo is `false` |
| Effect | Clears the red count; rows newer than the old `seen_at` keep a dot until the panel closes | Leaves the list for everyone |
| Stored as | `admin_notification_seen.seen_at` | `done_at`, `done_by` |

The red count is notifications with no `done_at` and `occurred_at` after this admin's `seen_at`. The
panel loads it once, then again on a page change or when the window regains focus, at most once a minute.

## When each one is written

| `type` | Written when | `group_key` | Status |
|---|---|---|---|
| `memberJoins` | `member_events.joined` with no referral and "Send join emails" on. Timed when recorded, so a backdated member still shows as new | `memberJoins:<event id>` | Built |
| `referralJoins` | `member_events.joined` with a referral (instead of `memberJoins`) | `referralJoins:<event id>` | Built |
| `unsubscribes` | `subscription_events.unsubscribed`, except imports | `unsubscribes:<event id>` | Built |
| `outboxWaiting` | Daily run: any review email due within 2 days. `count` is every email waiting | one open row; see below | Built |
| `outboxPastDue` | Daily run: review emails whose day passed unapproved | one open row | Built |
| `outboxFailed` | Daily run: sends that failed their third try today | `outboxFailed:<date>` | Built |
| `paymentDeclined` | PayPal `BILLING.SUBSCRIPTION.PAYMENT.FAILED` | `paymentDeclined:<event id>` | Needs the payments branch |
| `paymentsStopped` | PayPal `BILLING.SUBSCRIPTION.SUSPENDED` | `paymentsStopped:<event id>` | Needs the payments branch |
| `paymentUnmatched` | A payment saved with no `person_id` | `paymentUnmatched:<payment id>` | Needs the payments branch |
| `refunds` | PayPal `PAYMENT.SALE.REFUNDED` (`refund`) or `REVERSED` (`reversal`) | `refunds:<payment id>` | Needs the payments branch |
| `paymentReceived` | PayPal `PAYMENT.SALE.COMPLETED` | `paymentReceived:<payment id>` | Needs the payments branch |
| `cancels` | A membership is cancelled | `cancels:<member event id>` | Needs the cancel flow |
| `pausesOrTierChanges` | A pause or a tier change | `pausesOrTierChanges:<member event id>` | Needs the cancel flow |

Not notified on purpose: members added with "Send join emails" off (backfills and spreadsheet imports;
the same rule that stops their join emails) and imported unsubscribes. Admins doing a bulk import don't
need hundreds of notifications about their own work.

**The Outbox rows** (`refresh_outbox_notifications`, called at the end of
`src/app/api/automatic-emails/run/route.ts`):
- Waiting and past due are one notification per situation, carrying a count
  (`refresh_count_notification`). A higher count moves it to now and reopens it, even if an admin marked
  it done; a lower or equal count just updates the number, and an admin's done stays done. When the count
  reaches 0 the run closes it (done, by nobody). The next time something is waiting, a new one opens.
- Failed is one per day, and reopens the same way if more fail later that day.
- The same call deletes done notifications older than 180 days.

## What the app calls

`src/features/notifications/`:

| File | What |
|---|---|
| `types.ts` | The contract: `NOTIFICATION_TYPES`, `NotificationData`, `NotificationsPage`, `NotificationsSource` |
| `actions.ts` | Server actions: `loadNewCount`, `openPanel` (first page, marks it seen), `loadPage(cursor)` (pages of 15), `setDone(id, done)`. One database call each. The admin check is the database's (`is_admin()` in every function, which also ends admin sessions after 7 days); a refusal (42501) sends the person to sign in, as `requireAdmin()` would, so the check isn't repeated in the app |
| `source.ts` | The actions as a `NotificationsSource`, for the admin portal |
| `parse.ts` | Rows into `AdminNotification`; a row missing a required fact is left out (logged), not shown broken. Cursors |
| `notify.ts` | `notifyAdmins(type, groupKey, data)`, server only, for webhooks and flows that run without an admin signed in. Always timed now, never at the provider's event time, which could fall behind admins' "seen" and never show as new |
| `copy.ts` | The words, icon area and link for each type |
| `NotificationsPanel.tsx` | The bell and the panel. Takes a `source` and the Settings link |

The admin portal (`src/app/admin/_components/AdminShell.tsx`) passes `serverNotifications`; the design
screens pass an in-memory demo with the same paging.

**Cost.** Each action is one round trip to the database: opening the panel is one, each ✓, Undo or
older page is one, and the bell count is at most one a minute.

**Paging** is by `(occurred_at, id)`, newest first. The cursor carries the database's own timestamp
(microseconds), never a rounded JavaScript date, so no row is skipped or repeated at a page boundary.

**Failures.** The bell shows no count if it can't load. The panel says "Notifications couldn't load"
with Try again; a failed next page offers Try again at the end of the list; a ✓ or Undo that doesn't
save puts the row back and says so in a toast.

## Requirements from other features

Built with those features, not here:
- **Payments (`icema/payments`).** In `src/features/payments/webhook.ts`, after each event is saved, call
  `notifyAdmins()` with the PayPal event or payment id in the group key, e.g.
  `notifyAdmins("paymentDeclined", \`paymentDeclined:${event.id}\`, { person })`. Unmatched payments:
  `notifyAdmins("paymentUnmatched", \`paymentUnmatched:${payment.id}\`, { amount, paymentId })`.
- **Cancelling must not delete the membership.** `end_paid_membership()` deletes the `memberships` row.
  Mark it ended and write a `member_events` row instead, then notify `cancels` from it (a trigger like
  `notify_member_event`, or `notifyAdmins` from the cancel action).
- **Pause and tier change events.** Write a `member_events` row for each and notify `pausesOrTierChanges`.

## Next

- **Email alerts.** Settings already lists one alert per type with its recipients. To build:
  `alert_recipients(type, person_id)`, and a step at the end of the daily run that sends each admin one
  email listing the notifications written since their last alert email for the types they're on, and
  nothing if there are none (log what was sent so nothing goes twice).
- **A missed daily run.** Nothing notices if the daily run fails or doesn't run; the "Today's emails
  couldn't go out" notification was designed and removed for now. Add it if the next run can check that
  the previous one finished.

## Known limits

- **A row the panel can't read** (a fact missing from `data`) is left out of the list but still counted on
  the bell, and can't be checked off. Only typed writers exist (`notifyAdmins()` takes
  `NotificationData`, the triggers build their own), so this needs a bad manual write.
- **Two open Outbox rows of one type** can only happen if an admin undoes an old one after a new
  situation opened; the run then keeps only the newest up to date. Rare enough not to guard.

## Testing

`supabase/tests/admin_notifications.test.sql` runs on a database with every migration applied and
Supabase's `auth` schema present. It covers each writer (including backdated joins), opening the panel (first
page, seen up to what was shown, never backwards, nothing to show marks nothing), done and undo, paging with equal timestamps, repeated group keys, the Outbox
refresh (open, idempotent, done stays done, a bigger count reopens, close, past due, failed), permissions
(non-admins and signed-out visitors refused with 42501, signed-in users, truncate, the service role), the 180-day cleanup, and that a failing
notification never stops a join.

The repo has no database in CI yet. To run the tests, apply the migrations to a database with Supabase's
`auth` schema (a local Supabase, or PGlite with `auth.uid()` / `auth.jwt()` stubs) and run the file; each
check raises on failure and prints a `pass:` row otherwise.
