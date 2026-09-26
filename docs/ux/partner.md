# Partner UX: flows and copy

How the partner portal works and what it says, including the Opportunities screens both portals share.

Edit the **Current text** column to update product copy. Strings live in `src/app/partner/_copy.ts` (shell nav and sidebar tooltips, My account, Organization and Team), `src/components/patterns/Sidebar.tsx` (menu buttons and account menu, shared with the admin portal), `src/features/opportunities/copy.ts` (Opportunities screens), `src/features/opportunities/catalog.ts` (type names, topics and options), `src/features/opportunities/format.ts` (Date column), `src/features/opportunities/service.ts` (Opportunities validation messages and toasts), `src/app/admin/partners/_data/profile.ts` and `src/app/admin/partners/_data/contacts.ts` (Organization and Team messages, shared with admin Partners) and `src/app/partner/organization/_data/actions.ts` (partner-only Organization and Team messages).

Messages in `service.ts`, `profile.ts`, `contacts.ts` and `actions.ts` are also the backend contract ([backend/opportunities.md](../backend/opportunities.md)), so tell the backend owner when they change. `{name}` parts are filled in on screen. Admin-only Opportunities strings are in [admin.md](./admin.md). The product rules behind these flows are in [decisions/opportunities.md](../decisions/opportunities.md) and [decisions/partners.md](../decisions/partners.md).

## Shell

### Flows

#### Sign in
1. Select the link in the invitation or sign-in email.
2. The portal opens on **Opportunities** for the person's organization.
- Do not show a sign-up option. Only SDC or a colleague at the organization invites partners.

#### Navigate sections (desktop, 768px and wider)
1. The sidebar is always visible on the left. It shows the organization's name at the top, then **Opportunities** and **Organization**.
2. Select a section to open it. The selected row is highlighted and the page loads on the right.
3. Hover over or tab to a section and wait a moment. A tooltip to the right says what the section is for.
- Do not add sidebar items for sub-areas. Use tabs inside the page.
- Wait 600ms before showing a section's tooltip, on hover and on keyboard focus. Do not pin it on click. A click opens the section and closes the tooltip.
- Pages have no description under the heading. The sidebar tooltip replaces it.
- Accessibility:
  - Nav landmark: `aria-label="Partner"`
  - Selected row: `aria-current="page"`
  - Brand mark (initials): `aria-hidden="true"`

#### Navigate sections (mobile, under 768px)
1. The sidebar is hidden. A top bar shows the menu button and the organization's name.
2. Tap the menu button to open the sidebar as a drawer over a dimmed page. Focus moves to the drawer's close button.
3. Tap a section to go there and close the drawer.
4. To close without navigating, do one of:
   - Tap the close button.
   - Tap the dimmed page.
   - Press Escape.
- When the drawer closes, return focus to the menu button.
- Do not let people reach the page behind the open drawer.
- Widening the window past 768px closes the drawer.
- Accessibility:
  - Closed menu button: `aria-label="Open menu"`, with `aria-expanded` and `aria-controls` pointing to the sidebar
  - Drawer close button: `aria-label="Close menu"`

#### Account menu
1. Select the profile button at the bottom of the sidebar (avatar, name and email).
2. A menu opens above it with **My account** and **Sign out**.
3. Select **My account** to open the My account page.
4. Select **Sign out** to sign out.
- Do not show a confirmation before signing out.
- Accessibility:
  - Profile button: `aria-label="Account menu for {name}"`

#### Access ends
1. If the person is removed, or SDC removes the organization's access, their next page load sends them to the sign-in page.
2. Saving on the Organization page, or changing the team, shows "Your organization's access has ended. Contact SDC if this is a mistake." and saves nothing.
- Do not show the organization's data once access has ended.

### Copy

| Element | Current text | Notes |
|---|---|---|
| Sidebar header and mobile top bar | {organization name} | Keep. Updates when the organization is renamed. |
| Brand mark | {organization initials} | Keep. First letters of the first two words. Hidden from screen readers. |
| Browser tab title | {page} · SDC Partner | Keep. |
| Browser tab title, no page title | SDC Partner | Keep. |
| Nav landmark | Partner | Accessible label only |
| Sidebar item | Opportunities | Keep. Same word as the admin portal. |
| Sidebar item | Organization | Keep. |
| Sidebar tooltip, Opportunities | What your organization shares with the SDC community. | New, needs approval. Was the Opportunities page description. |
| Sidebar tooltip, Organization | Your organization's profile and team. | New, needs approval. |
| Mobile menu button | Open menu | Accessible label only. Shared with the admin portal. |
| Mobile drawer close button | Close menu | Accessible label only. Shared with the admin portal. |
| Account menu button | Account menu for {name} | Accessible label only. Shared with the admin portal. |
| Account menu item | My account | Keep. Shared with the admin portal. |
| Account menu item | Sign out | Keep. Shared with the admin portal. |
| My account page heading | My account | Keep. The page is a placeholder. |
| My account page description | Your personal details and sign-in settings. | Review: there are no sign-in settings; sign-in is by email link. |

