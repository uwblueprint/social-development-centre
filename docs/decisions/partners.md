# Partners: decision log

Each entry: the decision, which page it's on, what it affects, and when someone runs into it.

## 1. Cancelling an invitation deletes it
- **Decision:** Cancelling an invitation (pending, not sent or expired) deletes that person. If nobody is left and the organization was never active, the organization is deleted too. Nothing goes to Removed. The confirmation starts on **Keep invitation**; for an invitation that was never delivered it says the person will be removed from the list instead of mentioning a link.
- **Page:** Admin → Partners → person's panel, or organization panel → person's menu → Cancel invitation; Partner → Organization → Team.
- **Affects:** Partner lists, People tab, the invitation link (stops working), audit trail.
- **When encountered:** An admin invited the wrong person or address, or the partner declined before accepting.

## 2. Email change on an active contact keeps them active
- **Decision:** Editing an active contact's email sends a fresh invitation to the new address and invalidates any earlier link. The person stays active with no invitation badge; sign-in moves to the new address once it's accepted. Editing a *pending* contact's email just replaces their invitation.
- **Page:** Admin → Partners → side panel → contact's menu → Edit.
- **Affects:** Contact's sign-in email, invitation emails, the contact's row (shows "New invitation sent to …" until accepted).
- **When encountered:** A partner contact changes jobs within the organization, or their organization changes email domains.

## 3. Details open in a side panel
- **Decision:** Clicking an organization or person row opens a right-hand panel over the list (drawer on mobile) instead of a separate page. Rows show a chevron. A person's panel is headed with their name and shows their organization as related information (select it to open the organization's panel).
- **Page:** Admin → Partners (both views, both statuses).
- **Affects:** Where admins edit details, manage contacts and invitations, remove or reinvite a partner.
- **When encountered:** Any time an admin opens a partner.

## 4. Organizations have several contacts; admins invite a person
- **Decision:** A partner organization has one or more contacts (typically 4–5). "Invite partner" invites a *person* (name, email) and attaches them to an organization chosen from a searchable dropdown; typing a name that doesn't exist offers **Add “{name}” as a new organization**. The Partners page has two views, Organizations and People, and a Status filter (decision 11).
- **Page:** Admin → Partners → Invite partner dialog; People tab; side panel → Add person.
- **Affects:** Data model (organization ↔ contacts), invitation flow, search (matches organization, contact name or email).
- **When encountered:** Every new invitation, and when an admin looks for a person rather than an organization.

## 5. An organization is awaiting a response until anyone accepts
- **Status:** Revised 27 Sep 2026 to match the invitation-state model in `docs/ux/portal.md`. Replaces the organization-level "Pending" badge.
- **Decision:** **Invitation pending** describes a person, never an organization. An organization nobody has accepted an invitation to yet shows **Awaiting response**. Once anyone accepts it's active (no badge), even if others haven't; each of those people shows their own invitation state (decision 12).
- **Page:** Admin → Partners → Organizations (Active) and the organization's panel.
- **Affects:** The organization badge, when the partner can start managing opportunities.
- **When encountered:** Right after inviting a new organization, until its first contact accepts.

## 6. Opportunity expiry after a partner is removed
- **Status:** Decided by owner, 26 Sep 2026. **Partly superseded 27 Sep 2026** by decision 13: the Remove access confirmation now says the opportunities are closed (**Closed**, reason **Partner access removed**), and reinviting reopens those whose dates haven't passed once someone accepts. See docs/decisions/opportunities.md for the listing lifecycle.
- **Decision:** Removal doesn't delete opportunities.
  - **Immediately:** the organization's opportunities stop being emailed and recommended.
  - **People who already received one** can still see it until its own end or **one month (30 days) after removal, whichever comes first**. Undated ones close one month after removal. One that already ended stays ended.
  - Until then it stays on Admin → Opportunities → **Live** with a **No longer emailed** badge; after that it moves to **Closed** marked **Partner removed**.
  - Reinviting the partner doesn't republish listings that already closed this way; each needs review first.
- **Page:** Admin → Partners → side panel → Remove access (confirmation explains this); Admin → Opportunities (badges, panel note, "{name} (removed)" in the **Organization** filter); public listing pages.
- **Affects:** Opportunity visibility, recommendations, automated emails, the partner's opportunity count.
- **When encountered:** When an admin removes a partner, and over the following month as listings close.

## 7. Links to expired listings show "no longer available"
- **Decision:** An SDC link to an expired listing (e.g. from an email sent before removal) opens a "This opportunity is no longer available" page instead of the listing. External registration links are the partner's and may keep working.
- **Page:** Public opportunity page (not the admin UI).
- **Affects:** Community members clicking old email links.
- **When encountered:** After a listing expires, when someone opens an older email.

## 8. People move by being removed and reinvited; names and emails change
- **Decision:** A contact belongs to one organization at a time. There is no "move" action. If someone leaves an organization, the admin removes them from it; if they join another partner, the admin invites their email under that organization. A move may not be instant. Organizations and people can be renamed and emails can change, so records use stable IDs, never names or emails, and history, invitations and opportunities stay linked through changes.
- **Page:** Admin → Partners → side panel → contact's menu (Edit, Remove from organization); Invite partner dialog.
- **Affects:** Data model, audit trail, duplicate checks (an email is only unique among *current* contacts, so a removed person can be invited elsewhere).
- **When encountered:** When a contact changes employer, name or email, or a partner organization rebrands.

