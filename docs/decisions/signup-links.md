# Signup links: decision log

Decisions behind `/admin/signup-links` and the join steps at `/join`. Backend:
[docs/backend/signup-links.md](../backend/signup-links.md). Each decision can be revisited.

## 1. What it is (Nov 2026)
- **Decision:** staff make one link and QR code per outreach event (fairs, open houses, pop-ups). The
  table shows how many people opened each link, how many joined and the conversion, and exports as CSV.
- **Why:** SDC can't tell which events bring in members, so it can't tell which are worth repeating.

## 2. A link never changes (Nov 2026)
- **Decision:** the slug is made from the event name once and is never edited, in the app or the
  database (a trigger refuses it). There is no rename, archive or delete in the app.
- **Why:** printed QR codes carry the URL. Changing or deleting a link breaks every poster already up.

## 3. The join steps are public and follow the design (Nov 2026)
- **Decision:** `/join` ships the design's steps as they are: Welcome → Add your details → Pay us →
  Thank you!, each a heading and Continue. The details form and payment are filled in when they are
  designed.
- **Public:** open to anyone with the link, no sign-in, like the intake form.
- **Affects:** `src/app/join/`, `src/features/join/`, `src/features/auth/portals.ts`.

## 4. What counts (Nov 2026)
- **Click:** the welcome step loading with a known `source`. Reloads count (SDC can ask to dedupe per
  browser per day if that skews the numbers).
- **Join:** reaching the thank-you step on a visit that started from the link, once per visit. When the
  steps collect who is joining, this becomes once per person.
- **Source is carried in the URL**, not a cookie, from the welcome step to the thank-you step, with a
  random visit id beside it.
