# Admin UX: flows and copy

The single source for admin portal flows and UX copy.

Edit the **Current text** column to update product copy. Community strings live in `src/app/admin/community/_copy.ts`, keyed by the IDs below.

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
4. If a section has items that need attention, show the number in a badge beside the section name.
5. The page itself should explain what the number refers to. Do not rely on the badge alone.

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
   - Organizations
   - People
   - Removed
3. Type in the search field, then press Enter or select the search button. Search matches organization name, contact name or email.
4. Select the clear button to clear the search and show the full list.
5. Select a row to open its details in the side panel.
   - On the People tab, the panel opens on the person's organization with that person highlighted under Contacts.

Do not search as the user types. Search runs only when submitted.

Accessibility:
- Tab list: `aria-label="Partner views"`
- Tables: `aria-label="Organizations"`, `aria-label="People"`, `aria-label="Removed partners"`
- Search button: `aria-label="Search"`
- Clear button: `aria-label="Clear search"`

#### Invite a partner with a new organization

1. Select **Invite partner**.
2. Enter **Name** and **Email**.
3. In **Organization**, type a name that doesn't match an existing organization and select **Create "{name}"**.
4. Select **Send invitation**.
5. If the invitation is sent, the dialog closes and a toast confirms it.
6. If the email can't be delivered, the person is still added. The dialog closes, a toast explains, and their contact row shows the error with **Retry**.

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

#### Cancel an invitation

1. Open the actions menu on a pending contact.
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
4. Every saved contact gets a new invitation. The partner returns to **Organizations**, marked **Invitation pending**.

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
| Page description | Invite organizations, manage their contacts, and control their access to opportunities. | Keep |
| Header button | Invite partner | Keep |
| Search field label | Search partners | Keep |
| Search field hint | Matches organization name, contact name or email | Keep |
| Search field placeholder | Search partners | Review: repeats the label |
| Search button | Search | Accessible label only |
| Clear search button | Clear search | Accessible label only |
| Tab list | Partner views | Accessible label only |
| Tab | Organizations | Keep |
| Tab | People | Owner question: rename to Contacts? The panel section and column say Contacts, and the button says Add person |
| Tab | Removed | Keep |
| Tab count | ({count}) | Keep |
| Organizations table | Organizations | Accessible label only |
| Organizations column header | Organization | Keep |
| Organizations column header | Contacts | Keep |
| Organizations column header | Email | Keep |
| Organizations column header | Opportunities | Keep |
| Opportunities cell, one | 1 opportunity | Keep |
| Opportunities cell, many | {count} opportunities | Keep |
| Contacts cell, nobody left | No contacts | Keep |
| Empty cell | — | Keep |
| Status badge, organization and person | Invitation pending | Keep. Review: decisions/partners.md #2 and #5 still say Pending |
| Status badge, panel | Removed | Keep |
| Organizations empty, search title | No matches for "{q}" | Keep |
| Organizations empty, search description | Try a different organization name, contact name or email. | Keep |
| Organizations empty, no partners title | No partners yet | Keep |
| Organizations empty, no partners description | Invite an organization to give them access to their opportunities. | Keep |
| Organizations empty, action | Invite partner | Keep |
| People table | People | Accessible label only |
| People column header | Name | Keep |
| People column header | Email | Keep |
| People column header | Organization | Keep |
| People column header | Invitation | Keep |
| Invitation cell, send failed | Invitation not sent | Keep |
| Invitation cell, pending | Expires {date} | Keep |
| People empty, search title | No matches for "{q}" | Keep |
| People empty, search description | Try a different name, email or organization. | Keep |
| People empty, no people title | No people yet | Keep |
| People empty, no people description | Invite a partner to add their first contact. | Keep |
| People empty, action | Invite partner | Keep |
| Removed table | Removed partners | Accessible label only |
| Removed column header | Organization | Keep |
| Removed column header | Contacts | Keep |
| Removed column header | Removed | Keep |
| Removed empty, search title | No matches for "{q}" | Keep |
| Removed empty, search description | Try a different organization name, contact name or email. | Keep |
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
2. Select a tab:
   - General members
   - Paying members
3. Type in the search field, then press Enter or select the search button.
4. Select the clear button to clear the search and show the full list.
5. Submitting or clearing a search returns to page 1.
6. Select a row to open that person's panel.

Do not search as the user types. Search runs only when submitted.

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
   - In the table, hover over or tab to a row's Email cell, then select the copy button. This doesn't open the row.
   - In the panel header, select the copy button next to the email.
   - Select **Copy email** from the row's or the panel's actions menu.
2. A toast confirms the email was copied.

#### Convert to paying member

