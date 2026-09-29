# Partners: backend requirements

From the Partners PRD, product decisions and the owner's UX spec (the owner's UX spec (retired)). The UI is built against:
- **Types:** `src/app/admin/partners/_data/types.ts`
- **Queries:** `_data/queries.ts`
- **Server actions:** `_data/actions.ts` (admin) and `src/app/partner/organization/_data/actions.ts` (partner). FormData field names and `ActionState` results are the contract.
- **Shared rules and messages:** `_data/contacts.ts` (people and invitations) and `_data/profile.ts` (organization profile). Both portals call these, so they validate and word things the same way.

A dev-only in-memory store (`_data/store.ts`) makes the UI work end to end. Replace `queries.ts` and the actions, then delete `store.ts`. Dev simulations: an email containing `fail` fails delivery; one containing `nosave` fails to save.

## Model
- An **organization** (partner) has one or more **people** (called contacts in the data model; the UI never says "contact"). Admins invite a *person* and attach them to an existing organization or add one inline.
- Person status: `pending` until they accept their invitation, then `active`. A removed person keeps their record with `removedAt`.
- Organization status (derived): `removed` if access was removed; otherwise `active` once anyone has accepted, else `pending` (shown as **Awaiting response**).
- **Invitation** (`sentAt?`, `expiresAt?`): the link that was last *delivered*. Both are absent until a send succeeds. Delivery errors are logged for SDC, never stored for display.
- **Invitation state** (derived at read time by `invitationStateOf` in `_data/contacts.ts`; return it as `invitationState` on pending people):
  | State | Rule | UI |
  |---|---|---|
  | `pending` | delivered, `expiresAt` in the future | Invitation pending; Expires {date} |
  | `notSent` | never delivered | Invitation not sent; Retry |
  | `expired` | delivered, `expiresAt` passed | Invitation expired; Expired {date} |

