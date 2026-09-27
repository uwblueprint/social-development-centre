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
| `link` | text, `https://` | Required to publish. The external page where people take action. People may type it without a protocol (`sdckw.ca`); `saveOpportunity` stores the result of `normalizeWebAddress` (`src/lib/url.ts`). |
| `organization_id` | FK → organizations, or `sdc` | SDC posts as itself (`SDC_ORG`). Either add SDC as an organizations row or treat `sdc` as a reserved ID. The UI needs `{ id, name }`, with the **current** name. |
| `details` | JSON (per kind, below) | Drafts may be partial. Published and closed listings are complete. |
| `status` | `draft` \| `published` \| `closed` | Stored status, shown as **Draft**, **Published**, **Closed**. See [Automatic expiry](#automatic-expiry). |
| `closed_reason` | `ended` \| `closed` \| `partner_removed` \| null | `ended`: its date passed. `closed`: a person closed it. `partner_removed`: its organization's access was removed (shown as **Partner access removed**; see [Removed partners](#removed-partners)). Null unless closed. |
| `created_at`, `updated_at` | timestamptz | |
| `updated_by` | `{ name, role: admin \| partner }` | Store the user ID and derive the name, so a renamed person shows their current name. The panel shows "Updated {when} by {who}". |
| `published_at` | timestamptz, nullable | Set the first time a listing is published. Kept after it's closed. Cleared on duplicate. |

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

JSON is enough because emails and recommendations only need the fields in this table. If you later filter emails by format, location or date in SQL, add those as columns.

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
| `listOpportunities(actor, filters)` | `Opportunity[]` | Scoped to the actor. Apply [effective status](#automatic-expiry) before choosing the tab. `filters.tab`: `published`, `drafts` or `closed` (closed includes ended listings and those of removed partners). Optional filters: `kind`, `organizationId` (admins only), and `q`, a case-insensitive substring of the title **or** the organization name. **Sort:** Published by key date, soonest first and undated last, then most recently updated. Drafts and Closed by most recently updated. |
| `getOpportunityCounts(actor, filters)` | `{ published, drafts, closed }` | The same scope and filters as the list, without the tab. Used for the tab counts. |
| `getOpportunity(actor, id)` | `Opportunity \| null` | `null` if missing **or** not visible to the actor. Returned with effective status. |
| `listPublisherOptions()` | `OrganizationRef[]` | Admin only. SDC first, then current (not removed) partners A–Z. Feeds the form's **Organization** picker. |
| `listOrganizationFilterOptions()` | `OrganizationFilterOption[]` | Admin only. `listPublisherOptions()` plus removed partners that have listings (`removed: true`). Feeds the list's **Organization** filter. |
| `countPublishedOpportunities(organizationId)` | `number` | Effective status `published` for one organization (a removed partner has none). Replaces Partners' stored `opportunityCount` in the Organizations table and in "View opportunities ({count})". `countLiveOpportunities` is a deprecated alias until Partners switches over. |

Paging isn't built. Volumes are small (about 50 partners). Add paging when a tab regularly passes about 200 rows.

## Writes (`service.ts`)
Each function takes `(actor, …)` and returns `ActionState` from `src/lib/forms.ts`. **Keep the messages exactly as written.** The UI shows action results as toasts, and validation errors beside fields and in the form's error summary, and they're listed in [docs/ux/portal.md](../ux/portal.md#listing-actions-and-states) (Opportunities table).

| Function | Behaviour | Success message |
|---|---|---|
| `saveOpportunity(actor, fd)` | Create when there's no `id`, update when there is. Validates (below), normalizes `link`, sets the status from `intent`, stamps `updated_at` and `updated_by`, and sets `published_at` on first publish. Returns `data: { id, tab }`. | `Draft saved.` / `Published. Members can now see this {type}.` (new, or was a draft) / `Changes saved.` |
| `closeOpportunity(actor, id)` | `status = closed`, `closed_reason = closed`. No confirmation in the UI. | `Closed. This opportunity won't be recommended to members or included in emails.` |
| `reopenOpportunity(actor, id)` | `status = published` and clears `closed_reason`. **Refuse if the listing has already ended** (`This {type} has already ended. Edit its date to reopen it.`) **or its organization is removed** (`This partner no longer has access. Reinvite them before reopening their opportunities.`). No confirmation in the UI. | `Reopened. Members can see this opportunity again.` |
| `duplicateOpportunity(actor, id)` | New draft: a copy with a new `id` and the title `Copy of {title}` (cut to 100 characters). Same organization. Clears `closed_reason` and `published_at`; resets the timestamps and `updated_by`. Returns `data: { id }`. No confirmation in the UI. | `Duplicated as a draft.` |
| `deleteOpportunity(actor, id)` | Hard delete. The UI confirms first. | `Deleted “{title}”.` |

If a listing is missing or the actor can't access it, every function returns `This opportunity no longer exists.` `{type}` is `KIND_NOUN` in `catalog.ts` (event, petition, volunteer role, job, opportunity).

### FormData fields (`saveOpportunity`)
All values are strings. Fields marked "multiple" repeat the key.

| Field | Notes |
|---|---|
| `id` | Present when editing. |
| `kind` | `event` \| `petition` \| `volunteer` \| `job` \| `other`. Ignored when editing (the stored kind wins). |
| `intent` | `draft` saves as a draft. `publish` publishes it. `save` keeps the current effective status (for **Save changes** on a published or closed listing). Default: `publish`. |
| `organizationId` | Admin only. Ignored for partners. Empty means SDC. |
| `title`, `summary`, `link` | |
| `topics` | Multiple. Unknown IDs and duplicates are dropped. |
| Event | `date`, `startTime`, `endTime`, `format`, `location`, `cost`, `costDetails`, `accessibility` |
| Petition | `target`, `deadline`, `signatureGoal` |
| Volunteer role | `commitment`, `format`, `location`, `startDate`, `timeCommitment`, `skills`, `minimumAge`, `applyBy` |
| Job | `employmentType`, `workplace`, `location`, `pay`, `applyBy`, `qualifications` |
| Other | `callToAction`, `deadline`, `detailLabel` (multiple), `detailValue` (multiple), paired by position. Rows with both empty are skipped. |

### Validation
- **The strictness depends on the next status.** Publishing, and saving a published or closed listing, are **strict** (every required field). Drafts are **lenient**: only a title is required, but anything that *is* filled in must still be valid (lengths, date and time format, link format, a positive integer, end time after start time, complete detail pairs).
- **Field errors are keyed by the control `name`.** Custom details use `detailLabel.{i}` and `detailValue.{i}`; too many details uses `details`.
- **The form-level message** titles the form's error summary, and is never shown as a toast: `Fix {n} field(s) to publish this {type}` (publish), `… to save your changes` (save) or `… to save this draft` (draft).
- **Links:** accept anything `normalizeWebAddress` accepts (`sdckw.ca`, `www.sdckw.ca/events`, `http://…`, `https://…`) and store its `https://` result. Otherwise the error is `Enter a web address, like sdckw.ca.`
- **You can't publish a listing with a date that has passed.** The error goes on `date` (events), `applyBy` (volunteer role, job) or `deadline` (petition, other).
- The field messages are in `service.ts`; the rules for showing them are in [docs/ux/portal.md](../ux/portal.md#shared-rules) (Form errors).

## Automatic expiry
Rule (`format.ts`, `hasEnded` and `effectiveStatus`):
- **Key date:** event `date`; petition and other `deadline`; volunteer and job `applyBy`.
- **An event ends at `date` + `startTime`.** Every other kind ends at 23:59:59.999 on its key date, in Waterloo Region time.
- **No key date means it never ends automatically.**
- **Drafts never end.** Only `published` listings do.
- **An ended published listing reads as `closed` with `closed_reason = ended`** (Closed, reason **Ended**). It moves to the Closed tab and out of the published count.

Implement this as a scheduled job (at least hourly, since events end at their start time) that writes `status = closed, closed_reason = ended`, **or** as a rule applied at query time. Either way, every read, count and email query must agree, and the timezone must be America/Toronto rather than the server's.

**Known edge in the dev service:** saving (`intent=save`) a listing that ended but is still stored as `published` writes `closed_reason = closed`, so it would show **Closed** instead of **Ended**. If you store expiry with a job, this can't happen. If you compute it at query time, keep `ended` when the effective reason is `ended`.

## Removed partners
Decided by owner, 26 Sep 2026 ([opportunities decisions 13 and 14](../decisions/opportunities.md), owner decision 8 in `docs/ux/portal.md`).

**Admin and partner views.** Implemented at query time in `format.ts` (`effectiveStatus(o, now, partnerRemovedAt)`), with `queries.ts` passing the organization's `removedAt`:
- From `removedAt`, every published listing of the organization reads as `closed` with `closed_reason = partner_removed` (**Closed**, reason **Partner access removed**). A listing whose own date passed before `removedAt` reads as `ended`. If you store this instead, write it when access is removed (`closeListingsForOrganization(organizationId)` does that in the dev store).
- `reopenOpportunity` refuses while the organization is removed: `This partner no longer has access. Reinvite them before reopening their opportunities.`
- **Admin Organization filter:** `listOrganizationFilterOptions()` returns SDC, current partners, then removed partners that still have listings (`removed: true`, shown as "{name} (removed)"; that names the organization, not a listing status). `listPublisherOptions()` still leaves removed partners out, so nobody can post as them.
- Partners of a removed organization can't sign in (`getCurrentPartner` returns `null`), so only admins see these states.

**Members (not built yet).** Keep the owner's visibility rule on the member side:
- Leave every listing of a removed organization out of all new emails and recommendations from `removedAt`.
- People who were **already emailed** a listing can still view it until **the earlier of its own end or `removedAt` + 1 month** (30 days). Undated listings use `removedAt` + 30 days. After that, show it as no longer available.
- This is a read rule for member-facing pages only. The admin view just shows Closed with the reason.

**Reinstatement (owner decision 8).** Reinviting doesn't change any listing. Access returns when someone at the organization **accepts** an invitation; the acceptance handler then clears `removed_at` and calls:

| Function | Behaviour |
|---|---|
| `reopenListingsForOrganization(organizationId)` (`service.ts`) | For the organization's listings with `status = closed` and `closed_reason = partner_removed`: if the date hasn't passed, set `status = published` and clear `closed_reason`; if it has, set `closed_reason = ended`. Listings closed by a person (`closed`) or already `ended` are untouched. Returns the number reopened. Revalidates the list pages. |
| `closeListingsForOrganization(organizationId)` (`service.ts`) | Stores the organization's effectively-removed published listings as `closed` / `partner_removed`. Call it on removal, or at the latest before `removed_at` is cleared on reinvite, so reinviting alone doesn't republish them. `closeListingsPastRemovalCutoff(organizationId, removedAt)` is a deprecated alias that Partners' reinvite still calls. |

Order at acceptance: clear `removed_at`, then `reopenListingsForOrganization`. Do both in one transaction so a listing is never published for a removed organization.

## Revalidation
After any successful write, revalidate:
- `/admin/opportunities`
- `/partner/opportunities`
- `/admin/partners` (the opportunity counts)

If the form's edit pages or the partner organization page render cached data, add `/admin/opportunities/[id]/edit` and `/partner/opportunities/[id]/edit`.

## Partner organization profile
The partner **Organization** page edits the organization's name, website and short description, and manages the team: partners invite and remove colleagues (opportunities decision 8, partners decision 10). The requirements are in [backend/partners.md](./partners.md) under `updateOrganization`:
- `updateMyOrganization` (`src/app/partner/organization/_data/actions.ts`) takes FormData `name`, `website` and `description`. It takes the organization from `getCurrentPartner()`, never from the client, and refuses removed organizations.
- The validation is shared with the admin action in `src/app/admin/partners/_data/profile.ts`.
- A name change must show up everywhere at once: listings, the partner sidebar and Partners. Store organizations by ID only; never copy the name onto opportunity rows. The dev store copies it (`OrganizationRef` on each record), so renames don't reach existing listings in development.
- Team: the organization's current contacts (name, email, and whether they're pending). Partners invite and remove colleagues themselves; see [backend/partners.md](./partners.md#partners-managing-their-own-team).

## Also needed
- **The Partners panel link.** "View opportunities" links to `/admin/opportunities?org=<organizationId>`. The list reads `org` (plus `tab`, `q`, `kind`) in `components/listParams.ts` and passes it as `filters.organizationId`; partners' `org` is ignored.
- **Emails and recommendations** (not built) must read only effective-`published` listings, which excludes removed partners. See [Removed partners](#removed-partners) for what already-emailed members can still view.

## Delete when done
- `src/features/opportunities/store.ts` (the seed data and in-memory store).
- The imports of `@/app/admin/partners/_data/store` (`orgs`, `statusOf`) in `queries.ts`, `service.ts` and `src/app/partner/_data/session.ts`. Replace them with real organization queries.
