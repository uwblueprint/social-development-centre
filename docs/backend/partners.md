# Partners: backend requirements

From the Partners PRD. The frontend is built against these; the UI shows placeholder data until they exist.

## Data the UI needs
`Partner`
- `id`, `organizationName`, `contactName`, `contactEmail`
- `status`: `pending` | `active` | `removed`
- `opportunityCount` (current, non-expired listings)
- `invitation` (pending only): `sentAt`, `expiresAt`, `lastSendError?`
- `removedAt?`, `createdAt`, `updatedAt`

Lists: current partners (`pending` + `active`) and removed partners, each searchable by organization or contact name/email (server-side search once lists get long).

## Actions (server actions returning `ActionState`)
| Action | Rules |
|---|---|
| Create + invite | Require organization, contact name, contact email (valid). Reject duplicates of an active or pending partner for the same organization/contact (`fieldErrors`). Send the invitation email; on success the partner is `pending`. On send failure, keep the record, return `lastSendError`, and allow retry. |
| Resend invitation | Pending only. New link, one-week expiry; old link invalid. |
| Cancel invitation | Pending only. Invalidate the link. Needs a decision: delete the record or move it to Removed. |
| Edit details | Pending, active or removed. Changing the contact email sends a fresh invitation and invalidates the old one (for active partners: needs a decision, see questions). |
| Remove access | Active or pending. Effects below. |
| Reinvite | Removed only. Uses saved (optionally edited) details; on success returns to current list as `pending`. Does not republish expired opportunities. |

## Invitation acceptance
- Link valid for 7 days (auth design default), single use.
- On acceptance: status becomes `active` (UI drops the Pending badge); partner can manage their own opportunities.

## Removing a partner
- Immediately: revoke portal access and sessions; stop recommending all its opportunities; exclude them from all future automated emails.
- Each existing opportunity expires at the earlier of its own end date or `removedAt + 1 month`, after which it no longer appears anywhere on the platform. Needs a scheduled job (or expiry computed at read time).
- Keep the partner record and all opportunity records for history.
- Already-sent emails can't be recalled; external registration links may keep working. SDC-controlled listing and recommendation surfaces must honour expiry.

## Reinstating
- Successful reinvitation returns the partner to `pending`, then `active` on acceptance.
- Expired opportunities stay expired until an admin or the partner reviews and republishes each one.

## Also needed
- Filter for the opportunities list by partner (`/admin/opportunities?partner=<id>`), used by the "View opportunities" link.
- Audit trail (who invited, removed, reinstated, when) so admins can inspect history.
- Admin role check on every action, not just page access.