## Opportunities (shared by both portals)

The same list, panel and form serve `/admin/opportunities` and `/partner/opportunities`. Partners see only their own organization's listings and never see the Organization column, filter or form field.

### Flows

#### Find an opportunity
1. Select **Opportunities** in the sidebar. The **Live** tab opens.
2. Select a tab: **Live**, **Drafts** or **Closed**. Each tab shows its count, for example "Live (4)".
3. To narrow the list:
   - Type in the search field to the right of the tabs. Results update 300ms after the last keystroke. Press Enter to search straight away. It matches the title or the organization's name.
   - While results load, a spinner replaces the search icon.
   - Select the clear button to clear the search.
   - Choose a type from **Type**, above the table.
4. Select a row to open the side panel.
- The search field has no visible label, only the search icon and the placeholder. Do not add a search button.
- Searching doesn't add browser history entries. If an older search returns after a newer one, ignore it.
- Tab counts follow the search and the Type filter.
- Sort Live by soonest date, with undated listings last. Sort Drafts and Closed by most recently updated.
- Do not show a status column. The tab is the status.
  - On Closed, each row has a badge: **Ended**, **Closed** or **Partner removed**.
  - On Live, a removed partner's rows have the badge **No longer emailed**.
- If nothing matches, show **No matches** with **Clear filters**. If a tab is empty with no search or filter, show that tab's empty state.
- While the page loads, show the heading and placeholder rows.
- Accessibility:
  - Tab list: `aria-label="Opportunities"`
  - Table: `aria-label="{tab}"`, for example `aria-label="Live"`
  - Search: a `role="search"` landmark; the field has `aria-label="Search opportunities"`
  - Clear button: `aria-label="Clear search"`
  - Loading page: `aria-busy="true"`
  - The type icon is decorative and always sits next to the type name.

#### View an opportunity
1. Select a row. The side panel opens and focus moves to the panel.
2. The panel shows:
   - The title, status badge, and type.
   - **Short description**, **Posted by**, **Topics** and the type's link.
   - Every other field that's filled in, in form order.
   - "Updated {when} by {who}".
3. Select **Edit** to open the form, or **More actions** for everything else.
- **Edit** is the panel's one primary action.
- Every item in the **More actions** menu has an icon. **Delete** sits below a separator.
- Show the status as text, never color alone.
- For a removed partner's live listing, show **No longer emailed** and the note saying until when people can still see it.
- Accessibility:
  - More actions button: `aria-label="More actions"`
  - Panel close button: `aria-label="Close panel"`

#### Create an opportunity
1. Select **New opportunity** at the top right, then choose a type: **Event**, **Petition**, **Volunteer role**, **Job** or **Other**. Each type shows its icon.
2. The form opens as a full page titled "New {type}", with a **Basics** section and the type's own section.
3. Fill in the fields and select **Publish**.
   - On success, show the toast "Published. The {type} is now live." and open the Live tab.
   - On errors, show each message under its field, show the toast "Fix the highlighted fields to publish." and move focus to the first field with an error.
- **Publish**, **Save as draft** and **Cancel** sit in a footer that stays on screen. **Publish** is the one primary action.
- **Cancel** and the **Opportunities** back link return to the list.
- Show **Location** unless the listing is Online (events) or Remote (volunteer roles and jobs).
- Show **Cost details** only when **Cost** is Paid. **Cost** starts on Free.
- Title and Short description show how many characters are left.
- A listing can't be published with a date that has already passed.
- Do not show a confirmation before publishing. There's no review step (opportunities decision 2).
- Accessibility:
  - Required fields show "(required)" next to the label.
  - Hints and character counts are linked to their field.
  - Choice buttons (for example **How people attend**): `aria-label="{field label}"`
  - Topics group: `aria-label="Topics"`; each topic is a toggle button with a check when selected.

#### Save a draft
1. In the form of a new listing or a draft, select **Save as draft**.
2. Only **Title** is required. Anything else that's filled in must still be valid.
3. On success, show "Draft saved." and open the Drafts tab.
   - On errors, show the toast "Fix the highlighted fields to save."
- Do not show a confirmation. Members never see drafts.

