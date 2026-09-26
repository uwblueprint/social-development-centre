# Admin UX: flows and copy

The single source for admin portal flows and UX copy. Edit the **Current text** column; edits are applied back to code (Community's strings live in `src/app/admin/community/_copy.ts`, keyed by the IDs below).

## Shell

### Flows

**Navigate sections (desktop, ≥768px)**
1. The sidebar is always visible on the left, showing Opportunities, Partners, Community, Insights.
2. Click a section's row. The row shows selected state (`aria-current="page"`) and the matching page loads on the right.
3. If a section has a pending count, it shows as a numeric badge on its row.

**Navigate sections (mobile, <768px)**
1. The sidebar is hidden; a top bar shows a menu icon and the product name.
2. Tap the menu icon to open the sidebar as a drawer over the content, with a dimmed scrim behind it.
3. Tap a section, or press Escape, or tap the scrim, to close the drawer. Tapping a section also navigates.

**Account menu**
1. Click the profile row at the bottom of the sidebar (avatar, name, email).
2. A menu opens above it with "My account" (navigates) and "Sign out".
3. Choosing "Sign out" signs the admin out.

### Copy

| ID | Where | Current text |
|---|---|---|
| shell.brand.name | Sidebar header, mobile top bar | `SDC Admin` |
| shell.brand.initials | Sidebar brand mark (decorative) | `SDC` |
| shell.nav.label | Nav landmark aria-label | `Admin` |
| shell.nav.opportunities | Sidebar item | `Opportunities` |
| shell.nav.partners | Sidebar item | `Partners` |
| shell.nav.community | Sidebar item | `Community` |
| shell.nav.insights | Sidebar item | `Insights` |
| shell.nav.count | Badge on a sidebar item, aria-label | `{count} new` |
| shell.mobile.open | Mobile menu icon button, aria-label | `Open navigation` |
| shell.account.trigger | Profile button, aria-label | `Account menu for {name}` |
| shell.account.myAccount | Account menu item | `My account` |
| shell.account.signOut | Account menu item | `Sign out` |

## Partners

### Flows

**Find a partner or person**
1. Go to Partners. Choose a tab: Organizations, People or Removed.
2. Type in the search field, then press Enter or click its search button to run the search; click the field's × button to clear it and return to the unfiltered list.
3. Click a row to open its details in the right-hand panel (a drawer on mobile).

**Invite, creating a new organization**
1. Click "Invite partner". Enter Name and Email.
2. In Organization, type a name that doesn't match an existing one and choose `Create "{name}"`.
3. Click "Send invitation". On success the dialog closes and a toast confirms; on a delivery failure the person is still added and a toast explains, with Retry available on their row.

**Invite into an existing organization**
1. Either click "Invite partner" and pick the organization from the list, or open an existing partner's panel and click "Add person" (organization preset).
2. Enter Name and Email and click "Send invitation".

**Resend an invitation**
1. Open the partner, find the pending contact, open their `⋯` menu, choose "Resend invitation". The previous link stops working.

**Cancel an invitation**
1. Open the `⋯` menu on a pending contact, choose "Cancel invitation", confirm. This deletes the contact (and the organization too if it was never active).

**Edit a partner or contact**
1. Open the partner. Rename the organization inline and click "Save".
2. Or open a contact's `⋯` menu, choose "Edit", change Name/Email, click "Save". Changing an active contact's email sends a fresh invitation but keeps them active.

**View a partner's opportunities**
1. Open the partner and click "View opportunities ({count})"; opens Opportunities filtered to that partner.

**Remove a person**
1. Open the contact's `⋯` menu, choose "Remove from organization", confirm. Disabled (with reason) if they're the organization's only contact.

**Remove a partner**
1. Open the partner, click "Remove access" in the panel footer, read the confirmation, confirm. The organization moves to Removed.

**Reinvite a removed partner**
1. Open the partner on the Removed tab, update details if needed, click "Reinvite", confirm. Every saved contact gets a new invitation; the partner returns to Organizations as Pending.

### Copy

| ID | Where | Current text |
|---|---|---|
| partners.page.title | Page heading | `Partners` |
| partners.page.description | Page subheading | `Invite organizations, manage their contacts, and control their access to opportunities.` |
| partners.header.invite | Header button | `Invite partner` |
| partners.search.label | Search field label | `Search partners` |
| partners.search.hint | Search field hint | `Matches organization name, contact name or email` |
| partners.search.placeholder | Search field placeholder | `Search partners` |
| partners.search.submit | Search button (icon, accessible name) | `Search` |
| partners.search.clear | Clear button (icon, accessible name) | `Clear search` |
| partners.tabs.organizations | Tab | `Organizations` |
| partners.tabs.people | Tab | `People` |
| partners.tabs.removed | Tab | `Removed` |
| partners.table.org.organization | Column header | `Organization` |
| partners.table.org.contacts | Column header | `Contacts` |
| partners.table.org.email | Column header | `Email` |
| partners.table.org.opportunities | Column header | `Opportunities` |
| partners.table.org.opportunities.one | Cell | `1 opportunity` |
| partners.table.org.opportunities.many | Cell | `{count} opportunities` |
| partners.badge.pending | Badge, org/person rows | `Pending` |
| partners.badge.removed | Badge, panel status | `Removed` |
| partners.empty.org.results.title | Organizations empty (search) | `No matches for "{q}"` |
| partners.empty.org.results.desc | Organizations empty (search) | `Try a different organization name, contact name or email.` |
| partners.empty.org.none.title | Organizations empty (no data) | `No partners yet` |
| partners.empty.org.none.desc | Organizations empty (no data) | `Invite an organization to give them access to their opportunities.` |
| partners.empty.org.none.action | Organizations empty action | `Invite partner` |
| partners.table.people.name | Column header | `Name` |
| partners.table.people.email | Column header | `Email` |
| partners.table.people.organization | Column header | `Organization` |
| partners.table.people.invitation | Column header | `Invitation` |
| partners.people.invitation.notSent | Cell | `Invitation not sent` |
| partners.people.invitation.expires | Cell | `Expires {date}` |
| partners.empty.people.results.title | People empty (search) | `No matches for "{q}"` |
| partners.empty.people.results.desc | People empty (search) | `Try a different name, email or organization.` |
| partners.empty.people.none.title | People empty (no data) | `No people yet` |
| partners.empty.people.none.desc | People empty (no data) | `Invite a partner to add their first contact.` |
| partners.empty.people.none.action | People empty action | `Invite partner` |
| partners.table.removed.organization | Column header | `Organization` |
| partners.table.removed.contacts | Column header | `Contacts` |
| partners.table.removed.removed | Column header | `Removed` |
| partners.empty.removed.results.title | Removed empty (search) | `No matches for "{q}"` |
| partners.empty.removed.results.desc | Removed empty (search) | `Try a different organization name, contact name or email.` |
| partners.empty.removed.none.title | Removed empty (no data) | `No removed partners` |
| partners.empty.removed.none.desc | Removed empty (no data) | `Partners whose access you remove appear here.` |
| partners.invite.dialog.title | Dialog title | `Invite partner` |
| partners.invite.dialog.desc | Dialog description | `Add a contact and give them access to their organization's opportunities.` |
| partners.invite.field.name | Field label | `Name` |
| partners.invite.field.name.placeholder | Input placeholder | `Ada Lovelace` |
| partners.invite.field.email | Field label | `Email` |
| partners.invite.field.email.placeholder | Input placeholder | `ada@example.org` |
| partners.invite.field.org | Field label | `Organization` |
| partners.invite.field.org.hint | Field hint | `Search existing organizations, or create a new one` |
| partners.invite.field.org.placeholder | Combobox placeholder | `Search or create an organization…` |
| partners.invite.combobox.searchPlaceholder | Combobox search input | `Search organizations…` |
| partners.invite.combobox.empty | Combobox empty state | `No organizations found` |
| partners.invite.combobox.create | Combobox create row / chosen value | `Create "{name}"` |
| partners.invite.cancel | Dialog button | `Cancel` |
| partners.invite.submit | Dialog submit button | `Send invitation` |
| partners.invite.error.name | Field error | `Enter the contact's name.` |
| partners.invite.error.email.invalid | Field error | `Enter an email address like name@example.org.` |
| partners.invite.error.email.inUse | Field error | `This person is already a current partner contact.` |
| partners.invite.error.org.required | Field error | `Choose an organization or create a new one.` |
| partners.invite.error.org.duplicate | Field error | `An organization with this name already exists. Choose it from the list.` |
| partners.invite.error.summary | Toast/message on field errors | `Check the highlighted fields.` |
| partners.invite.toast.success | Toast | `Invitation sent to {email}.` |
| partners.invite.toast.partial | Toast | `{name} was added, but the invitation wasn't sent. {sendError} Try resending.` |
| partners.invite.sendError | Simulated email-service error | `The invitation email couldn't be delivered.` |
| partners.panel.orgName.label | Sheet field label | `Organization name` |
| partners.panel.orgName.save | Sheet button (sm) | `Save` |
| partners.panel.orgName.error.required | Field error | `Enter the organization's name.` |
| partners.panel.orgName.error.duplicate | Field error | `Another organization already has this name.` |
| partners.panel.orgName.error.summary | Message on field error | `Check the highlighted field.` |
| partners.panel.orgName.error.gone | Message | `This organization no longer exists.` |
| partners.panel.orgName.toast.saved | Toast | `Changes saved.` |
| partners.panel.removedMeta | Meta row | `Removed {date}` |
| partners.panel.viewOpportunities | Link | `View opportunities ({count})` |
| partners.panel.contacts.heading | Section title | `Contacts` |
| partners.panel.addPerson | Button | `Add person` |
| partners.panel.removeAccess | Footer button | `Remove access` |
| partners.panel.reinvite | Footer button | `Reinvite` |
| partners.remove.dialog.title | Confirm dialog title | `Remove {org}'s access?` |
| partners.remove.dialog.body | Confirm dialog body | `Immediately: portal access ends now, and their opportunities stop being recommended and leave future emails. Over the next month: each opportunity expires at its own end date or in one month, whichever is first. Already-sent emails can't be recalled.` |
| partners.remove.dialog.cancel | Confirm dialog button | `Keep access` |
| partners.remove.dialog.confirm | Confirm dialog button | `Yes, remove access` |
| partners.remove.error.already | Result message | `This partner is already removed.` |
| partners.remove.toast.done | Result message/toast | `{org} was removed. Their access ended now; their opportunities expire within a month.` |
| partners.reinvite.dialog.title | Confirm dialog title | `Reinvite this partner?` |
| partners.reinvite.dialog.body | Confirm dialog body | `Sends a fresh invitation to each saved contact and returns {org} to the current list as Pending. Opportunities that already expired are not republished.` |
| partners.reinvite.dialog.cancel | Confirm dialog button | `Cancel` |
| partners.reinvite.dialog.confirm | Confirm dialog button | `Yes, reinvite` |
| partners.reinvite.error.notRemoved | Result message | `Only removed partners can be reinvited.` |
| partners.reinvite.error.noContacts | Result message | `Add a contact before reinviting.` |
| partners.reinvite.error.emailClash | Result message | `{email} is already a contact at another current partner. Edit it first.` |
| partners.reinvite.toast.partial | Result message/toast | `Reinvited, but these invitations weren't sent: {emails}. Resend from the partner's details.` |
| partners.reinvite.toast.done | Result message/toast | `{org} was reinvited. It shows as Pending until someone accepts.` |
| partners.contact.menu.edit | Menu item | `Edit` |
| partners.contact.menu.resend | Menu item | `Resend invitation` |
| partners.contact.menu.cancel | Menu item | `Cancel invitation` |
| partners.contact.menu.remove | Menu item | `Remove from organization` |
| partners.contact.menu.remove.disabledReason | Disabled reason (tooltip + hidden text) | `This is the organization's only contact. Remove the organization instead.` |
| partners.contact.edit.cancel | Edit form button | `Cancel` |
| partners.contact.edit.save | Edit form button | `Save` |
| partners.contact.error.name | Field error | `Enter the contact's name.` |
| partners.contact.error.email.invalid | Field error | `Enter an email address like name@example.org.` |
| partners.contact.error.email.inUse | Field error | `Another current partner contact uses this email.` |
| partners.contact.error.gone | Result message | `This contact no longer exists.` |
| partners.contact.error.summary | Message on field error | `Check the highlighted fields.` |
| partners.contact.toast.saved | Toast | `Changes saved.` |
| partners.contact.toast.savedNewInvite | Toast | `Saved. A new invitation was sent to {email}.` |
| partners.contact.toast.savedSendFailed | Toast | `Saved, but the new invitation wasn't sent. {sendError}` |
| partners.contact.invitation.expires | Row text | `Expires {date}` |
| partners.contact.invitation.sendErrorLine | Row error text | `{sendError}` |
| partners.contact.invitation.retry | Row button | `Retry` |
| partners.resend.error.gone | Result message | `This contact no longer exists.` |
| partners.resend.error.failed | Result message | `The invitation wasn't sent. {sendError}` |
| partners.resend.toast.done | Result message/toast | `Invitation resent to {email}. The previous link no longer works.` |
| partners.cancel.error.notPending | Result message | `Only pending invitations can be cancelled.` |
| partners.cancel.toast.done | Result message/toast | `Invitation cancelled.` |
| partners.cancel.dialog.title | Confirm dialog title | `Cancel this invitation?` |
| partners.cancel.dialog.body | Confirm dialog body | `{name} won't be able to use the invitation link already sent.` |
| partners.cancel.dialog.cancel | Confirm dialog button | `Keep invitation` |
| partners.cancel.dialog.confirm | Confirm dialog button | `Yes, cancel invitation` |
| partners.removeContact.error.notActive | Result message | `Only active contacts can be removed. Cancel a pending invitation instead.` |
| partners.removeContact.error.onlyContact | Result message | `This is the organization's only contact. Remove the organization instead.` |
| partners.removeContact.toast.done | Result message/toast | `{name} was removed from {org}. Their access ended now.` |
| partners.removeContact.dialog.title | Confirm dialog title | `Remove {name} from {org}?` |
| partners.removeContact.dialog.body | Confirm dialog body | `{name} loses access to the partner portal now. Their record is kept for history, and their email can be invited under another organization.` |
| partners.removeContact.dialog.cancel | Confirm dialog button | `Keep access` |
| partners.removeContact.dialog.confirm | Confirm dialog button | `Yes, remove` |

## Community

### Flows

**Find someone**
1. Go to Community. Choose a tab: General members or Paying members.
2. Type in the search field, then press Enter or click its search button to run the search — it never searches live. Click the field's × to clear it and return to the unfiltered list; either submitting or clearing resets to page 1.
3. Click a row to open their panel.

**Add members**
1. Click "Add members". Paste one or more email addresses.
2. Click "Continue" to check them: new members, upgrades (Paying tab), already-members, unsubscribed and invalid addresses are each shown as their own line, with a duplicates count if any were removed.
3. Click "Add N members" to confirm and send the matching welcome/upgrade emails, or "Back" to change the list.

**Copy someone's email**
1. In the table, hover (or tab to) a row's Email cell and click the copy icon that appears — this doesn't open the row.
2. Or open the panel and click the copy icon next to the email in the header, or choose "Copy email" from either the row's or the panel's `⋯` menu.

**Convert to paying member**
1. From a general member's row `⋯` menu, choose "Convert to paying member" — or open their panel and click the same button in the header.
2. This runs immediately (no confirmation); they move to Paying members and get the upgrade email.

**Remove paying access**
1. From a paying member's row `⋯` menu, choose "Remove paying access" — or open their panel and click the same button in the header.
2. Confirm in the dialog. Their paid benefits end now; they stay a general member and get a notice email.

**Unsubscribe**
1. From a row's `⋯` menu, choose "Unsubscribe" — or open the panel, open its `⋯` menu, and choose "Unsubscribe".
2. Confirm in the dialog. All emails to them stop; a paying member also loses paid access. The row shows their name dimmed with a mail-off icon.

**Restore email eligibility (disabled)**
1. On an unsubscribed person's panel, open the `⋯` menu — "Restore email eligibility" is shown disabled, with a tooltip explaining why (SDC's consent rules aren't confirmed yet).

**Edit details**
1. Open a row, then choose "Edit details" from the panel's `⋯` menu (this also switches to the Details tab if needed).
2. Change Name or Email, click "Save", or "Cancel" to discard. A conflicting email shows a field error and saves nothing.

**View someone's email history**
1. Open a row's panel and click the "Emails (N)" tab.
2. Emails list newest first as an accordion: subject, kind, date, and a "Bounced" badge if delivery bounced. Click one to expand and see the full message in a sandboxed preview.
3. Use "Expand all" / "Collapse all" above the list to open or close every email at once.

**Export**
1. Click "Export". Choose who to include and whether to include unsubscribed members.
2. Check the shown count, then click "Download CSV".

### Copy

IDs are dot-paths into `src/app/admin/community/_copy.ts`'s `communityCopy` object. `{placeholder}` marks a value the function fills in at render time (a count, a name, a filename). Toasts and messages returned by server actions (`_data/actions.ts`) are a separate, fixed backend contract and aren't listed here.

| ID | Where | Current text |
|---|---|---|
| page.title | Page heading | `Community` |
| page.description | Page subheading | `View subscribers and paying members, add people and manage their access.` |
| tabs.ariaLabel | Tab list, aria-label | `Community views` |
| tabs.general | Tab label | `General members` |
| tabs.paying | Tab label | `Paying members` |
| tabs.generalCount | Tab count suffix | `({general} · {unsubscribed} unsubscribed)` |
| tabs.payingCount | Tab count suffix | `({paying})` |
| toolbar.searchAriaLabel | Search field, aria-label | `Search members` |
| toolbar.searchPlaceholder | Search field placeholder | `Search by name or email` |
| toolbar.export | Toolbar button | `Export` |
| toolbar.addMembers | Toolbar button; also the empty state's action | `Add members` |
| table.headerName | Column header | `Name` |
| table.headerEmail | Column header | `Email` |
| table.headerLastEmail | Column header | `Last email` |
| table.headerAdded | Column header | `Added` |
| table.headerActions | Column header, visually hidden | `Actions` |
| table.noName | Name cell, no name on file | `No name` |
| table.noLastEmail | Last email cell, never emailed | `—` |
| table.copyEmailLabel | Email cell's copy button, aria-label | `Copy email` |
| table.unsubscribedLabel | Unsubscribed icon's tooltip and visually-hidden text | `Unsubscribed` |
| table.rowActionsLabel | Row `⋯` trigger, aria-label | `Actions for {name}` |
| rowMenu.copyEmail | Row `⋯` menu item | `Copy email` |
| rowMenu.convert | Row `⋯` menu item (general, subscribed) | `Convert to paying member` |
| rowMenu.remove | Row `⋯` menu item (paying) | `Remove paying access` |
| rowMenu.unsubscribe | Row `⋯` menu item, danger | `Unsubscribe` |
| empty.searchTitle | Empty state title, search with no matches | `No matches for "{q}"` |
| empty.searchDescription | Empty state description | `Try a different name or email.` |
| empty.payingTitle | Empty state title, Paying tab | `No paying members yet` |
| empty.payingDescription | Empty state description | `Convert a general member to paying from their record, or add paying members here.` |
| empty.generalTitle | Empty state title, General tab | `No members yet` |
| empty.generalDescription | Empty state description | `People who join or subscribe appear here.` |
| addDialog.titlePaying | Add members dialog title, Paying tab | `Add paying members` |
| addDialog.titleGeneral | Add members dialog title, General tab | `Add general members` |
| addDialog.emailsLabel | Field label | `Email addresses` |
| addDialog.emailsHint | Field hint | `Separate with commas or new lines` |
| addDialog.emailsPlaceholder | Field placeholder | `ada@example.org, grace@example.org` |
| addDialog.cancel | Dialog button | `Cancel` |
| addDialog.continue | Dialog button, submits the check | `Continue` |
| addDialog.back | Dialog button, returns to paste step | `Back` |
| addDialog.adding | Confirm button, pending state | `Adding…` |
| addDialog.addCount | Confirm button | `Add {n} member(s)` |
| addDialog.summary | Preview step summary line | `{n} new member(s) will be added and get a welcome email.` |
| addDialog.skipped | Preview step, expandable issue line | `{n} already member(s), skipped` |
| addDialog.unsubscribedIssue | Preview step, expandable issue line | `{n} unsubscribed, not added` |
| addDialog.invalid | Preview step, expandable issue line | `{n} invalid` |
| addDialog.duplicates | Preview step note | `{n} duplicates removed` |
| addDialog.toggleAddresses | Issue line's expand toggle, aria-label | `{label}. Show/Hide addresses` |
| addDialog.addedFallback | Toast fallback if the server sends no message | `Members added.` |
| addDialog.notAddedFallback | Toast fallback if the server sends no message | `The members weren't added.` |
| exportDialog.title | Dialog title | `Export members` |
| exportDialog.description | Dialog body text | `Download a CSV of member names and emails.` |
| exportDialog.whoLabel | Field label | `Who to export` |
| exportDialog.scopeGeneral | Scope option | `General members` |
| exportDialog.scopePaying | Scope option | `Paying members` |
| exportDialog.scopeEveryone | Scope option | `Everyone` |
| exportDialog.includeUnsubscribed | Checkbox label | `Include unsubscribed members` |
| exportDialog.counting | Count line, loading state | `Counting…` |
| exportDialog.countLine | Count line | `{n} person/people will be exported` |
| exportDialog.cancel | Dialog button | `Cancel` |
| exportDialog.download | Dialog button | `Download CSV` |
| exportDialog.preparing | Download button, pending state | `Preparing…` |
| exportDialog.downloadedToast | Toast on success | `Downloaded {filename}.` |
| exportDialog.errorToast | Toast on failure | `The export couldn't be created. Try again.` |
| panel.categoryGeneral | Panel header / Details tab category value | `General member` |
| panel.categoryPaying | Panel header / Details tab category value | `Paying member` |
| panel.categoryUnsubscribed | Panel header / Details tab category value | `Unsubscribed` |
| panel.copyEmailLabel | Panel header's copy button, aria-label | `Copy email` |
| panel.convertButton | Panel header primary button (general, subscribed) | `Convert to paying member` |
| panel.removeButton | Panel header primary button (paying) | `Remove paying access` |
| panel.tabsAriaLabel | Details/Emails tab list, aria-label | `{name} details` |
| panel.menuLabel | Panel `⋯` trigger, aria-label | `Actions for {name}` |
| panel.menuEdit | Panel `⋯` menu item | `Edit details` |
| panel.menuCopyEmail | Panel `⋯` menu item | `Copy email` |
| panel.menuUnsubscribe | Panel `⋯` menu item, danger | `Unsubscribe` |
| panel.menuRestore | Panel `⋯` menu item, disabled (unsubscribed) | `Restore email eligibility` |
| panel.restoreReason | Disabled reason tooltip for the above | `Turned off until SDC confirms its consent rules for resubscribing people.` |
| panel.tabDetails | Tab label | `Details` |
| panel.tabEmailsLoading | Tab label while the count is still loading | `Emails` |
| panel.tabEmails | Tab label once loaded | `Emails ({n})` |
| details.email | Details tab, read-only row label | `Email` |
| details.category | Details tab, read-only row label | `Category` |
| details.dateAdded | Details tab, read-only row label | `Date added` |
| editForm.ariaLabel | Edit form, aria-label | `Edit member` |
| editForm.nameLabel | Field label | `Name` |
| editForm.emailLabel | Field label | `Email` |
| editForm.cancel | Form button | `Cancel` |
| editForm.save | Form button | `Save` |
| confirm.revokeTitle | Confirm dialog title | `Remove paying access for {name}?` |
| confirm.revokeBody | Confirm dialog body | `Their paid benefits end now. They'll keep getting general emails, and we'll send them a notice.` |
| confirm.revokeCancel | Confirm dialog cancel button | `Keep paying access` |
| confirm.revokeConfirm | Confirm dialog confirm button | `Yes, remove paying access` |
| confirm.unsubscribeTitle | Confirm dialog title | `Unsubscribe {name}?` |
| confirm.unsubscribeBodyPaying | Confirm dialog body (paying member) | `This stops all emails to them and removes their paying access, now. Their record is kept, marked Unsubscribed.` |
| confirm.unsubscribeBodyGeneral | Confirm dialog body (general member) | `This stops all emails to them now. Their record is kept, marked Unsubscribed.` |
| confirm.unsubscribeCancel | Confirm dialog cancel button | `Keep subscribed` |
| confirm.unsubscribeConfirm | Confirm dialog confirm button | `Yes, unsubscribe` |
| emailsTab.expandAll | Toggle button above the email list | `Expand all` |
| emailsTab.collapseAll | Toggle button above the email list | `Collapse all` |
| emailsTab.bouncedBadge | Badge on a bounced email | `Bounced` |
| emailsTab.empty | Empty state, no emails sent | `No emails sent yet.` |
| emailsTab.loading | Loading state | `Loading emails…` |
| emailsTab.loadError | Error state | `Couldn't load this person's emails. Try again.` |
| emailsTab.previewTitle | Sandboxed preview iframe, title attribute | `Email preview: {subject}` |
| emailsTab.kindLabel | Email kind label shown per row | `Welcome` / `Paying welcome` / `Upgrade` / `Revoked` / `Opportunities` |
| toast.emailCopied | Toast after any "Copy email" action | `Email copied` |
| toast.done | Toast fallback if a server action sends no message | `Done.` |
