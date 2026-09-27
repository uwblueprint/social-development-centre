# Community: backend requirements

UI contract: `src/app/admin/community/_data/{types,queries,actions}.ts`. `store.ts` is a dev-only stand-in; replace `queries.ts` and `actions.ts`, then delete it. Decisions: [../decisions/community.md](../decisions/community.md).

## Data
- One record per email (case-insensitive unique), `MemberRecord`: `id`, `name?`, `email`, `tier` (`general` | `paying`), `subscribed`, `addedAt`, `unsubscribedAt?`, `unsubscribedBy?` (`self` | `admin`), `onboarding`, `source`, `sourceDetail?`.
- `unsubscribedBy` is required whenever `subscribed` is false: `self` for the email's unsubscribe link or the provider's sync, `admin` for **Unsubscribe** in the admin portal. Records without it are treated as `self`.
- Unsubscribed records keep their data. They can be `paying` (conversion has no subscription gate).
- `onboarding`: `not_started` | `in_progress` | `completed` (setting up preferences after joining). New people from **Add members**, a file or the kiosk start at `not_started`. The legacy backfill sets it per person (most legacy people are `not_started`).
- `source`: `legacy_import` | `booth` | `website` | `partner_event` | `referral` | `admin_added` | `file_import`, set once when the record is created, plus optional free-text `sourceDetail` (booth location, event name; at most 80 characters). **Export only:** never sent to the admin UI (`toMember` in `queries.ts` lists fields one by one so it can't leak).
- **Send log with clicks:** per sent email, the opportunities it contained (`id`, `title`, `cta` = `sign_up` | `take_action`) and each one's actions for this person: `cta` (clicked the primary action: signed up or did it) and `share` (used "Invite a friend"), each with a time. **Opens are never recorded or counted.** From the provider's click tracking, matched to opportunity links.
- **Deletion suppression list:** a hash of every deleted address (not the address itself), checked by **Add members** and imports.
- No payments, dates of access or admin edit history.

## Status (derived, never stored)
`deriveStatus` / `summarizeActivity` in `_data/status.ts` are pure; keep them and feed them the real send log. One status per person, first match wins:
1. `unsubscribed`: `subscribed` is false.
2. `invited`: onboarding `not_started`.
3. `onboarding_incomplete`: onboarding `in_progress`.
4. `never_clicked`: onboarded, no `cta` action ever.
5. `active`: a `cta` action in the last 60 days (`ACTIVE_WINDOW_DAYS`).
6. `inactive`: `cta` actions, but none in the last 60 days.
Shares don't change status. For SQL, keep `last_cta_click_at` and `cta_clicks` denormalized per member (updated by the click webhook) so the list can filter and sort without scanning the log.

## Queries
- `listMembers(tier, q, page, sort, statuses)`: 50 per page. The tiers are exclusive (owner, 27 Sep): General is `tier = general`, Paying is `tier = paying`, subscribed or not. `statuses` is the Status filter from the `status` URL param (absent = every status except `unsubscribed`; `all`; `none`; or a comma list). Search by name or email, server-side.
- Rows are `Member`: the record without `source`/`sourceDetail`, plus `status`, `ctaClicks`, `lastClickAt?` and `lastEmail` (`subject`, `sentAt`).
  - **Last email** and **Sent** (confirmed 27 Sep): the server sends `lastEmail.subject` as the plain subject string and `lastEmail.sentAt` as an ISO 8601 timestamp (`toISOString()`), never display text. The page also sends `now` (ISO, the render time). All relative and formatted text ("3d ago", the full date on hover) comes from `src/lib/date.ts` (`formatRelative`, `formatDateTime`) on the client, so a real backend must keep sending ISO dates and raw subjects.
- Sorting is server-side, before paginating. `sort` is `{ key, direction }` from the `sort` and `dir` URL params: `key` is one of `MEMBER_SORT_KEYS` (`name`, `email`, `clicks` = `ctaClicks`, `sent` = the latest email's `sentAt`, `added` = `addedAt`), `direction` is `asc` or `desc`. Unknown or missing keys use the default, `added` `desc` (`DEFAULT_MEMBER_SORT`; there's no Added column, it's just the default order); any `dir` other than `desc` is `asc`.
  - Name and email compare case-insensitively. People with no name (for `name`) or no email sent (for `sent`) come last in either direction.
  - Ties break on `id` ascending, so a person never appears on two pages.
- `getCommunityCounts(tier, q, statuses)`: `general` and `paying` (people with a selected status, never overlapping), `hidden` per tier (search matches the filter hides, for the empty states), and `byStatus` (people in `tier` per status, ignoring the filter, for the filter's option counts). All narrowed by the search.

## Email history
- `listMemberEmails(id)`: every email sent to the person, newest first: `kind` (`general-welcome`, `paying-welcome`, `paying-added` = "Paying membership added", `paying-removed` = "Paying access removed", `opportunities`), `subject`, `sentAt`, delivery `status` (`delivered` | `not-delivered`, from the email provider's send log), and `opportunities` with this person's actions (empty for non-opportunity emails). No bodies, so the panel opens fast.
- `getSentEmailHtml(memberId, emailId)`: the rendered `html` of one email as delivered, or `null`. The panel calls it per email only when that email scrolls near view, and renders it in a sandboxed frame.
- `getMember(id)`: one `Member`, or `null` when unknown or deleted; the panel re-reads the person after each action, and the page calls it for `?member=<id>` so a shared link opens that person's panel even when they're not on the current page.

## Actions (all return `ActionState`; all require an SDC admin)
| Action | Rules | Email |
|---|---|---|
| `previewMembers(mode, fd)` | `mode` `single` (fields `name`, `email`) or `bulk` (field `emails`, the file view's rows); `paying` = `on`. Parse forgivingly (commas, semicolons, tabs, new lines; `Name <email>`, `"Last, First" <email>`, `Name email`; `mailto:`, capitals, trailing punctuation); dedupe keeping the first name. Classify each address once: `added`, `converted` (subscribed general, paying checked), `alreadyPaying` (never downgraded), `alreadyMembers`, `unsubscribedSelf`, `unsubscribedAdmin` (each with `willConvert`), `deleted` (on the suppression list: skipped), plus `duplicates` and `invalid`. Empty input → field error on `email`/`emails`. Saves nothing. The single form calls `confirmMembers` straight after when the only outcome is one new person. | none |
| `confirmMembers(mode, fd)` | Same fields plus `resubscribe` = `on`. Re-run the classification server-side, then create (onboarding `not_started`, source `admin_added` for `single`, `file_import` for `bulk`), convert (including unsubscribed people when `willConvert`), and resubscribe `unsubscribedAdmin` only when `resubscribe`. Never resubscribe `unsubscribedSelf`; never re-add `deleted`. Message counts added, converted, resubscribed, emails sent and any not delivered. | General welcome / New paying welcome to `added`; Paying membership added to subscribed `converted` and to resubscribed + converted people; none to anyone still unsubscribed |
| `updateMember(id, name, email)` | Email unique across current **and** unsubscribed records. | none |
| `grantPaidAccess(id)` | Any non-paying person → paying, subscribed or not; entitlement active immediately. The UI confirms first. Report delivery: "Paying member email sent." only when the provider confirms delivery. | Paying membership added (subscribed only) |
| `revokePaidAccess(id)` | Paying → general; entitlement removed immediately. | Paying access removed (subscribed only) |
| `unsubscribeMember(id)` | Stop all sends; keep record and tier; set `unsubscribedBy = admin`. | none |
| `resubscribeMember(id)` | Only when `unsubscribedBy = admin` (owner decision 6); otherwise refuse. Subscribed again, tier kept, clear `unsubscribedAt`/`unsubscribedBy`. Must also resubscribe in the email provider. | none (no automatic welcome) |
| `deleteMember(id)` | For data-removal requests. Hard delete: the record, its send log and click history, so they leave Community and every export. **Also delete the contact in the email provider**, and add a hash of the address to the suppression list so imports and **Add members** can't re-add it. Irreversible. | none |
| `addBoothSignup(name, email, location)` | See [Booth kiosk](#booth-kiosk). | General welcome, new people only |
| `countExport(kind, scope, includeUnsubscribed)` / `exportMembers(kind, scope, includeUnsubscribed)` | Scope `general` = general (not paying), `paying` = paying, `both` = either tier. `includeUnsubscribed` adds unsubscribed people of the chosen tiers, for any scope; otherwise only subscribed people. `kind` `members`: one row per person, columns `name, email, status, tier, subscribed, unsubscribed_by, unsubscribed, onboarding, source, source_detail, added, last_email, emails_received` (delivered), `cta_clicks, signups, shares, last_click`. `kind` `activity`: one row per action (primary action or share), columns `email, subject, sent, opportunity, action` (Signed up, Took action, Shared), `clicked`. Values are plain words, dates `YYYY-MM-DD` in SDC's time zone; cells a spreadsheet would run as formulas are prefixed with `'`. Count = people or actions. | none |

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
| `addBoothSignup(name, email, location)` → `ActionState` | Requires an SDC admin session (the kiosk runs on an admin's tablet). New email → subscribed general member with `source = booth`, `sourceDetail` = `location` (nullable, max 80 chars), onboarding `not_started` and sign-up time. **Existing email, any state (general, paying or unsubscribed) → `success` and no change, no email**, so the kiosk never discloses membership. Never resubscribes anyone. Invalid email → `fieldErrors.email`; any other failure → `status: "error"` (the kiosk shows its own retry copy). | General welcome, new people only |

- **Landed (27 Sep):** `addBoothSignup(name, email, location: string | null)` is in `src/app/admin/community/_data/actions.ts`. New people get `source = booth`, `sourceDetail = location`, onboarding `not_started` (so they show as **Invited**). A deleted person signing up again is fresh consent: they're added and removed from the suppression list. The kiosk's stub in `src/app/kiosk/actions.ts` (marked `TODO(kiosk)`) can be swapped for the import.
- Admins open the kiosk from Community with **Open sign-up kiosk**, a dialog with an optional **Location** that opens `/kiosk?location=…` (or `/kiosk`) in a new tab. `location` may be `null`.
- `source`/`sourceDetail` stay export only (decision); they're not shown in the member panel.