#### Edit an opportunity
1. Open the panel and select **Edit**.
2. The form opens titled "Edit {type}", filled in with the current values.
3. Select the primary button:
   - Drafts: **Publish** or **Save as draft**.
   - Live and closed listings: **Save changes**. The listing keeps its status.
4. On success, show "Changes saved." (or the Published toast) and open the tab the listing was on.
- The type can't change.
- A listing someone closed stays closed after **Save changes**. Select **Reopen** afterwards.
- An Ended listing goes live again once its date is moved forward and saved.
- Do not show a confirmation before saving.

#### Duplicate
1. In the panel, select **More actions**, then **Duplicate**.
2. Create a draft titled "Copy of {title}", show "Duplicated as a draft." and open its edit page.
- Do not show a confirmation. It only creates a draft.

#### Close
1. In the panel of a live listing, select **More actions**, then **Close**.
2. The listing moves to the Closed tab. Show "Closed. It won't appear in emails or the feed."
- Do not show a confirmation before closing. **Reopen** undoes it.
- Offer **Close** on live listings only and **Reopen** on closed ones. Drafts offer neither.

#### Reopen
1. In the panel of a closed listing, select **More actions**, then **Reopen**.
2. On success, the listing moves to Live. Show "Reopened. It's live again."
   - If its date has passed, show "This {type} has already ended. Edit its date to reopen it." and leave it closed.
   - If the partner was removed and the listing is past its cutoff, show "This partner was removed. Reinvite the partner before reopening its opportunities."

#### Delete
1. In the panel, select **More actions**, then **Delete**.
2. Show the confirmation "Delete this {type}?" with **Delete** and **Cancel**.
3. Select **Delete** to remove it, close the panel and show "Deleted “{title}”."
- Always confirm before deleting. It can't be undone.
- The confirmation points people to Close instead.
- **Cancel** has focus when the confirmation opens. **Delete** uses the danger style.

#### Open the link
1. In the panel, select **More actions**, then **Open link**. It's offered only when the listing has a link.
2. The page opens in a new tab.
- The link in the panel's details also opens in a new tab.

#### Open a listing that's gone or belongs to another organization
1. Opening the edit page of a deleted listing, or of another organization's listing, shows **Opportunity not found** with **Back to opportunities**.
2. An action on a listing that no longer exists shows "This opportunity no longer exists."
- Do not say which case it is. Partners must not learn that another organization's listing exists.

### Copy

#### List page

| Element | Current text | Notes |
|---|---|---|
| Page heading | Opportunities | Keep. |
| New button | New opportunity | Keep. Opens the type menu. |
| New menu heading | Choose a type | Keep. |
| New menu item | Event | Keep. From catalog.ts. |
| New menu item | Petition | Keep. |
| New menu item | Volunteer role | Keep. |
| New menu item | Job | Keep. |
| New menu item | Other | Review: vague on its own. Revisit after the 29 September types session. |
| Tab | Live | Keep. |
| Tab | Drafts | Keep. |
| Tab | Closed | Keep. Includes Ended listings. |
| Tab count | ({count}) | Keep. |

#### Toolbar

| Element | Current text | Notes |
|---|---|---|
| Search field | Search opportunities | Accessible label only. There's no visible label. |
| Search field placeholder | Search by title or organization | Review: partners only see their own organization, so "Search by title" fits the partner portal. |
| Clear search button | Clear search | Accessible label only. Kit default. |
| Type filter label | Type | Keep. Above the table. |
| Type filter, no filter | All types | Keep. |

#### Table

| Element | Current text | Notes |
|---|---|---|
| Table name | Opportunities | Review: unused. The table is named after its tab (Live, Drafts or Closed). |
| Column header | Opportunity | Keep. Shows the icon, title and type name. |
| Column header | Date | Keep. |
| Column header | Updated | Keep. Reads like "2:14 p.m." today, "Sep 24" this year, "Sep 24, 2025" otherwise. |
| Closed tab badge, date passed | Ended | Keep. |
| Closed tab badge, someone closed it | Closed | Keep. |
| Draft label | Draft | Review: unused. Drafts are on their own tab. |

#### Date column

From format.ts. {date} reads like "Thu, Oct 8" this year or "Oct 8, 2027" otherwise. {time} reads like "6:30 p.m.".

