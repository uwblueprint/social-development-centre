# Admin UX: flows and copy

The single source for admin portal flows and UX copy.

Edit the **Current text** column to update product copy. Sidebar strings live in `src/app/admin/_components/AdminShell.tsx`. Community strings live in `src/app/admin/community/_copy.ts`. Partners toolbar, tab, table, badge and invitation strings live in `src/app/admin/partners/_copy.ts`; the rest of Partners is still in `src/app/admin/partners/_components/`.

List pages (Partners, Community and Opportunities) share one layout: a compact header with the page heading on the left and its buttons on the right, then one row with the tabs on the left and search on the right. There is no page description. What each section is for is in its sidebar tooltip.

## Shell

### Flows

#### Navigate sections (desktop, ≥768px)

1. The sidebar is always visible on the left and shows:
   - Opportunities
   - Partners
   - Community
   - Insights
2. Select a section to open that page.
3. The selected section is visually highlighted and uses `aria-current="page"`.
4. Hover over or tab to a section and wait a moment. A tooltip to the right says what the section is for.
5. If a section has items that need attention, show the number in a badge beside the section name.
6. The page itself should explain what the number refers to. Do not rely on the badge alone.

Wait 600ms before showing a section's tooltip, on hover and on keyboard focus, so moving down the sidebar doesn't flash every one. Do not pin the tooltip on click. A click opens the section and closes the tooltip.

#### Navigate sections (mobile, <768px)

1. The sidebar is hidden. A top bar shows the product name and a menu button.
2. Tap the menu button to open the sidebar as a drawer over the page.
3. Focus moves to the close button in the drawer. The page behind is dimmed and can't be used while the drawer is open.
4. To close the drawer, do one of these:
   - Tap the close button.
   - Tap a section. This also opens that page.
   - Tap the dimmed page outside the drawer.
   - Press Escape.
5. When the drawer closes, focus returns to the menu button.
6. If the window widens to 768px or more, the drawer closes and the sidebar shows as on desktop.

Accessibility:
- Closed menu button: `aria-label="Open menu"`, with `aria-expanded` and `aria-controls` pointing at the drawer
- Open drawer close button: `aria-label="Close menu"`

#### Account menu

1. Select the profile button at the bottom of the sidebar. It shows the admin's avatar, name and email.
2. A menu opens above it with:
   - My account
   - Sign out
3. Select **My account** to open the account page.
4. Select **Sign out** to sign out.

Accessibility:
- Profile button: `aria-label="Account menu for {name}"`
- Sidebar navigation landmark: `aria-label="Admin"`
- The brand mark (SDC) is decorative and hidden from screen readers.

### Copy

| Element | Current text | Notes |
|---|---|---|
| Product name, sidebar header and mobile top bar | SDC Admin | Keep |
| Brand mark | SDC | Decorative, hidden from screen readers |
| Navigation landmark | Admin | Accessible label only |
| Navigation | Opportunities | Keep |
| Navigation | Partners | Keep |
| Navigation | Community | Keep |
| Navigation | Insights | Keep |
| Sidebar tooltip, Opportunities | Events, petitions, volunteer roles and jobs from SDC and Civic Hub partners. | New, needs approval. Was the Opportunities page description. Review: leaves out Other. Revisit after the 29 September types session |
| Sidebar tooltip, Partners | Civic Hub organizations and the people who post for them. | New, needs approval |
| Sidebar tooltip, Community | Everyone on SDC's email list, and who has paid access. | New, needs approval |
| Sidebar tooltip, Insights | Reports on what people click and join. | New, needs approval |
| Section badge | {count} | Number only. The section's page says what it counts |
| Mobile menu button | Open menu | Accessible label only |
| Drawer close button | Close menu | Accessible label only |
| Profile button | Account menu for {name} | Accessible label only |
| Account menu | My account | Keep |
| Account menu | Sign out | Clear and familiar |

## Partners

### Flows

#### Find a partner or person

1. Go to **Partners**.
2. Select a tab. Each shows its count in brackets:
   - Organizations: current partners
   - People: active contacts at current partners
   - Invitations: people who haven't accepted yet
   - Removed: past partners
3. Type in the search field. Results update 300ms after the last keystroke. Press Enter to search straight away. Search matches organization name, contact name or email, and every tab count shows how many match.
4. While results load, a spinner replaces the search icon.
5. Select the clear button to clear the search and show the full list.
6. Select a row to open its details in the side panel.
   - On the People and Invitations tabs, the panel opens on the person's organization with that person highlighted under Contacts.