## 9. Removing a person vs removing an organization
- **Decision:**
  - **Person left the organization:** "Remove from organization" on that active contact. Their portal access ends now; the record is kept for history and listed on People → Removed; they can be invited again here or under another organization. Pending contacts are cancelled instead (decision 1).
  - **Organization dissolved or partnership ended:** "Remove access" on the organization. All its people lose access, and the organization moves to Removed with the effects in decision 13.
  - The last person with access can't be removed on its own (server-enforced). In the admin portal the option is disabled with the reason "This is the only person with access to this organization. Remove the organization's access instead." A partner who somehow tries it is told "This is the only person with access to this organization. Contact SDC for help."
  - A person who hasn't accepted can't be removed ("This person doesn't have access yet. Cancel their invitation instead.").
- **Page:** Admin → Partners → side panel (contact menu; Remove access).
- **Affects:** Portal access for one person or for everyone at the organization; the Removed tab (organizations only).
- **When encountered:** When a partner contact leaves, or a partnership ends.

## 10. Partners manage their own team
- **Status:** Decided by owner, 26 Sep 2026. Replaces the assumption that only SDC invites and removes partner contacts.
- **Decision:** Partners can invite and remove colleagues in their own organization; SDC can still do everything from Partners. On Partner → **Organization** → **Team**:
  - **Invite colleague** opens a dialog with **Name** and **Email** and sends an invitation (7 days, same rules as SDC's invitations: an email that already has access is refused, and a failed send can be retried).
  - If the person was saved but the email failed, the dialog closes and their row shows **Invitation not sent** with **Retry**. If nothing was saved, the dialog stays open with its values and says the invitation couldn't be sent.
  - Each person's menu (**Actions for {name}**) offers the invitation actions for their state (decision 12), and **Remove from organization** once they have access (confirmation starts on **Keep access**; **Remove access** uses danger styling).
  - Nobody can remove themselves: the option isn't shown on your own row, which is marked "(you)", and the server refuses it ("You can't remove your own access. Ask a colleague or SDC for help.").
  - The last person with access can't be removed (decision 9; server-enforced).
- **Page:** Partner → Organization → Team.
- **Affects:** Portal access for partner staff, SDC's admin workload, the Partners contact lists (same records).
- **When encountered:** A new colleague needs access, or someone leaves the organization.

## 11. Two views and a Status filter
- **Status:** Decided by owner, 26 Sep 2026 (docs/ux/portal.md, owner decision 3). Replaces the Organizations · People · Invitations · Removed tabs.
- **Decision:** Partners has two views, **Organizations** and **People** (tabs labelled "Partner views"), and a visibly labelled **Status** filter: **Active** or **Removed**. Each view's count follows the filter and the search.
  - **Removed → Organizations:** organizations whose access was removed. Restore one by inviting someone to it (decision 13).
  - **Removed → People:** people removed from their organization, and people at an organization whose access was removed. Restore one by inviting them again (**Invite again** in their panel).
  - Search stays search-as-you-type (owner decision 1). Organizations matches the organization's name and its people's names and emails (a matching person returns their organization); People matches name, email and organization name. No results says "No matches found. Try another name or email.", distinct from an empty list.
  - Invitations are no longer a separate tab: each person's invitation state shows on their People row (decision 12). The admin interface doesn't use the word "contact"; the organization panel's list is **People**.
- **Page:** Admin → Partners.
- **Affects:** Where pending and removed people are listed, counts, search.
- **When encountered:** Every visit to Partners.

## 12. Three invitation states
- **Status:** Decided 27 Sep 2026 from docs/ux/portal.md (Team and invitations). Replaces the "Not delivered" and "Expired" badges.
- **Decision:** A person who hasn't accepted is in exactly one state, shown as text (not colour alone), the same in both portals:

  | State | Row text | Actions |
  |---|---|---|
  | Sent, not accepted, within 7 days | Invitation pending; Expires {date} | Resend invitation; Cancel invitation |
  | Never delivered | Invitation not sent | Retry; Cancel invitation |
  | 7 days passed | Invitation expired; Expired {date} | Send new invitation; Cancel invitation |
  | Accepted | No badge | Remove from organization |

  - A past expiry date never shows under **Invitation pending**.
  - A successful resend creates a fresh single-use link, invalidates the old one and updates the expiry ("New invitation sent to {email}. The previous link won't work."). A failed resend changes nothing: a still-valid earlier link keeps working and the row keeps its state ("We couldn't send the new invitation. Try again.").
  - Delivery errors are logged for SDC, never shown.
- **Page:** Admin → Partners → People rows and panels; Partner → Organization → Team.
- **Affects:** Invitation badges, row actions, toasts.
- **When encountered:** After inviting someone, until they accept; when an email bounces or a link expires.

## 13. Reinviting a removed organization
- **Status:** Decided by owner, 26 Sep 2026 (docs/ux/portal.md, owner decision 8).
- **Decision:** A removed organization is reinvited by inviting a person to it (**Reinvite** in its panel, or choosing it in **Invite partner**). The result says "Invitation sent to {email}. {organization} is awaiting a response." The organization returns to Active, but nobody has access until someone accepts; its other people stay on People → Removed and can be invited again. When someone accepts, access returns and its closed opportunities whose dates haven't passed reopen automatically.
- **Remove access** confirms: "People at {organization} will lose access to the partner portal. Their opportunities will be closed and won't be recommended or emailed." (**Keep access** / **Remove access**). Result: "{organization} no longer has access. Its opportunities are closed."
- **Page:** Admin → Partners → organization panel → Remove access / Reinvite; Invite partner dialog.
- **Affects:** Portal access, the organization's listings (Closed, Partner access removed), People → Removed.
- **When encountered:** When a partnership ends, and if it resumes.