| Element | Current text | Notes |
|---|---|---|
| Event with date and start time | {date} · {time} | Keep. Without a start time, only {date}. |
| Event with no date | No date yet | Keep. Drafts only. |
| Petition or Other with a deadline | Closes {date} | Keep. The form says "Deadline"; "Closes" says what happens. |
| Petition or Other with no deadline | No deadline | Keep. |
| Volunteer role or Job with an apply-by date | Apply by {date} | Keep. Matches the field label. |
| Volunteer role with no apply-by date, one-time | One-time | Keep. |
| Volunteer role with no apply-by date, ongoing | Ongoing | Keep. Also shown when no commitment is set. |
| Job with no apply-by date | Open until filled | Keep. |

#### Empty states

| Element | Current text | Notes |
|---|---|---|
| Live tab empty title | Nothing live right now | Keep. |
| Live tab empty body | Publish an opportunity and it will show up here. | Keep. |
| Drafts tab empty title | No drafts | Keep. |
| Drafts tab empty body | Drafts you save show up here. Only people who can edit see them. | Keep. |
| Closed tab empty title | Nothing closed yet | Keep. |
| Closed tab empty body | Opportunities move here when their date passes or someone closes them. | Keep. |
| No results title | No matches | Keep. |
| No results body | Try a different search or clear the filters. | Keep. |
| No results button | Clear filters | Keep. |

#### Side panel

| Element | Current text | Notes |
|---|---|---|
| Status badge | Live | Keep. |
| Status badge | Draft | Keep. |
| Status badge | Ended | Keep. |
| Status badge | Closed | Keep. |
| Primary button | Edit | Keep. |
| More actions button | More actions | Accessible label only |
| Menu item | Open link | Keep. |
| Menu item | Duplicate | Keep. |
| Menu item, live listing | Close | Keep. The panel's own close button now says "Close panel". |
| Menu item, closed listing | Reopen | Keep. |
| Menu item | Delete | Keep. Danger style. |
| Detail label | Short description | Keep. Same as the form. |
| Detail label | Posted by | Keep. The organization's current name. |
| Detail label | Topics | Keep. |
| Detail label, link | Registration link / Petition link / Sign-up link / Application link / Link | Keep. Same as the form, by type. |
| Last updated line | Updated {when} by {who} | Keep. |
| Empty short description | No description yet. | Keep. Drafts only. |
| Empty topics or link | Not set | Keep. |
| Panel close button | Close panel | Accessible label only. Kit default. |

#### Removed partner

A removed partner can't sign in, so in practice only admins see these.

| Element | Current text | Notes |
|---|---|---|
| Live row badge and panel badge | No longer emailed | New, needs approval. Owner question: Partners says these listings "expire". Pick one word for this state and use it in both places. |
| Panel note | The partner was removed. People who already got it can see it until {date}. | Keep. |
| Closed row badge and panel status | Partner removed | New, needs approval. See the No longer emailed note. |
| Organization filter option | {name} (removed) | New, needs approval. Admin only. |

#### Delete confirmation

| Element | Current text | Notes |
|---|---|---|
| Dialog title | Delete this {type}? | Keep. {type} is lower case: event, petition, volunteer role, job, opportunity. |
| Dialog body | It will be removed for everyone and can't be restored. To take it out of emails but keep the record, close it instead. | Keep. |
| Confirm button | Delete | Keep. Danger style. |
| Cancel button | Cancel | Keep. Focused when the dialog opens. |

#### Form: page and footer

| Element | Current text | Notes |
|---|---|---|
| Page heading, new | New {type} | Review: for Other this reads "New opportunity", the same as the New button. |
| Page heading, edit | Edit {type} | Keep. |
| Back link | Opportunities | Keep. |
| Primary button, new listing or draft | Publish | Keep. |
| Primary button, live or closed listing | Save changes | Keep. |
| Secondary button | Save as draft | Keep. New listings and drafts only. |
| Cancel link | Cancel | Keep. |
| Required marker | (required) | Keep. Kit default. |
| Character counter | {count} characters left | Keep. "1 character left" for one. |
| Section heading | Basics | Keep. |
| Event section heading | Date and place | Keep. |
| Petition section heading | Petition details | Keep. |
| Volunteer role section heading | Role details | Keep. |
| Job section heading | Job details | Keep. |
| Other section heading | Details | Review: the field inside it is also "Details". |

#### Form: Basics

| Element | Current text | Notes |
|---|---|---|
| Title field label | Title | Keep. Up to 100 characters. |
| Title field hint | Say what it is in a few words. This is the email headline. | Keep. |
| Short description field label | Short description | Keep. Up to 280 characters. |
| Short description field hint | One or two sentences for the email. Full details stay on your page. | Keep. |
| Topics field label | Topics | Keep. |
| Topics field hint | Choose up to 3. We send it to people who care about these. | Keep. "We" is SDC. |
| Event link field label | Registration link | Keep. |
| Petition link field label | Petition link | Keep. |
| Volunteer role link field label | Sign-up link | Keep. |
| Job link field label | Application link | Keep. |
| Other link field label | Link | Keep. |
| Link field hint | Where people go to take part. Starts with https:// | Review: "https://" is technical. Suggest "Copy the full web address from your browser." |

