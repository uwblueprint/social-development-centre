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
- **Decision:** Clicking an organization row opens a right-hand panel over the list (drawer on mobile) instead of a separate page. Rows show a chevron. *(Superseded for People by decision 20: people have no panel.)*
- **Page:** Admin → Partners (both views, both statuses).
- **Affects:** Where admins edit details, manage contacts and invitations, remove or reinvite a partner.
- **When encountered:** Any time an admin opens a partner.

## 4. Organizations have several contacts; admins invite a person
- **Decision:** A partner organization has one or more contacts (typically 4–5). "Invite partner" invites a *person* (name, email) and attaches them to an organization chosen from a searchable dropdown; typing a name that doesn't exist offers **Add “{name}” as a new organization**. The Partners page has two views, Organizations and People, and a Status filter (decision 11).
- **Page:** Admin → Partners → Invite partner dialog; People tab; side panel → Add person.
- **Affects:** Data model (organization ↔ contacts), invitation flow, search (matches organization, contact name or email).
- **When encountered:** Every new invitation, and when an admin looks for a person rather than an organization.

## 5. An organization is awaiting a response until anyone accepts
- **Status:** Revised 27 Sep 2026 to match the invitation-state model in `docs/ux/portal.md`. Replaces the organization-level "Pending" badge. **Revised again 27 Sep 2026:** in the admin table and panels the organization-level badge is now the **Not onboarded** health tag (decision 14), which has the same rule. "{organization} is awaiting a response." stays as the reinvite result.
- **Decision:** **Invitation pending** describes a person, never an organization. An organization nobody has accepted an invitation to yet shows **Awaiting response**. Once anyone accepts it's active (no badge), even if others haven't; each of those people shows their own invitation state (decision 12).
- **Page:** Admin → Partners → Organizations (Active) and the organization's panel.
- **Affects:** The organization badge, when the partner can start managing opportunities.
- **When encountered:** Right after inviting a new organization, until its first contact accepts.

## 6. A removed partner's opportunities close
- **Status:** Decided by owner, 26 Sep 2026. Revised 27 Sep 2026: listings no longer "expire"; they close.
- **Decision:** Removal doesn't delete opportunities. From the moment access is removed, the organization's published listings are **Closed** with the reason **Partner access removed**: no longer recommended or included in emails. One whose date had already passed keeps the reason **Ended**. People who already got a listing by email can still view it until it ends or one month after removal, whichever is first (a member-side rule). Reopening them is refused while the partner is removed; when someone accepts a reinvitation they reopen automatically if their dates haven't passed (decision 13). Details: docs/decisions/opportunities.md decisions 13 and 14.
- **Page:** Admin → Partners → organization panel → Remove access (the confirmation says so); Admin → Opportunities → Closed.
- **Affects:** Opportunity status, recommendations, automated emails, the partner's published count.
- **When encountered:** When an admin removes a partner, and if the partner is reinvited.

## 7. Links to closed listings show "no longer available"
- **Decision:** An SDC link to a listing members can no longer see (e.g. from an email sent before removal) opens a "This opportunity is no longer available" page instead of the listing. External registration links are the partner's and may keep working.
- **Page:** Public opportunity page (not the admin UI).
- **Affects:** Community members clicking old email links.
- **When encountered:** After the member-side viewing window ends, when someone opens an older email.

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
- **Affects:** Portal access for one person or for everyone at the organization; Status → Removed (organizations and people).
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
- **Status:** Decided by owner, 26 Sep 2026 (docs/ux/portal.md, owner decision 3). Replaces the Organizations · People · Invitations · Removed tabs. **Revised by owner, 27 Sep 2026:** the toolbar Status select is replaced by header filters (decision 17). Active and Removed are now the Status filter on the Organization column; on People, removed people are a **Removed** option in the Tags filter.
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

## 14. One health tag per organization
- **Status:** Decided by owner, 27 Sep 2026. Thresholds are the owner's; the reasons and next steps are new copy that needs approval.
- **Decision:** Partners is simple user management that also shows which organizations might need SDC's support. Each organization with access gets at most one tag, derived on the server; the first rule that matches wins:

  | Order | Tag | Rule | Reason shown in the panel | Suggested next step |
  |---|---|---|---|---|
  | 1 | **Not onboarded** | Nobody has accepted an invitation. | Nobody at {organization} has accepted an invitation yet. | Check their invitation under People, then resend it or reach out to confirm the email address. |
  | 2 | **No recent posts** | No opportunity published in the 60 days since joining (first acceptance), or since the last post. | {organization} hasn't posted an opportunity in the 60 days since joining. / …since their last post. | Reach out to see if they need help posting. |
  | 3 | **Not emailed** | A currently published opportunity wasn't in any SDC email within 14 days of posting (checked once those 14 days have passed). | A published opportunity from {organization} wasn't in any email within 14 days of posting. | Check the listing's topics and dates so it can go out in the next email. |
  | 4 | **No clicks** | It has emailed opportunities and none of them got a click from an email. | Nobody has clicked an opportunity from {organization} in SDC's emails yet. | Reach out to help them write a clearer title and summary. |

  - No match: no tag. Removed organizations have no tag.
  - The tag is text with an icon (never colour alone): **Not onboarded** is neutral, the others use the warning colour.
  - Opportunities SDC posts on a partner's behalf count as the partner's posts.
  - When any organization has a tag, a calm note above the Organizations table says "{n} partners might need support" with **Show them**, which turns on the Health filter (all four tags). It's hidden while the Health filter is on.
- **Page:** Admin → Partners → Organizations (Health column, filter and callout) and the organization panel (tag, reason, next step).
- **Affects:** Which partners SDC contacts; depends on email inclusion and click data (docs/backend/partners.md).
- **When encountered:** Every visit to Partners.

