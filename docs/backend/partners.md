# Partners: backend requirements

From the Partners PRD, product decisions and the owner's UX spec (`docs/ux/portal.md`). The UI is built against:
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
- Organization: `id`, `name`, `website?` (stored as https://), `description?` (up to 280 characters), `status`, `contacts[]` (current people with `invitationState`), `opportunityCount` (`countPublishedOpportunities(organizationId)` from `src/features/opportunities/queries.ts`), `createdAt`, `removedAt?`.
- Lists (in `_data/queries.ts`; server-side search once lists grow, and each view's count uses the same `q` and status):
  - `listPartners(status, q)`: organizations. `active` = not removed; `removed` = access removed. Matches organization name and its people's names and emails (a matching person returns their organization).
  - `listPartnerPeople(status, q)`: `active` = everyone at current organizations, with their invitation state. `removed` = people removed from their organization (`removal: "person"`) plus people at removed organizations (`removal: "organization"`, `removedAt` = the organization's). Matches name, email and organization name.
  - `listOrganizationOptions()`: every organization, including removed ones (inviting someone to a removed organization reinvites it).

## Admin actions
| Action | Rules |
|---|---|
| `invitePartner` | Fields `name`, `email`, and `organizationId` or `organizationName` (new). Field errors only (no message): name missing, invalid email, email already has access somewhere ("This person already has access to {organization}."), no organization, duplicate new organization name. **Save first, then send.** Saved but not delivered → `status: "error"`, `data.saved: true`, "{name} was added, but we couldn't send the invitation. Select Retry to try again." Nothing saved → `data.saved: false`, "We couldn't send the invitation. Try again." If the email belonged to someone previously at that organization, restore their record instead of duplicating it. **If the organization is removed, this is a reinvite** (below). |
| `resendInvitation(contactId)` | Resend (pending), Retry (not sent) or Send new invitation (expired). On success: new single-use link, 7-day expiry, previous link invalidated. On failure: **change nothing**; a still-valid earlier link keeps working and the state stays as it was. Messages in `contactMessages`. |
| `cancelInvitation(contactId)` | Any invitation state. **Deletes** the person. Deletes the organization too if nobody remains and it was never active. Refuses an active person ("This invitation is no longer open. Refresh the team list."). |
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
- Audit trail: who invited, cancelled, removed or reinvited, and when; delivery failures with their provider reason (never shown in the UI).
- A person belongs to one organization at a time. Moving = `removeContact` at the old organization, then `invitePartner` at the new one. Key everything on stable IDs; names and emails change.

Decisions and their rationale: [docs/decisions/partners.md](../decisions/partners.md).