#### Form: Event

| Element | Current text | Notes |
|---|---|---|
| Event form field label | Date | Keep. |
| Event form field label | Start time | Keep. |
| Event form field label | End time | Keep. Optional. |
| Event form field label | How people attend | Keep. |
| How people attend options | In person / Online / Hybrid | Review: events say Online; volunteer roles and jobs say Remote. |
| Event form field label | Location | Keep. Hidden when Online. |
| Location field hint | Address or venue name. | Keep. |
| Event form field label | Cost | Keep. |
| Cost options | Free / Paid | Keep. |
| Event form field label | Cost details | Keep. Shown when Paid. |
| Cost details field hint | For example, “$10, pay what you can”. | Keep. |
| Event form field label | Accessibility | Keep. |
| Accessibility field hint | Step-free access, ASL, childcare, quiet space. Leave blank if you're not sure. | Keep. |

#### Form: Petition

| Element | Current text | Notes |
|---|---|---|
| Petition form field label | Addressed to | Keep. |
| Addressed to field hint | Who you're asking, for example “Region of Waterloo Council”. | Keep. |
| Petition form field label | Deadline | Keep. |
| Deadline field hint | Optional. It closes after this day. | Keep. |
| Petition form field label | Signature goal | Keep. |
| Signature goal field hint | Optional. | Keep. |

#### Form: Volunteer role

| Element | Current text | Notes |
|---|---|---|
| Volunteer form field label | Commitment | Keep. |
| Commitment options | One-time / Ongoing | Keep. |
| Volunteer form field label | Where volunteers work | Keep. |
| Where volunteers work options | In person / Remote / Hybrid | See the How people attend note. |
| Volunteer form field label | Location | Keep. Hidden when Remote. |
| Location field hint | Address or neighbourhood. | Keep. |
| Volunteer form field label | Time commitment | Keep. |
| Time commitment field hint | For example, “2 hours a week”. | Review: optional, but the hint doesn't say so. |
| Volunteer form field label | Start date | Keep. |
| Start date field hint | Optional. | Keep. |
| Volunteer form field label | Apply by | Keep. |
| Apply by field hint | Optional. It closes after this day. | Keep. |
| Volunteer form field label | Skills or experience | Keep. |
| Skills or experience field hint | Optional. Leave blank if anyone can help. | Keep. |
| Volunteer form field label | Minimum age | Keep. |
| Minimum age field hint | Optional. | Keep. |

#### Form: Job

| Element | Current text | Notes |
|---|---|---|
| Job form field label | Employment type | Keep. |
| Employment type placeholder | Choose one | Keep. Also the admin Organization field placeholder. |
| Employment type options | Full-time / Part-time / Contract / Temporary / Internship | Keep. |
| Job form field label | Workplace | Keep. |
| Workplace options | On-site / Remote / Hybrid | Review: events and volunteer roles say "In person" for the same idea. |
| Job form field label | Location | Keep. Hidden when Remote. |
| Location field hint | City or address. | Keep. |
| Job form field label | Pay | Keep. |
| Pay field hint | For example, “$22–25 an hour”. Including pay gets more applicants. | Review: optional, but the hint doesn't say so. Keep the nudge. |
| Job form field label | Apply by | Keep. |
| Apply by field hint | Optional. It closes after this day. | Keep. |
| Job form field label | Qualifications | Keep. |
| Qualifications field hint | Optional. Must-haves only. | Keep. |

#### Form: Other

| Element | Current text | Notes |
|---|---|---|
| Other form field label | Call to action | Review: marketing jargon. Suggest "Button text". |
| Call to action field hint | The button people see, for example “Take the survey”. | Keep. |
| Other form field label | Deadline | Keep. |
| Deadline field hint | Optional. It closes after this day. | Keep. |
| Other form field label | Details | Review: same word as the section heading. Suggest "Extra details". |
| Details field hint | Optional. Add up to 5, like “Time needed: 5 minutes”. | Keep. |
| Detail row field label | Label | Review: technical. Suggest "Name". |
| Detail row field label | Value | Review: technical. Suggest "Detail". |
| Add detail button | Add detail | Keep. Hidden at 5. |
| Remove detail button | Remove detail {n} | Accessible label only |

#### Not found

