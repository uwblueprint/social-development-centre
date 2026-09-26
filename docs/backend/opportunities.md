# Opportunities: backend requirements

**Bottom line:** implement `queries.ts` and `service.ts` in `src/features/opportunities/` against real tables, keeping every function name, FormData field name and `ActionState` result. Then delete `store.ts`. Both portals share this code. What differs is the **actor**, which each portal's actions build from the session and never take from the client.

The UI is built against:
- **Types:** `src/features/opportunities/types.ts` (the contract)
- **Reads:** `src/features/opportunities/queries.ts`
- **Writes:** `src/features/opportunities/service.ts` (validation, status rules and user-facing messages)
- **Server actions:** `src/app/admin/opportunities/_data/actions.ts` and `src/app/partner/opportunities/_data/actions.ts`. These are thin wrappers that bind the actor and call `service.ts`.
- **Expiry and dates:** `src/features/opportunities/format.ts`
- **Labels, topics and limits:** `src/features/opportunities/catalog.ts`

A dev-only in-memory store (`store.ts`) makes both portals work end to end. It resets on restart.

Decisions and their rationale: [docs/decisions/opportunities.md](../decisions/opportunities.md). Every one of them is an assumption that SDC hasn't confirmed yet.

## Model

### `opportunities`
| Field | Type | Notes |
|---|---|---|
| `id` | text / uuid | Stable. The UI never keys on the title. |
| `kind` | `event` \| `petition` \| `volunteer` \| `job` \| `other` | Can't change after creation. `saveOpportunity` keeps the stored kind when editing. |
| `title` | text, ≤ 100 | Required, even for drafts. |
| `summary` | text, ≤ 280 | Required to publish. Written for email. |
| `topics` | `TopicId[]`, 1–3 | Required to publish. IDs come from `TOPICS` in `catalog.ts`. The list is a placeholder until the 29 September taxonomy; keep IDs stable if labels change. Store as an array column or a join table. |
| `link` | text, `https://` | Required to publish. The external page where people take action. |
| `organization_id` | FK → organizations, or `sdc` | SDC posts as itself (`SDC_ORG`). Either add SDC as an organizations row or treat `sdc` as a reserved ID. The UI needs `{ id, name }`, with the **current** name. |
| `details` | JSON (per kind, below) | Drafts may be partial. Live and closed listings are complete. |
| `status` | `draft` \| `live` \| `closed` | Stored status. See [Automatic expiry](#automatic-expiry). |
| `closed_reason` | `ended` \| `closed` \| null | `ended`: its date passed. `closed`: a person closed it. Null unless closed. |
| `created_at`, `updated_at` | timestamptz | |
| `updated_by` | `{ name, role: admin \| partner }` | Store the user ID and derive the name, so a renamed person shows their current name. The panel shows "Updated {when} by {who}". |
| `published_at` | timestamptz, nullable | Set the first time a listing goes live. Kept after it's closed. Cleared on duplicate. |

### `details` by kind
Dates are `yyyy-mm-dd` and times are `HH:mm` (24-hour), both local to Waterloo Region (America/Toronto).

| Kind | Required to publish | Optional |
|---|---|---|
| `event` | `date`, `startTime`, `format` (`in_person` \| `online` \| `hybrid`), `location` unless `online` | `endTime` (after `startTime`), `cost` (`free` \| `paid`, default `free`), `costDetails` (required if `paid`), `accessibility` |
| `petition` | `target` | `deadline`, `signatureGoal` (positive integer) |
| `volunteer` | `commitment` (`one_time` \| `ongoing`), `format` (`in_person` \| `remote` \| `hybrid`), `location` unless `remote` | `startDate`, `timeCommitment`, `skills`, `minimumAge` (positive integer), `applyBy` |
| `job` | `employmentType` (`full_time` \| `part_time` \| `contract` \| `temporary` \| `internship`), `workplace` (`on_site` \| `remote` \| `hybrid`), `location` unless `remote` | `pay`, `applyBy`, `qualifications` |
| `other` | `callToAction` | `deadline`, `details[]` (≤ 5 `{ label ≤ 40, value ≤ 120 }`) |

When the format or workplace is `online` or `remote`, `location` is dropped. When cost is `free`, `costDetails` is dropped.

JSON is enough because the feed and email only need the fields in this table. If you later filter emails by format, location or date in SQL, add those as columns.

### Audit
The panel only needs the latest `updated_by`. The user research asks to keep history ("who last changed a listing matters when both SDC and the partner edit it"), so an append-only log of each action (who, when, what) is recommended.

## Actor and permissions
`Actor` (`types.ts`) is either `{ role: "admin", name }` or `{ role: "partner", name, organizationId }`. **Always derive it from the session, never from FormData or arguments.** Each portal's `_data/actions.ts` already does this. Keep it that way, and re-check the session on every call.

| Operation | Partner | Admin |
|---|---|---|
| List, count, get | Only rows where `organization_id = actor.organizationId` | Every row |
| Create | Always their own organization. `organizationId` in FormData is **ignored**. | Any current (not removed) organization, or SDC. Defaults to SDC if empty. |
| Edit, close, reopen, duplicate, delete | Own organization only | Any |
| Filter by organization | Ignored | `organizationId` filter |

- **A row the actor can't see must act as if it doesn't exist.** `getOpportunity` returns `null`, and writes return the "no longer exists" error. Never reveal another organization's listing, even by a different error message.
- **Enforce scoping in the query or with row-level security** (Supabase RLS on `organization_id`), not only in application code.
- **Partners can't change a listing's organization.** Admins can, when editing.

## Session seams
**`getCurrentPartner()`** in `src/app/partner/_data/session.ts` returns a `PartnerUser` (`name`, `email`, `initials`, `avatarUrl?`, `organization { id, name }`) or `null`. It throws in production until implemented, so the partner portal fails closed.
- **Return `null` unless** the signed-in user is an **active** contact (they accepted their invitation and weren't removed) of a **current** organization (not removed). The layout then redirects to `/login`.
- **Return the organization's current name.** The sidebar shows it as the product name.
- **Call it on every partner action,** not just in the layout. Removing a person or an organization must end access at once, including for open tabs ([partners decisions 6 and 9](../decisions/partners.md)).
- **One organization per person.** A contact belongs to one organization at a time (partners decision 8), so there's no organization switcher.

`getCurrentAdmin()` (`src/app/admin/_data/session.ts`) is unchanged. It must check the SDC admin role.

## Reads (`queries.ts`)
| Function | Returns | Rules |
|---|---|---|
| `listOpportunities(actor, filters)` | `Opportunity[]` | Scoped to the actor. Apply [effective status](#automatic-expiry) before choosing the tab. `filters.tab`: `live`, `drafts` or `closed` (closed includes ended). Optional filters: `kind`, `organizationId` (admins only), and `q`, a case-insensitive substring of the title **or** the organization name. **Sort:** Live by key date, soonest first and undated last, then most recently updated. Drafts and Closed by most recently updated. |
| `getOpportunityCounts(actor, filters)` | `{ live, drafts, closed }` | The same scope and filters as the list, without the tab. Used for the tab counts. |
| `getOpportunity(actor, id)` | `Opportunity \| null` | `null` if missing **or** not visible to the actor. Returned with effective status. |
| `listPublisherOptions()` | `OrganizationRef[]` | Admin only. SDC first, then current (not removed) partners A–Z. Feeds the form's **Organization** picker and the list's **Organization** filter. |
| `countLiveOpportunities(organizationId)` | `number` | Effective status `live` for one organization. Replaces Partners' stored `opportunityCount` in the Organizations table and in "View opportunities ({count})". |

Paging isn't built. Volumes are small (about 50 partners). Add paging when a tab regularly passes about 200 rows.

## Writes (`service.ts`)
Each function takes `(actor, …)` and returns `ActionState` from `src/lib/forms.ts`. **Keep the messages exactly as written.** The UI shows them as toasts and field errors, and they're listed in [docs/ux/partner.md](../ux/partner.md#opportunities-copy).

| Function | Behaviour | Success message |
|---|---|---|
| `saveOpportunity(actor, fd)` | Create when there's no `id`, update when there is. Validates (below), sets the status from `intent`, stamps `updated_at` and `updated_by`, and sets `published_at` on first publish. Returns `data: { id }`. | `Draft saved.` / `Published. The {noun} is now live.` (new, or was a draft) / `Changes saved.` |
| `closeOpportunity(actor, id)` | `status = closed`, `closed_reason = closed`. | `Closed. It won't appear in emails or the feed.` |
| `reopenOpportunity(actor, id)` | `status = live` and clears `closed_reason`. **Refuse if the listing has already ended.** | `Reopened. It's live again.` |
| `duplicateOpportunity(actor, id)` | New draft: a copy with a new `id` and the title `Copy of {title}` (cut to 100 characters). Same organization. Clears `closed_reason` and `published_at`; resets the timestamps and `updated_by`. Returns `data: { id }`. | `Duplicated as a draft.` |
| `deleteOpportunity(actor, id)` | Hard delete. The UI confirms first. | `Deleted “{title}”.` |

If a listing is missing or the actor can't access it, `saveOpportunity` returns `This opportunity no longer exists, or you can't edit it. Go back to the list.` The other four functions return `This opportunity no longer exists.`

### FormData fields (`saveOpportunity`)
All values are strings. Fields marked "multiple" repeat the key.

| Field | Notes |
|---|---|
| `id` | Present when editing. |
| `kind` | `event` \| `petition` \| `volunteer` \| `job` \| `other`. Ignored when editing (the stored kind wins). |
| `intent` | `draft` saves as a draft. `publish` makes it live. `save` keeps the current effective status (for **Save changes** on a live or closed listing). Default: `publish`. |
| `organizationId` | Admin only. Ignored for partners. Empty means SDC. |
| `title`, `summary`, `link` | |
| `topics` | Multiple. Unknown IDs and duplicates are dropped. |
| Event | `date`, `startTime`, `endTime`, `format`, `location`, `cost`, `costDetails`, `accessibility` |
| Petition | `target`, `deadline`, `signatureGoal` |
| Volunteer role | `commitment`, `format`, `location`, `startDate`, `timeCommitment`, `skills`, `minimumAge`, `applyBy` |
| Job | `employmentType`, `workplace`, `location`, `pay`, `applyBy`, `qualifications` |
| Other | `callToAction`, `deadline`, `detailLabel` (multiple), `detailValue` (multiple), paired by position. Rows with both empty are skipped. |

### Validation
- **The strictness depends on the next status.** Publishing, and saving a live or closed listing, are **strict** (every required field). Drafts are **lenient**: only a title is required, but anything that *is* filled in must still be valid (lengths, date and time format, link format, a positive integer, end time after start time, complete detail pairs).
- **Field errors are keyed by the control `name`.** Custom details use `detailLabel.{i}` and `detailValue.{i}`; too many details uses `details`.
- **The form-level message** is `Fix the highlighted fields to publish.` (strict) or `Fix the highlighted fields to save.` (draft).
- **Links:** the hint and error say `https://`, but the dev service also accepts `http://`. Pick one; requiring `https://` matches the copy.
- **You can't make a listing live with a date that has passed.** The error goes on `date` (events), `applyBy` (volunteer role, job) or `deadline` (petition, other).
- The full list of messages is in [docs/ux/partner.md](../ux/partner.md#validation-messages).

## Automatic expiry
Rule (`format.ts`, `hasEnded` and `effectiveStatus`):
- **Key date:** event `date`; petition and other `deadline`; volunteer and job `applyBy`.
- **An event ends at `date` + `startTime`.** Every other kind ends at 23:59:59.999 on its key date, in Waterloo Region time.
- **No key date means it never ends automatically.**
- **Drafts never expire.** Only `live` listings do.
- **An ended live listing reads as `closed` with `closed_reason = ended`** (shown as **Ended**). It moves to the Closed tab and out of the live count.

Implement this as a scheduled job (at least hourly, since events end at their start time) that writes `status = closed, closed_reason = ended`, **or** as a rule applied at query time. Either way, every read, count and email query must agree, and the timezone must be America/Toronto rather than the server's.

**Known edge in the dev service:** saving (`intent=save`) a listing that ended but is still stored as `live` writes `closed_reason = closed`, so it would show **Closed** instead of **Ended**. If you store expiry with a job, this can't happen. If you compute it at query time, keep `ended` when the effective reason is `ended`.

## Removed partners (open question)
Partners decision 6 says a removed organization's listings stop being recommended and emailed **at once**, then each expires at the earlier of its own end date or **removal + 1 month**. The Opportunities code doesn't implement this yet:
- `effectiveStatus` doesn't know about removal, so a removed partner's listings stay **Live** in the admin list until their own date.
- `listPublisherOptions` leaves out removed partners, so admins **can't filter** to their listings and can't post as them. Posting as them is intended; filtering to them is a gap.
- Partners can't see anything after removal, because `getCurrentPartner` returns `null`.

**Open question for SDC:** when a partner is removed, should their live listings be **closed at once** (simplest, and matches "stop emailing now"), or follow the one-month cutoff? Until SDC answers, implement partners decision 6: exclude them from emails and recommendations from `removedAt`, and treat `removedAt + 1 month` as an extra key date in expiry. Reinviting doesn't republish them.

## Revalidation
After any successful write, revalidate:
- `/admin/opportunities`
- `/partner/opportunities`
- `/admin/partners` (the opportunity counts)

If the form's edit pages or the partner organization page render cached data, add `/admin/opportunities/[id]/edit` and `/partner/opportunities/[id]/edit`.

## Partner organization profile
The partner **Organization** page edits the organization's name, website and short description, and lists the team read-only (decisions 8 and 9). The requirements are in [backend/partners.md](./partners.md) under `updateOrganization`:
- `updateMyOrganization` (`src/app/partner/organization/_data/actions.ts`) takes FormData `name`, `website` and `description`. It takes the organization from `getCurrentPartner()`, never from the client, and refuses removed organizations.
- The validation is shared with the admin action in `src/app/admin/partners/_data/profile.ts`.
- A name change must show up everywhere at once: listings, the partner sidebar and Partners. Store organizations by ID only; never copy the name onto opportunity rows. The dev store copies it (`OrganizationRef` on each record), so renames don't reach existing listings in development.
- Team: the organization's current contacts (name, email, and whether they're pending). Read-only.

## Also needed
- **The Partners panel link.** "View opportunities" links to `/admin/opportunities?org=<organizationId>`. The list reads `org` (plus `tab`, `q`, `kind`) in `components/listParams.ts` and passes it as `filters.organizationId`; partners' `org` is ignored.
- **Emails and the feed** (not built) must read only effective-`live` listings from current partners.

## Delete when done
- `src/features/opportunities/store.ts` (the seed data and in-memory store).
- The imports of `@/app/admin/partners/_data/store` (`orgs`, `statusOf`) in `queries.ts`, `service.ts` and `src/app/partner/_data/session.ts`. Replace them with real organization queries.