On Organizations, show **Invitation pending** beside the name until anyone at the organization accepts. Leave a cell empty when there's nothing to show. Do not show a dash.

The search field has no visible label, only the search icon and the placeholder. Do not add a search button. Searching keeps the current tab and doesn't add browser history entries. If an older search returns after a newer one, ignore it.

Accessibility:
- Tab list: `aria-label="Partner views"`
- Tables: `aria-label="Organizations"`, `aria-label="People"`, `aria-label="Invitations"`, `aria-label="Removed partners"`
- Search: a `role="search"` landmark; the field has `aria-label="Search by name or email"`
- Clear button: `aria-label="Clear search"`

#### Follow up on invitations

1. Select the **Invitations** tab. It lists every pending invitation at current partners, including people at organizations nobody has joined yet. The ones that expire soonest are first.
2. Each row shows the name with the email under it, then **Organization**, **Sent** and **Expires**.
3. Check for a badge beside the name:
   - **Not delivered**: the invitation email couldn't be sent.
   - **Expired**: the link no longer works.
4. Select the row's actions menu, then do one of these:
   - Select **Resend invitation**. A new link is sent and the previous one stops working. A toast confirms it.
   - Select **Cancel invitation**, then **Yes, cancel invitation** to confirm, or **Keep invitation** to go back.
5. Select the row itself to open the partner's panel with that person highlighted under Contacts.

If both badges apply, show **Not delivered** only. The person never got a link to expire.

Accessibility:
- Row actions menu: `aria-label="Actions for {name}"`
- The actions column header is visually hidden text: "Actions".
- Badges are text, never color alone.

#### Invite a partner with a new organization

1. Select **Invite partner**.
2. Enter **Name** and **Email**.
3. In **Organization**, type a name that doesn't match an existing organization and select **Create "{name}"**.
4. Select **Send invitation**.
5. If the invitation is sent, the dialog closes and a toast confirms it. The person is listed on **Invitations** until they accept, then on **People**.
6. If the email can't be delivered, the person is still added. The dialog closes and a toast explains. They're listed on **Invitations** with **Not delivered**, and their contact row in the panel shows the error with **Retry**.

Do not allow a new organization with the same name as an existing one. Show a field error and ask the admin to choose it from the list.

#### Invite a person to an existing organization

1. Do one of these:
   - Select **Invite partner** and choose the organization from the **Organization** list.
   - Open the organization's panel and select **Add person**. The organization is already filled in.
2. Enter **Name** and **Email**.
3. Select **Send invitation**.

**Add person** is hidden for removed partners.

#### Resend an invitation

1. Open the partner's panel.
2. Under **Contacts**, find the person marked **Invitation pending** and select their actions menu.
3. Select **Resend invitation**. The previous link stops working.
4. If the last send failed, select **Retry** on their row instead.

You can also resend from the row's actions menu on the **Invitations** tab.

#### Cancel an invitation

1. Open the actions menu on a pending contact in the partner's panel, or on their row on the **Invitations** tab.
2. Select **Cancel invitation**.
3. Select **Yes, cancel invitation** to confirm, or **Keep invitation** to go back.
4. The person is deleted. If nobody is left and the organization was never active, the organization is deleted too.

#### Rename an organization

1. Open the partner's panel.
2. Change **Organization name** at the top of the panel.
3. Select **Save**.

#### Update a partner's profile

1. Open the partner's panel.
2. Under **Profile**, change **Website** or **Short description**.
3. Select **Save profile**.

The website must start with https://. The short description can be up to 280 characters. Partners can edit both from their own portal.

#### Edit a contact

1. Open the contact's actions menu and select **Edit**.
2. Change **Name** or **Email**.
3. Select **Save**, or **Cancel** to discard.
4. If the email changed, a new invitation is sent to the new address. An active contact stays active.

#### View a partner's opportunities

1. Open the partner's panel.
2. Select **View opportunities ({count} live)**.
3. Opportunities opens, filtered to that partner.

#### Remove a person from an organization

1. Open an active contact's actions menu.
2. Select **Remove from organization**.
3. Select **Yes, remove** to confirm, or **Keep access** to go back.
4. Their access ends now. Their record is kept, and their email can be invited under another organization.

If they're the organization's only contact, **Remove from organization** is disabled. The tooltip explains why.

#### Remove a partner's access