| Element | Current text | Notes |
|---|---|---|
| Heading | Opportunity not found | Keep. Also the browser tab title. |
| Body | It may have been deleted, or it belongs to another organization. | Keep. Doesn't say which. |
| Link | Back to opportunities | Keep. |

#### Topics

From catalog.ts. A placeholder list until the 29 September taxonomy session. Topic IDs stay the same if labels change.

| Element | Current text | Notes |
|---|---|---|
| Topic | Housing and homelessness | Keep. Placeholder. |
| Topic | Food security | Keep. Placeholder. |
| Topic | Income and poverty | Keep. Placeholder. |
| Topic | Newcomers and refugees | Keep. Placeholder. |
| Topic | Environment and climate | Keep. Placeholder. |
| Topic | Health and wellbeing | Keep. Placeholder. |
| Topic | Accessibility and disability | Keep. Placeholder. |
| Topic | Arts and culture | Keep. Placeholder. |
| Topic | Civic participation | Keep. Placeholder. |
| Topic | Youth | Keep. Placeholder. |
| Topic | Seniors | Keep. Placeholder. |

#### Validation messages

From service.ts. Field messages appear under their field. The form-level message appears as a toast.

| Element | Current text | Notes |
|---|---|---|
| Toast, Publish or Save changes with errors | Fix the highlighted fields to publish. | Review: also shown for Save changes, where "to save" fits better. |
| Toast, Save as draft with errors | Fix the highlighted fields to save. | Keep. |
| Toast, listing missing or not yours | This opportunity no longer exists, or you can't edit it. Go back to the list. | Keep. |
| Toast, no type | Choose a type of opportunity. | Keep. Rare: a broken link. |
| Title error, empty | Enter a title. | Keep. |
| Title error, too long | Keep the title to 100 characters. | Keep. |
| Short description error, empty | Add a short description. | Keep. |
| Short description error, too long | Keep the description to 280 characters. | Review: say "short description" to match the label. |
| Topics error, none | Choose at least one topic. | Keep. |
| Topics error, too many | Choose up to 3 topics. | Keep. |
| Link error, empty | Add the link where people take action. | Review: the hint says "take part". Use one phrase. |
| Link error, not https | Enter a full link that starts with https:// | Review: see the Link field hint note. |
| Date error, wrong format | Enter a date like 2026-10-08. | Review: technical format. Suggest "Enter a date like Oct 8, 2026." |
| Event date error, passed | This date and time has passed. Choose a future date. | Keep. Publish only. |
| Deadline or apply-by error, passed | This date has passed. Choose a future date or clear it. | Keep. Publish only. |
| Event date error, empty | Choose the event date. | Keep. |
| Start time error, empty | Enter a start time. | Keep. |
| Time error, wrong format | Enter a time like 18:30. | Review: the list shows "6:30 p.m.". Suggest "Enter a time like 6:30 p.m." |
| End time error, before start | End time must be after the start time. | Keep. |
| How people attend error, empty | Choose how people attend. | Keep. |
| Event location error, empty | Enter where it's happening. | Keep. |
| Cost details error, empty when Paid | Say what it costs, for example “$10, pay what you can”. | Keep. |
| Addressed to error, empty | Say who the petition is addressed to. | Keep. |
| Signature goal error, not a whole number | Enter a whole number, like 500. | Keep. |
| Commitment error, empty | Choose one-time or ongoing. | Keep. |
| Where volunteers work error, empty | Choose where volunteers work. | Keep. |
| Volunteer location error, empty | Enter where volunteers go. | Keep. |
| Minimum age error, not a whole number | Enter an age in years, like 16. | Keep. |
| Employment type error, empty | Choose the employment type. | Keep. |
| Workplace error, empty | Choose where the work happens. | Keep. |
| Job location error, empty | Enter the city or address. | Keep. |
| Call to action error, empty | Enter what people should do, like “Take the survey”. | Keep. |
| Detail row error, label missing | Add a label, or clear this detail. | Keep. Update if "Label" is renamed. |
| Detail row error, value missing | Add a value, or clear this detail. | Keep. Update if "Value" is renamed. |
| Details error, too many | Keep it to 5 details. | Keep. |

#### Toasts and results

From service.ts.

