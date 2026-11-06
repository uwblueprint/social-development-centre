# Signup links: backend

How `/admin/signup-links` and the join steps at `/join` store links and count what they bring in.
Decisions and their rationale: [docs/decisions/signup-links.md](../decisions/signup-links.md). PRD:
Automatic Tags & Signup Links (Notion).

A link is made for one event. People open `https://join.socialdevelopmentcentre.ca/join?source=<slug>`,
go through the join steps (Welcome → Add your details → Pay us → Thank you!), and each link counts how
many opened it (clicks) and how many reached the end (joins).

The screens use `SignupLink` from `src/features/signup-links/links.ts`.

## Storage
`supabase/migrations/20261103000000_signup_links.sql`.

`public.signup_links`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` primary key | |
| `name` | `text not null` | The event name as typed, trimmed, 1–500 characters. Can be corrected from the dashboard; the app has no rename. |
| `slug` | `text not null unique` | Lowercase letters and digits joined by single hyphens. **Never changes:** a trigger (`signup_links_keep_slug`) refuses any update to `slug` or `id`, dashboard included, because printed QR codes carry it. |
| `created_at` | `timestamptz not null` | Newest first on the screen. |
| `created_by` | `uuid` → `people` | The admin who made it. |

`public.signup_link_events`: one row per click or join.

| Column | Type | Notes |
|---|---|---|
| `id` | `bigint` identity | |
| `link_id` | `uuid not null` → `signup_links` | |
| `kind` | `text not null` | `click` or `join`. |
| `visit_id` | `uuid not null` | A random id the welcome step makes on each load and the join steps carry in the URL (`&visit=`) to the thank-you step. Not a person. Unique per `(link_id, kind, visit_id)`, so a retried request or a reloaded thank-you page adds nothing. |
| `person_id` | `uuid` → `people`, nullable | For joins, once the join steps know who is joining (not yet). A partial unique index then counts one join per person per link. |
| `at` | `timestamptz not null` | So a date range can be added later. |

`public.signup_link_counts` (view, security invoker): every link with `clicks` and `joins`. The
screen computes conversion (joins ÷ clicks) itself and shows "–" when `clicks` is 0.

**Row-level security:** admins (`is_admin()`) can read both tables and the view. Nobody can insert,
update or delete directly; every write goes through the functions below.

## Reading
`listSignupLinks()` in `src/features/signup-links/queries.ts`: every link, newest first,
`{ id, name, slug, clicks, joins }`.

## Creating
Server action `createSignupLink(prevState, formData)` in `src/features/signup-links/actions.ts`,
returning `ActionState<SignupLink>`. One field, `eventName` (required, trimmed, at most 500 characters);
a missing or too-long name comes back as `fieldErrors.eventName`.

It makes the slug with `slugify()` (accents stripped, lowercased, anything else collapsed to `-`, or
`link` if nothing is left) and calls `public.create_signup_link(p_name text, p_slug text)`, which is
admin-only, takes a lock so two admins can't race, adds `-2`, `-3` and so on when the slug is taken,
and returns the new row. The dialog then shows the URL and QR code; the QR image is drawn in the
browser (`qrcode`).

The URL is built from the slug with `signupLinkUrl()`. Its base is `NEXT_PUBLIC_JOIN_URL`, defaulting
to `https://join.socialdevelopmentcentre.ca/join`. Set it only for local and preview builds.

## Counting
Both writes run in the browser after the step has shown, through the server actions in
`src/features/join/actions.ts`, so link previews (which don't run scripts) aren't counted and a failed
write never stops anyone joining. `/join` is public: no sign-in.

- **Click:** the welcome step (`/join?source=<slug>`) calls
  `public.record_signup_link_click(p_source text, p_visit_id uuid)`. An unknown, missing or malformed
  `source` records nothing. Reloading the welcome step makes a new visit id, so reloads count as clicks.
- **Join:** the thank-you step calls `public.record_signup_link_join(p_source text, p_visit_id uuid)`.
  It counts only when that visit recorded a click on the same link, once per visit.
- Both functions are security definer, executable by `anon` and `authenticated`, and treat their
  arguments as untrusted; the server actions also drop anything that isn't a slug and a UUID.

**Not protected against:** someone scripting fake clicks with made-up visit ids. The counts are a
guide for which events to repeat, not an audit; rate limiting can come later if it matters.

## When the join steps are designed
- Details: once the steps collect who is joining, pass their `person_id` to the join write so joins
  count once per person per link (the index is already there).
- The join itself (creating the membership) should then be what records the join, not reaching the
  thank-you page.
