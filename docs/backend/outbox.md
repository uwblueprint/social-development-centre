# Outbox: what the design needs from the backend

Design: `/design/outbox` (`src/app/design/outbox/`), on demo data. The storage, `outbox_upcoming`,
`approve_send`, `edit_send` and the daily run already exist; see [Automatic emails](./automatic-emails.md).
This page lists what the screen uses that those don't cover yet.

## The screen
- **Left panel:** tabs **For review**, **All** and, only when something failed, **Couldn't send**.
  Search (name, email, tag, template) and a template filter. Each row has a checkbox, a when label
  ("5 days", "Past due · 2 days ago", "Couldn't send · 1 day ago"), the name and the subject.
- **Calendar:** today and the next 30 days. Each day shows how many emails go out, "N to review", and
  for past days "N not sent". Today shows "N sent" once the daily run has gone out. The previous
  month is reachable only while something is past due or couldn't send.
- **Email view:** replaces the calendar. Template, subject and body, then Edit, Delete email and
  Approve / Send now / Resend.
- **Bulk:** select rows, then Approve, Send now, Resend or Delete from a floating bar, confirmed in a dialog.
- Every action shows a toast with **Undo**.

## Reading

`outbox_upcoming(days = 30)` covers the upcoming rows. The screen also needs, per row:

| Field | Used for |
|---|---|
| `automatic_email_id` and its name | The template label and the template filter. |
| `body` (with any override) | The email view. Today only `subject` is returned. |
| The member's first name, last name, email and tags | Search, the header and the tags beside the name. |
| `due_on` | The calendar day and the "5 days" label. |

It also needs a second read for **what didn't go out**: `email_sends` that are `not_sent` (or
`past_due` occurrences) from the last month, with when and why. The screen groups them into three
reasons, each with its own message:

| Design reason (`fail`) | From | What the message tells the admin |
|---|---|---|
| `admin`: not approved in time | `past_due` | Review it, then Resend. |
| `platform`: our error | `failed` (three attempts) | We'll try again tomorrow morning, or send it from Gmail (a prefilled compose link). |
| `bounce`: address bounced | `bounced` | Confirm the address with the member, then Resend. |

`unsubscribed`, `no_longer_matched`, `not_a_member` and `trashed` don't need anyone to act, so they
aren't shown.

For the calendar: a count of `sent` per day for the shown days, and whether **today's run has
happened yet**, so today shows "N emails" before 10:30 and "N sent" after.

## Actions

| Action | Exists? | Notes |
|---|---|---|
| Approve | `approve_send` | Also in bulk: a list of (occurrence, person), or call it in a loop. |
| Save edits | `edit_send` | Subject and body. |
| Reset to original template | `edit_send(…, null, null)` | Clears both overrides. |
| **Switch template** | No | While editing, an admin can pick another automatic email's content for this one person. Needs a template override on the send (`template_override_id`) so the label shows the new template, or save it as an edit and show "Personalized". |
| **Delete email** | No | Takes one person out of this send without touching the automatic email. Record it as `not_sent` with a new reason, e.g. `removed`. |
| **Send now** | No | Sends one approved email today instead of on its day, outside the 10:30 run. |
| **Resend** | No | Queues a `not_sent` (`failed`, `bounced`) or `past_due` send again for the next run, or right away like Send now. |
| **Undo** | No | Every action above can be undone from the toast for a few seconds: unapprove, restore a deleted send, revert an edit or template switch. Either an inverse function for each, or hold the write on the client until the toast closes. |

## Open questions
- **Bounces:** with Gmail SMTP we never hear about bounces (see automatic-emails.md), so the
  "Email bounced" message can't appear until we use a sending service with webhooks.
- **Platform retries:** the design says a `failed` send is tried again with the next morning's
  emails, but today the third failure is final. Either keep retrying daily, or change the copy.
- **Send now:** does it skip the review rule for a review-mode email, or only work once approved?
- **Undo vs. the daily run:** what happens if someone approves at 10:29 and clicks Undo at 10:31?