| Element | Current text | Notes |
|---|---|---|
| Toast, draft saved | Draft saved. | Keep. |
| Toast, published | Published. The {type} is now live. | Keep. |
| Toast, live or closed listing saved | Changes saved. | Keep. Same as Organization. |
| Toast, closed | Closed. It won't appear in emails or the feed. | Owner question: no screen explains "the feed", and Partners says "stop being recommended". Which term? |
| Toast, reopened | Reopened. It's live again. | Keep. |
| Toast, reopen refused, date passed | This {type} has already ended. Edit its date to reopen it. | Keep. |
| Toast, reopen refused, partner removed | This partner was removed. Reinvite the partner before reopening its opportunities. | Keep. Admins only in practice. |
| Toast, duplicated | Duplicated as a draft. | Keep. |
| Duplicate's title | Copy of {title} | Keep. |
| Toast, deleted | Deleted “{title}”. | Keep. |
| Toast, action on a missing listing | This opportunity no longer exists. | Keep. |

## Organization

Rules: [decisions/opportunities.md](../decisions/opportunities.md) entries 8 and 9, and [decisions/partners.md](../decisions/partners.md) entry 10. Admins edit the same details and people from Partners, with the same rules and messages.

### Flows

#### Update organization details
1. Select **Organization** in the sidebar.
2. Under **Profile**, edit **Organization name**, **Website** or **Short description**.
3. Select **Save changes**.
   - On success, show the toast "Changes saved." The new name updates the sidebar and every listing at once.
   - On a field error, show the message under the field, keep what the person typed, and show the toast "Check the highlighted field." (or "fields").
- **Organization name** is required and must be unique. **Website** is optional and must start with https://. **Short description** is optional, up to 280 characters.
- Do not show a confirmation before saving.
- If the person has been signed out, or the organization's access has ended, show the message as a toast and save nothing.

#### View the team
1. Select **Organization** in the sidebar.
2. Under **Team**, list every current person at the organization with their name and email.
   - Mark the signed-in person's own row "(you)".
   - Mark anyone who hasn't accepted yet **Invitation pending**, with "Expires {date}" under their email.
   - If their invitation email failed, show the error with **Retry** instead of the expiry date.
- Every item in a row menu has an icon.
- Accessibility:
  - The team is a list (`role="list"`) labelled by the Team heading.
  - Row menu button: `aria-label="Actions for {name}"`
  - Show Invitation pending as text, never color alone.

#### Invite a colleague
1. Under **Team**, select **Invite colleague**.
2. In the dialog, enter **Name** and **Email** (both required).
3. Select **Send invitation**.
   - On success, close the dialog and show "Invitation sent to {email}." The person appears as **Invitation pending**.
   - On a field error, keep the dialog open and show the message under the field.
   - If the email couldn't be sent, close the dialog, add the person anyway and show "{name} was added, but the invitation wasn't sent. {send error} Try resending." Their row shows the error and **Retry**.
- The invitation link works once, for 7 days.
- An email that's already a current partner contact is refused.

#### Resend an invitation
1. On a pending person's row, select the row menu, then **Resend invitation**. On a failed send, select **Retry** instead.
2. Show "Invitation resent to {email}. The previous link no longer works."
   - If it fails again, show "The invitation wasn't sent. {send error}"
- Do not show a confirmation before resending.

#### Cancel an invitation
1. On a pending person's row, select the row menu, then **Cancel invitation**.
2. Show the confirmation "Cancel this invitation?" with **Keep invitation** and **Yes, cancel invitation**.
3. Select **Yes, cancel invitation** to remove the person from the list and show "Invitation cancelled."
- **Keep invitation** has focus when the confirmation opens. **Yes, cancel invitation** uses the danger style.

#### Remove a colleague
1. On an active person's row, select the row menu, then **Remove from organization**.
2. Show the confirmation "Remove {name} from your organization?" with **Keep access** and **Yes, remove**.
3. Select **Yes, remove**. Their access ends now. Show "{name} was removed from {organization}. Their access ended now."
- The organization's opportunities stay as they are, including ones the person posted.
- Do not show a row menu on the signed-in person's own row. Nobody can remove themselves.
- **Keep access** has focus when the confirmation opens. **Yes, remove** uses the danger style.

### Copy

#### Profile

| Element | Current text | Notes |
|---|---|---|
| Page heading | Organization | Keep. Matches the sidebar item. |
| Section heading | Profile | Keep. |
| Organization name field label | Organization name | Keep. Same label as admin Partners. |
| Website field label | Website | Keep. |
| Website field hint | Starts with https:// | Review: "https://" is technical. Decide together with the Link field hint. |
| Website field placeholder | https://example.org | Keep. An example, not the label. |
| Short description field label | Short description | Keep. Same term as the Opportunities field. |
| Short description field hint | One or two sentences about what your organization does. Up to 280 characters. | Keep. |
| Save button | Save changes | Keep. Same as the Opportunities form. |
| Toast, saved | Changes saved. | Keep. Same as Partners and Opportunities. |
| Toast, one field error | Check the highlighted field. | Review: Opportunities says "Fix the highlighted fields to…". Use one phrasing. |
| Toast, several field errors | Check the highlighted fields. | See above. |
| Organization name error, empty | Enter the organization's name. | Keep. |
| Organization name error, taken | Another organization already has this name. | Keep. |
| Website error | Enter a web address that starts with https://, like https://example.org. | Review: Opportunities says "link". Use one term. |
| Short description error, too long | Shorten the description to 280 characters or fewer. | Review: Opportunities says "Keep the description to 280 characters." Use one phrasing. |
| Toast, signed out | Your session ended. Sign in again to save changes. | Review: "session" is technical. Suggest "You've been signed out. Sign in again to save changes." |
| Toast, access ended | Your organization's access has ended. Contact SDC if this is a mistake. | Keep. Also shown for team actions. |