1. Do one of these:
   - Select **Convert to paying member** from a general member's row actions menu.
   - Open their panel and select **Convert to paying member** in the header.
2. They move to Paying members and get the upgrade email.

Do not ask for confirmation. The change runs straight away.

#### Remove paying access

1. Do one of these:
   - Select **Remove paying access** from a paying member's row actions menu.
   - Open their panel and select **Remove paying access** in the header.
2. Select **Yes, remove paying access** to confirm, or **Keep paying access** to go back.
3. Their paid benefits end now. They stay a general member and get a notice email.

#### Unsubscribe

1. Do one of these:
   - Select **Unsubscribe** from a row's actions menu.
   - Open the panel, select its actions menu, then select **Unsubscribe**.
2. Select **Yes, unsubscribe** to confirm, or **Keep subscribed** to go back.
3. All emails to them stop. A paying member also loses paying access.
4. Their row shows their name dimmed with an unsubscribed icon.

#### Resubscribe (turned off)

1. Open an unsubscribed person's panel and select its actions menu.
2. **Resubscribe** is shown disabled. The tooltip explains that it stays off until SDC confirms its consent rules.

#### Edit details

1. Open a row's panel.
2. Select **Edit details** from the panel's actions menu. This switches to the Details tab if needed.
3. Change **Name** or **Email**.
4. Select **Save**, or **Cancel** to discard.

If the email is already in use, show a field error and save nothing.

#### View someone's email history

1. Open a row's panel and select the **Emails ({n})** tab.
2. Emails are listed newest first. Each shows its subject, type and date, and a **Bounced** badge if delivery failed.
3. Select an email to expand it and see the full message.
4. Select **Expand all** or **Collapse all** to open or close every email at once.

#### Export

1. Select **Export**.
2. Under **Who to export**, choose:
   - General members
   - Paying members
   - Everyone
3. Select **Include unsubscribed members** if needed.
4. Check the count, then select **Download CSV**.

Accessibility:
- Tab list: `aria-label="Community views"`
- Search field: `aria-label="Search members"`
- Row and panel actions menus: `aria-label="Actions for {name}"`
- Copy buttons: `aria-label="Copy email"`
- Unsubscribed icon: tooltip and visually hidden text "Unsubscribed"
- Panel tab list: `aria-label="{name} details"`
- Edit form: `aria-label="Edit member"`
- Address group toggle: `aria-label="{label}. Show addresses"` or `"{label}. Hide addresses"`
- Email preview frame: `title="Email preview: {subject}"`

### Copy

Toasts and messages returned by the server (`src/app/admin/community/_data/actions.ts`) are backend copy and aren't listed here.

