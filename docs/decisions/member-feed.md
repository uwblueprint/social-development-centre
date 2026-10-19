# Member feed: decision log

Assumptions made while building the paying members' feed (priority P2 in `docs/product/README.md`). The UI is front end only; data is mocked. Each can be revisited.

## 1. A consumer layout, not the admin sidebar
- **Decision (owner, 30 Sep 2026):** The feed lives in a new `/member` portal with a slim top bar on tablet and desktop and a bottom tab bar on phones (For you, Explore, Your opportunities). It doesn't reuse `SidebarLayout`. Inspiration from Mobbin: Luma, StubHub and Meetup (recommended rows and chips), Sweatpals and GetYourGuide (removable filter tags), Codecademy (Upcoming and Past tabs).
- **Page:** `/member/*`.
- **Affects:** `src/app/member/`, `src/features/feed/`. The brand name in the top bar is **Nexus** (the existing title template); replace it when the product name is settled.
- **When encountered:** Every visit.

## 2. Opening a link is how something lands in Your opportunities
- **Decision (owner, 30 Sep 2026):** Clicking a call to action adds the opportunity to **Your opportunities** with no confirmation question. The button then reads **Opened**, a toast offers **Undo**, and the member can remove it later. Nothing in the UI claims the person attended or signed up.
- **Why:** SDC doesn't host registrations (`docs/product/README.md`), so opening the partner's link is all it can know. A "Did you go?" prompt was offered and declined.
- **Affects:** `MemberProvider.opened`, `docs/backend/feed.md`. The follow-up email within 48 hours (P0) can read the same records.
- **When encountered:** Every click of a call to action.

## 3. For you is ranked by interests only
- **Decision (owner, 30 Sep 2026):** Recommendations use the topics chosen at onboarding, nothing else. A topic match is worth most; a date in the next 3 or 7 days breaks ties. The best match is shown large, then **Closing soon**, then one row per interest. A listing appears once on the page. Area, budget and past clicks aren't used yet.
- **Affects:** `src/features/feed/matching.ts`. Interests can be edited from For you and the account menu. No cap on topics (a listing is capped at 3; a member isn't).
- **When encountered:** Opening For you.

## 4. Filters run in the browser and live in the URL
- **Decision (assumption):** The feed's opportunities are all sent to the page, and search, filters and sorting run in the browser so every tap answers at once. The URL follows (`?topic=food&kind=event&when=week&free=1&access=step_free&sort=soonest`) without adding history entries.
- **Rules (assumptions):** A place filter never hides petitions or other asks, which have no place. **Free events only** affects paid events only. An accessibility filter shows events only. **Next 7 days** and **Next 30 days** hide anything without a date.
- **Affects:** `matching.ts` (`applyFilters`). When the list outgrows what's reasonable to send to the browser, move the same filters to the server with the same URL.
- **When encountered:** Filtering Explore.

## 5. Every type is shown, including petitions
- **Decision (owner, 30 Sep 2026):** Events, volunteer roles, petitions, jobs and other asks all appear.
- **Watch:** Petitions and other civic actions must never be members-only (`docs/users.md`, Paying member constraints). The feed is an extra place to find them, not the only one: they keep going out by email and their partner links stay public. Early access to limited-capacity events is the only gating SDC has floated, and isn't built.

## 6. What members can see that isn't open
- **Decision (from the removed-partners rule):** The feed shows only opportunities that are currently published, so ended, closed and removed-partner listings disappear from it. **Your opportunities** keeps what a member already opened: ended ones show **Ended**, closed ones **Closed**, a removed partner's listing shows **Closed** for 30 days and then **No longer available**. See `docs/backend/opportunities.md#removed-partners`.
- **When encountered:** Coming back to **Your opportunities** after an event passes.

## 7. A link styled as a button lives in the feature, not the kit
- **Decision (assumption, needs design-system owner sign-off):** The feed's main action is a link (it opens the partner's page in a new tab), and the kit has no link button. `src/features/feed/components/ButtonLink.tsx` matches `Button`'s variants and sizes. If other screens need it, move it into `src/components/ui/` with a doc and a demo.
- **Affects:** `ButtonLink` and `NavButtonLink`.

## 8. Motion
Staggered card entrance (capped at 8), card lift and picture zoom on hover, a pressed state on buttons, a check that fades in when a link opens, a count that swells slightly in the top bar, filter tags that fade in, and Your opportunities rows that collapse away on removal. All use the existing duration and easing tokens, and reduced motion is handled globally.
