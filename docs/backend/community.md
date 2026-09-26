# Community: backend requirements

UI contract: `src/app/admin/community/_data/{types,queries,actions}.ts`. `store.ts` is a dev-only stand-in; replace `queries.ts` and `actions.ts`, then delete it. Decisions: [../decisions/community.md](../decisions/community.md).

## Data
- One record per email (case-insensitive unique): `id`, `name?`, `email`, `tier` (`general` | `paying`), `subscribed`, `addedAt`, `unsubscribedAt?`.
- Unsubscribed records keep their data and are always `general` tier.
- No source, payments, dates of access or admin edit history.

## Queries
- `listMembers(tier, q, page)`: 50 per page. General: subscribed general first, then all unsubscribed. Paying: subscribed paying. Search by name or email, server-side.
- `getCommunityCounts()`: subscribed general, subscribed paying, unsubscribed.

## Email history
- `listMemberEmails(id)`: every email sent to the person, newest first: `kind`, `subject`, `sentAt`, delivery `status`, and the rendered `html` as delivered (from the email provider's send log). The UI renders `html` in a sandboxed frame.
- `listMembers` rows include `lastEmail` (`subject`, `sentAt`).

## Actions (all return `ActionState`; all require an SDC admin)
| Action | Rules | Email |
|---|---|---|
| `previewImport(tier, emails)` | Parse commas, semicolons, spaces, new lines; lowercase; dedupe; classify: new, upgrade (paying tab, existing subscribed general), skip (already in tier; paying never downgraded), unsubscribed (never imported), invalid. Saves nothing. | none |
| `confirmImport(tier, emails)` | Re-run the classification server-side, then create/upgrade. | General welcome / New paying welcome / Upgrade |
| `updateMember(id, name, email)` | Email unique across current **and** unsubscribed records. | none |
| `grantPaidAccess(id)` | Subscribed general only → paying; entitlement active immediately. | Upgrade |
| `revokePaidAccess(id)` | Paying → general; entitlement removed immediately. | Revoked |
| `unsubscribeMember(id)` | Stop all sends; remove paid entitlement; keep record. | none |
| `restoreEmailEligibility(id)` | Unsubscribed → subscribed general (never paying). **Disabled in the UI** until SDC's consent rules are confirmed. | none (no automatic welcome) |
| `countExport` / `exportMembers(scope, includeUnsubscribed)` | CSV `name,email`. Scope `general` includes unsubscribed only when asked; `all` = everyone. | none |

## Integrations and dependencies
- **Signup sync:** new signups from SDC's current collection tool flow in automatically as general members (provider and mechanism TBC). Imports are the fallback.
- **Unsubscribes flow both ways:** an unsubscribe in the email provider must mark the record unsubscribed here, and vice versa, so nobody unsubscribed is emailed by the integrated system.
- **Sending ownership:** decide whether our system or the existing provider sends welcomes, so nobody gets two.
- **Initial backfill:** SDC's existing list is loaded by a one-time migration script that sends no emails. It never goes through Add members.
- **Access enforcement:** protected member pages and automated sends read the current `tier`/`subscribed` state; paid access delivery (sign-in) follows the Authentication PRD.
- Confirm the paid benefit and access link before finalizing the paying-member emails ([drafts](../emails/community.md)).
