# Outbox: what the design needs from the backend

Design: `/design/outbox` (`src/app/design/(admin)/outbox/`), on demo data. The storage, `outbox_upcoming`,
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
  Approve (or Resend for a bounce).
- **Bulk:** select rows, then Approve, Resend or Delete from a floating bar, confirmed in a dialog. On the Couldn't send tab the bar offers Approve when every selected email was not approved in time, Resend when every one bounced, and neither for a mix or for our own errors (Delete only).
- Every action shows a toast with **Undo**.

## Reading

`outbox_upcoming(days = 30)` covers the upcoming rows. The screen also needs, per row:

| Field | Used for |
|---|---|
| `automatic_email_id` and its name | The template label and the template filter. |
| `subject` and `body`, each the override if there is one, else the template's, as Email Editor documents (see [Subject and body format](#subject-and-body-format)) | The email view. Today only `subject` is returned. |
| The member's first name, last name, email and tags | Search, the header and the tags beside the name. |
| `due_on` | The calendar day and the "5 days" label. |

It also needs a second read for **what didn't go out**: `email_sends` that are `not_sent` (or
`past_due` occurrences) from the last month, with when and why. The screen groups them into three
reasons, each with its own message:

| Design reason (`fail`) | From | What the message tells the admin |
|---|---|---|
| `admin`: not approved in time | `past_due` | It never went out because it wasn't approved, so: review it, then **Approve**. It is scheduled for the next daily run (10:30 AM). |
| `platform`: our error | `failed` (three attempts) | We'll try again tomorrow morning, or send it from Gmail (a prefilled compose link). No primary action; Delete is still available. |
| `bounce`: address bounced | `bounced` | Confirm the address with the member, then Resend. |

`unsubscribed`, `no_longer_matched`, `not_a_member` and `trashed` don't need anyone to act, so they
aren't shown.

For the calendar: a count of `sent` per day for the shown days, and whether **today's run has
happened yet**, so today shows "N emails" before 10:30 and "N sent" after.

## The member panel

Beside the open email, a panel helps decide whether this person deserves a personal note. Per open email it needs:

| Field | Used for |
|---|---|
| The member's email address | Shown as text (mail icon) under "About {first name}". |
| The date they joined | "Member since {month year}", and the "Joined {date}" value in "Why this email" when the rule starts on joining. |
| The member's tags | Shown as tags in the panel, and matched against the automatic email's tag conditions. |
| The automatic email's rule: its trigger and its audience conditions | "Why this email" is derived from it, not written by hand. The panel mirrors the Automatic Emails editor's two parts. **When**: the trigger (a member joins, a tag is added, monthly on day N, or a one-off with who set it up) and its delay (`n` days, weeks or months, or within 24 hours). **Who**: the tags the member must have (all of `require`, any of `only`), the tags that exclude them (`never`), or "Any member" when there are none. Send the rule as it is now, so a personalized email still shows it. |
| For that trigger, the member's own value | The date they joined, or the date the trigger tag was added to them (for example the day the $1,000+ tag was added), to show "Joined Oct 8, 2026" or "Tag added Nov 7, 2026" next to "Sends Nov 8". Monthly and one-off emails need no member value (a one-off needs who set it up). |
| Which of the member's tags satisfy each tag condition | Shown as tags under the condition ("Has one of the tags Volunteer or Board": Volunteer). The screen works this out from the member's tags and the rule; the server can do it instead. |
| The member's other sends over the next 30 days, excluding the open one | "Other emails": the date and status (Sent, Scheduled, To review, Couldn't send) on one line, with the automatic email name under it. The screen shows the 5 nearest and "and {n} more". |

## Subject and body format

An edited send's **body** is stored as the Email Editor's rich-text document (TipTap JSON, the same shape as `automatic_emails.body`), so bold, italic, links, lists, quotes, highlight and images survive an edit. `body_override` is `jsonb`; `null` means "follow the template". The **subject is always plain text** (decided Nov 2026): `subject_override` stays a `text` column, with no formatting. An edit that says the same as the template is saved as `null` (the screen compares the two after normalising them). Open for the screen: the editor's subject field still allows personalized-text chips; with a plain-text subject they would have to become a text token such as `[First name]` that both sides parse.

