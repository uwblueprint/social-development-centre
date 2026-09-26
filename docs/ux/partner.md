# Partner portal UX: flows and copy

The single source for partner portal flows and UX copy, and for the **Opportunities** screens that both portals share. Admin-only Opportunities strings are in [admin.md](./admin.md#opportunities).

Edit the **Current text** column. Edits are applied back to code:
- **Opportunities screens:** `src/features/opportunities/copy.ts`.
- **Type names, topics and option labels:** `src/features/opportunities/catalog.ts`.
- **Date column text:** `src/features/opportunities/format.ts`.
- **Validation messages and toasts:** `src/features/opportunities/service.ts`. These are also the backend contract (see [backend/opportunities.md](../backend/opportunities.md)), so tell the backend owner when they change.
- **Partner shell, My account and Organization page:** `src/app/partner/_copy.ts`. Organization save messages: `src/app/admin/partners/_data/profile.ts` (shared with admin Partners) and `src/app/partner/organization/_data/actions.ts`.

`{name}`-style placeholders are filled in when the screen renders.

Every flow here follows the plan in [plan/opportunities-and-partner-portal.md](../plan/opportunities-and-partner-portal.md). Every product rule behind them is an unconfirmed assumption, listed in [decisions/opportunities.md](../decisions/opportunities.md).

## Shell

### Flows

#### Sign in from an invitation
1. Select the link in the invitation email. It works once, for 7 days.
2. The partner lands on **Opportunities** in their organization's portal.
3. If the link has expired or was replaced, the partner sees the sign-in page and asks SDC to resend.
- Do not show any sign-up option. Only SDC invites partners.

#### Navigate sections (desktop, 768px and wider)
1. The sidebar is always visible on the left. It shows the organization's name at the top, then two sections: Opportunities and Organization.
2. Select a section to open it. The selected row is highlighted and the page loads on the right.
- Do not add sidebar items for sub-areas. Use tabs inside the page.
- Accessibility:
  - The nav landmark's label is the portal name (see the copy table).
  - The selected row has `aria-current="page"`.

#### Navigate sections (mobile, under 768px)
1. The sidebar is hidden. A top bar shows a menu button and the organization's name.
2. Select the menu button to open the sidebar as a drawer, with a dimmed scrim behind it.
3. Select a section to go there and close the drawer. Press Escape or select the scrim to close it without navigating.
- Accessibility:
  - Menu button: "Open navigation".

#### Account menu
1. Select the profile row at the bottom of the sidebar (avatar, name and email).
2. A menu opens above it, with My account and Sign out.
3. Select Sign out to sign out and return to the sign-in page.
- Do not show a confirmation before signing out.
- Accessibility:
  - Profile button: "Account menu for {name}".

#### Access ends
1. If SDC removes the person, or removes the organization's access, the partner's next page load or action sends them to the sign-in page.
- Do not show the organization's data once access has ended, even in a tab that's already open.

### Copy

| Element | Current text | Notes |
|---|---|---|
| Sidebar header and mobile top bar | {organization name} | Keep. The partner's current organization name. |
| Brand mark | {organization initials} | Decorative. The first letters of the first two words. |
| Browser tab title | {page} · SDC Partner | Keep. |
| Nav landmark | Partner | Accessible label only. |
| Sidebar item | Opportunities | Keep. The same word as the admin portal. |
| Sidebar item | Organization | Keep. |
| Mobile menu button | Open navigation | Accessible label only. Shared with the admin portal (SidebarLayout). |
| Account menu button | Account menu for {name} | Accessible label only. Shared with the admin portal. |
| Account menu item | My account | Keep. Shared with the admin portal. |
| Account menu item | Sign out | Keep. Shared with the admin portal. |
| My account page heading | My account | Keep. The page is a placeholder for now. |
| My account page description | Your personal details and sign-in settings. | "Sign-in settings" promises something that doesn't exist yet (sign-in is by email link). Review when the page is built. |

## Organization

The rules behind this page are [decisions/opportunities.md](../decisions/opportunities.md) entries 8 and 9. Admins edit the same fields from Partners, with the same validation.

### Flows

#### Update organization details
1. Select Organization in the sidebar.
2. Under Profile, edit the Organization name, Website or Short description.
3. Select Save changes.
   - On success, show the toast "Changes saved." The new name updates the sidebar and every listing at once.
   - On a field error, show the message under the field, keep what they typed, and show "Check the highlighted field." (or "fields") as a toast.
- Organization name is required and must be unique among organizations. Website is optional but must start with https://. Short description is optional, up to 280 characters.
- Do not show a confirmation before saving.
- If the session has ended or the organization's access was removed, show the message and save nothing.

#### View the team
1. Select Organization in the sidebar.
2. Under Team, list every current contact at the organization, with name and email. Anyone who hasn't accepted their invitation yet shows Invitation pending.
- The team is read-only. Do not show invite, edit or remove controls. The note under the heading points partners to SDC.
- Accessibility:
  - The team is a list (role="list"), one item per person.
  - Invitation pending is text, never color alone.

### Copy

| Element | Current text | Notes |
|---|---|---|
| Page heading | Organization | Keep. Matches the sidebar item. |
| Page description | How your organization appears to the SDC community. | Keep. |
| Section heading | Profile | Keep. |
| Field label | Organization name | Keep. The same label as the admin Partners panel. |
| Field label | Website | Keep. |
| Website hint | Starts with https:// | "https://" is technical. Review together with the opportunity link hint. |
| Website placeholder | https://example.org | Keep. An example, not the label. |
| Field label | Short description | Keep. The same term as the opportunity field. |
| Short description hint | One or two sentences about what your organization does. Up to 280 characters. | Keep. |
| Save button | Save changes | Keep. The same label as the opportunity form. |
| Success toast | Changes saved. | Keep. The same as Partners and Opportunities. |
| Toast, one field error | Check the highlighted field. | Opportunities say "Fix the highlighted fields to…". Review: use one phrasing. |
| Toast, several field errors | Check the highlighted fields. | See above. |
| Field error, name empty | Enter the organization's name. | Keep. |
| Field error, name taken | Another organization already has this name. | Keep. |
| Field error, website | Enter a web address that starts with https://, like https://example.org. | The opportunity link error says "Enter a full link that starts with https://". Review: "web address" or "link", one term. |
| Field error, description too long | Shorten the description to 280 characters or fewer. | Opportunities say "Keep the description to 280 characters." Review: one phrasing. |
| Error, signed out | Your session ended. Sign in again to save changes. | "Session" is a technical term. Suggest "You've been signed out. Sign in again to save changes." |
| Error, access removed | Your organization's access has ended. Contact SDC if this is a mistake. | Keep. |
| Section heading | Team | Keep. |
| Team note | SDC manages who has access. To add or remove someone, contact your SDC coordinator. | Keep. |
| Label on a contact who hasn't accepted | Invitation pending | Admin Partners shows "Pending". Keep here; "Invitation pending" says what's pending. |

## Opportunities (both portals)

The same list, panel and form serve `/admin/opportunities` and `/partner/opportunities`. Partners never see the Organization column, filter or picker, and every screen is scoped to their own organization.

### Flows

#### Find an opportunity
1. Select Opportunities in the sidebar. The Live tab opens.
2. Select a tab: Live, Drafts or Closed. Each tab shows its count.
3. To narrow the list:
   - Type in the search field, then press Enter or select its search button. It matches the title or the organization name.
   - Select the field's clear button to clear the search.
   - Choose a Type (and, for admins, an Organization).
4. Select a row to open its details in the side panel (a drawer on mobile).
- Do not search while the person types. Search runs on Enter or the search button.
- Counts on the tabs follow the search and filters.
- If nothing matches, show the No matches empty state with Clear filters. If a tab is empty without filters, show that tab's empty state.
- There's no status column. The tab is the status. On the Closed tab, each row says whether it Ended or was Closed.
- Accessibility:
  - Search button: "Search". Clear button: "Clear search".
  - The type icon is decorative and always sits next to the type name.
  - The table has the caption "Opportunities".

#### Create an opportunity
1. Select New opportunity, then choose a type from the menu (Event, Petition, Volunteer role, Job, Other).
2. The form opens as a full page titled "New {type}", with a Basics section and the type's own section.
3. Fill in the fields and select Publish.
   - On success, show the toast "Published. The {type} is now live." and return to the list.
   - On errors, show each message under its field and the toast "Fix the highlighted fields to publish."
- Publish, Save as draft and Cancel sit in a sticky footer. Publish is the one primary action.
- Show Location only when the format isn't Online or Remote. Show Cost details only when Cost is Paid.
- Do not show a confirmation before publishing. There's no review step (decision 2).
- Accessibility:
  - The menu button's accessible name comes from its visible text; the menu is labelled "Choose a type".
  - Every field has a visible label; hints are linked to their field.

#### Save a draft
1. In the form, select Save as draft.
2. Only a title is required. Anything else that's filled in must still be valid.
3. On success, show "Draft saved." The draft appears on the Drafts tab.
- Do not show a confirmation. Drafts are never visible to members.

#### Edit an opportunity
1. Open the panel and select Edit.
2. The form opens titled "Edit {type}", with the current values.
3. Select Save changes (live or closed listings), or Publish or Save as draft (drafts).
   - On success, show "Changes saved." or the published toast, and return to the tab the listing is now on.
- Save changes keeps the status. Editing a closed listing's date doesn't reopen it; select Reopen afterwards.
- The type can't change when editing.
- Do not show a confirmation before saving.

#### Leave the form with unsaved changes
Not built yet. The strings exist in copy.ts, but Cancel currently leaves without asking.
1. Select Cancel or the Opportunities back link after changing something.
2. Show the dialog "Leave without saving?" with Leave and Keep editing.
- Do not show the dialog when nothing has changed.
- Keep editing is the default focus.

#### Duplicate
1. In the panel, select More actions, then Duplicate.
2. A new draft titled "Copy of {title}" is created and its edit page opens. Show "Duplicated as a draft."
- Do not show a confirmation before duplicating. It only creates a draft.

#### Close
1. In the panel, select More actions, then Close.
2. The listing moves to the Closed tab. Show "Closed. It won't appear in emails or the feed."
- Do not show a confirmation before closing. Reopen undoes it.
- Offer Close on live listings only, and Reopen on closed ones. Drafts offer neither.

#### Reopen
1. On the Closed tab, open the panel and select More actions, then Reopen.
2. On success it moves to Live. Show "Reopened. It's live again."
3. If its date has passed, show "This {type} has already ended. Edit its date to reopen it." and leave it closed. The partner edits the date, selects Save changes, then Reopen.

#### Delete
1. In the panel, select More actions, then Delete.
2. Show the confirmation "Delete this {type}?" with Delete and Cancel.
3. On confirm, remove it, close the panel and show "Deleted “{title}”."
- Always confirm before deleting. It can't be undone.
- The confirmation points people to Close instead.
- Cancel is the default focus. Delete uses the danger style.

#### Open a listing that's gone or belongs to another organization
1. Opening an edit page for a deleted listing, or for another organization's listing (partners), shows Opportunity not found with Back to opportunities.
- Do not say which case it is. Partners must not learn that another organization's listing exists.

#### Open the link
1. In the panel, select More actions, then Open link. It's only offered when the listing has a link.
2. The external page opens in a new tab.
- Accessibility:
  - Say that it opens in a new tab (for example, visually hidden text).

### Opportunities copy

#### List page

| Element | Current text | Notes |
|---|---|---|
| Page heading | Opportunities | Keep. |
| Page description (partner portal) | What your organization shares with the SDC community. | Keep. The admin description is in admin.md. |
| New button | New opportunity | Keep. |
| New menu label | Choose a type | Accessible label only. |
| New menu items | Event · Petition · Volunteer role · Job · Other | From catalog.ts. "Other" is vague on its own; review after the 29 September types session. |
| Tab | Live | Keep. |
| Tab | Drafts | Keep. |
| Tab | Closed | Keep. Includes Ended listings. |

#### Toolbar

| Element | Current text | Notes |
|---|---|---|
| Search field label | Search opportunities | Accessible label only. |
| Search field placeholder | Search by title or organization | Review: partners only see their own organization, so "Search by title" fits the partner portal. |
| Search button | Search | Accessible label only (SearchField default). |
| Clear search button | Clear search | Accessible label only (SearchField default). |
| Type filter label | Type | Keep. |
| Type filter, no filter | All types | Keep. |

#### Table

| Element | Current text | Notes |
|---|---|---|
| Table caption | Opportunities | Accessible label only. |
| Column header | Opportunity | Keep. Shows the icon, title, and type name as text. |
| Column header | Date | Keep. |
| Column header | Updated | Keep. |
| Row label, ended listing | Ended | Keep. The date passed on its own. |
| Row label, closed listing | Closed | Keep. Someone closed it. |
| Row label, draft | Draft | Keep. |

#### Date column

From format.ts. `{date}` reads like "Thu, Oct 8" this year or "Oct 8, 2027" otherwise; times read like "6:30 p.m.".

| Element | Current text | Notes |
|---|---|---|
| Event with date and time | {date} · {time} | Keep. |
| Event with no date (draft) | No date yet | Keep. |
| Petition or Other with deadline | Closes {date} | Keep. The form calls this "Deadline"; "Closes" says what happens. |
| Petition or Other, no deadline | No deadline | Keep. |
| Volunteer role or Job with apply-by date | Apply by {date} | Keep. Matches the field label. |
| Volunteer role, no apply-by date | One-time / Ongoing | Keep. Shows the commitment instead. |
| Job, no apply-by date | Open until filled | Keep. |

#### Empty states

| Element | Current text | Notes |
|---|---|---|
| Live tab empty, title | Nothing live right now | Keep. |
| Live tab empty, body | Publish an opportunity and it will show up here. | Keep. |
| Drafts tab empty, title | No drafts | Keep. |
| Drafts tab empty, body | Drafts you save show up here. Only people who can edit see them. | Keep. |
| Closed tab empty, title | Nothing closed yet | Keep. |
| Closed tab empty, body | Opportunities move here when their date passes or someone closes them. | Keep. |
| No search results, title | No matches | Keep. |
| No search results, body | Try a different search or clear the filters. | Keep. |
| No search results, button | Clear filters | Keep. |

#### Side panel

| Element | Current text | Notes |
|---|---|---|
| Status label | Live / Draft / Ended / Closed | Keep. Always text, never color alone. |
| Primary button | Edit | Keep. The panel's one primary action. |
| More actions button | More actions | Accessible label only (⋯ icon). |
| Menu item | Open link | Keep. |
| Menu item | Duplicate | Keep. |
| Menu item (live) | Close | Review: the panel's own × button is also labelled "Close" (Sheet default), so a screen reader hears "Close" for two different things. Suggest "Close opportunity" here, or "Close panel" on the × button. |
| Menu item (closed) | Reopen | Keep. |
| Menu item | Delete | Keep. Danger style. |
| Detail label | Posted by | Keep. The organization. |
| Detail label | Topics | Keep. |
| Detail label | Link | Keep. |
| Last updated line | Updated {when} by {who} | Keep. |
| Empty description | No description yet. | Keep. Drafts only. |
| Empty optional field | Not set | Keep. |
| Panel close button | Close | Accessible label only (Sheet default). See the Close menu item note. |

#### Delete confirmation

| Element | Current text | Notes |
|---|---|---|
| Dialog title | Delete this {type}? | {type} is lower case: event, petition, volunteer role, job, opportunity. |
| Dialog body | It will be removed for everyone and can't be restored. To take it out of emails but keep the record, close it instead. | Keep. |
| Confirm button | Delete | Keep. Danger style. |
| Cancel button | Cancel | Keep. |

#### Form: page and footer

| Element | Current text | Notes |
|---|---|---|
| Page heading (new) | New {type} | For Other, this reads "New opportunity", the same as the New button. Review: "New opportunity (other)" or a clearer name for Other. |
| Page heading (edit) | Edit {type} | Keep. |
| Back link | Opportunities | Keep. |
| Primary button (new or draft) | Publish | Keep. |
| Primary button (live or closed) | Save changes | Keep. |
| Secondary button | Save as draft | Keep. Shown only for new listings and drafts. |
| Tertiary button | Cancel | Keep. |
| Section heading | Basics | Keep. |
| Section heading (Event) | Date and place | Keep. |
| Section heading (Petition) | Petition details | Keep. |
| Section heading (Volunteer role) | Role details | Keep. |
| Section heading (Job) | Job details | Keep. |
| Section heading (Other) | Details | Keep. The custom details field inside it is also called "Details"; review. |

#### Form: Basics

| Element | Current text | Notes |
|---|---|---|
| Field label | Title | Keep. |
| Title hint | Say what it is in a few words. This is the email headline. | Keep. Limit 100 characters. |
| Field label | Short description | Keep. |
| Short description hint | One or two sentences for the email. Full details stay on your page. | For admins posting as SDC, "your page" is SDC's own page; keep. Limit 280 characters. |
| Field label | Topics | Keep. |
| Topics hint | Choose up to 3. We send it to people who care about these. | "We" means SDC; fine for partners. For admins, review "SDC sends it…". |
| Link label (Event) | Registration link | Keep. |
| Link label (Petition) | Petition link | Keep. |
| Link label (Volunteer role) | Sign-up link | Keep. |
| Link label (Job) | Application link | Keep. |
| Link label (Other) | Link | Keep. |
| Link hint | Where people go to take part. Starts with https:// | "https://" is technical. Suggest "Copy the full web address from your browser." Keep the error message consistent with whatever you choose. |

#### Form: Event (Date and place)

| Element | Current text | Notes |
|---|---|---|
| Field label | Date | Keep. |
| Field label | Start time | Keep. |
| Field label | End time | Keep. Optional. |
| Field label | How people attend | Keep. |
| Options | In person / Online / Hybrid | Events say "Online"; volunteer roles and jobs say "Remote". Review whether to use one term. |
| Field label | Location | Keep. Hidden when Online. |
| Location hint | Address or venue name. | Keep. |
| Field label | Cost | Keep. |
| Options | Free / Paid | Keep. |
| Field label | Cost details | Keep. Shown when Paid. |
| Cost details hint | For example, “$10, pay what you can”. | Keep. |
| Field label | Accessibility | Keep. |
| Accessibility hint | Step-free access, ASL, childcare, quiet space. Leave blank if you're not sure. | Keep. |

#### Form: Petition (Petition details)

| Element | Current text | Notes |
|---|---|---|
| Field label | Addressed to | Keep. |
| Addressed to hint | Who you're asking, for example “Region of Waterloo Council”. | Keep. |
| Field label | Deadline | Keep. |
| Deadline hint | Optional. It closes after this day. | Keep. |
| Field label | Signature goal | Keep. |
| Signature goal hint | Optional. | Keep. |

#### Form: Volunteer role (Role details)

| Element | Current text | Notes |
|---|---|---|
| Field label | Commitment | Keep. |
| Options | One-time / Ongoing | Keep. |
| Field label | Where volunteers work | Keep. |
| Options | In person / Remote / Hybrid | See the Event format note. |
| Field label | Location | Keep. Hidden when Remote. |
| Location hint | Address or neighbourhood. | Keep. |
| Field label | Start date | Keep. |
| Start date hint | Optional. | Keep. |
| Field label | Time commitment | Keep. |
| Time commitment hint | For example, “2 hours a week”. | Optional, but the hint doesn't say so. Suggest adding "Optional." for consistency. |
| Field label | Skills or experience | Keep. |
| Skills hint | Optional. Leave blank if anyone can help. | Keep. |
| Field label | Minimum age | Keep. |
| Minimum age hint | Optional. | Keep. |
| Field label | Apply by | Keep. |
| Apply by hint | Optional. It closes after this day. | Keep. |

#### Form: Job (Job details)

| Element | Current text | Notes |
|---|---|---|
| Field label | Employment type | Keep. |
| Employment type placeholder | Choose one | Keep. Also used by the admin Organization picker. |
| Options | Full-time / Part-time / Contract / Temporary / Internship | Keep. |
| Field label | Workplace | Keep. |
| Options | On-site / Remote / Hybrid | Events say "In person" for the same idea. Review. |
| Field label | Location | Keep. Hidden when Remote. |
| Location hint | City or address. | Keep. |
| Field label | Pay | Keep. |
| Pay hint | For example, “$22–25 an hour”. Including pay gets more applicants. | Optional, but the hint doesn't say so. Keep the nudge. |
| Field label | Apply by | Keep. |
| Apply by hint | Optional. It closes after this day. | Keep. |
| Field label | Qualifications | Keep. |
| Qualifications hint | Optional. Must-haves only. | Keep. |

#### Form: Other (Details)

| Element | Current text | Notes |
|---|---|---|
| Field label | Call to action | Marketing jargon. Suggest "Button text". |
| Call to action hint | The button people see, for example “Take the survey”. | Keep. |
| Field label | Deadline | Keep. |
| Deadline hint | Optional. It closes after this day. | Keep. |
| Field label | Details | Same word as the section heading. Suggest "Extra details". |
| Details hint | Optional. Add up to 5, like “Time needed: 5 minutes”. | Keep. |
| Detail row field label | Label | Slightly technical. Suggest "Name" (for example "Time needed"). |
| Detail row field label | Value | Technical. Suggest "Detail" (for example "5 minutes"). |
| Add button | Add detail | Keep. Hidden at 5. |
| Remove button | Remove detail {n} | Accessible label only (icon button). |

#### Form: leaving with unsaved changes

| Element | Current text | Notes |
|---|---|---|
| Dialog title | Leave without saving? | Not used yet (dialog not built). |
| Dialog body | Your changes to this opportunity will be lost. | Keep. |
| Confirm button | Leave | Keep. |
| Cancel button | Keep editing | Keep. Default focus. |

#### Not found

| Element | Current text | Notes |
|---|---|---|
| Heading | Opportunity not found | Keep. |
| Body | It may have been deleted, or it belongs to another organization. | Keep. Doesn't reveal which. |
| Link | Back to opportunities | Keep. |

#### Topics

From catalog.ts. A placeholder list until the 29 September taxonomy session. The IDs stay the same if labels change.

| Element | Current text | Notes |
|---|---|---|
| Topic | Housing and homelessness | Placeholder. |
| Topic | Food security | Placeholder. |
| Topic | Income and poverty | Placeholder. |
| Topic | Newcomers and refugees | Placeholder. |
| Topic | Environment and climate | Placeholder. |
| Topic | Health and wellbeing | Placeholder. |
| Topic | Accessibility and disability | Placeholder. |
| Topic | Arts and culture | Placeholder. |
| Topic | Civic participation | Placeholder. |
| Topic | Youth | Placeholder. |
| Topic | Seniors | Placeholder. |

#### Validation messages

From service.ts. Each one appears under its field; the form-level message appears as a toast.

| Element | Current text | Notes |
|---|---|---|
| Toast, publish or save changes with errors | Fix the highlighted fields to publish. | Also shown for Save changes on a live listing. Review: "…to save" reads better there. |
| Toast, save as draft with errors | Fix the highlighted fields to save. | Keep. |
| Form error, missing or inaccessible listing | This opportunity no longer exists, or you can't edit it. Go back to the list. | Keep. |
| Form error, no type | Choose a type of opportunity. | Keep. Rare (bad link). |
| Title, empty | Enter a title. | Keep. |
| Title, too long | Keep the title to 100 characters. | Keep. |
| Short description, empty | Add a short description. | Keep. |
| Short description, too long | Keep the description to 280 characters. | Say "short description" to match the label. |
| Topics, none | Choose at least one topic. | Keep. |
| Topics, too many | Choose up to 3 topics. | Keep. |
| Link, empty | Add the link where people take action. | The hint says "take part"; use one phrase. |
| Link, invalid | Enter a full link that starts with https:// | See the link hint note. |
| Any date, wrong format | Enter a date like 2026-10-08. | Technical format. Review if the date picker lets people type; suggest "Enter a date like Oct 8, 2026." |
| Date passed on publish (event) | This date and time has passed. Choose a future date. | Keep. |
| Date passed on publish (other types) | This date has passed. Choose a future date or clear it. | Keep. |
| Event date, empty | Choose the event date. | Keep. |
| Start time, empty | Enter a start time. | Keep. |
| Any time, wrong format | Enter a time like 18:30. | 24-hour, but the list shows "6:30 p.m.". Suggest "Enter a time like 6:30 p.m." |
| End time before start | End time must be after the start time. | Keep. |
| Event format, empty | Choose how people attend. | Keep. |
| Event location, empty | Enter where it's happening. | Keep. |
| Cost details, empty when Paid | Say what it costs, for example “$10, pay what you can”. | Keep. |
| Addressed to, empty | Say who the petition is addressed to. | Keep. |
| Signature goal, not a whole number | Enter a whole number, like 500. | Keep. |
| Commitment, empty | Choose one-time or ongoing. | Keep. |
| Volunteer format, empty | Choose where volunteers work. | Keep. |
| Volunteer location, empty | Enter where volunteers go. | Keep. |
| Minimum age, not a whole number | Enter an age in years, like 16. | Keep. |
| Employment type, empty | Choose the employment type. | Keep. |
| Workplace, empty | Choose where the work happens. | Keep. |
| Job location, empty | Enter the city or address. | Keep. |
| Call to action, empty | Enter what people should do, like “Take the survey”. | Keep. |
| Detail label missing | Add a label, or clear this detail. | Update if "Label" is renamed. |
| Detail value missing | Add a value, or clear this detail. | Update if "Value" is renamed. |
| Too many details | Keep it to 5 details. | Keep. |

#### Toasts and result messages

From service.ts.

| Element | Current text | Notes |
|---|---|---|
| Draft saved | Draft saved. | Keep. |
| Published (new, or a draft) | Published. The {type} is now live. | Keep. |
| Saved a live or closed listing | Changes saved. | Also shown when publishing a closed listing, which reopens it. Review. |
| Closed | Closed. It won't appear in emails or the feed. | "The feed" doesn't exist yet and partners won't know it. Suggest "Closed. It won't appear in SDC emails." |
| Reopened | Reopened. It's live again. | Keep. |
| Reopen refused, date passed | This {type} has already ended. Edit its date to reopen it. | Keep. |
| Duplicated | Duplicated as a draft. | Keep. |
| Deleted | Deleted “{title}”. | Keep. |
| Close, reopen, duplicate or delete on a missing listing | This opportunity no longer exists. | Keep. |
