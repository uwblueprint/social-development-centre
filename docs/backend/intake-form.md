# Intake form: backend

How `/intake-form` stores what people answer. Decisions and their rationale:
[docs/decisions/intake-form.md](../decisions/intake-form.md).

The form is **open to anyone with the link** — no sign-in, no session. So everything it sends,
including the person's name and email, comes from the browser and is treated as untrusted.

## Storage
`public.intake_submissions`, created by `supabase/migrations/20261022000000_intake_submissions.sql`.

| Column | Type | Notes |
|---|---|---|
| `submission_id` | `uuid` primary key | Made by the browser once per page load and sent again on every retry, so a retried save updates this row instead of adding a second. |
| `first_name` | `text not null` | Trimmed. |
| `last_name` | `text not null` | Trimmed. |
| `email` | `text not null` | Trimmed and lowercased. Not unique: the same address may answer twice (a correction, a shared family address), and which one wins is SDC's call, not the form's. |
| `answers` | `jsonb not null` | The five questions, stored as **labels, not ids**, so a row reads as it was answered. Also holds the browser's `submittedAt`. |
| `created_at`, `updated_at` | `timestamptz not null` | `updated_at` moves on a retry. |

Indexed on `created_at desc` (reading recent submissions) and `email` (finding someone's answers).

`answers` for a completed form:

```json
{
  "submittedAt": "2026-10-22T14:03:11.482Z",
  "topics": ["Housing and homelessness"], "topicsOther": "",
  "ways": ["Volunteer my time or skills"], "waysOther": "",
  "location": "Kitchener", "locationOther": "",
  "timeAvailable": "A few hours for an event or activity",
  "hopes": "Meet people doing housing work locally."
}
```

Every question can be skipped, so any of these may be `[]` or `""`. Only the three contact fields
are required.

## Writing
`public.submit_intake(p_submission_id uuid, p_first_name text, p_last_name text, p_email text, p_answers jsonb)`
returns `void`. Security definer, executable by `anon` and `authenticated`.

**It is the only way into the table.** Row-level security is on with **no policies**, so neither
`anon` nor `authenticated` can read or write `intake_submissions` directly; a `select` returns an
empty list rather than an error. Service role (the Supabase dashboard) bypasses RLS.

It upserts on `submission_id`, and raises `22023` if the names are blank or the email isn't an
address.

The details are validated three times, because the form is public: in the browser (so the person
sees which field is wrong, on the step where they can fix it), in the server action
(`src/features/intake/actions.ts`), and inside `submit_intake` itself. The pattern the browser and
the action share is `EMAIL_PATTERN` in `src/features/intake/submit.ts`.

## Reading
Nothing in the product reads these rows. SDC reads them in the Supabase dashboard.

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
- **No "not interested" record, and no suppression.** Choosing it saves nothing, so SDC cannot count
  who opened the form and left, and cannot stop sending that person invitations. The 22 Oct review
  named this button as the replacement for an **Unsubscribe** link
  (`docs/decisions/intake-form.md`, decisions 5 and 8), so if SDC expects it to act like one, it
  needs two things that do not exist: an event log to record the refusal, and a suppression list the
  mailing-list campaign actually reads before sending. Until then the screen does not promise it,
  and the user guide tells people to reply to SDC's email instead.