| Element | Current text | Notes |
|---|---|---|
| Page heading | Community | Keep. `page.title` |
| Page description | View general and paying members, add people and manage their access. | Keep. `page.description` |
| Tab list | Community views | Accessible label only. `tabs.ariaLabel` |
| Tab | General members | Keep. `tabs.general` |
| Tab | Paying members | Keep. `tabs.paying` |
| General tab count | ({general} · {unsubscribed} unsubscribed) | Keep. `tabs.generalCount` |
| Paying tab count | ({paying}) | Keep. `tabs.payingCount` |
| Search field | Search members | Accessible label only. `toolbar.searchAriaLabel` |
| Search field placeholder | Search by name or email | Keep. `toolbar.searchPlaceholder` |
| Toolbar button | Export | Keep. `toolbar.export` |
| Toolbar button and empty state action | Add members | Keep. `toolbar.addMembers` |
| Column header | Name | Keep. `table.headerName` |
| Column header | Email | Keep. `table.headerEmail` |
| Column header | Last email | Keep. `table.headerLastEmail` |
| Column header | Added | Keep. `table.headerAdded` |
| Column header, visually hidden | Actions | Accessible label only. `table.headerActions` |
| Name cell, no name on file | No name | Keep. `table.noName` |
| Last email cell, never emailed | — | Keep. `table.noLastEmail` |
| Email cell copy button | Copy email | Accessible label only. `table.copyEmailLabel` |
| Unsubscribed icon | Unsubscribed | Tooltip and hidden text. `table.unsubscribedLabel` |
| Row actions menu | Actions for {name} | Accessible label only. `table.rowActionsLabel` |
| Row menu item | Copy email | Keep. `rowMenu.copyEmail` |
| Row menu item, general member | Convert to paying member | Keep. `rowMenu.convert` |
| Row menu item, paying member | Remove paying access | Keep. `rowMenu.remove` |
| Row menu item | Unsubscribe | Keep. `rowMenu.unsubscribe` |
| Empty state, search title | No matches for "{q}" | Keep. `empty.searchTitle` |
| Empty state, search description | Try a different name or email. | Keep. `empty.searchDescription` |
| Empty state, Paying tab title | No paying members yet | Keep. `empty.payingTitle` |
| Empty state, Paying tab description | Convert a general member to paying from their record, or add paying members here. | Keep. `empty.payingDescription` |
| Empty state, General tab title | No members yet | Keep. `empty.generalTitle` |
| Empty state, General tab description | People who join or subscribe appear here. | Keep. `empty.generalDescription` |
| Add dialog title, Paying tab | Add paying members | Keep. `addDialog.titlePaying` |
| Add dialog title, General tab | Add general members | Keep. `addDialog.titleGeneral` |
| Add dialog field label | Email addresses | Keep. `addDialog.emailsLabel` |
| Add dialog field hint | Separate with commas or new lines | Keep. `addDialog.emailsHint` |
| Add dialog field placeholder | ada@example.org, grace@example.org | Keep. `addDialog.emailsPlaceholder` |
| Add dialog button | Cancel | Keep. `addDialog.cancel` |
| Add dialog button, checks the list | Continue | Keep. `addDialog.continue` |
| Add dialog button, back to the list | Back | Keep. `addDialog.back` |
| Add dialog confirm, pending | Adding… | Keep. `addDialog.adding` |
| Add dialog confirm | Add {n} members | Keep. "member" when n is 1. `addDialog.addCount` |
| Check summary | {n} new members will be added and get a welcome email. | Keep. "member" when n is 1. `addDialog.summary` |
| Check line, already members | {n} already members, skipped | Keep. "member" when n is 1. `addDialog.skipped` |
| Check line, unsubscribed | {n} unsubscribed, not added | Keep. `addDialog.unsubscribedIssue` |
| Check line, invalid | {n} invalid | Keep. `addDialog.invalid` |
| Check note, duplicates | {n} duplicates removed | Keep. `addDialog.duplicates` |
| Check line toggle, closed | {label}. Show addresses | Accessible label only. `addDialog.toggleAddresses` |
| Check line toggle, open | {label}. Hide addresses | Accessible label only. `addDialog.toggleAddresses` |
| Toast fallback, added | Members added. | Keep. `addDialog.addedFallback` |
| Toast fallback, not added | The members weren't added. | Keep. `addDialog.notAddedFallback` |
| Export dialog title | Export members | Keep. `exportDialog.title` |
| Export dialog description | Download a CSV of member names and emails. | Keep. `exportDialog.description` |
| Export field label | Who to export | Keep. `exportDialog.whoLabel` |
| Export option | General members | Keep. `exportDialog.scopeGeneral` |
| Export option | Paying members | Keep. `exportDialog.scopePaying` |
| Export option | Everyone | Keep. `exportDialog.scopeEveryone` |
| Export checkbox | Include unsubscribed members | Keep. `exportDialog.includeUnsubscribed` |
| Export count, loading | Counting… | Keep. `exportDialog.counting` |
| Export count | {n} people will be exported | Keep. "person" when n is 1. `exportDialog.countLine` |
| Export dialog button | Cancel | Keep. `exportDialog.cancel` |
| Export dialog button | Download CSV | Keep. `exportDialog.download` |
| Export button, pending | Preparing… | Keep. `exportDialog.preparing` |
| Toast, exported | Downloaded {filename}. | Keep. `exportDialog.downloadedToast` |
| Toast, export failed | The export couldn't be created. Try again. | Keep. `exportDialog.errorToast` |
| Panel category | General member | Keep. `panel.categoryGeneral` |
| Panel category | Paying member | Keep. `panel.categoryPaying` |
| Panel category | Unsubscribed | Keep. `panel.categoryUnsubscribed` |
| Panel copy button | Copy email | Accessible label only. `panel.copyEmailLabel` |
| Panel header button, general member | Convert to paying member | Keep. `panel.convertButton` |
| Panel header button, paying member | Remove paying access | Keep. `panel.removeButton` |
| Panel tab list | {name} details | Accessible label only. `panel.tabsAriaLabel` |
| Panel actions menu | Actions for {name} | Accessible label only. `panel.menuLabel` |
| Panel menu item | Edit details | Keep. `panel.menuEdit` |
| Panel menu item | Copy email | Keep. `panel.menuCopyEmail` |
| Panel menu item | Unsubscribe | Keep. `panel.menuUnsubscribe` |
| Panel menu item, unsubscribed, disabled | Resubscribe | Keep. `panel.menuRestore` |
| Disabled reason, Resubscribe | Turned off until SDC confirms its consent rules for resubscribing people. | Keep. `panel.restoreReason` |
| Panel tab | Details | Keep. `panel.tabDetails` |
| Panel tab, count loading | Emails | Keep. `panel.tabEmailsLoading` |
| Panel tab | Emails ({n}) | Keep. `panel.tabEmails` |
| Details row label | Email | Keep. `details.email` |
| Details row label | Category | Keep. `details.category` |
| Details row label | Date added | Keep. `details.dateAdded` |
| Edit form | Edit member | Accessible label only. `editForm.ariaLabel` |
| Edit field label | Name | Keep. `editForm.nameLabel` |
| Edit field label | Email | Keep. `editForm.emailLabel` |
| Edit form button | Cancel | Keep. `editForm.cancel` |
| Edit form button | Save | Keep. `editForm.save` |
| Remove paying access dialog title | Remove paying access for {name}? | Keep. `confirm.revokeTitle` |
| Remove paying access dialog body | Their paid benefits end now. They'll keep getting general emails, and we'll send them a notice. | Keep. `confirm.revokeBody` |
| Remove paying access dialog cancel | Keep paying access | Keep. `confirm.revokeCancel` |
| Remove paying access dialog confirm | Yes, remove paying access | Keep. `confirm.revokeConfirm` |
| Unsubscribe dialog title | Unsubscribe {name}? | Keep. `confirm.unsubscribeTitle` |
| Unsubscribe dialog body, paying member | This stops all emails to them and removes their paying access, now. Their record is kept, marked Unsubscribed. | Keep. `confirm.unsubscribeBodyPaying` |
| Unsubscribe dialog body, general member | This stops all emails to them now. Their record is kept, marked Unsubscribed. | Keep. `confirm.unsubscribeBodyGeneral` |
| Unsubscribe dialog cancel | Keep subscribed | Keep. `confirm.unsubscribeCancel` |
| Unsubscribe dialog confirm | Yes, unsubscribe | Keep. `confirm.unsubscribeConfirm` |
| Emails tab button | Expand all | Keep. `emailsTab.expandAll` |
| Emails tab button | Collapse all | Keep. `emailsTab.collapseAll` |
| Bounced email badge | Bounced | Owner question: "Not delivered" is plainer if admins don't know "bounced". `emailsTab.bouncedBadge` |
| Emails tab, none sent | No emails sent yet. | Keep. `emailsTab.empty` |
| Emails tab, loading | Loading emails… | Keep. `emailsTab.loading` |
| Emails tab, error | Couldn't load this person's emails. Try again. | Keep. `emailsTab.loadError` |
| Email preview frame | Email preview: {subject} | Accessible label only. `emailsTab.previewTitle` |
| Email type | Welcome | Keep. `emailsTab.kindLabel` |
| Email type | Paying welcome | Keep. `emailsTab.kindLabel` |
| Email type | Upgrade | Owner question: the action is Convert to paying member. Align the email name? `emailsTab.kindLabel` |
| Email type | Paying access removed | Keep. `emailsTab.kindLabel` |
| Email type | Opportunities | Keep. `emailsTab.kindLabel` |
| Toast, email copied | Email copied | Keep. `toast.emailCopied` |
| Toast fallback | Done. | Keep. `toast.done` |

