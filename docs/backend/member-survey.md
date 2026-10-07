# Membership survey (`/join`): backend requirements

The UI is finished and uses fixed seams. Nothing here is built yet; the page fails closed in production (the save throws), so no one is told their answers were saved when they weren't. Decisions: [member-survey](../decisions/member-survey.md).

## 1. Save the answers
`src/features/survey/submit.ts`, `submitSurvey(submission: SurveySubmission): Promise<ActionState>`
- Replace the stub so it writes **one row per submission** to the agreed spreadsheet (or existing storage). It returns `{ status: "success" }`, or `{ status: "error" }` for anything retryable (the UI keeps the answers and shows its own message).
- The payload is human-readable: option **labels**, not ids. Multi-select answers arrive as string arrays; join them for a spreadsheet cell.

| Field | Notes |
|---|---|
| `submissionId` | UUID, created once per page load and **sent again on every retry**. A repeated id must return the first result and not add a row (idempotent). |
| `submittedAt` | UTC ISO 8601 with a Z. |
| `name` | Optional, may be empty. |
| `email` | Required; the UI checks the shape only. Use it to match the contact record. |
| `topics`, `topicsOther` | Selected labels; the "Other" text only when Other was chosen (max 80 characters). |
| `ways`, `waysOther` | Same. |
| `location`, `locationOther` | One label; the city/town only when "Outside Waterloo Region" was chosen (max 60). |
| `timeAvailable` | One label. A preference, not a commitment: do not use it to assign people to actions automatically. |
| `hopes` | Optional free text, max 600. |

If a save is made from a server action, run it from a server-only module and re-validate `email` there; the browser check is a convenience.

## 2. Analytics events
`src/features/survey/analytics.ts`, `trackSurveyEvent(event)`. Send these to SDC's analytics tool:
- `survey_step_viewed` with `step` (`welcome`, `contact`, `topics`, `ways`, `location`, `time`, `hopes`, `done`, `unsubscribed`): shows where people drop off.
- `survey_unsubscribe_clicked` (owner decision: note unsubscribes here).
- `survey_submitted`.

Unsubscribing is only recorded as an event so far. Whether it should also remove the person from the Mailchimp audience is open; the invitation email's own **Unsubscribe** button should use Mailchimp's unsubscribe link.

## 3. Public route
`/join` must work signed out. `src/lib/supabase/proxy.ts` (`updateSession`) redirects every signed-out request to `/login` except `/login` and `/auth`, so `/join` needs to be allowed there before this can go live.

## 4. Prefill
The invitation link can carry `?email=` and `?name=` (Mailchimp merge tags, e.g. `*|EMAIL|*`). The page trims and length-limits them and shows them in editable fields. Email addresses in links can end up in browser history and server logs, so keep that in mind when choosing what the email puts in the URL.

## 5. Try it without a backend
In development the stub waits 700 ms and logs the payload to the browser console (`[survey submit]`). Add `?fail` to the address to make the first save fail once, to see the retry path.
