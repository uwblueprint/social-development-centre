# Signup links: backend

What `/design/signup-links` needs. The screen builds against `SignupLink` in
`src/app/design/signup-links/data.ts`; the demo data there is replaced by these. PRD: Automatic Tags &
Signup Links (Notion).

A link is made for one event. People open `https://join.socialdevelopmentcentre.ca/join?source=<slug>`,
land on the join page, and click Join. Clicks and joins are counted against the link.

## Reading
- `listSignupLinks()` returns every link, newest first: `{ id, name, slug, clicks, joins }`.
- `clicks` is the number of recorded page loads for the slug; `joins` is the number of joins attributed to it.
- The screen computes conversion (joins ÷ clicks) itself and shows "–" when `clicks` is 0.

## Creating
- Server action `createSignupLink(prevState, formData)` returning `ActionState`. One field: `eventName`
  (required, trimmed). An empty name returns a `fieldErrors.eventName` saying what to fix.
- Slug: from the name, lowercase and hyphenated (accents stripped, other characters collapsed to `-`).
  It must be unique: on a clash append `-2`, `-3`. Slugs never change after creation, because printed QR
  codes carry them.
- Returns the new link (`id`, `name`, `slug`) so the dialog can show its URL and QR code. The URL is
  built from the slug; the QR image is drawn in the browser.

## Counting
- **Click:** when the join page loads with a `source` that matches a link, record one click. An unknown or
  missing `source` records nothing. Reloads count; if that skews the numbers, dedupe per browser per day
  (SDC's call).
- **Join:** when Join is clicked on a page that arrived with `source`, attribute that join to the link.
  Carry `source` from page load through to the join (the join page keeps it, not a cookie). Attribute
  once per person.
- The join page is not designed yet; both writes must work without a sign-in, so treat `source` as
  untrusted input.

## Storage (suggested)
`signup_links` (`id`, `name`, `slug` unique, `created_at`) plus an event log (`link_id`, `kind`
`click | join`, `at`, optional `person_id` on joins), so the counts can be derived and a date range can be
added later. Admin-only reads through RLS; writes only through the functions above.
