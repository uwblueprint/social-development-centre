# Intake form: backend

How the two public intake-form variants store what people answer. Decisions and their rationale:
[docs/decisions/intake-form.md](../decisions/intake-form.md).

The form is **open to anyone with the link** — no sign-in, no session. So everything it sends,
including the person's name and email, comes from the browser and is treated as untrusted.

## Storage
`public.intake_submissions`, created by `supabase/migrations/20261022142839_intake_submissions.sql` and extended by `supabase/migrations/20261027000100_intake_form_variants.sql`.

| Column | Type | Notes |
|---|---|---|
| `submission_id` | `uuid` primary key | Made by the browser once per page load and sent again on every retry, so a retried save updates this row instead of adding a second. |
| `first_name` | `text not null` | Trimmed. |
| `last_name` | `text not null` | Trimmed. |
| `email` | `text not null` | Trimmed and lowercased. Not unique: the same address may answer twice (a correction, a shared family address), and which one wins is SDC's call, not the form's. |
| `form_source` | `text` nullable for rows created before the variants | `ride-for-refuage` or `sdc-members`, set from the route that was opened. |
| `answers` | `jsonb not null` | The five questions, stored as **labels, not ids**, so a row reads as it was answered. Topic labels include their explicit rank. Also holds the browser's `submittedAt`. |
| `created_at`, `updated_at` | `timestamptz not null` | `updated_at` moves on a retry. |

Indexed on `created_at desc` (reading recent submissions) and `email` (finding someone's answers).

`answers` for a completed form:

```json
{
  "submittedAt": "2026-10-22T14:03:11.482Z",
  "topics": [
    { "rank": 1, "topic": "Housing, tenant rights, and eviction prevention" },
    { "rank": 2, "topic": "Homelessness, encampments, and ending chronic homelessness" }
  ],
  "topicsOther": "",
  "ways": ["Receive invitations to occasional workshops, discussions, or community events"],
  "waysOther": "",
  "location": "Kitchener",
  "timeAvailable": "A few hours for an event or activity",
  "hopes": "Meet people doing housing work locally."
}
```

Every question can be skipped, so answers may be `[]` or `""`. Dragging or moving any topic assigns
the full ordered list unique ranks from 1 to 9. Only the three contact fields are required.

## Writing
`public.submit_intake(p_submission_id uuid, p_first_name text, p_last_name text, p_email text, p_form_source text, p_answers jsonb)`
returns `void`. Security definer, executable by `anon` and `authenticated`. The route source is
required, validated, and saved in `form_source`; the function also validates the optional complete
topic ranking.

**It is the only way into the table.** Row-level security is on with **no policies**, so neither
`anon` nor `authenticated` can read or write `intake_submissions` directly; a `select` returns an
empty list rather than an error. Service role (the Supabase dashboard) bypasses RLS.

It upserts on `submission_id`, and raises `22023` if the names are blank or the email isn't an
address.

The details are validated three times, because the form is public: in the browser (so the person
sees which field is wrong, on the step where they can fix it), in the server action
(`src/features/intake/actions.ts`), and inside `submit_intake` itself. The pattern the browser and
the action share is `EMAIL_PATTERN` in `src/features/intake/submit.ts`.

## Form analytics
`public.page_visits`, created by `supabase/migrations/20261027000000_intake_page_visits.sql` and
extended by `supabase/migrations/20261027000100_intake_form_variants.sql`, records
one row when someone leaves a form step or closes/navigates away from the page. Tracking starts on
the welcome letter, after its privacy notice is visible; the envelope itself is not tracked.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` identity primary key | One row per visited step. |
| `person_id` | `uuid not null` | Random ID generated once per form attempt. It is not a `people.id` and has no foreign key. |
| `key_id` | `text` nullable | Normalized email after it is entered; null before then. |
| `page_key` | `text not null` | `welcome`, `contact`, `topics`, `ways`, `location`, `time`, or `hopes`. |
| `total_ms`, `active_ms` | `bigint not null` | Total time on the step, and time while the page is visible. |
| `first_answer_ms`, `last_answer_ms` | `bigint` nullable | Elapsed time from entering the step to the first and last edit. |
| `left_via` | `text not null` | `next`, `skip`, `back`, `submit`, `not_interested`, or `exit`. |
| `answers` | `jsonb not null` | Array of `{ "field": "...", "value": ... }` entries for non-contact answers on that step. Contact fields are excluded; free-text answers are stored as entered. |
| `created_at` | `timestamptz not null` | Time the visit was recorded. |
| `"from"` | `text` | Route source: `ride-for-refuage` or `sdc-members`. No external referrer is collected. |
| `user_found` | `boolean` nullable | `true` when `key_id` matches `public.people.email`, `false` when it does not, and `NULL` before an email is entered. This indicates a matching `people` row, not a verified identity. |

`active_ms` counts only time while the browser page is visible. Answer times are elapsed from step
entry and therefore include time spent in a hidden tab. The contact step records answer timing, but
its `answers` array is empty; the email is used only as `key_id`. After a valid email is entered,
the database applies that email and its `user_found` result to earlier visits in the same attempt.
For an abandoned attempt before email entry, `key_id` and `user_found` remain `NULL`.

The table has RLS enabled and no client read/write grants. The public route
`/api/intake/page-visits` is explicitly public in the auth proxy, validates the request, and calls the security-definer
`record_intake_page_visit` function. The function also validates the route source and analytics data.
Page visits do not change the idempotent `intake_submissions` save behavior.

Apply the variants migration after the original page-visits migration. It adds `form_source`, updates
the allowed `"from"` values and replaces both public write functions; the old RPC signatures are
removed so a write cannot omit its source.

## Reading
Nothing in the product reads these rows. SDC can read them in the Supabase dashboard.

## Not built
- **No spam protection.** `submit_intake` is a public, unauthenticated write with no rate limit,
  captcha or duplicate check. If the link is shared publicly rather than emailed, this is the
  exposure that matters.
- **No email verification.** Nobody proves they own the address they type, so these rows must not be
  treated as identity, and must never grant access to anything.
- **No way to correct a submission.** Once the page is closed, the `submissionId` is gone and a
  second attempt writes a second row.
- **No admin screen**, and no link to `people`: an intake submission does not create a person, a
  membership or a tag. Joining these rows to `public.people` is a later decision.
- **No suppression.** Choosing **Not interested** is recorded as a page visit, but there is no
  suppression list the mailing-list campaign reads before sending. The button is not an
  unsubscribe; the user guide tells people to reply to SDC's email instead.