## Data the UI needs
- Organization (`PartnerOrganization`, both portals): `id`, `name`, `website?` (stored as https://), `description?` (up to 280 characters), `status`, `contacts[]` (current people with `invitationState`), `opportunityCount` (`countPublishedOpportunities(organizationId)` from `src/features/opportunities/queries.ts`), `createdAt`, `removedAt?`.
- Admin only (`AdminPartnerOrganization`): `health?` (below), `joinedAt?` (first acceptance), `lastPostedAt?` (latest `publishedAt` of any of its opportunities), `totalClicks` (clicks from SDC emails on its opportunities, all time), `notes?` (`{ text, editedBy, editedAt }`). **Never return these to the partner portal:** `getPartner` (used by `/partner/organization`) returns the partner shape only.
- Lists (in `_data/queries.ts`). Search, filters and sort all run on the server from URL params; each view's count uses the same `q` and filters. Each header filter returns its options with counts (search and the *other* filters applied).
  - `listPartners({ q, status[], health[], sort })` → `{ rows, facets: { status, health } }`. `status`: `active` (not removed) and/or `removed`; default `["active"]`; empty = both. `health`: tags; empty = off. Sort keys `name`, `health` (rule order), `people` (current people), `published` (`opportunityCount`), `lastPosted`; empty values sort last in either direction, ties by name. Search matches the organization's name and its people's names and emails.
  - `listPartnerPeople({ q, organizations[], tags[], sort })` → `{ rows, facets: { organizations, tags } }`. One row per person, each with `tag`: their invitation state (`pending`, `notSent`, `expired`), `removed` (removed from their organization, `removal: "person"`, or at a removed organization, `removal: "organization"` with the organization's `removedAt`), or none (has access). Tags filter values add `access` for no tag; default is every value except `removed`; empty = all. Sort keys `name`, `email`, `organization`, `tags` (labels A–Z, no tag last). Search matches name, email and organization name.
  - `listPartnerDirectory()`: every organization (admin shape) and person, unfiltered, so an open panel survives its row being filtered out. Fine at ~50 partners; fetch one by id instead once this grows.
  - `countPartnersNeedingSupport()`: organizations with access that have a health tag (the callout), ignoring search and filters.
  - `listActivePartnerEmails()`: **Copy all emails**. Emails of every current person at an organization with access (invited or accepted), A–Z, deduplicated.
  - `listOrganizationOptions()`: every organization, including removed ones (inviting someone to a removed organization reinvites it).

## Partner health
Derived on the server for each organization with access (`_data/health.ts`); removed organizations have none. **One tag, first match wins:**

| Order | `health.tag` | Rule |
|---|---|---|
| 1 | `notOnboarded` | No current person has accepted an invitation. |
| 2 | `noRecentPosts` | `now − (lastPostedAt ?? joinedAt ?? createdAt) > 60 days`. `health.since` is `lastPost` or `joined` (the reason's wording). |
| 3 | `notEmailed` | Some opportunity whose effective status is **published** and that was published more than 14 days ago was not in any SDC email within 14 days of `publishedAt`. |
| 4 | `noClicks` | At least one of its opportunities was emailed, and its emailed opportunities have zero clicks in total. |

- Thresholds: `NO_RECENT_POSTS_DAYS = 60`, `EMAIL_WITHIN_DAYS = 14` in `_data/types.ts` (the UI's reasons quote them).
- Inputs: `listPublishedHistory(organizationId)` (read-only, `src/features/opportunities/queries.ts`: every opportunity with a `publishedAt`, and its effective status) and, per opportunity, the first email it was in and its clicks from emails (`emailStatsFor` in `_data/emailStats.ts`, a dev stand-in seeded so every case appears). **Needed from the email/insights backend:** a record of which opportunities each sent email included (`opportunity_id`, `sent_at`) and click counts per opportunity per email.
- `joinedAt`: set when the organization's first person accepts (the acceptance handler). Dev seed only; falls back to `createdAt`.
- Compute at query time for now; a nightly job is fine once click data is large. The tag must match what the filter, sort and callout use.

## Dismissing health
- `dismissHealth(orgId)`: admin only. Stores the organization's current `health.tag` as `health_dismissed`. `activityOf` hides a tag equal to `health_dismissed`, so the organization drops out of the tag, the filter, the sort and the "{n} need support" count until its computed tag changes. Toast: "Dismissed the warning for {organization}. It comes back only if something else changes."
- The list banner's Dismiss is per browser (localStorage, keyed to the current count); no backend needed.

## SDC notes
- The panel autosaves (after 800ms without typing, and on blur) through the same action; there's no Save button and the UI no longer shows who edited last. `saveOrganizationNotes(orgId, _prev, fd)`: field `notes`, up to 2,000 characters (`ORGANIZATION_NOTES_MAX`; error "Shorten the notes to 2,000 characters or fewer."). Stores `{ text, editedBy: <admin's name from the session>, editedAt: now }`; empty text clears the note. Success: "Notes saved." Admin only; never readable from the partner portal. Keep history in the audit trail if SDC wants it later (the UI shows the latest edit only).

## Admin actions
| Action | Rules |
|---|---|
| `invitePartner` | Fields `name`, `email`, and `organizationId` or `organizationName` (new). Field errors only (no message): name missing, invalid email, email already has access somewhere ("This person already has access to {organization}."), no organization, duplicate new organization name. **Save first, then send.** Saved but not delivered → `status: "error"`, `data.saved: true`, "{name} was added, but we couldn't send the invitation. Select Retry to try again." Nothing saved → `data.saved: false`, "We couldn't send the invitation. Try again." If the email belonged to someone previously at that organization, restore their record instead of duplicating it. **If the organization is removed, this is a reinvite** (below). |
| `resendInvitation(contactId)` | Resend (pending), Retry (not sent) or Send new invitation (expired). On success: new single-use link, 7-day expiry, previous link invalidated. On failure: **change nothing**; a still-valid earlier link keeps working and the state stays as it was. Messages in `contactMessages`. |
| `cancelInvitation(contactId)` | Any invitation state. **Deletes** the person. An organization always has at least one person: if nobody remains, delete the organization when it was never active, or return it to removed (`removedAt` = now) when it was (a reinvited organization). Refuses an active person ("This invitation is no longer open. Refresh the team list."). |
| `updateContact(contactId)` | Fields `name`, `email`. Changing the email sends a fresh invitation to the new address first; if that send fails, nothing is saved. An active person stays active until the new address accepts. |
| `updateOrganization(orgId)` | Fields `name`, `website`, `description`; only fields present change. Name required and unique ("Enter the organization's name.", "Another organization already has this name."); website optional, normalized with `normalizeWebAddress` (`src/lib/url.ts`) so `sdckw.ca` is fine ("Enter a valid website, like sdckw.ca."); description up to 280 characters. Field errors only, no summary message. |
| `removeContact(contactId)` | Active people only ("This person doesn't have access yet. Cancel their invitation instead."). Refuses the organization's last person with access ("This is the only person with access to this organization. Remove the organization's access instead."). Ends that person's access now, keeps the record (`removedAt`). |
| `removePartner(orgId)` | Organization-level; effects below. Result: "{organization} no longer has access. Its opportunities are closed." |

Every admin action must verify the caller is an SDC admin.

### Reinviting a removed organization
Owner decision 8 ([decisions/partners.md](../decisions/partners.md) decision 13). `invitePartner` with a removed `organizationId`:
1. Store its listings as closed (`closeListingsForOrganization(organizationId)` in `src/features/opportunities/service.ts`) so none reopen early.
2. Clear the organization's `removedAt`. Its other people get `removedAt` (the removal date) and stay on People → Removed until invited again; the invited person's old record, if any, is restored as pending.
3. Invite the person as usual. Success: "Invitation sent to {email}. {organization} is awaiting a response."

Nobody has access until someone accepts.

## Partner actions (Organization → Team)
Partners manage their own team (decision 10). Each action re-checks `getCurrentPartner()` and only touches people of **that** organization; an ID from another organization acts as if it doesn't exist.

| Action | Same rules as |
|---|---|
| `updateMyOrganization` (FormData `name`, `website`, `description`) | `updateOrganization`, organization from the session |
| `inviteColleague` (FormData `name`, `email`) | `invitePartner`, organization fixed to the caller's. Partners never learn another organization's name: an email with access at their own organization gets "This person already has access to your organization."; elsewhere, "This person already has access to another organization. Contact SDC for help." |
| `resendColleagueInvitation(contactId)` | `resendInvitation` |
| `cancelColleagueInvitation(contactId)` | `cancelInvitation` |
| `removeColleague(contactId)` | `removeContact`, but the last-person refusal says "This is the only person with access to this organization. Contact SDC for help.", and it refuses the caller's own record ("You can't remove your own access. Ask a colleague or SDC for help."). Both are enforced on the server; the UI also hides Remove on your own row. |

**Signed out or access ended:** every partner action saves nothing and returns `status: "error"` with `data.blocked` = `signedOut` ("You've been signed out. Sign in again to save your changes.") or `accessEnded` ("Your organization no longer has access. Contact SDC if you think this is a mistake."). The page shows these as a persistent message with a sign-in link or `SDC_CONTACT_EMAIL` (`src/lib/contact.ts`), not a toast.

`PartnerUser` carries `contactId` so the UI can mark the signed-in person's row "(you)".

## Invitation acceptance
- Link valid for 7 days, single use. Only the most recently delivered link works.
- On acceptance the person becomes `active` and the invitation is cleared. The organization becomes active.
- **If the organization was reinvited after removal, the acceptance handler must call `reopenListingsForOrganization(organizationId)`** (`src/features/opportunities/service.ts`) once its access returns. That reopens its listings closed with **Partner access removed** whose dates haven't passed (owner decision 8). The Partners UI doesn't call it; there's no acceptance handler in the dev store.

## Removing a partner
- Immediately: revoke portal access and sessions for everyone at the organization; its published listings move to **Closed** with the reason **Partner access removed** (`closed_reason = partner_removed`; one whose date had already passed stays **Ended**), are no longer recommended and are left out of all future emails. See [opportunities.md](./opportunities.md#removed-partners).
- Keep the organization, its people and all opportunity records for history.
- Already-sent emails can't be recalled, and external registration links may keep working.

## Also needed
- Opportunities list filter by partner: `/admin/opportunities?org=<organizationId>`, used by "View opportunities".
- New opportunity for a partner: `/admin/opportunities/new?org=<organizationId>` preselects who it's posted as ("Post an opportunity for them"). Only an organization from `listPublisherOptions()` is used; anything else starts with SDC.
- Audit trail: who invited, cancelled, removed or reinvited, and when; delivery failures with their provider reason (never shown in the UI).
- A person belongs to one organization at a time. Moving = `removeContact` at the old organization, then `invitePartner` at the new one. Key everything on stable IDs; names and emails change.

Decisions and their rationale: [docs/decisions/partners.md](../decisions/partners.md).
