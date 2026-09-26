# Admin UX: Shell and Partners

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
