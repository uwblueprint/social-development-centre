# Partners: backend requirements

From the Partners PRD plus product decisions. The UI is built against:
- **Types:** `src/app/admin/partners/_data/types.ts`
- **Queries:** `_data/queries.ts`
- **Server actions:** `_data/actions.ts` (FormData field names and `ActionState` results are the contract)

A dev-only in-memory store (`_data/store.ts`) makes the UI work end to end. Replace `queries.ts` and `actions.ts`, then delete `store.ts`.

## Model
- An **organization** (partner) has one or more **contacts** (people; typically 4–5). Admins invite a *person* and attach them to an existing organization or create one inline.
- Contact status: `pending` until they accept their invitation, then `active`.
- Organization status (derived): `removed` if access was removed; otherwise `active` once any contact has accepted, else `pending`. Only Pending is labelled in the UI.

## Data the UI needs
- Organization: `id`, `name`, `website?` (`https://` only), `description?` (up to 280 characters), `status`, `contacts[]`, `opportunityCount` (live opportunities: published and not ended or closed; derived from Opportunities), `createdAt`, `removedAt?`.
- Contact: `id`, `name`, `email`, `status`, `invitation?` (`sentAt`, `expiresAt`, `sendError?`), `removedAt?` (removed contacts are kept but not listed).
- Lists (all in `_data/queries.ts`, all searchable by organization name, contact name or email; server-side once lists grow, and each tab count uses the same `q`):
  - `listPartners("current" | "removed", q)`: organizations.
  - `listPartnerPeople(q)`: **active** contacts at current organizations (People tab).
  - `listPendingInvitations(q)`: **pending** contacts at current organizations, including organizations nobody has joined yet (Invitations tab). Returns `PendingInvitation` (a person plus a required `invitation` and `expired`, true once `expiresAt` has passed; compute it at read time). Sorted by `expiresAt` ascending, so expired ones come first. An active contact with an outstanding email-change invitation stays on People, not here.

## Actions
| Action | Rules |
|---|---|
| `invitePartner` | Fields `name`, `email`, and `organizationId` or `organizationName` (new). Reject a duplicate email among current contacts and a duplicate organization name (as field errors). Send the invitation; on send failure keep the contact with `sendError` so the admin can retry. |
| `resendInvitation` | New link (7-day expiry, single use); previous link stops working. |
| `cancelInvitation` | Pending contacts only. **Deletes** the contact. Deletes the organization too if no contacts remain and it was never active. |
| `updateContact` | Fields `name`, `email`. Changing the email sends a fresh invitation and invalidates the old one. **An active contact stays active** until the new address accepts, then sign-in moves to the new address. |
| `updateOrganization` | Fields `name`, `website`, `description`; only fields present in the FormData change (the panel saves the name and the profile separately). Name required and unique among organizations; website empty or an `https://` URL; description up to 280 characters. Works for removed partners too. Partners edit the same fields for their own organization through `updateMyOrganization` (`src/app/partner/organization/_data/actions.ts`), which takes the organization from the session, never from the client. Rules shared in `_data/profile.ts`. |
| `removeContact` | Active contacts only (a person left the organization). Revoke that person's access now; keep the record for history (`removedAt`), hide it from lists, and free the email for other organizations. Refuse if they're the organization's only current contact. |
| `removePartner` | Organization-level. Effects below. |
| `reinvitePartner` | Removed only. Uses the saved (optionally edited) contacts, sends each a fresh invitation, and returns the organization to the current list as Pending. Does not republish expired opportunities: listings past the removal cutoff are stored as closed (`partner_removed`) first (`closeListingsPastRemovalCutoff` in `src/features/opportunities/service.ts`). |

Every action must verify the caller is an SDC admin.

### Partners managing their own team
Decided by owner, 26 Sep 2026 ([decisions/partners.md](../decisions/partners.md) decision 10). The partner portal's **Organization → Team** calls these in `src/app/partner/organization/_data/actions.ts`. Each re-checks `getCurrentPartner()` and only touches contacts of **that** organization; a contact ID from another organization acts as if it doesn't exist. The rules and messages are shared with the admin actions in `src/app/admin/partners/_data/contacts.ts` (email validation, duplicate check among current contacts, 7-day invitation, send-failure handling).

| Action | Same rules as |
|---|---|
| `inviteColleague` (FormData `name`, `email`) | `invitePartner`, organization fixed to the caller's |
| `resendColleagueInvitation(contactId)` | `resendInvitation` |
| `cancelColleagueInvitation(contactId)` | `cancelInvitation` |
| `removeColleague(contactId)` | `removeContact`, and it refuses the caller's own contact (the UI hides that option) |

`PartnerUser` now carries `contactId` so the UI can tell which row is the signed-in person.

## Invitation acceptance
- Link valid for 7 days (auth design default), single use.
- On acceptance the contact becomes `active`. The Pending badge clears once any contact at the organization is active. The contact can then manage the organization's opportunities.

## Removing a partner
- Immediately: revoke portal access and sessions for all contacts; stop recommending all of the organization's opportunities; exclude them from all future automated emails.
- Each existing opportunity stays visible to people who already received it until the earlier of its own end or `removedAt + 30 days`, then closes with `closed_reason = partner_removed` (undated ones close at `removedAt + 30 days`; already-ended ones stay ended). See [opportunities.md](./opportunities.md#removed-partners). Expired listings disappear from every SDC surface. Needs a scheduled job or expiry computed at read time.
- Keep the organization, contacts and all opportunity records for history.
- Already-sent emails can't be recalled, and external registration links may keep working. SDC-controlled listing and recommendation surfaces must honour expiry. Links in old emails to an expired SDC listing show a "no longer available" page.

## Also needed
- Opportunities list filter by partner: `/admin/opportunities?org=<organizationId>`, used by "View opportunities".
- Audit trail: who invited, cancelled, removed or reinvited, and when.
- A person belongs to one organization at a time. Moving = `removeContact` at the old organization, then `invitePartner` at the new one (no dedicated move). Organizations and people can be renamed and emails change; key everything on stable IDs.

Decisions and their rationale: [docs/decisions/partners.md](../decisions/partners.md).