- **Reading:** `outbox_upcoming` returns the effective subject and body as documents, so the screen needs no second lookup. Search does not read them (it matches name, email, tags and template name).
- **At send time** (`email_deliveries()` and `render.ts`): render the document to email HTML with the member's values filled in for each personalized-text chip, using the chip's fallback when the member has none (the same renderer Automatic Emails uses for a template; its image and highlight nodes are written for email clients, see the editor's `emailHighlight.ts`). The subject is rendered to plain text with the same filling. Also produce a plain-text alternative: paragraphs as lines, list items as `- `, links as `text (url)`.
- **Templates:** the Automatic Emails backend keeps `body` as the same opaque editor document, so a send with no override renders from the template's document and the override replaces it whole. (If `subject` stays a plain-text column there, a template subject with chips needs the same document form, or a `[First name]`-style text format both sides parse; decide with Automatic Emails.) The demo authors templates as text with `[First name]` labels only for readability.
- **Gmail fallback** ("Send it from Gmail"): the screen builds a plain-text version from the document itself; a server-rendered plain text would do the same job.

## Actions

| Action | Exists? | Notes |
|---|---|---|
| Approve | `approve_send` | Also in bulk: a list of (occurrence, person), or call it in a loop. Also applies to a `past_due` send (not approved in time): it is scheduled for the next daily run (10:30 AM), toast "Approved. Scheduled for tomorrow at 10:30 AM." |
| Save edits | `edit_send` | Subject and body as Email Editor documents (JSON). The screen sends `null` for a field that is back to matching the template. |
| Reset to original template | `edit_send(…, null, null)` | Clears both overrides, so the email follows its template again. Allowed (confirmed Nov 2026). |
| **Delete email** | No | Takes one person out of this send without touching the automatic email. Record it as `not_sent` with a new reason, e.g. `removed`. |
| **Resend** | No | Always acts on one email: there is no "Resend and next", because each failure needs its own fix. Used for a `bounced` send, after the address is checked (a `past_due` send is approved, not resent; a `failed` send is retried by the system). Queues it again for the next daily run (10:30 AM). It never sends immediately. |
| **Undo** | Not needed | **Lives on the client** (decided Nov 2026). The action is held in the browser while its toast is open and only sent to the server once the undo time has run out; Undo just cancels it. The held actions are sent right away when the person leaves: on tab close or navigation (`pagehide`, sent with `fetch` `keepalive`), and before the 10:30 AM run (see open questions). |

## Open questions
- **Bounces:** with Gmail SMTP we never hear about bounces (see automatic-emails.md), so the
  "Email bounced" message can't appear until we use a sending service with webhooks.
- **Platform retries:** the design says a `failed` send is tried again with the next morning's
  emails, but today the third failure is final. Either keep retrying daily, or change the copy.
- **Held actions vs. the daily run:** an action still held on the client at 10:30 AM would miss the run (a held delete would still send). Flush held actions before the run, or refuse to hold an action when the run is closer than the undo time. Also decide what other admins see while an action is held, and what happens to held actions if the browser crashes or the connection drops.

## Offline
The screen stays readable when the connection drops and blocks every change. What the real screen needs:
- **Which email bodies are cached on the client.** An email that was already opened (or prefetched with the list) opens read-only offline; one that wasn't is blocked with a reason. The demo treats an email as cached once it has been opened.
- **When the data was last fetched**, so the screen can say how fresh what's on it is.
- **Actions are not queued offline.** Approve, Resend, Delete, Save edits and Reset to original template all need the server and are disabled with a reason. The 10:30 AM run can happen while someone is offline, so a queued approval could land after its email's send time and send, or miss, something unexpectedly.
- **After reconnecting**, refetch the list and the open email. If the 10:30 AM run went out meanwhile, the open email says so ("Sent at 10:30 AM while you were offline.").

## Edge cases the screen designs (State lab)

What the design needs from the backend for its failure and concurrency states:

- **Conflicts:** approve and save-edits must fail with a distinct "already changed" result (version or updated-at check). Approve: the email is already approved, so the UI shows it scheduled. Edit: the server returns the other admin's version so "Use theirs" can show it.
- **Validation:** save-edits returns errors per field (`subject`, `body`), e.g. a subject length limit.
- **Rate limits:** actions can answer "too many requests" with a retry-after time.
- **Stale data:** list and calendar reads return a `lastUpdated` time so the screen can warn when it is over a day old.
- **Session:** an expired session answers actions with an "unauthenticated" result so unsaved edits can be kept while signing in again.
- **Undo window:** undo of approve, delete and resend can be refused once the window (1 minute) has passed.
- **Volume:** the list loads every email for the next 30 days at once (hundreds on a busy day), grouped by day, with no paging.
