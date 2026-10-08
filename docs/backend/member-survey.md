# Welcome survey (`/welcome`): how it is wired

The survey is answered once, after a member's first sign-in. Decisions:
[member-survey](../decisions/member-survey.md). How sign-in works: [auth.md](../auth.md).

This replaces the original frontend-only design, which assumed a public `/join` page prefilled from
Mailchimp merge tags. Two of its requirements are now inverted and recorded here so nobody
re-implements them: the survey must stay **behind** sign-in, and the email comes from the session,
never from the URL.

Everything this feature needs on the backend **already exists** (migrations
`20261007024752_people_and_roles` and `20261007024829_revoke_sync_person_email`). It adds no table,
function or column.

## 1. What the gate reads
`getSignedInPerson()` in `src/features/auth/session.ts` resolves the person in one cached query and
exposes `hasAnsweredWelcome`, which is simply whether a `welcome_answers` row exists.

- `src/app/page.tsx` sends members to `/welcome` while `hasAnsweredWelcome` is false.
- `src/app/welcome/page.tsx` sends them back to `/` once it is true, so the survey can't be
  re-answered.

**Why absence of a row, not a flag:** the completion record *is* the state, so the two can't
disagree, and someone who abandons the survey half-way is simply still unanswered and gets asked
again next time. `people.first_signed_in_at` would not work for this — `record_sign_in()` sets it on
the very first sign-in, before any answers exist, so an abandoned form would never be re-prompted.

Note `requireMember()` redirects anyone who is not a paying member to sign-in, so a signed-in person
with no `public.people` row never reaches the survey. That matters because `submit_welcome` raises
for a caller with no person row — see §5.

## 2. Saving the answers
`submitSurvey` in `src/features/welcome/actions.ts` calls `submit_welcome(p_full_name, p_answers)`,
which sets `people.full_name` and upserts the person's `welcome_answers` row. Identity is
`current_person_id()` inside that function; the browser never supplies it.

- Takes the submission as an argument rather than FormData: the survey is a multi-step flow holding
  answers in React state, so there is no single form post to read.
- The payload is human-readable: option **labels**, not ids, built by the pure `toSubmission` in
  `src/features/welcome/submit.ts`. Multi-select answers are string arrays.
- `name` is split out into `p_full_name`; everything else becomes the `answers` jsonb.
- **Retry safety comes from the upsert**, not from a key: `submit_welcome` does
  `on conflict (person_id) do update`, so re-sending replaces the row rather than adding one.
  `submissionId` is still carried inside the answers for traceability.
- It returns an `ActionState` and does **not** redirect, because the flow shows its own confirmation
  step before leaving.

| Field | Notes |
|---|---|
| `submittedAt` | UTC ISO 8601 with a Z. |
| `topics`, `topicsOther` | Selected labels; "Other" appears as the label `Other`, and its text only when Other was chosen (max 80 characters). |
| `ways`, `waysOther` | Same. |
| `location`, `locationOther` | One label (`Kitchener`, `Waterloo`, `Cambridge` or `Other`); the typed place only when Other was chosen (max 80). |
| `timeAvailable`, `timeOther` | One label; the typed amount only when Other was chosen (max 80). A preference, not a commitment: do not use it to assign people to actions automatically. |
| `hopes` | Optional free text, max 600. |

The upsert means `submit_welcome` will happily **overwrite** a completed set of answers. Nothing can
reach it twice today, since `/welcome` redirects away once answered — but a future "edit my answers"
screen gets that for free, and an "answers are final" rule would need a guard in the function.

## 3. Still needed: the event log
`trackSurveyEvent` in `src/features/welcome/analytics.ts` **is not implemented** — it logs to the
console in development and does nothing in production. There is no event table, and adding one is a
separate decision rather than something this feature should invent. Without it there is no drop-off
data, which was one of the pilot's stated goals.

It needs somewhere to record, per person:
- `survey_step_viewed` with `step` (`envelope`, `welcome`, `contact`, `topics`, `ways`, `location`,
  `time`, `hopes`, `done`, `unsubscribe`, `unsubscribed`) — this is the drop-off signal.
- `survey_envelope_opened` — someone opened the letter (the gap between this and `envelope` views is
  people who never got past the closed envelope).
- `survey_unsubscribe_clicked` and `survey_unsubscribed` — someone started, then confirmed, Unsubscribe.
- `survey_submitted`.

Writes should be fire-and-forget: logging must never block a step change or fail a submission.

## 4. Unsubscribe (still needed)
The letter design (8 Oct 2026) puts an **Unsubscribe** button on every survey screen, with a
confirmation step and a "You’re unsubscribed" screen whose only action is **Sign out**. Today it
**changes nothing**: it fires `survey_unsubscribe_clicked` / `survey_unsubscribed` (which go nowhere
until §3 exists) and the person is still unanswered, so the gate at `/` shows them the survey again
at their next sign-in.

To make the screen true it needs, per person:
- a record that they unsubscribed (a column on `people` or a row in the §3 event log), which the
  gate at `/` reads so it stops sending them to `/welcome`;
- removal from the Mailchimp audience used for SDC invitations (API call or a synced suppression
  list), since the screen promises "We won’t email you about SDC membership again".

## 5. Open question: who can sign in at all
`can_sign_in(email, 'member')` and `requireMember()` both require `memberships.tier = 'paying'`. The
survey's premise is a **complimentary** membership for Ride for Refuge supporters, who would
presumably be `tier = 'general'` — and so could not sign in, and would never reach the survey.
Either those supporters are given `tier = 'paying'`, or the member checks need to admit `general`.
Worth settling before the invitations go out.

## 6. Try it
`pnpm dev`, sign in as someone with a `public.people` row and `memberships.tier = 'paying'` (per §5)
and no `welcome_answers` row, then visit `/` — you land on `/welcome`. Answers go to
`welcome_answers.answers`; the name goes to `people.full_name`.