## Opportunities

Admins and partners share the same list, panel and form. The shared flows and strings are in [partner.md → Opportunities (both portals)](./partner.md#opportunities-both-portals). This section covers only what admins see that partners don't.

### Flows

#### Filter by organization

1. On **Opportunities**, select the **Organization** filter in the toolbar.
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
| Page description | Events, petitions, volunteer roles and jobs from SDC and Civic Hub partners. | Review: leaves out Other. Revisit after the 29 September types session |
| Organization filter label | Organization | Keep |
| Organization filter, no filter | All organizations | Keep |
| Organization filter, removed partner | {name} (removed) | Keep |
| First option in the Organization filter and picker | Social Development Centre | Keep. SDC's own name, from catalog.ts |
| Table column header | Organization | Keep |
| Form field label | Organization | Keep |
| Form field hint | Post as SDC, or on behalf of a partner. | Keep |
| Form field placeholder | Choose one | Keep. Shared with the Employment type picker |
| Field error, no organization | Choose an organization. | Keep. Also shown if the chosen partner was removed while the form was open |
| Panel detail label | Posted by | Keep. Shared; on the admin side it shows whether SDC or a partner posted it |
| Live tab and panel badge, removed partner | No longer emailed | Owner question: Partners calls this state "expire". Pick one word |
| Panel note, removed partner | The partner was removed. People who already got it can see it until {date}. | Keep |
| Closed tab and panel status, removed partner | Partner removed | Owner question: as above |
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