## 15. SDC notes on an organization
- **Status:** Decided by owner, 27 Sep 2026.
- **Decision:** The organization panel has **SDC notes (only admins see these)**: one free-text note per organization (up to 2,000 characters), saved with **Save notes**. It shows "Last edited by {name}, {relative time}" (full date and time on hover). Saving an empty note clears it. Partners never see notes: the partner portal's organization query doesn't return them.
- **Page:** Admin → Partners → organization panel.
- **Affects:** Admin-only data on the organization; the partner portal (never exposed).
- **When encountered:** When an admin wants to remember context about a partner (preferred contact, seasonal programs).

## 16. Copy emails
- **Status:** Decided by owner, 27 Sep 2026.
- **Decision:** Admins reach partners from their own email client:
  - **Copy all emails** (page header, beside **Invite partner**) copies the email of every person who isn't removed (people at organizations with access, including those whose invitation is pending), comma-separated, A–Z, without duplicates, and toasts "Copied {n} email addresses".
  - **Copy emails** in the organization panel copies that organization's people the same way.
  - Clicking an email in the People table copies it: a checkmark replaces the copy icon in place and a "Copied" tooltip shows for 1.5 seconds, as in Community. The row doesn't open.
- **Page:** Admin → Partners.
- **Affects:** Clipboard only; nothing is sent from the product.
- **When encountered:** When SDC wants to email some or all partners.

## 17. Header filters and sorting
- **Status:** Decided by owner, 27 Sep 2026. Replaces the toolbar Status select (decision 11).
- **Decision:** Filters live in the column headers (a filter icon opens a checkbox list with counts); every column sorts. Filters, sort and search are in the URL and run on the server.
  - **Organizations:** Organization (sort by name; **Status** filter: Active, Removed; default Active), Health (sort in rule order, untagged last; filter by tag; the column hides when no row has a tag and the filter is off), People (count), Published (count), Last posted (relative time, full date on hover; "Never" if none).
  - **People:** Name (frozen when the table scrolls sideways), Email, Organization (filter), Tags (Invitation pending, Invitation not sent, Invitation expired, Removed; filter adds **Has access** for people with no tag). Removed people are hidden by default because the Tags filter starts with everything except **Removed**; so that filter is always on and the Tags column always shows.
  - **Clear filter** in a header shows every option (for Status, Active and Removed together). Switching views resets the sort.
- **Page:** Admin → Partners.
- **Affects:** URL params `status`, `health`, `orgs`, `tags`, `sort`, `dir`; counts beside each view follow the filters and search.
- **When encountered:** Every visit to Partners.

## 18. An organization always has at least one person
- **Status:** Decided by owner, 27 Sep 2026.
- **Decision:** An organization is only ever created by inviting its first person (**Invite partner**), and it never ends up with nobody:
  - The last person with access can't be removed (decision 9); the disabled option points to **Remove access** for the organization.
  - Cancelling the only invitation at an organization that was never active deletes the organization too (decision 1). At an organization that was active before (a reinvited one), it goes back to Removed.
- **Page:** Admin → Partners (Invite partner, organization panel, People row menu).
- **Affects:** Organization lifecycle, `cancelInvitation`.
- **When encountered:** When removing people or cancelling invitations.

## 19. Organization panel: actions up top, summary, post for them
- **Status:** Decided by owner, 27 Sep 2026.
- **Decision:** The organization panel shows its actions under the title, not beside the close button: **Edit details** (opens the profile form in place), **Add person** (or **Reinvite** when removed), **Copy emails** and **Remove access**. Below: Health (decision 14), Summary (**Published**, **Total clicks** from emails, **Last posted**, **View opportunities**, **Post an opportunity for them**), People, SDC notes and Profile. **Post an opportunity for them** opens New opportunity with that organization preselected (`/admin/opportunities/new?org={id}`); an unknown or removed organization is ignored and the form starts with SDC.
- **Page:** Admin → Partners → organization panel; Admin → Opportunities → New.
- **Affects:** Panel layout; the new-opportunity form's initial organization.
- **When encountered:** Whenever an admin opens an organization.

## 20. People rows have a menu, not a panel; panels are shareable
- **Status:** Decided by owner, 27 Sep 2026. New copy (**Edit details** in the row menu and dialog title, "Open {organization}" as the Organization cell's accessible name) is new, needs approval.
- **Decision:**
  - **People has no side panel** and its rows aren't clickable. Each row ends in a ⋯ menu (**Actions for {name}**) with icons: **Edit details** (a small dialog with **Name** and **Email**, saved the same way as before), **Resend invitation** / **Retry** / **Send new invitation** (by invitation state), **Cancel invitation**, and **Remove from organization** (danger; disabled with the reason for the last person with access). Removed people's menu has **Invite again**.
  - **The Organization cell is a link-styled button**: it switches to **Organizations** with that organization's panel open.
  - **The open organization panel is in the URL** (`?view=organizations&org=<id>`): opening it sets the param with `router.replace` (no new history entry), closing clears it, and loading a link with it opens the panel. An unknown id opens nothing.
  - **One line per row everywhere.** No cell wraps: Name, Email and Organization have fixed widths and truncate (full text on hover). Tags read "Invitation pending · Expires Oct 2" on one line: the badge, then the date in muted text, with no year when it's the current year ("Removed · Sep 12" for removed people).
  - **Search sits in the page header** beside the title and actions, not in the tab row.
  - **"Show them"** in the support callout uses the outline button so it stands out on the info background.
- **Page:** Admin → Partners (both views).
- **Affects:** URL param `org`; the person panel is gone (its actions moved to the row menu); decision 3.
- **When encountered:** Managing people, and sharing a link to an organization.
