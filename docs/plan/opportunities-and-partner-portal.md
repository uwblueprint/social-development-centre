# Plan: Opportunities (admin) + partner portal

Status: in build, 26 September 2026. Frontend only, backed by dev stores and `_data` contracts, the same seams as Partners and Community.

## Bottom line
- **Partners and SDC admins post five kinds of opportunity**, each with its own form: event, petition, volunteer role, job, and "other" (a custom shape).
- **Every opportunity** has a title, a short description, 1–3 topics, and one external link where people take action. The type-specific fields sit on top of that.
- **Admins can do anything a partner can,** for any organization, including SDC itself.
- **Partners only see their own organization.** A new `/partner` portal reuses the admin sidebar layout and the same opportunity screens.
- **Nobody hosts registration.** Every opportunity links out to the partner's page (Second Yes constraint).

## Questions I'd have asked upfront, and the assumption taken
The user was unavailable. Each assumption is recorded in [decisions/opportunities.md](../decisions/opportunities.md) so it can be reversed cheaply.

| # | Question | Assumption built |
|---|---|---|
| 1 | What is "opportunities (custom thing)"? | **Owner confirmed (26 Sep).** A fifth type called **Other**. It has a required call to action (e.g. "Take the survey"), an optional deadline, and up to 5 custom label/value details. It covers programs, surveys and calls for input that don't fit the other four. |
| 2 | Does SDC review partner listings before they go live? | **Owner confirmed (26 Sep): no review step.** Notion marks review as P2/TBD. Partners publish directly, and admins can edit, close or delete anything. |
| 3 | Who tags topics? | **Whoever posts.** At least 1 and at most 3 topics are required to publish. The topic list is a placeholder until the 29 September taxonomy session. |
| 4 | When does a listing leave the feed? | **Events** end at their start time (Notion, 24 September). **Other types** end the day after their deadline; with no deadline they stay live until someone closes them. |
| 5 | Drafts? | **Yes.** "Save as draft" needs only a title (anything else filled in must still be valid), and drafts are invisible to members. Publishing validates everything. |
| 6 | Delete vs close? | **Close** takes a listing out of emails and the feed but keeps it (for the record and follow-ups). **Delete** is permanent, for mistakes, and asks for confirmation. Closed listings can be reopened. |
| 7 | Recurring events? | **Out of scope.** "Duplicate" copies a listing into a new draft instead. |
| 8 | Can partners invite colleagues or remove people? | **Owner decided (26 Sep): yes**, within their own organization. SDC can still manage everyone. |
| 9 | Can partners rename their organization? | **Yes.** They can edit their name, website and short description. Admins can edit the same fields from Partners. |
| 10 | Images or logos? | **Out of scope.** Emails are text-first and there's no upload backend yet. |
| 11 | Eventbrite prefill from a pasted link? | **Out of scope** (still a spike). The form keeps the link field first-class so prefill can slot in later. |
| 13 | What happens to a removed partner's listings? | **Owner decided (26 Sep):** stop emailing them at once; people who already got them can see them until the listing ends or one month after removal, whichever is sooner. |
| 12 | Which fields does each type need? | The minimum set below, following Notion's rule "store only what the feed and email need". |

## Opportunity model
**Common fields**, all required to publish:
- **Title:** up to 100 characters.
- **Short description:** up to 280 characters, written for email.
- **Topics:** 1–3.
- **Link:** must start with `https://`.
- **Organization:** for admins, this is a picker. For partners, it's always their own organization.

| Kind | Required to publish | Optional |
|---|---|---|
| Event | Date, start time, format (in person / online / hybrid), and a location unless the event is online | End time, cost (free/paid plus details), accessibility notes |
| Petition | Who it's addressed to | Deadline, signature goal |
| Volunteer role | Commitment (one-time / ongoing), format (in person / remote / hybrid), and a location unless the role is remote | Start date, time commitment, skills, minimum age, apply-by date |
| Job | Employment type, workplace (on-site / remote / hybrid), and a location unless the job is remote | Pay, apply-by date, qualifications |
| Other | Call to action | Deadline, up to 5 custom details (label + value) |

**Status** is one of:
- `draft`
- `live`
- `closed`, with a reason: `ended` (the date passed on its own) or `closed` (a person closed it).

The contract is `src/features/opportunities/types.ts`, and every label lives in `src/features/opportunities/copy.ts`.

## Information architecture
**Admin: `/admin/opportunities`**
- Header: the title plus the **New opportunity ▾** menu (Event, Petition, Volunteer role, Job, Other), following Calendly's "Create ▾".
- Underline tabs by status with counts: **Live · Drafts · Closed** (following Sweatpals and Xero).
- Toolbar:
  - Search, which submits on Enter or with the button.
  - A **Type** select.
  - An **Organization** select (admin only).
- Table columns: Opportunity (icon + title, type as text), Organization (admin only), Date, and Updated. There is no status column; the tab is the status.
- Clicking a row opens a side panel with the read-only details. The panel has one primary action, **Edit**, and a ⋯ menu with Open link, Duplicate, Close/Reopen and Delete.
- **New and edit open a full page:** `/admin/opportunities/new?kind=event` and `/admin/opportunities/[id]/edit`.
  - It's a focused single-column form with sections (HoneyBook, Squarespace).
  - A sticky footer holds **Publish** (primary), **Save as draft** and **Cancel**.
- **Partners integration.** The partner panel links "View opportunities" to `/admin/opportunities?org=<id>`, and the opportunity count now comes from real data.

**Partner: `/partner`**
- The sidebar uses the same `SidebarLayout`, with the organization's name as the product name. Sections are **Opportunities** and **Organization**. The profile menu holds My account and Sign out.
- `/partner/opportunities` is the same list and panel with no organization column or filter. New and edit use the same pages, scoped to the partner's own organization.
- `/partner/organization` edits the name, website and short description, and shows the team read-only.

## Permissions
| Action | Partner | Admin |
|---|---|---|
| List, view, create, edit, duplicate, close, reopen or delete opportunities | Own organization only | Any organization, including SDC |
| Choose the posting organization | No | Yes |
| Edit organization profile | Own organization only | Any organization (Partners) |
| Invite, edit or remove partner people and organizations | No | Yes (existing) |
| Members, analytics | No | Yes |

The server actions enforce this. The UI only hides what doesn't apply.

## States designed
- Loading: route-level `loading.tsx` skeletons.
- Empty: per tab, plus a no-results state for search and filters.
- Validation errors: per field, plus a form-level toast.
- Success toasts.
- Delete confirmation.
- Long titles: truncated in the table, wrapped in the panel.
- Width: works at 360px, where the table scrolls horizontally and the form is a single column.

## Build split
1. **Contract, store, queries and service,** plus the lint rule for `src/features/**`. Done first; everything else depends on it.
2. **List, panel and actions menu,** wired into admin and partner.
3. **Form and per-kind sections,** with new and edit routes in both portals.
4. **Partner portal:** shell, session, organization page, Partners integration and the a11y test routes.
5. **Docs:** user guide, decisions, backend requirements and UX copy.

Each part gets one verification pass: `pnpm check` plus a browser smoke test, with at most two fix rounds.

## Out of scope for this pass
- A review queue.
- Link prefill.
- Images.
- Recurring events.
- Attendance import.
- Analytics.
- The members' feed.
- Partners inviting colleagues.
