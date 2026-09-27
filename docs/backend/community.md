# Community: backend requirements

UI contract: `src/app/admin/community/_data/{types,queries,actions}.ts`. `store.ts` is a dev-only stand-in; replace `queries.ts` and `actions.ts`, then delete it. Decisions: [../decisions/community.md](../decisions/community.md).

## Data
- One record per email (case-insensitive unique): `id`, `name?`, `email`, `tier` (`general` | `paying`), `subscribed`, `addedAt`, `unsubscribedAt?`, `unsubscribedBy?` (`self` | `admin`).
- `unsubscribedBy` is required whenever `subscribed` is false: `self` for the email's unsubscribe link or the provider's sync, `admin` for **Unsubscribe** in the admin portal. Records without it are treated as `self`.
- Unsubscribed records keep their data. They can be `paying` (conversion has no subscription gate).
- No source, payments, dates of access or admin edit history.

## Queries
- `listMembers(tier, q, page, sort)`: 50 per page. The tiers are exclusive (owner, 27 Sep). General: subscribed and not paying (`tier = general`). Paying: subscribed and paying. Unsubscribed people are never listed, except that a General search also returns matching unsubscribed people after all subscribed matches. Search by name or email, server-side.
- Sorting is server-side, before paginating. `sort` is `{ key, direction }` from the `sort` and `dir` URL params: `key` is one of `MEMBER_SORT_KEYS` (`name`, `email`, `sent` = the latest email's `sentAt`, `added` = `addedAt`), `direction` is `asc` or `desc`. Unknown or missing keys use the default, `added` `desc` (`DEFAULT_MEMBER_SORT`); any `dir` other than `desc` is `asc`.
  - Name and email compare case-insensitively. People with no name (for `name`) or no email sent (for `sent`) come last in either direction.
  - Ties break on `id` ascending, so a person never appears on two pages.
  - Subscribed and unsubscribed matches are sorted separately: unsubscribed matches stay after every subscribed match whatever the sort.
  - SQL sketch: `ORDER BY subscribed DESC, <column> <dir> NULLS LAST, id ASC`, with `sent` from the latest row of the send log per person (a lateral join or a denormalized `last_email_sent_at`, indexed).
- `getCommunityCounts(q?)`: subscribed general (not paying) and subscribed paying, which never overlap, narrowed by the search when given. Unsubscribed people are never counted in those two. Also `unsubscribedMatches`: unsubscribed people matching the search (0 without one), so an empty Paying members search can say its only matches are unsubscribed people at the end of General members.

## Email history
- `listMemberEmails(id)`: every email sent to the person, newest first: `kind` (`general-welcome`, `paying-welcome`, `paying-added` = "Paying membership added", `paying-removed` = "Paying access removed", `opportunities`), `subject`, `sentAt`, delivery `status` (`delivered` | `not-delivered`, from the email provider's send log). No bodies, so the panel opens fast.
- `getSentEmailHtml(memberId, emailId)`: the rendered `html` of one email as delivered, or `null`. The panel calls it per email only when that email scrolls near view, and renders it in a sandboxed frame.
- `listMembers` rows include `lastEmail` (`subject`, `sentAt`).

## Actions (all return `ActionState`; all require an SDC admin)
| Action | Rules | Email |
|---|---|---|
| `previewMembers(mode, fd)` | `mode` `single` (fields `name`, `email`) or `bulk` (field `emails`); `paying` = `on`. Parse forgivingly (commas, semicolons, tabs, new lines; `Name <email>`, `"Last, First" <email>`, `Name email`; `mailto:`, capitals, trailing punctuation); dedupe keeping the first name. Classify each address once: `added`, `converted` (subscribed general, paying checked), `alreadyPaying` (never downgraded), `alreadyMembers`, `unsubscribedSelf`, `unsubscribedAdmin` (each with `willConvert`), plus `duplicates` and `invalid`. Empty input → field error on `email`/`emails`. Saves nothing. | none |
| `confirmMembers(mode, fd)` | Same fields plus `resubscribe` = `on`. Re-run the classification server-side, then create, convert (including unsubscribed people when `willConvert`), and resubscribe `unsubscribedAdmin` only when `resubscribe`. Never resubscribe `unsubscribedSelf`. Message counts added, converted, resubscribed, emails sent and any not delivered. | General welcome / New paying welcome to `added`; Paying membership added to subscribed `converted` and to resubscribed + converted people; none to anyone still unsubscribed |
| `updateMember(id, name, email)` | Email unique across current **and** unsubscribed records. | none |
| `grantPaidAccess(id)` | Any non-paying person → paying, subscribed or not; entitlement active immediately. Report delivery: "Paying member email sent." only when the provider confirms delivery. | Paying membership added (subscribed only) |
| `revokePaidAccess(id)` | Paying → general; entitlement removed immediately. | Paying access removed (subscribed only) |
| `unsubscribeMember(id)` | Stop all sends; remove paid entitlement; keep record; set `unsubscribedBy = admin`. | none |
| `resubscribeMember(id)` | Only when `unsubscribedBy = admin` (owner decision 6); otherwise refuse. Subscribed again, tier kept, clear `unsubscribedAt`/`unsubscribedBy`. Must also resubscribe in the email provider. | none (no automatic welcome) |
| `countExport` / `exportMembers(scope, includeUnsubscribed)` | CSV `name,email`. Scope `general` = general (not paying), `paying` = paying, `both` = either tier. `includeUnsubscribed` adds unsubscribed people of the chosen tiers, for any scope; otherwise only subscribed people. | none |

## Integrations and dependencies
- **Signup sync:** new signups from SDC's current collection tool flow in automatically as general members (provider and mechanism TBC). Imports are the fallback.
- **Unsubscribes flow both ways:** an unsubscribe in the email provider must mark the record unsubscribed here (`unsubscribedBy = self`), and vice versa, so nobody unsubscribed is emailed by the integrated system.
- **Delivery status:** sends must return whether the provider accepted/delivered the email, so the conversion toast only claims success when it's true, and failures show as **Not delivered**.
- **Sending ownership:** decide whether our system or the existing provider sends welcomes, so nobody gets two.
- **Initial backfill:** SDC's existing list is loaded by a one-time migration script that sends no emails. It never goes through Add member or Import members.
- **Access enforcement:** protected member pages and automated sends read the current `tier`/`subscribed` state; paid access delivery (sign-in) follows the Authentication PRD.
- **CSV upload** is parsed in the browser into the text box; the server only ever receives the `emails` text.
- Confirm the paid benefit and access link before finalizing the paying-member emails ([drafts](../emails/community.md)).

## Booth kiosk
The `/kiosk` page ([decisions](../decisions/kiosk.md)) calls one action through `signUpAtBooth` in `src/app/kiosk/actions.ts`, which validates Name and Email and checks the admin session first.

| Action | Rules | Email |
|---|---|---|
| `addBoothSignup(name, email, location)` → `ActionState` | Requires an SDC admin session (the kiosk runs on an admin's tablet). New email → subscribed general member with `source = booth`, `location` (nullable, max 80 chars) and sign-up time. **Existing email, any state (general, paying or unsubscribed) → `success` and no change, no email**, so the kiosk never discloses membership. Never resubscribes anyone. Invalid email → `fieldErrors.email`; any other failure → `status: "error"` (the kiosk shows its own retry copy). | General welcome, new people only |

- **Until it lands** the kiosk uses a stub in `src/app/kiosk/actions.ts` (marked `TODO(kiosk)`) that always succeeds. Swap it for the import from `src/app/admin/community/_data/actions.ts`.
- Show `source`/`location` in the member panel later if admins want to know which booth someone came from (not built).
