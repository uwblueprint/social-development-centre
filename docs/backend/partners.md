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
- Lists: current organizations; removed organizations; all people at current organizations. All searchable by organization name, contact name or email (server-side once lists grow).

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
| `reinvitePartner` | Removed only. Uses the saved (optionally edited) contacts, sends each a fresh invitation, and returns the organization to the current list as Pending. Does not republish expired opportunities. |

Every action must verify the caller is an SDC admin.

## Invitation acceptance
- Link valid for 7 days (auth design default), single use.
- On acceptance the contact becomes `active`. The Pending badge clears once any contact at the organization is active. The contact can then manage the organization's opportunities.

## Removing a partner
- Immediately: revoke portal access and sessions for all contacts; stop recommending all of the organization's opportunities; exclude them from all future automated emails.
- Each existing dated opportunity expires at the earlier of its own end date or `removedAt + 1 month` (already-ended ones stay expired); undated ones expire at `removedAt + 1 month`. Expired listings disappear from every SDC surface. Needs a scheduled job or expiry computed at read time.
- Keep the organization, contacts and all opportunity records for history.
- Already-sent emails can't be recalled, and external registration links may keep working. SDC-controlled listing and recommendation surfaces must honour expiry. Links in old emails to an expired SDC listing show a "no longer available" page.

## Also needed
- Opportunities list filter by partner: `/admin/opportunities?org=<organizationId>`, used by "View opportunities".
- Audit trail: who invited, cancelled, removed or reinvited, and when.
- A person belongs to one organization at a time. Moving = `removeContact` at the old organization, then `invitePartner` at the new one (no dedicated move). Organizations and people can be renamed and emails change; key everything on stable IDs.

Decisions and their rationale: [docs/decisions/partners.md](../decisions/partners.md).
