# Partners: decision log

Each entry: the decision, which page it's on, what it affects, and when someone runs into it.

## 1. Cancelling an invitation deletes it
- **Decision:** Cancelling a pending invitation deletes that contact. If nobody is left and the organization was never active, the organization is deleted too. Nothing goes to Removed.
- **Page:** Admin → Partners → partner side panel → contact's menu → Cancel invitation.
- **Affects:** Partner lists, People tab, the invitation link (stops working), audit trail.
- **When encountered:** An admin invited the wrong person or address, or the partner declined before accepting.

## 2. Email change on an active contact keeps them active
- **Decision:** Editing an active contact's email sends a fresh invitation to the new address and invalidates any earlier link. The contact stays active with no Pending badge; sign-in moves to the new address once it's accepted. Editing a *pending* contact's email just replaces their invitation.
- **Page:** Admin → Partners → side panel → contact's menu → Edit.
- **Affects:** Contact's sign-in email, invitation emails, the contact's row (shows "New invitation sent to …" until accepted).
- **When encountered:** A partner contact changes jobs within the organization, or their organization changes email domains.

## 3. Details open in a side panel
- **Decision:** Clicking a partner or person row opens a right-hand panel over the list (drawer on mobile) instead of a separate page.
- **Page:** Admin → Partners (all three tabs).
- **Affects:** Where admins edit details, manage contacts and invitations, remove or reinvite a partner.
- **When encountered:** Any time an admin opens a partner.

## 4. Organizations have several contacts; admins invite a person
- **Decision:** A partner organization has one or more contacts (typically 4–5). "Invite partner" invites a *person* (name, email) and attaches them to an organization chosen from a searchable dropdown; typing a name that doesn't exist offers `Create "<name>"`. The Partners page has Organizations, People and Removed tabs.
- **Page:** Admin → Partners → Invite partner dialog; People tab; side panel → Add person.
- **Affects:** Data model (organization ↔ contacts), invitation flow, search (matches organization, contact name or email).
- **When encountered:** Every new invitation, and when an admin looks for a person rather than an organization.

## 5. An organization is Pending until any contact accepts
- **Decision:** The organization shows the Pending badge until at least one of its contacts accepts. After that it's active (no badge), even if other contacts are still pending; those show Pending on their own rows.
- **Page:** Admin → Partners → Organizations tab and side panel; People tab.
- **Affects:** Pending badge, when the partner can start managing opportunities.
- **When encountered:** Right after inviting a new organization, until its first contact accepts.

## 6. Opportunity expiry after a partner is removed
- **Decision:** Removal doesn't delete opportunities; it sets a cutoff one month after removal.
  - Dated opportunity: expires at its own end date or the cutoff, **whichever comes first**. One that already ended stays expired.
  - Undated opportunity: expires at the cutoff.
  - Recommendations and new automated emails stop including them immediately on removal.
  - Reinviting the partner doesn't republish expired opportunities; each needs review first.
- **Page:** Admin → Partners → side panel → Remove access (confirmation explains this); Admin → Opportunities (listings disappear at expiry); public listing pages.
- **Affects:** Opportunity visibility, recommendations, automated emails, the partner's opportunity count.
- **When encountered:** When an admin removes a partner, and over the following month as listings expire.

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
  - **Person left the organization:** "Remove from organization" on that active contact. Their portal access ends now; the record is kept for history and hidden from lists; their email can be invited under another organization. Pending contacts are cancelled instead (decision 1).
  - **Organization dissolved or partnership ended:** "Remove access" on the organization. All its contacts lose access, and the organization moves to Removed with the effects in decision 6.
  - The last remaining contact can't be removed on its own; the option is disabled with the reason "This is the organization's only contact. Remove the organization instead."
- **Page:** Admin → Partners → side panel (contact menu; Remove access).
- **Affects:** Portal access for one person or for everyone at the organization; the Removed tab (organizations only).
- **When encountered:** When a partner contact leaves, or a partnership ends.
