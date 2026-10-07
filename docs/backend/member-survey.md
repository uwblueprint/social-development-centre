# Membership survey (`/join`): how it is wired

The survey is a **first-login gate**: a signed-in person who has not answered it is sent to `/join`
and kept there until their answers are saved. Decisions:
[member-survey](../decisions/member-survey.md).

This replaces the original frontend-only design, which assumed a public page prefilled from
Mailchimp merge tags. Two of its requirements are now inverted and recorded here so nobody
re-implements them: `/join` must stay **behind** sign-in, and the email comes from the session,
never from the URL.

The data layer for this feature **already existed** when the UI was wired up (migrations
`20261007024752_people_and_roles` and `20261007024829_revoke_sync_person_email`). Nothing in this
feature adds a table, a function or a column; it consumes what is there.

## 1. What the gate reads
`getWelcomeState()` in `src/features/survey/state.ts` returns one of three states:

| State | Means | Gate behaviour |
|---|---|---|
| `pending` | member record exists, no `welcome_answers` row | redirect to `/join` |
| `done` | `welcome_answers` holds their row | let through |
| `no-member-record` | signed in, but no row in `public.people` | let through |

It resolves the person with the backend's own `current_person_id()` RPC
(`select id from public.people where user_id = auth.uid()`), then looks for their `welcome_answers`
row — readable under the existing "Members see their answers, admins see all" policy, so the query
is already scoped to them.

**Why absence of a row, not a flag:** it is the completion record itself, so it cannot disagree with
reality, and someone who abandons the survey half-way is simply still `pending` and gets asked
again next time. `people.first_signed_in_at` is *not* usable for this — `record_sign_in()` sets it
on the very first sign-in, before the survey is submitted, so an abandoned form would never be
re-prompted.

**Why `no-member-record` is let through, not redirected:** `submit_welcome` raises for a caller with
no person row, so redirecting them to `/join` would trap them in a form that can never succeed.
A person row is created by whoever adds the member; `record_sign_in()` only links an existing row to
an auth account by matching the JWT email.

The gate is `src/app/(app)/layout.tsx`. `/join` sits outside the `(app)` route group, because inside
it the redirect would target itself. Anything else that should be gated has to live inside that
group — and note the gate is **member**-shaped, so admin and partner areas should stay out of it.

## 2. Saving the answers
`submitSurvey` in `src/app/join/actions.ts` calls `submit_welcome(p_full_name, p_answers)`, which
sets `people.full_name` and upserts the person's `welcome_answers` row. Identity is
`current_person_id()` inside that function; the browser never supplies it.

- The payload is human-readable: option **labels**, not ids, built by the pure `toSubmission` in
  `src/features/survey/submit.ts`. Multi-select answers are string arrays.
- `name` is split out into `p_full_name`; everything else becomes the `answers` jsonb.
- **Retry safety comes from the upsert**, not from a key: `submit_welcome` does
  `on conflict (person_id) do update`, so re-sending replaces the row rather than adding one.
  `submissionId` is still carried inside the answers for traceability.
- There is no `email` field. Identity is `auth.uid()`, resolved in the database.
- The action returns an `ActionState`; on `error` the flow keeps the answers and shows its own
  message, so the person can try again.

| Field | Notes |
|---|---|
| `submittedAt` | UTC ISO 8601 with a Z. |
| `topics`, `topicsOther` | Selected labels; the "Other" text only when Other was chosen (max 80 characters). |
| `ways`, `waysOther` | Same. |
| `location`, `locationOther` | One label; the city/town only when "Outside Waterloo Region" was chosen (max 60). |
| `timeAvailable` | One label. A preference, not a commitment: do not use it to assign people to actions automatically. |
| `hopes` | Optional free text, max 600. |

Note that the upsert means `submit_welcome` will happily **overwrite** a completed set of answers.
Today nothing can reach it twice — `/join` redirects away once the state is `done` — but a future
"edit my answers" screen gets that for free, and a future "answers are final" rule would need a
guard in the function.

## 3. Still needed: the event log
`trackSurveyEvent` in `src/features/survey/analytics.ts` **is not implemented** — it logs to the
console in development and does nothing in production. There is no event table, and adding one is a
separate decision rather than something this feature should invent. Without it there is no
drop-off data, which was one of the pilot's stated goals.

It needs somewhere to record, per person:
- `survey_step_viewed` with `step` (`welcome`, `contact`, `topics`, `ways`, `location`, `time`,
  `hopes`, `done`, `left`) — this is the drop-off signal.
- `survey_left` — someone chose "Maybe later".
- `survey_submitted`.

Writes should be fire-and-forget: logging must never block a step change or fail a submission.

## 4. No unsubscribe
"Maybe later" shows a screen and nothing else: the person keeps no answers row, so they are still
`pending` and the survey is waiting next time. Removing someone from the Mailchimp audience is not
this form's job — the invitation email's own **Unsubscribe** button uses Mailchimp's link. Once §3
exists, choosing it should at least be recorded.

## 5. Open question: who can sign in at all
`can_sign_in(email, 'member')` requires `memberships.tier = 'paying'`. The survey's premise is a
**complimentary** membership for Ride for Refuge supporters, who would presumably be
`tier = 'general'` — and so could not sign in, and would never reach this gate. Either those
supporters get `tier = 'paying'`, or `can_sign_in` needs to admit `general` members. Worth settling
before the invitations go out.

## 6. Try it
`pnpm dev`, sign in as someone who has a `public.people` row (with `memberships.tier = 'paying'`,
per §5) and no `welcome_answers` row, then visit `/` — the gate sends you to `/join`. Answers land
in `welcome_answers`; the name lands on `people.full_name`.