#### Team

| Element | Current text | Notes |
|---|---|---|
| Section heading | Team | Keep. Admin Partners calls the same people "People" and "Contacts". |
| Invite button | Invite colleague | New, needs approval. |
| Own row marker | (you) | New, needs approval. |
| Pending badge | Invitation pending | Keep. Admin Partners now uses the same words. |
| Invitation expiry | Expires {date} | New, needs approval. Review: an expired invitation still shows a past date here. |
| Send error line | {send error} | Keep. Text comes from the email service. |
| Retry button | Retry | Keep. |
| Row menu button | Actions for {name} | Accessible label only |
| Row menu item, pending | Resend invitation | Keep. |
| Row menu item, pending | Cancel invitation | Keep. |
| Row menu item, active | Remove from organization | Keep. |

#### Invite dialog

| Element | Current text | Notes |
|---|---|---|
| Dialog title | Invite colleague | New, needs approval. |
| Dialog description | We'll email them a link to join your organization's portal. The link works for 7 days. | Keep. |
| Name field label | Name | Keep. |
| Email field label | Email | Keep. |
| Cancel button | Cancel | Keep. |
| Submit button | Send invitation | Keep. Same as admin Partners. |
| Name error, empty | Enter the contact's name. | Review: partners say "colleague", not "contact". |
| Email error, invalid | Enter an email address like name@example.org. | Keep. |
| Email error, already a contact | This person is already a current partner contact. | Review: "partner contact" is admin language. |
| Toast, several field errors | Check the highlighted fields. | Review: not shown. The dialog shows only the field messages. |
| Toast, sent | Invitation sent to {email}. | Keep. |
| Toast, added but not sent | {name} was added, but the invitation wasn't sent. {send error} Try resending. | Review: the row's button says "Retry". |

#### Resend, cancel and remove

| Element | Current text | Notes |
|---|---|---|
| Toast, resent | Invitation resent to {email}. The previous link no longer works. | Keep. |
| Toast, resend failed | The invitation wasn't sent. {send error} | Keep. |
| Cancel confirmation title | Cancel this invitation? | Keep. |
| Cancel confirmation body | {name} won't be able to use the invitation link already sent. | Keep. |
| Cancel confirmation, keep button | Keep invitation | Keep. |
| Cancel confirmation, confirm button | Yes, cancel invitation | Keep. |
| Toast, cancelled | Invitation cancelled. | Keep. |
| Remove confirmation title | Remove {name} from your organization? | Keep. |
| Remove confirmation body | {name} loses access to the partner portal now. Your organization's opportunities stay as they are. | Keep. |
| Remove confirmation, keep button | Keep access | Keep. |
| Remove confirmation, confirm button | Yes, remove | Keep. |
| Toast, removed | {name} was removed from {organization}. Their access ended now. | Keep. |
| Toast, person no longer exists | This contact no longer exists. | Review: "contact" again. Rare. |
| Toast, cancel refused | Only pending invitations can be cancelled. | Keep. Rare. |
| Toast, remove refused, not active | Only active contacts can be removed. Cancel a pending invitation instead. | Keep. Rare. |
| Toast, remove refused, last person | This is the organization's only contact. Remove the organization's access instead. | Keep. Admin only in practice: a partner's last person is always themselves. |
| Toast, remove refused, yourself | You can't remove yourself. Ask a colleague or SDC to remove you. | Keep. Rare: the option is hidden on your own row. |

## Copy principles

Use familiar words and describe the action the user is taking.

Prefer:
- **Add member** over “Create user”
- **Invite partner** over “Create partner account”
- **Remove access** over “Revoke permissions”
- **Import members** over “CSV import”
- **Awaiting review** over “Pending” when the user needs to understand what is pending

Avoid technical terms unless they are already familiar to partners.

Use the same term for the same person, object, or action throughout the product.
