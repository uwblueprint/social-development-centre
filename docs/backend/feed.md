# Member feed: backend requirements

The feed is front end only today. The UI is built against:
- **Types:** `src/features/feed/types.ts` (`MemberProfile`, `KnownOpportunity`, `YoursEntry`).
- **Queries:** `src/features/feed/queries.ts`.
- **Session:** `src/app/member/_data/session.ts` (`getCurrentMember`).
- **Server actions:** `src/app/member/_data/actions.ts`.
- **Browser stand-in:** `src/features/feed/store.ts` (localStorage). Delete it when the actions below store real data.

## Who can see it
`getCurrentMember()` returns the signed-in **paying** member (`{ id, name, email, interests }`), or `null` for anyone else; the layout then redirects to `/login`. It throws in production until implemented, so the feed fails closed. Every member action must call it again. Interests are the topics chosen at onboarding (`TopicId[]`).

## Reading
- `listOpenOpportunities()`: every opportunity that is effectively published now (drafts, ended, closed and removed partners' listings are left out; see `format.ts` `effectiveStatus`). Returns full `Opportunity` records. Everything is sent to the page; ranking, search and filters run in the browser (`matching.ts`). If there are ever thousands, move those to the server and keep the URL params (`q`, `kind`, `topic`, `area`, `when`, `free`, `access`, `sort`).
- `listKnownOpportunities()`: every non-draft opportunity with an `availability` (`open`, `ended`, `closed`, `unavailable`). Replace it with a query over **the member's own opened ids** so a member never receives records they didn't open. `unavailable` is a removed partner's listing more than 30 days after `removedAt`.

## Writing
| Action | Field | What to store |
|---|---|---|
| `recordOpen(opportunityId)` | id | One row per member and opportunity: `{ memberId, opportunityId, openedAt }`. Idempotent: a second open keeps the first `openedAt`. |
| `forgetOpen(opportunityId)` | id | Delete that row. Also what **Undo** calls. |
| `saveInterests(prev, fd)` | `topic`, once per chosen topic | Replace the member's interests. Ignore unknown topic ids. An empty set is valid. Returns `{ status: "success", data: { interests } }`. |

All return `ActionState`. A signed-out session returns `status: "error"` with `fieldErrors: { session: "signed-out" }`, which the UI turns into a **Sign in** prompt; other failures return a plain-language `message`.

## Also useful
- **The follow-up email and digest (P0, P2)** can read `openedAt` to pick a related next step within 48 hours. "Opened" isn't attendance, and the UI never says it is.
- **Clicks from the feed** should count with email clicks in `performance.clicks` (see `docs/backend/opportunities.md`), tagged by source (`email` or `feed`).
- **The feed's link** goes straight to the partner's page, as in email. There's no SDC redirect to count opens; `recordOpen` is the count.
- **Offline:** an open made offline is kept on the device only. Queue it and send `recordOpen` when the connection returns.
- **Interests** feed the segment used to send emails (P1), so keep one source of truth.

## Delete when done
- `src/features/feed/store.ts` and its uses in `MemberProvider.tsx`.
- The `STATE LAB` lines in `src/app/member/_data/session.ts`, `src/features/feed/queries.ts` and `MemberShell.tsx`.
- The imports of `@/app/admin/partners/_data/store` and `@/features/opportunities/store` in `queries.ts`.