1. Open the partner's panel.
2. Select **Remove access** at the bottom of the panel.
3. Read the confirmation, then select **Yes, remove access**, or **Keep access** to go back.
4. Portal access ends now. The organization moves to the **Removed** tab.
5. Their opportunities stop being emailed now and close within 30 days. See [Opportunities](#see-a-removed-partners-opportunities).

#### Reinvite a removed partner

1. On the **Removed** tab, open the partner.
2. Update their details if needed.
3. Select **Reinvite**, then **Yes, reinvite**.
4. Every saved contact gets a new invitation and is listed on **Invitations**. The partner returns to **Organizations**, marked **Invitation pending**.

Opportunities that already closed stay closed. Reinviting fails if the partner has no contacts, or if a contact's email is already used at another current partner.

Accessibility:
- Contact actions menu: `aria-label="Actions for {name}"`
- Organization name form: `aria-label="Organization name"`
- Contact edit form: `aria-label="Edit {name}"`
- Organization picker list: `aria-label="Organizations"`
- Disabled **Remove from organization**: the reason is in a tooltip and in visually hidden text on the item.

### Copy

| Element | Current text | Notes |
|---|---|---|
| Page heading | Partners | Keep |
| Header button | Invite partner | Keep |
| Search field placeholder | Search by name or email | Keep. Also the field's accessible label. There's no visible label |
| Clear search button | Clear search | Accessible label only |
| Tab list | Partner views | Accessible label only |
| Tab | Organizations | Keep |
| Tab | People | Owner question: rename to Contacts? The panel section and column say Contacts, and the button says Add person |
| Tab | Invitations | New, needs approval |
| Tab | Removed | Keep |
| Tab count | ({count}) | Keep. Follows the search |
| Empty state, search title, every tab | No matches for "{q}" | Keep |
| Empty state, search description, every tab | Try a different organization name, contact name or email. | Keep |
| Organizations table | Organizations | Accessible label only |
| Organizations column header | Organization | Keep |
| Organizations column header | Contacts | Keep |
| Organizations column header | Email | Keep |
| Organizations column header | Opportunities | Keep |
| Opportunities cell, one | 1 opportunity | Keep |
| Opportunities cell, many | {count} opportunities | Keep |
| Status badge, organization and person | Invitation pending | Keep. Review: decisions/partners.md #2 and #5 still say Pending |
| Status badge, panel | Removed | Keep |
| Organizations empty, no partners title | No partners yet | Keep |
| Organizations empty, no partners description | Invite an organization to give them access to their opportunities. | Keep |
| Organizations empty, action | Invite partner | Keep |
| People table | People | Accessible label only |
| People column header | Name | Keep |
| People column header | Email | Keep |
| People column header | Organization | Keep |
| People empty, no people title | No people yet | Keep |
| People empty, no people description | Invite a partner to add their first contact. | Keep |
| People empty, action | Invite partner | Keep |
| Invitations table | Invitations | Accessible label only |
| Invitations column header | Name | Keep. The email shows under the name |
| Invitations column header | Organization | Keep |
| Invitations column header | Sent | New, needs approval |
| Invitations column header | Expires | New, needs approval |
| Invitations column header, visually hidden | Actions | Accessible label only |
| Invitation badge, email failed | Not delivered | New, needs approval. Shown instead of Expired when both apply |
| Invitation badge, link expired | Expired | New, needs approval |
| Invitation row actions menu | Actions for {name} | Accessible label only |
| Invitation menu item | Resend invitation | Keep |
| Invitation menu item | Cancel invitation | Keep |
| Invitations empty, none title | No pending invitations | New, needs approval |
| Invitations empty, none description | People you invite appear here until they accept. | New, needs approval |
| Invitations empty, action | Invite partner | Keep |
| Removed table | Removed partners | Accessible label only |
| Removed column header | Organization | Keep |
| Removed column header | Contacts | Keep |
| Removed column header | Removed | Keep |
| Removed empty, none title | No removed partners | Keep |
| Removed empty, none description | Partners whose access you remove appear here. | Keep |
| Invite dialog title | Invite partner | Keep |
| Invite dialog description | Add a contact and give them access to their organization's opportunities. | Keep |
| Invite field label | Name | Keep |
| Invite field placeholder | Ada Lovelace | Keep |
| Invite field label | Email | Keep |
| Invite field placeholder | ada@example.org | Keep |
| Invite field label | Organization | Keep |
| Invite field hint | Search existing organizations, or create a new one | Owner question: "Add" over "Create"? |
| Organization picker placeholder | Search or create an organization… | Owner question: "Add" over "Create"? |
| Organization picker search | Search organizations… | Keep |
| Organization picker list | Organizations | Accessible label only |
| Organization picker, no results | No organizations found | Keep |
| Organization picker, create row | Create “{name}” | Owner question: "Add" over "Create"? Kit copy, needs the design-system owner. Review: curly quotes here, straight quotes once chosen |
| Organization picker, chosen new organization | Create "{name}" | Owner question: as above |
| Invite dialog button | Cancel | Keep |
| Invite dialog submit | Send invitation | Keep |
| Field error, name | Enter the contact's name. | Keep |
| Field error, email format | Enter an email address like name@example.org. | Keep |
| Field error, email in use (invite) | This person is already a current partner contact. | Keep |
| Field error, no organization | Choose an organization or create a new one. | Keep |
| Field error, organization exists | An organization with this name already exists. Choose it from the list. | Keep |
| Form error summary | Check the highlighted fields. | Keep |
| Toast, invitation sent | Invitation sent to {email}. | Keep |
| Toast, invitation sent (fallback) | Invitation sent. | Keep |
| Toast, added but not sent | {name} was added, but the invitation wasn't sent. {sendError} Try resending. | Keep |
| Toast, not sent (fallback) | The invitation wasn't sent. | Keep |
| Email send error | The invitation email couldn't be delivered. | Review: stand-in until the real email service; its errors replace this |
| Panel field label | Organization name | Keep |
| Panel name button | Save | Keep |
| Field error, organization name | Enter the organization's name. | Keep |
| Field error, name taken | Another organization already has this name. | Keep |
| Error summary, one field | Check the highlighted field. | Keep |
| Result, organization gone | This organization no longer exists. | Keep |
| Toast, saved | Changes saved. | Keep |
| Panel meta, removed | Removed {date} | Keep |
| Panel link | View opportunities ({count} live) | Keep. Opens Opportunities filtered to this partner |
| Panel section heading | Profile | Keep |
| Profile field label | Website | Keep |
| Profile field hint | Starts with https:// | Review: "https://" is technical. Review with the opportunity link hint |
| Profile field placeholder | https://example.org | Keep |
| Profile field label | Short description | Keep |
| Profile field hint | Up to 280 characters. Partners can edit this too. | Keep |
| Profile button | Save profile | Keep |
| Field error, website | Enter a web address that starts with https://, like https://example.org. | Keep |
| Field error, description too long | Shorten the description to 280 characters or fewer. | Keep. 280 comes from ORGANIZATION_DESCRIPTION_MAX |
| Panel section heading | Contacts | Keep |
| Panel button | Add person | Owner question: Add contact? See the People tab |
| Panel footer button | Remove access | Keep |
| Panel footer button, removed partner | Reinvite | Keep |
| Remove access dialog title | Remove {org}'s access? | Keep |
| Remove access dialog body | Immediately: portal access ends now, and their opportunities stop being recommended and leave future emails. Over the next month: each opportunity expires at its own end date or in one month, whichever is first. Already-sent emails can't be recalled. | Owner question: Opportunities shows these as No longer emailed, then Partner removed. Nothing there says "expired". Pick one word. Owner question: is "recommended" the same as "the feed" in the Close toast? |
| Remove access dialog cancel | Keep access | Keep |
| Remove access dialog confirm | Yes, remove access | Keep |
| Result, already removed | This partner is already removed. | Keep |
| Toast, partner removed | {org} was removed. Their access ended now; their opportunities expire within a month. | Owner question: "expire", as above |
| Reinvite dialog title | Reinvite this partner? | Keep |
| Reinvite dialog body | Sends a fresh invitation to each saved contact and returns {org} to the current list, marked Invitation pending. Opportunities that already expired are not republished. | Owner question: "expired", as above |
| Reinvite dialog cancel | Cancel | Keep |
| Reinvite dialog confirm | Yes, reinvite | Keep |
| Result, not removed | Only removed partners can be reinvited. | Keep |
| Result, no contacts | Add a contact before reinviting. | Keep |
| Result, email in use | {email} is already a contact at another current partner. Edit it first. | Keep |
| Toast, reinvite partly failed | Reinvited, but these invitations weren't sent: {emails}. Resend from the partner's details. | Keep |
| Toast, reinvited | {org} was reinvited. It shows as Invitation pending until someone accepts. | Keep |
| Toast, fallback | Done. | Keep |
| Contact actions menu | Actions for {name} | Accessible label only |
| Contact menu item | Edit | Keep |
| Contact menu item | Resend invitation | Keep |
| Contact menu item | Cancel invitation | Keep |
| Contact menu item | Remove from organization | Keep |
| Disabled reason, only contact | This is the organization's only contact. Remove the organization's access instead. | Keep. Also the server error |
| Contact row, pending | Expires {date} | Keep |
| Contact row, send failed | {sendError} | Shows the email service's error |
| Contact row button | Retry | Keep |
| Contact edit form | Edit {name} | Accessible label only |
| Contact edit button | Cancel | Keep |
| Contact edit button | Save | Keep |
| Field error, email in use (edit) | Another current partner contact uses this email. | Keep |
| Result, contact gone | This contact no longer exists. | Keep |
| Toast, new email invited | Saved. A new invitation was sent to {email}. | Keep |
| Toast, new email not sent | Saved, but the new invitation wasn't sent. {sendError} | Keep |
| Result, resend failed | The invitation wasn't sent. {sendError} | Keep |
| Toast, resent | Invitation resent to {email}. The previous link no longer works. | Keep |
| Toast, resent (fallback) | Invitation resent. | Keep |
| Result, not pending | Only pending invitations can be cancelled. | Keep |
| Toast, cancelled | Invitation cancelled. | Keep |
| Cancel invitation dialog title | Cancel this invitation? | Keep |
| Cancel invitation dialog body | {name} won't be able to use the invitation link already sent. | Keep |
| Cancel invitation dialog cancel | Keep invitation | Keep |
| Cancel invitation dialog confirm | Yes, cancel invitation | Keep |
| Result, not active | Only active contacts can be removed. Cancel a pending invitation instead. | Keep |
| Toast, person removed | {name} was removed from {org}. Their access ended now. | Keep |
| Remove person dialog title | Remove {name} from {org}? | Keep |
| Remove person dialog body | {name} loses access to the partner portal now. Their record is kept for history, and their email can be invited under another organization. | Keep |
| Remove person dialog cancel | Keep access | Keep |
| Remove person dialog confirm | Yes, remove | Keep |

## Community

### Flows

#### Find someone

1. Go to **Community**.
2. Select a tab. Each shows its count in brackets:
   - General members: everyone subscribed, paying members included
   - Paying members
3. To see what General members counts, hover over or tab to it and wait a moment. A tooltip explains it.
4. Type in the search field. Results update 300ms after the last keystroke. Press Enter to search straight away. Search matches name or email, and both tab counts show how many match.
5. While results load, a spinner replaces the search icon.
6. Select the clear button to clear the search and show the full list.
7. Searching or clearing returns to page 1.
8. Select a row to open that person's panel.

Do not list or count people who unsubscribed. The search field has no visible label, only the search icon and the placeholder. Do not add a search button. Searching doesn't add browser history entries. If an older search returns after a newer one, ignore it.

#### Find someone who unsubscribed

1. On **General members**, search for their name or email.
2. Matching people who unsubscribed appear after every subscribed match. Their name and email are dimmed and their name has an **Unsubscribed** badge.

Search on **Paying members** doesn't include them. They aren't added to either tab count.

#### Add members

1. Select **Add members**.
2. Paste one or more email addresses, separated with commas or new lines.
3. Select **Continue** to check them.
4. The check shows each group on its own line:
   - New members who will be added
   - Already members, skipped
   - Unsubscribed, not added
   - Invalid addresses
   - Duplicates removed, if any
5. Select a group's line to show or hide its addresses.
6. Select **Add {n} members** to add them and send the welcome emails, or **Back** to change the list.

On the Paying members tab, the dialog adds paying members.

#### Copy someone's email

1. Do one of these:
   - In the table, hover over or tab to a row's Email cell, then select the copy button. This doesn't open the row. On touch screens the button is always shown.
   - In the panel header, select the copy button next to the email.
   - Select **Copy email** from the row's or the panel's actions menu.
2. The copy button shows a check and a "Copied" tooltip for 1.5 seconds, then goes back to the copy icon. If copying fails, the tooltip says so instead.
3. From an actions menu, a toast confirms the email was copied.

Close the copy button's tooltip as soon as the pointer leaves or focus moves. Do not leave "Copied" showing.

#### Convert to paying member

1. Select **Convert to paying member** from a general member's row actions menu or from their panel's actions menu.
2. They also appear in Paying members and get the upgrade email. A toast confirms it, and the panel closes.

Do not ask for confirmation. The change runs straight away.

#### Remove paying access

1. Select **Remove paying access** from a paying member's row actions menu or from their panel's actions menu.
2. Select **Yes, remove paying access** to confirm, or **Keep paying access** to go back.
3. Their paid benefits end now. They stay a general member and get a notice email.

#### Unsubscribe

1. Select **Unsubscribe** from a row's actions menu or from the panel's actions menu.
2. Select **Yes, unsubscribe** to confirm, or **Keep subscribed** to go back.
3. All emails to them stop. A paying member also loses paying access.
4. They leave the lists and the tab counts. Search General members to find them again.

For someone who unsubscribed, the row's actions menu offers only **Copy email**.

#### Resubscribe (turned off)

1. Open an unsubscribed person's panel and select its actions menu.
2. **Resubscribe** is shown disabled. The tooltip explains that it stays off until SDC confirms its consent rules.

#### Edit details

1. Open a row's panel.
2. Select **Edit details** from the panel's actions menu. The form opens at the top of the panel, above Emails.
3. Change **Name** or **Email**.
4. Select **Save**, or **Cancel** to discard.

If the email is already in use, show a field error and save nothing.

#### View someone's details and email history

1. Select a row to open the panel. It's one scrolling view.
2. The header shows:
   - The name, or the email if there's no name
   - The email with a copy button, unless it's already the heading
   - A status badge: **General member**, **Paying member** or **Unsubscribed**
   - Added {date}
3. Every action is in the header's actions menu:
   - Edit details
   - Copy email
   - Convert to paying member, or Remove paying access
   - Unsubscribe, or a disabled Resubscribe
4. Below the header, **Emails ({n})** lists every email sent to them, newest first. Each shows its subject and the date it was sent, and a **Bounced** badge if delivery failed.
5. Scroll to read each email. Every email is open. Each body loads as it comes near the visible area, with a same-size placeholder saying "Loading email…" until then.
6. If an email's body can't load, select **Try again** in its place. If the list can't load, select **Try again** beside the message.

Do not add tabs, an avatar or a primary button to the panel. Show each fact once.

#### Export members

1. Select **Export members**.
2. Under **Who to export**, keep the current tab or choose:
   - General members: everyone subscribed, paying members included
   - Paying members
3. Select **Include unsubscribed members** if needed.
4. Check the count, then select **Download CSV**.

The CSV has two columns: name and email. **Download CSV** is disabled while nobody would be exported.

Accessibility:
- Tab list: `aria-label="Community views"`
- General members tab: the tooltip opens after 600ms on hover or keyboard focus, and a click doesn't pin it
- Search: a `role="search"` landmark; the field has `aria-label="Search by name or email"`
- Clear button: `aria-label="Clear search"`
- Row and panel actions menus: `aria-label="Actions for {name}"`
- Copy buttons: `aria-label="Copy email"`. The result ("Copied" or the failure message) is announced through a `role="status"` region
- Unsubscribed: a text badge, never color alone
- Edit form: `aria-label="Edit member"`
- Emails section: labelled by its Emails heading. Each subject is a heading
- Emails list loading: `role="status"`. Emails list error: `role="alert"`
- Address group toggle: `aria-label="{label}. Show addresses"` or `"{label}. Hide addresses"`
- Email preview frame: `title="Email preview: {subject}"`

### Copy

Toasts and messages returned by the server (`src/app/admin/community/_data/actions.ts`) are backend copy and aren't listed here.

| Element | Current text | Notes |
|---|---|---|
| Page heading | Community | Keep |
| Tab list | Community views | Accessible label only |
| Tab | General members | Keep |
| General tab tooltip | Includes paying members. Doesn't include people who unsubscribed. | New, needs approval |
| Tab | Paying members | Keep |
| General tab count | ({count}) | Keep. Subscribed people only, paying members included. Follows the search |
| Paying tab count | ({count}) | Keep. Follows the search |
| Search field placeholder | Search by name or email | Keep. Also the field's accessible label. There's no visible label |
| Clear search button | Clear search | Accessible label only |
| Header button | Export members | Keep |
| Header button and empty state action | Add members | Keep |
| Column header | Name | Keep |
| Column header | Email | Keep |
| Column header | Last email | Keep |
| Column header | Added | Keep |
| Column header, visually hidden | Actions | Accessible label only |
| Name cell, no name on file | No name | Keep |
| Last email cell, never emailed | — | Keep |
| Unsubscribed badge, search results | Unsubscribed | Keep |
| Copy button, table and panel header | Copy email | Owner to rewrite. Accessible label and tooltip |
| Copy button tooltip, copied | Copied | Keep |
| Copy button tooltip, copy failed | Couldn't copy. Select the email to copy it. | New, needs approval |
| Row actions menu | Actions for {name} | Accessible label only |
| Row menu item | Copy email | Keep |
| Row menu item, general member | Convert to paying member | Keep |
| Row menu item, paying member | Remove paying access | Keep |
| Row menu item | Unsubscribe | Keep |
| Empty state, search title | No matches for "{q}" | Keep |
| Empty state, search description | Try a different name or email. | Keep |
| Empty state, Paying tab title | No paying members yet | Keep |
| Empty state, Paying tab description | Convert a general member to paying from their record, or add paying members here. | Keep |
| Empty state, General tab title | No members yet | Keep |
| Empty state, General tab description | People who join or subscribe appear here. | Keep |
| Add dialog title, Paying tab | Add paying members | Keep |
| Add dialog title, General tab | Add general members | Keep |
| Add dialog field label | Email addresses | Keep |
| Add dialog field hint | Separate with commas or new lines | Keep |
| Add dialog field placeholder | ada@example.org, grace@example.org | Keep |
| Add dialog button | Cancel | Keep |
| Add dialog button, checks the list | Continue | Keep |
| Add dialog button, back to the list | Back | Keep |
| Add dialog confirm, pending | Adding… | Keep |
| Add dialog confirm | Add {n} members | Keep. "member" when n is 1 |
| Check summary | {n} new members will be added and get a welcome email. | Keep. "member" when n is 1 |
| Check line, already members | {n} already members, skipped | Keep. "member" when n is 1 |
| Check line, unsubscribed | {n} unsubscribed, not added | Keep |
| Check line, invalid | {n} invalid | Keep |
| Check note, duplicates | {n} duplicates removed | Keep |
| Check line toggle, closed | {label}. Show addresses | Accessible label only |
| Check line toggle, open | {label}. Hide addresses | Accessible label only |
| Toast fallback, added | Members added. | Keep |
| Toast fallback, not added | The members weren't added. | Keep |
| Export dialog title | Export members | Keep |
| Export dialog description | Download a CSV of member names and emails. | Keep |
| Export field label | Who to export | Keep |
| Export option | General members | Keep. Everyone subscribed, paying members included |
| Export option | Paying members | Keep |
| Export checkbox | Include unsubscribed members | Keep. Review: changes nothing when Paying members is chosen |
| Export count, loading | Counting… | Keep |
| Export count | {n} people will be exported | Keep. "person" when n is 1 |
| Export dialog button | Cancel | Keep |
| Export dialog button | Download CSV | Keep |
| Export button, pending | Preparing… | Keep |
| Toast, exported | Downloaded {filename}. | Keep |
| Toast, export failed | The export couldn't be created. Try again. | Keep |
| Panel status badge | General member | Keep |
| Panel status badge | Paying member | Keep |
| Panel status badge | Unsubscribed | Keep |
| Panel date line | Added {date} | New, needs approval |
| Panel actions menu | Actions for {name} | Accessible label only |
| Panel menu item | Edit details | Keep |
| Panel menu item | Copy email | Keep |
| Panel menu item, general member | Convert to paying member | Keep |
| Panel menu item, paying member | Remove paying access | Keep |
| Panel menu item | Unsubscribe | Keep |
| Panel menu item, unsubscribed, disabled | Resubscribe | Keep |
| Disabled reason, Resubscribe | Turned off until SDC confirms its consent rules for resubscribing people. | Keep |
| Edit form | Edit member | Accessible label only |
| Edit field label | Name | Keep |
| Edit field label | Email | Keep |
| Edit form button | Cancel | Keep |
| Edit form button | Save | Keep |
| Remove paying access dialog title | Remove paying access for {name}? | Keep |
| Remove paying access dialog body | Their paid benefits end now. They'll keep getting general emails, and we'll send them a notice. | Keep |
| Remove paying access dialog cancel | Keep paying access | Keep |
| Remove paying access dialog confirm | Yes, remove paying access | Keep |
| Unsubscribe dialog title | Unsubscribe {name}? | Keep |
| Unsubscribe dialog body, paying member | This stops all emails to them and removes their paying access, now. Their record is kept, marked Unsubscribed. | Keep |
| Unsubscribe dialog body, general member | This stops all emails to them now. Their record is kept, marked Unsubscribed. | Keep |
| Unsubscribe dialog cancel | Keep subscribed | Keep |
| Unsubscribe dialog confirm | Yes, unsubscribe | Keep |
| Emails section heading | Emails | Keep |
| Emails count | ({n}) | Keep. Hidden when no emails were sent |
| Bounced email badge | Bounced | Owner question: "Not delivered" is plainer if admins don't know "bounced" |
| Emails, none sent | No emails sent yet. | Keep |
| Emails, loading | Loading emails… | Keep |
| Emails, error | Couldn't load this person's emails. | Keep. Followed by Try again |
| Email body, loading | Loading email… | New, needs approval |
| Email body, error | Couldn't load this email. | New, needs approval |
| Emails and email body retry button | Try again | New, needs approval |
| Email preview frame | Email preview: {subject} | Accessible label only |
| Toast, email copied | Email copied | Keep. Review: also shown when copying from a menu fails |
| Toast fallback | Done. | Keep |

## Opportunities

Admins and partners share the same list, panel and form. The shared flows and strings are in [partner.md → Opportunities (shared by both portals)](./partner.md#opportunities-shared-by-both-portals). This section covers only what admins see that partners don't.

### Flows

#### Filter by organization

1. On **Opportunities**, select the **Organization** filter above the table, next to **Type**.
2. Select an organization. The list shows:
   - All organizations
   - Social Development Centre
   - Current partners, A–Z
   - Removed partners that still have opportunities, A–Z, shown as **{name} (removed)**
3. The list, the tab counts and search narrow to that organization.
4. To clear it, select **All organizations**, or select **Clear filters** on the No matches state.

#### Open a partner's opportunities from Partners

1. On **Partners**, open a partner and select **View opportunities ({count} live)**.
2. Opportunities opens with the **Organization** filter set to that partner.

#### Post as SDC or on behalf of a partner

1. In the new or edit form, the Basics section starts with **Organization**. A new opportunity defaults to **Social Development Centre**.
2. Select the partner to post for. The opportunity then shows in that partner's portal, and they can edit it.
3. The table's **Organization** column and the panel's **Posted by** row show who it belongs to.

Only admins see this field. A partner's opportunities always belong to their own organization. Removed partners are not in the list.

Do not show a confirmation when posting for a partner.

If the chosen partner is removed while the form is open, saving shows a field error on **Organization**.

#### See a removed partner's opportunities

1. When a partner's access is removed, their live opportunities stay on the **Live** tab with a **No longer emailed** badge. They are no longer emailed or recommended.
2. Select one to open the panel. It shows the **No longer emailed** badge and a note saying until when people who already got it can see it.
3. Each one closes at its own end date or 30 days after the removal, whichever is first.
4. If it closes because of the removal, it moves to **Closed** with a **Partner removed** badge. If its date passed first, it shows **Ended**.

Only admins see a removed partner's opportunities.

#### Reopen a removed partner's opportunity

1. Selecting **Reopen** on a **Partner removed** opportunity shows an error asking the admin to reinvite the partner first.
2. Reinvite the partner from **Partners**.
3. Opportunities still inside the 30 days are emailed again straight away.
4. Opportunities that already closed stay closed. Review each one, then reopen it from its panel.

### Copy

| Element | Current text | Notes |
|---|---|---|
| Organization filter label | Organization | Keep |
| Organization filter, no filter | All organizations | Keep |
| Organization filter, removed partner | {name} (removed) | New, needs approval |
| First option in the Organization filter and picker | Social Development Centre | Keep. SDC's own name, from catalog.ts |
| Table column header | Organization | Keep |
| Form field label | Organization | Keep |
| Form field hint | Post as SDC, or on behalf of a partner. | Keep |
| Form field placeholder | Choose one | Keep. Shared with the Employment type picker |
| Field error, no organization | Choose an organization. | Keep. Also shown if the chosen partner was removed while the form was open |
| Panel detail label | Posted by | Keep. Shared; on the admin side it shows whether SDC or a partner posted it |
| Live tab and panel badge, removed partner | No longer emailed | New, needs approval. Owner question: Partners calls this state "expire". Pick one word |
| Panel note, removed partner | The partner was removed. People who already got it can see it until {date}. | Keep |
| Closed tab and panel status, removed partner | Partner removed | New, needs approval. Owner question: as above |
| Reopen error, removed partner | This partner was removed. Reinvite the partner before reopening its opportunities. | Keep |

## Copy principles

Use familiar words and describe the action the user is taking.

Prefer:
- **Add member** over “Create user”
- **Invite partner** over “Create partner account”
- **Remove access** over “Revoke permissions”
- **Import members** over “CSV import”
- **Awaiting review** over “Pending” when the user needs to understand what is pending

Avoid technical terms unless they are already familiar to admins.

Use the same term for the same person, object, or action throughout the product.
