# SDC portal: UX flows and copy

> **Owner decisions, 26 Sep 2026. These override the text below where they conflict.**
> 1. **Search stays search-as-you-type:** results 300ms after typing stops, Enter searches immediately, × clears, and the only text is a placeholder. The doc's Search button, visible search label and "Clear search" button do not apply.
> 2. **General members and Paying members are exclusive (owner, 27 Sep).** General members are subscribed people who aren't paying members; the General members tab tooltip says so.
> 3. **Partners:** two views (Organizations, People) plus a **Status** filter (Active, Removed), as this doc proposes. Invitation states show on people rows.
> 4. **No page descriptions.** Section descriptions are sidebar tooltips.
> 5. **SDC contact path:** a placeholder, `{SDC contact email}`, until SDC confirms one.
> 6. **Resubscribe:** only the person can resubscribe after they unsubscribe themselves. Admins can resubscribe only people an admin unsubscribed.
> 7. **Convert to paying member** has no email-subscription gate. Adding members has a "make them paying members" checkbox, unchecked by default. Re-adding existing emails with it checked converts them. The add flow detects likely mistakes (duplicates, people already paying, people who unsubscribed themselves), previews what will happen, and asks only when intent is genuinely unclear.
> 8. **Reinviting a removed organization:** access returns when someone accepts, and its closed opportunities whose dates haven't passed reopen automatically.
> 9. **Modals get subtle enter and exit animations.**
> 10. **Shell badges:** no section defines a count yet, so no badges are shown.

This document covers the **admin portal** and the **partner portal**, including shared sign-in. Each section names its audience. The copy tables contain proposed text for the interface; the flows describe the behaviour that makes that text accurate. Review a behavioural change with design and engineering before applying copy alone.

For strings already mapped to code, preserve their existing IDs when updating the **Current text** value. Community strings are in `src/app/admin/community/_copy.ts`. This document does not assign new code IDs. The supplied partner document began in the middle of the Opportunities copy table, so detailed screens not present in that source are identified below rather than reconstructed as though they were verified.

## UX review

The partner-facing **Organization** section does not belong under a heading that promises only admin flows. This version names both audiences and keeps the partner's **Team** distinct from the admin's **People** view. The original mixes valid business rules with copy that exposes technology: `https://` requirements, raw mail-service errors, generic validation toasts, and the word **session**. The interface should handle those conditions and show what the person can do next.

The original also treats **Invitation pending** as a catch-all for sent, failed, and expired invitations. Those are different states with different next steps. Its cancellation and removal confirmations describe real consequences, but button labels such as **Yes, remove** and success messages such as **Their access ended now** sound mechanical. The revised states and messages below are intended to be implemented together.

The copy audit caught genuine drift: **subscribers** versus **general members**, **Pending** versus **Invitation pending**, **Revoked** versus **Remove paying access**, and **Upgrade** versus **Convert to paying member**. It also contains a few proposed changes that need correction. A sidebar badge announced as a bare number has no meaning; **Invitation pending** may describe a person but may not accurately describe an entire organization; and the generic sign-in failure message assumes that retrying will help even when sign-in is not permitted. Those cases are resolved or marked for a product decision below.

## Shared rules

- **Names for people and organizations:**
  - Use **organization** for a CivicHub organization.
  - In the admin portal, use **People** for the view of individuals and **Add person** for its action, pending an owner decision.
  - In the partner portal, use **Team** for people who can access that organization's portal.
  - A section labelled **Contacts** in the admin details panel should be renamed **People** when the corresponding screen and decision record are updated.
  - In sentences, use **person**, **they**, or **them** where that sounds natural. Avoid showing the internal term **contact**.
- **Community classifications:**
  - Use **general member** and **paying member** as the two classifications. Do not call general members **subscribers**.
  - A person occupies one classification at a time; conversion changes that classification, while email subscription is a separate state.
- **Invitation states:**
  - Use **Invitation pending** only when an email was sent and the link has not been accepted or expired.
  - Use **Invitation not sent** when delivery failed, and **Invitation expired** after its expiry.
  - Never show an expiry date in the past beneath **Invitation pending**.
- **Form errors:** show field errors beside the relevant fields, retain entered values, and move focus to the first invalid field on submit. Do not also show a generic validation toast. For long forms, use a persistent error summary linked to the invalid fields.
- **Confirmations:** use one when cancelling an invitation, removing someone's access, or deleting an opportunity. Save, publish, reopen, resend, and sign out do not need an extra confirmation unless their actual consequences warrant one.
- **Raw errors:**
  - Never display raw email-provider errors, raw authentication errors, or `{send error}`.
  - Record diagnostic details internally and show a short, accurate message.
  - Do not suggest that waiting or retrying will solve a known permanent access restriction.
- **Web addresses:**
  - Accept ordinary website entries such as `sdckw.ca` and `https://sdckw.ca`, and normalize valid entries internally. A user does not need to type `https://`.
  - If this behaviour is not yet implemented, change the field before using the simpler copy below.
- **Labels:**
  - Use a visible button label for essential actions such as **Search**. Icons can supplement text; they should not carry the action by themselves. *(Owner decision 1: search is the exception.)*
  - Give form fields persistent visible labels rather than placeholders or accessible names alone.

## Admin portal

### Shell

#### Navigate sections

**Desktop, 768px or wider:**
- Keep the left sidebar visible with **Opportunities**, **Partners**, **Community**, and **Insights**.
- Selecting a section opens it, visibly highlights that item, and marks it with `aria-current="page"`.

**Smaller screens:**
- Show the product name and an **Open menu** button in the top bar.
- The button opens a modal navigation drawer over a dimmed, inactive page. Move focus into the drawer and keep it there while the drawer is open.
- Include a visible close control. The close control, the backdrop, and Escape dismiss the drawer and return focus to the menu button.
- Choosing a section closes the drawer, opens the destination, and moves focus to its page heading.
- If the viewport grows to 768px or more, close the drawer and show the desktop sidebar.

**Section counts:**
- If a section displays a count, give it a defined meaning within that section.
- The visible badge may show a number, but its accessible name must explain it, such as **Partners, 3 awaiting review**. The destination page should use the same wording.
- Do not add a badge whose meaning changes unpredictably.

#### Account menu

- The profile button at the bottom of the sidebar shows the person's avatar, name, and email, with a visible indication that it opens a menu.
- The menu contains **My account** and **Sign out**.
- Signing out returns the person to the sign-in page without a confirmation.

| Element | Current text | Notes |
|---|---|---|
| Product name | SDC Admin | Sidebar and mobile top bar |
| Navigation | Opportunities | |
| Navigation | Partners | |
| Navigation | Community | Keep until the page's actual contents justify another name |
| Navigation | Insights | Validate against page contents and user testing before renaming |
| Navigation landmark | Admin navigation | Accessible name |
| Mobile menu button | Open menu | Accessible name; expose `aria-expanded` and `aria-controls` |
| Drawer close button | Close menu | Accessible name |
| Profile button | Open account menu for {name} | Accessible name; expose expanded state |
| Account menu | My account | |
| Account menu | Sign out | |
| Section badge | {count} | Visible number; accessible name adds what is counted. Never announce the number alone or assume it means “new” |

The SDC brand mark is decorative when adjacent text already says **SDC Admin**.

### Partners

#### Find an organization or person

1. Open **Partners**. Offer **Organizations** and **People** as the two views.
2. Within either view, use a visibly labelled **Status** filter with **Active** and **Removed**. Counts beside views should reflect the current filter, if counts are shown.
3. Enter a query and select the visible **Search** button or press Enter. Run the search on submission, not on every keystroke. Keep the query and filter visible with the results. *(Owner decision 1: search as you type instead.)*
4. What each view matches:
   - In **Organizations**, match organization name and its people's names or emails.
   - In **People**, match name, email, and organization name.
   - If a contact matches in Organizations, return the relevant organization.
5. Select **Clear search** to restore the full list for the current view and status. Provide an empty result message that distinguishes no matches from no records.
6. Select a row to open its panel:
   - An organization row shows that organization's details.
   - A person row opens a panel headed with that person's name, showing their organization as related information.
   - Make row interactivity clear with hover and focus treatment and a chevron.

The tabs have `aria-label="Partner views"`. Label the tables **Organizations** and **People**; label the filter **Status**. Row selection must also work from a keyboard. If **Removed** contains a different set of objects or has different restoration rules, confirm that model before implementing the filter.

#### Invite a partner

1. Select **Invite partner** and enter **Contact name** and **Email**.
2. Start typing in **Organization**. Show matching organizations and allow one to be selected.
3. If there is no match, offer **Add “{name}” as a new organization**. Show the chosen or new organization clearly before submission.
4. Select **Send invitation**.
   - On success, show a sent confirmation and the person's pending state.
   - On delivery failure, distinguish **Invitation not sent** from a sent invitation and offer **Retry**. Do not display an email-service error.

- Check for existing people and organizations before creating duplicates.
- Preserve what was entered if validation fails.
- The existing design-system picker reportedly displays **Create “{name}”** and the hint **Search or create an organization…**. Replace those strings with the proposed **Add** language only when its component can be changed safely, including other screens that share it.

| Element | Current text | Notes |
|---|---|---|
| Page heading | Partners | |
| Views | Organizations; People | Object types |
| Filter | Status | Options: Active; Removed |
| Search button | Search | Visible label |
| Clear button | Clear search | Visible label |
| No search results | No matches found. Try another name or email. | Adapt if the active view has a narrower search scope |
| Primary action | Invite partner | |
| Fields | Contact name; Email; Organization | Contact name is specific in this admin form |
| New organization option | Add “{name}” as a new organization | |
| Invitation sent | Invitation sent to {email}. | |
| Invitation delivery failure | {name} was added, but we couldn't send the invitation. Select Retry to try again. | Only if the person was in fact saved |
| Delivery status | Invitation not sent | Do not label a failed send pending |
| Delivery action | Retry | |

#### Remove an organization's access

- The admin action is **Remove access**.
- Its confirmation should distinguish the organization's portal access from the fate of its opportunities.
- The source audit reports that one surface calls those listings **expired**, while Opportunities displays **No longer emailed** and **Partner removed** beneath **Closed**. Do not claim the listings expire unless there is an actual expiry state.
- Prefer **Closed** as the listing status with **Partner access removed** as the reason, provided that this reflects the implemented lifecycle.
- Show the consequence in the confirmation, and use the same language in the result and reinvitation flow.

| Element | Current text | Notes |
|---|---|---|
| Action | Remove access | The action affects the organization's portal access |
| Confirmation heading | Remove {organization}'s access? | |
| Confirmation body | People at {organization} will lose access to the partner portal. Their opportunities will be closed and won't be recommended or emailed. | Use only if all three consequences are true |
| Buttons | Keep access; Remove access | |
| Opportunity state | Closed; Partner access removed | Status and reason, not “Expired” or “No longer emailed” as competing statuses |
| Reinvite result | Invitation sent to {email}. {organization} is awaiting a response. | Do not call the entire organization an invitation |

Confirm whether reinviting automatically reopens any listings. The wording above assumes it does not, consistent with the separate **Reopen** action. *(Owner decision 8: it does, on acceptance.)*

### Opportunities

#### Listing actions and states

- Keep **Draft**, **Published**, and **Closed** distinct.
- **Publishing** makes an eligible opportunity visible to members.
- **Closing** stops new recommendations and email inclusion.
- **Reopening** requires a date that has not passed and a partner whose access is active.
- **Duplicating** creates a draft with a new title.
- **Deleting** removes the selected opportunity only after a clear confirmation.
- Keep these consequences consistent wherever admins and partners manage listings.

**Editing a listing:**
- When a field is invalid, preserve entered information and show its specific error beside the field.
- Use **Link** consistently for opportunity links and **Website** for an organization's website.
- Let people enter a normal web address without adding a protocol.

| Element | Current text | Notes |
|---|---|---|
| Draft saved | Draft saved. | |
| Published | Published. Members can now see this {type}. | `{type}` must be a natural noun in context |
| Changes saved | Changes saved. | Published or closed listing edits |
| Closed | Closed. This opportunity won't be recommended to members or included in emails. | Use only if both effects are true |
| Reopened | Reopened. Members can see this opportunity again. | |
| Reopen refused, date passed | This {type} has already ended. Edit its date to reopen it. | |
| Reopen refused, partner removed | This partner no longer has access. Reinvite them before reopening their opportunities. | Admin context |
| Duplicated | Duplicated as a draft. | |
| Duplicate title | Copy of {title} | |
| Deleted | Deleted “{title}”. | After confirmed deletion |
| Listing missing | This opportunity no longer exists. | |

- Confirm the closed state's actual email and recommendation behaviour with the team before publishing that toast.
- The source material supplied here includes the action messages but does not include the full listing form or deletion dialog; retain their existing field requirements until those screens can be reviewed.
- Avoid **live**, **feed**, **expired**, and **no longer emailed** as competing names for a listing's status. Use **Published**, **Closed**, and **Ended** only when each has a defined and distinct meaning.

### Community

#### Classifications and email status

**Classifications:**
- Admins see **General members** and **Paying members**.
- These are exclusive classifications. A paying member keeps the benefits of a general member, but does not appear in both classifications.
- Email subscription is independent of paying access.

**Adding people:**
- Importing a list must require the admin to choose which classification receives the new addresses. *(Owner decision 7: a "make them paying members" checkbox, unchecked by default.)*
- Show duplicates and errors before or after import clearly.
- Never silently change an existing paying member into a general member.
- The earlier product discussion supports adding one person, pasting multiple addresses, or importing a list; the exact upload and review screens were not included in the supplied UX source.

**Actions:**
- An admin can **Convert to paying member** when the person meets the product's eligibility rule, or **Remove paying access** when appropriate.
- **Unsubscribe** and **Resubscribe** concern emails, not membership.
- A disabled **Resubscribe** action must explain what prevents it and how to resolve that condition.
- If a person unsubscribed themselves, confirm the policy and consent mechanism before allowing an admin to resubscribe them; the friendlier label does not establish permission. *(Owner decision 6.)*

| Element | Current text | Notes |
|---|---|---|
| Page description | View general and paying members, add people and manage their access. | Accept audit change #8 *(Owner decision 4: shown as the sidebar tooltip, not on the page.)* |
| Member views | General members; Paying members | One person in one classification |
| Add action | Add members | One button for one person or many; the dialog also imports a file |
| Paying action | Convert to paying member | Conversion changes classification |
| Paying error | Only general members who are subscribed to emails can be converted to paying members. | Use only if email subscription really is a business requirement *(Owner decision 7: it isn't; remove.)* |
| Paying removal action | Remove paying access | |
| Email type, paying removal | Paying access removed | Accept audit change #10 if email types describe what was sent |
| Email type, paying conversion | Paying membership added | Replaces **Upgrade** if this email actually announces conversion; confirm email-template name and purpose |
| Toast, conversion email | Paying member email sent. | Only if email delivery succeeded; align with actual template |
| Email delivery badge | Not delivered | Prefer over **Bounced** for admins, with a way to inspect or correct the address |
| Email action | Unsubscribe; Resubscribe | Keep actions symmetrical, subject to consent rules |

- The eligibility error in the audit changed the verb but kept a potentially confusing condition: *subscribed general members*.
- Verify that subscription really gates paying conversion:
  - If it does, the proposed message states the condition in ordinary words.
  - If it does not, remove that gate rather than copying an old rule into new text.
- The current Community source has many other strings not included here; preserve their IDs and review the complete `_copy.ts` table before a code writeback.

#### Community rows (27 Sep)

| Element | Current text | Notes |
|---|---|---|
| General members tab tooltip (`tabs.generalTabTooltip`) | Subscribed people who aren't paying members. | New, needs approval. The tabs are exclusive |
| Header button (`toolbar.addMembers`) | Add members | New, needs approval. Replaces Add member and Import members |
| Add dialog title (`addDialog.title`) | Add members | New, needs approval |
| Add dialog hint (`addDialog.tagsHint`) | Press Enter, comma or space after each address, or paste a list. | New, needs approval |
| Add dialog placeholder (`addDialog.tagsPlaceholder`) | name@example.org | New, needs approval |
| Tag list name, screen readers only (`addDialog.tagsListLabel`) | Email addresses entered | New, needs approval |
| Invalid address tooltip (`addDialog.invalidEmail`) | This isn't an email address. Check for a missing @ or a typo. | New, needs approval |
| Link to file view (`addDialog.importFromFile`) | Import from a file | New, needs approval |
| Link back to the add view (`addDialog.backToAdd`) | Back | New, needs approval |
| File view hint (`addDialog.fileHint`) | Upload a CSV file, then check the addresses. Names are optional, e.g. Ada Lovelace <ada@example.org>. | New, needs approval |
| Preview button, only additions (`addDialog.confirmAdd`) | Add {n} person / Add {n} people | New, needs approval |
| Preview button, only conversions (`addDialog.confirmConvert`) | Make {n} person paying / Make {n} people paying | New, needs approval |
| Preview button, only resubscribes (`addDialog.confirmResubscribe`) | Resubscribe {n} person / Resubscribe {n} people | New, needs approval |
| Preview button, a mix (`addDialog.confirm`) | Confirm {n} change / Confirm {n} changes | Existing |
| Preview button, nothing will change (`addDialog.editList`) | Edit list | New, needs approval. Primary; Close is secondary |
| Export option (`exportDialog.scopeBoth`) | Both | New, needs approval. Include unsubscribed members applies to any option |
| Tag input screen-reader announcements (`tagInputCopy`, kit) | {tag} added / {n} added / {tag} removed / {tag} is already in the list / Remove {tag} | New, needs approval |

## Partner portal

### Organization profile

The **Organization** page contains **Profile** and **Team**. An SDC admin can edit the same organization details and people from Partners. Keep validation and status language consistent across both surfaces.

#### Update details

1. Open **Organization** and edit **Organization name**, **Website**, or **Short description** under **Profile**.
2. Select **Save changes**.
   - The name is required and unique.
   - The website is optional.
   - The description is optional and limited to 280 characters.
3. On success, show **Changes saved.** Update the sidebar name and associated listings. No confirmation is needed.
4. On invalid input, preserve values, show specific inline errors, and focus the first invalid field. Do not show **Check the highlighted fields** as a toast.
5. If the change can't be saved:
   - If sign-in has expired, save nothing and offer a clear path to sign in again.
   - If the organization has lost access, save nothing and explain how to get help.
   - Use a persistent message or appropriate signed-out page when a toast would disappear before action is possible.

| Element | Current text | Notes |
|---|---|---|
| Page heading | Organization | Matches navigation |
| Page description | How your organization appears to the SDC community. | *(Owner decision 4: sidebar tooltip, not on the page.)* |
| Section heading | Profile | |
| Name label | Organization name | |
| Website label | Website | |
| Website hint | Example: sdckw.ca | Requires accepting and normalizing entries without `https://` |
| Description label | Short description | |
| Description hint | One or two sentences about what your organization does. Up to 280 characters. | |
| Save button | Save changes | |
| Save success | Changes saved. | |
| Name missing | Enter the organization's name. | |
| Name already taken | Another organization already has this name. | |
| Website invalid | Enter a valid website, like sdckw.ca. | |
| Description too long | Shorten the description to 280 characters or fewer. | Same wording throughout the portal |
| Signed out | You've been signed out. Sign in again to save your changes. | Provide a sign-in action |
| Access ended | Your organization no longer has access. Contact SDC if you think this is a mistake. | Provide an SDC contact path |

### Team and invitations

#### View the team

- Show the name and email of each current or invited person.
- Mark the signed-in person's row **(you)**.
- Keep these invitation states mutually exclusive:

| State | Row text | Available action |
|---|---|---|
| Sent, not accepted, within 7 days | Invitation pending; Expires {date} | Resend invitation; Cancel invitation |
| Delivery failed | Invitation not sent | Retry; Cancel invitation |
| Seven days passed without acceptance | Invitation expired; Expired {date} | Send new invitation; Cancel invitation |
| Accepted | No invitation badge | Remove from organization, except for your own row |

- After a successful resend or new invitation, create a fresh single-use link, invalidate the old link, and update the expiry date.
- Show the status as text, never by colour alone.
- Label the team list with its heading.
- Give row menus an accessible name such as **Actions for {name}**.

#### Invite a colleague

1. Under **Team**, select **Invite colleague**. In the dialog, enter **Name** and **Email** and select **Send invitation**.
2. On success, close the dialog, show **Invitation sent to {email}.**, and add a row with **Invitation pending**. The link is single-use and expires after seven days.
3. On validation error, keep the dialog and its values, show specific field errors, and focus the first invalid field. Reject an email already granted access to this organization.
4. If the email wasn't sent:
   - If the person record was saved, close the dialog, show the failure message, and add a row marked **Invitation not sent** with **Retry**.
   - If no person record was saved, keep the dialog open with its values and say the invitation could not be sent.
   - Never imply it was sent.

#### Resend or cancel

- Use **Resend invitation** for a pending row, **Retry** for a failed send, and **Send new invitation** for an expired row.
- Resending needs no confirmation. On success, tell the person the previous link no longer works.
- On failure, retain **Invitation not sent** if there has never been a successful delivery. If a previously sent link remains usable, do not falsely invalidate it or change the row state until a replacement succeeds.

**To cancel a pending, expired, or failed invitation:**
- Show a confirmation explaining that a previously sent link will no longer work.
- Start focus on **Keep invitation**.
- Confirming cancels the invitation and removes its row from the current team list.

#### Remove a colleague

- On an active colleague's row, choose **Remove from organization**.
- Confirm that access ends immediately and that the organization's opportunities, including ones that person posted, stay as they are.
- Start focus on **Keep access**; use danger styling on **Remove access**.
- Hide the action on the signed-in person's row and prevent self-removal on the server.
- Do not allow a partner to remove the organization's last person with access; provide an SDC help path instead.

| Element | Current text | Notes |
|---|---|---|
| Section heading | Team | |
| Invite button and dialog title | Invite colleague | |
| Own row marker | (you) | |
| Invite description | We'll email them a link to join your organization's portal. The link expires after 7 days. | |
| Invite fields | Name; Email | |
| Submit button | Send invitation | |
| Name missing | Enter their name. | |
| Email invalid | Enter an email address like name@example.org. | |
| Already has access | This person already has access to your organization. | |
| Sent confirmation | Invitation sent to {email}. | |
| Saved but send failed | {name} was added, but we couldn't send the invitation. Select Retry to try again. | |
| Send failed, nothing saved | We couldn't send the invitation. Try again. | |
| Pending badge and date | Invitation pending; Expires {date} | Only after successful send |
| Failed badge and action | Invitation not sent; Retry | |
| Expired badge and action | Invitation expired; Expired {date}; Send new invitation | |
| Row menu label | Actions for {name} | Accessible name |
| Resend menu item | Resend invitation | Pending only |
| Resend success | New invitation sent to {email}. The previous link won't work. | |
| Resend failure | We couldn't send the new invitation. Try again. | Preserve status of any still-valid previous link |
| Cancel menu item | Cancel invitation | |
| Cancel title | Cancel this invitation? | |
| Cancel body | {name} won't be able to use the invitation link already sent. | For failed sends: “{name} will be removed from your team list.” |
| Cancel buttons | Keep invitation; Cancel invitation | Confirm button uses danger styling |
| Cancel success | Invitation cancelled. | |
| Remove menu item | Remove from organization | |
| Remove title | Remove {name} from your organization? | |
| Remove body | {name} will lose access to the partner portal. Your organization's opportunities won't change. | |
| Remove buttons | Keep access; Remove access | Confirm button uses danger styling |
| Remove success | {name} was removed from {organization}. They no longer have access. | |
| Person missing | This person could not be found. | Refresh list if state changed elsewhere |
| Cancel refused | This invitation is no longer open. Refresh the team list. | |
| Remove refused, pending | This person doesn't have access yet. Cancel their invitation instead. | |
| Remove refused, last person | This is the only person with access to this organization. Contact SDC for help. | Partner-facing context |
| Remove refused, self | You can't remove your own access. Ask a colleague or SDC for help. | Defensive error |

## Shared sign-in

- Show a persistent, visible **Email address** label. A placeholder example may supplement it, but cannot replace it.
- The sign-in form may ask for a one-time link, but it should never show a raw authentication-provider message such as **Signups not allowed for otp**.

| Situation | Current text | Behaviour |
|---|---|---|
| Email field | Email address | Visible label |
| Invalid address | Enter an email address like name@example.org. | Beside field |
| Link request succeeded | If this email has access, we'll send a sign-in link. Check your inbox. | Use this wording if account discovery must remain private |
| Temporary send failure | We couldn't send a sign-in link. Try again in a minute. | Only for a failure known to be temporary |
| Sign-in not permitted | We couldn't sign you in with this email. Contact SDC for help. | Provide a real contact path; do not suggest waiting |
| Signed out while editing | You've been signed out. Sign in again to save your changes. | Preserve entered values where feasible; do not imply they were saved |

- The audit's proposed message, **“Check the email address, wait a minute, then try again,”** should not be used for every provider failure. It combines three guesses and is false when sign-in is disabled for the address.
- Map known errors by cause; keep an intentionally generic message only when the cause cannot safely be disclosed.

## Account and sign-out

**New, needs approval.** My account is a dialog, not a page, opened from the sidebar profile menu in both portals. It holds a profile picture, the person's name and a danger zone; nothing else (sign-in is by email link, so there's no password). Signing out has no confirmation. Copy lives in `accountDialogCopy` (`src/components/patterns/AccountDialog.tsx`), `accountServerCopy` (`src/features/account/copy.ts`) and `goodbyeCopy` (`src/app/login/page.tsx`).

| Situation | Text | Status |
|---|---|---|
| Account menu item | My account | Opens the dialog |
| Dialog title | My account | New, needs approval |
| Dialog description | Signed in as {email} | New, needs approval |
| Picture label | Profile picture | New, needs approval |
| Picture hint | JPG, PNG or WebP. We crop it to a square. | New, needs approval |
| Picture buttons | Upload photo · Change photo · Remove photo | New, needs approval. "Change" when a picture is set |
| Picture: wrong file type | Choose a JPG, PNG or WebP image. | New, needs approval |
| Picture: unreadable file | We couldn't read that image. Choose a JPG, PNG or WebP file. | New, needs approval |
| Picture: too large (server check) | Choose a smaller image, up to 1 MB. | New, needs approval. Photos are resized in the browser first, so people rarely see it |
| Name label | Name (required) | New, needs approval |
| Name empty | Enter your name. | New, needs approval |
| Name too long | Use 80 characters or fewer. | New, needs approval |
| Buttons | Cancel · Save changes | New, needs approval |
| Saved (toast) | Changes saved | New, needs approval |
| Danger zone heading | Danger zone | New, needs approval |
| Danger zone body | Delete your account and sign out. | New, needs approval |
| Danger zone button | Delete account | New, needs approval |
| Confirm title | Delete your account? | New, needs approval |
| Confirm body, admin | You'll be signed out and lose access to SDC Admin. What you did here stays in SDC's records, shown as "Former admin". This can't be undone. | New, needs approval |
| Confirm body, partner | You'll be signed out and lose access to {organization} in the SDC partner portal. This can't be undone. | New, needs approval |
| Confirm buttons | Keep account · Delete account | New, needs approval. Delete is the danger button |
| Signed out (sign-in page, above the form) | You're signed out. See you soon, {first name}. | New, needs approval. Without a name: "You're signed out. See you soon." Muted text, no banner |
| Account deleted (sign-in page) | Your account is deleted and you're signed out. | New, needs approval |

## Copy audit: disposition

This table reviews the supplied audit as a proposed change set:
- **Accept** means the language is sound if the stated behaviour exists.
- **Revise** means the audit's replacement needs the adjustment in this document.
- **Decision** means wording alone cannot settle the product rule.

| Audit item | Disposition | Direction |
|---|---|---|
| 1. Open navigation → Open menu | Accept | Familiar accessible name |
| 2. Add Close menu control | Accept | Visible close button and accessible name; also manage focus |
| 3. “{n} new” → number only | Revise | Show the number visually, announce section and meaning, such as “Partners, 3 awaiting review”; define what it counts |
| 4. Pending → Invitation pending | Revise | Correct for a sent invitation to a person; do not use as an unexplained organization status, a failed send, or an expired link |
| 5. Reinvite confirmation says organization becomes Invitation pending | Revise | Say the invitation is pending and the organization is awaiting a response; state what happens to access and listings |
| 6. Reinvite toast calls the organization Invitation pending | Revise | Confirm a successful send to an actual email, then describe the organization's access separately |
| 7. Last person tooltip directs to Remove organization's access | Revise | Correct for an admin who has that action; partner users should see a working SDC help path because they cannot remove their own or the last person's access |
| 8. Subscribers → general members | Accept | Use one exclusive membership classification, separate from email subscription |
| 9. Restore email eligibility → Resubscribe | Decision | Clearer action label, but confirm consent and the actual state change before enabling it |
| 10. Revoked → Paying access removed | Accept | Align with **Remove paying access** if the row is an email type |
| 11. Convert to paying member in eligibility error | Revise | Align verb; verify whether email subscription is truly required |
| 12. Raw sign-in provider error → generic retry message | Revise | Hide provider text but distinguish temporary failure from permanent restriction |

### Other audit flags

- **People, Contacts, Add person:**
  - Keep **People** and **Add person** for now because they are recorded decisions.
  - The admin details panel's **Contacts** label is inconsistent. Change it to **People** and update `docs/decisions/partners.md` together, or record an explicit exception if SDC staff mean something different by contacts.
- **Create an organization:**
  - Proposed **Add “{name}” as a new organization** also affects the shared `CreatableCombobox`.
  - Review all uses with the design-system owner before changing its default string. A per-instance label may be safer if other screens genuinely create different objects.
- **The feed:** remove that term from copy unless a visible member experience is actually called **Feed**. Describe the consequence as recommendations and email inclusion when those are the real channels.
- **Expire, Ended, Closed, No longer emailed:**
  - Define lifecycle statuses and reasons before globally replacing strings.
  - An ended date is different from a manual close or a partner losing access.
  - **No longer emailed** describes one consequence, not necessarily a listing state.
- **Upgrade email:** align the email type and toast with **Convert to paying member** after checking what the actual email says. Avoid changing only the list label if the template still uses “upgrade.”
- **Bounced:** prefer **Not delivered** and a next step. If the reason is known and actionable, show it in the email detail view without provider jargon.
- **Visible login label:** add an actual label to the form. The current placeholder plus `aria-label` leaves sighted users without a persistent cue after typing.
- **Decision notes:** update the two **Pending badge** references in `docs/decisions/partners.md` to match the accepted invitation-state model, rather than copying a label into policy without defining it.
- **Accessibility gate:**
  - The reported `aria-allowed-attr` failure on the opportunities form is separate from UX wording. The design-system `Select` trigger reportedly places `aria-required` on a button.
  - The kit owner should fix the component semantics and rerun `pnpm check`; the copy changes do not resolve this failure. *(Fixed 26 Sep: the trigger has the combobox role.)*

## Copy principles

- Use words people already use in their work.
- Say what happened and what they can do next.
- Keep navigation, headings, labels, and statuses consistent; allow natural pronouns in sentences instead of repeating a system term.
- Prefer **Add member**, **Invite partner**, **Remove access**, and **Import members** to technical account or data terms.
- Use **Invitation pending** for a sent, unaccepted invitation and **Awaiting review** only when an admin actually needs to review something.
- Let the interface handle technical details such as URL prefixes and email delivery diagnostics.
- Describe different states with different words even if the underlying data model stores them together.

## Product decisions to confirm before implementation

1. Does the Partners **Removed** view contain both organizations and people, and can each be restored? The proposed Status filter depends on this answer.
2. What does each shell badge count? Define one stable meaning and accessible phrase per section, or omit the badge. *(Owner decision 10: omitted.)*
3. Does closing an opportunity stop both recommendations and outgoing emails immediately? The proposed confirmation assumes it does.
4. Can a failed invitation resend leave an earlier link valid? Reflect actual token behaviour in the status and toast.
5. What action should a partner take when their organization loses access or has only one person left? Provide an actual SDC contact path in the interface. *(Owner decision 5: placeholder.)*
6. Is a general member's email subscription required for conversion to paying membership? Is admin resubscription allowed after a person opts out? *(Owner decisions 6 and 7.)*
7. Does reinviting a removed organization restore portal access immediately, or only after someone accepts? What happens to its closed opportunities? *(Owner decision 8.)*
8. Which exact email does **Convert to paying member** send, and what is its existing template title? Align the email list entry and toast with the answer.

These are behaviour and data decisions. The revised wording should ship with the corresponding behaviour, not ahead of it.

## Empty and error states

An empty or error state says what's empty, why, and the one action that fixes it. It never shows raw error text. List strings are in `listEmptyCopy` (`src/components/patterns/ListPage.tsx`); `{items}`, `{scope}`, `{fields}` and `{filtered}` come from each page.

| Element | Current text | Notes |
|---|---|---|
| List: search matches only in another tab, title (`listEmptyCopy.searchTitle`) | No {items} match “{query}” | New, needs approval |
| List: search matches only in another tab, body (`listEmptyCopy.elsewhere`) | {n} match / {n} matches in {scope} | New, needs approval |
| List: search matches only in another tab, button (`listEmptyCopy.showIn`) | Show in {scope} | New, needs approval |
| List: search matches nothing, body (`listEmptyCopy.searched`) | Searched {fields}. Check the spelling, or clear the search. | New, needs approval |
| List: search matches nothing, button (`listEmptyCopy.clearSearch`) | Clear search | New, needs approval |
| List: filters hide everything, title (`listEmptyCopy.filtersTitle`) | No {filtered}, e.g. No closed jobs from Northside Food Bank | New, needs approval |
| List: filters hide everything, body (`listEmptyCopy.filtersBody`) | Nothing matches these filters. | New, needs approval |
| List: filters hide everything, button (`listEmptyCopy.clearFilters`) | Clear filters | New, needs approval |
| List: search plus filters, title | No {filtered} match “{query}” | New, needs approval |
| List: search plus filters, body (`listEmptyCopy.searchAndFiltersBody`) | Searched {fields} with these filters on. Check the spelling, or clear the search and filters. | New, needs approval |
| List: search plus filters, button (`listEmptyCopy.clearSearchAndFilters`) | Clear search and filters | New, needs approval |
| Search announcement, screen readers only (`listEmptyCopy.results`) | {n} result / {n} results | New, needs approval |
| Search announcement, no results (`listEmptyCopy.noResults`) | No results | New, needs approval |
| Community: General members noun (`empty.generalItems`) | members (“No members match “zzz””) | New, needs approval |
| Community: Paying members noun (`empty.payingItems`) | paying members | New, needs approval |
| Community: searched fields (`empty.searchedFields`) | names and emails | New, needs approval |
| Community: Paying members search matches only unsubscribed people, title | No paying members match “{query}” | New, needs approval |
| Community: Paying members search matches only unsubscribed people, body (`empty.unsubscribedElsewhere`) | {n} unsubscribed person matches. / {n} unsubscribed people match. They appear at the end of General members. | New, needs approval |
| Community: Paying members search matches only unsubscribed people, button | Show in General members | New, needs approval |
| Member panel, Emails, none sent (`emails.empty`) | No emails sent to them yet. | New, needs approval. Replaces “No emails sent yet.” |
| Member panel, Emails, none sent to an unsubscribed person (`emails.emptyUnsubscribed`) | No emails sent. They're unsubscribed, so none will be sent. | New, needs approval |
| Member panel, Emails, failed to load (`emails.loadError`) | We couldn't load their emails. Nothing was changed; this is a loading problem. | New, needs approval. Replaces “Couldn't load this person's emails.” Button: Try again |
| Add members preview, nothing valid entered (`addDialog.noValidAddresses`) | None of these are email addresses, so nothing will change. Edit the list so each entry looks like name@example.org. | New, needs approval |
| Add members preview, nothing valid entered, button (`addDialog.editList`) | Edit list | New, needs approval. Goes back to the list with focus in it; Close is secondary |
| Add members preview, everyone already a member (`addDialog.allAlreadyMembers`) | They're already a member, so nothing will change. / All {n} are already members, so nothing will change. | New, needs approval |
| Community fails to load (`communityCopy.loadError.title`) | We couldn't load Community. | New, needs approval |
| Admin Opportunities fails to load (`errorCopy.admin.opportunities.title`) | We couldn't load Opportunities. | New, needs approval |
| Admin Partners fails to load (`errorCopy.admin.partners.title`) | We couldn't load Partners. | New, needs approval |
| Other admin page fails to load (`errorCopy.admin.portal.title`) | We couldn't load this page. | New, needs approval |
| Partner Opportunities fails to load (`errorCopy.partner.opportunities.title`) | We couldn't load your opportunities. | New, needs approval |
| Partner Organization fails to load (`errorCopy.partner.organization.title`) | We couldn't load your organization. | New, needs approval |
| Other partner page fails to load (`errorCopy.partner.portal.title`) | We couldn't load this page. | New, needs approval |
| Any section fails to load, body | Your data is safe; this is a loading problem. | New, needs approval |
| Any section fails to load, button | Try again | New, needs approval |
| Partner portal fails to load, contact line | If it keeps happening, contact SDC at {SDC contact email}. | New, needs approval |

## Booth kiosk

A tablet sign-up page for SDC booths, e.g. Kitchener Market. An admin opens `/kiosk` (optionally `/kiosk?location=Kitchener Market`) from Community in a new tab. Admins only; no admin sidebar. Decisions: [kiosk.md](../decisions/kiosk.md). Copy lives in `src/app/kiosk/copy.ts`.

**Flow:** Sign up (Name, Email, **Sign me up**) → confirmation → reset after 20s or on **Next person**. Existing emails see the same confirmation. Focus goes to the confirmation heading, then to Name after a reset. Any touch or keypress pauses the countdown.

| Element | Current text | Notes |
|---|---|---|
| Label above the heading | Social Development Centre · {location} | New, needs approval. Just "Social Development Centre" without `?location=` |
| Heading | Get involved in your community | New, needs approval |
| Intro | Leave your name and email and we'll send you about one email a month with local ways to volunteer, learn and take part. We only use your details for these emails, and you can unsubscribe anytime. | New, needs approval |
| Field labels | Name / Email | New, needs approval. Both required |
| Button | Sign me up | New, needs approval |
| Name missing | Enter your name. | New, needs approval |
| Email missing | Enter your email address. | New, needs approval |
| Email invalid | Enter an email address like name@example.org. | Matches sign-in |
| Sign-up failed | We couldn't sign you up. Check your connection and tap Sign me up again. | New, needs approval. Values are kept |
| Confirmation heading | You're in, {name}! | New, needs approval |
| Confirmation body | Check your inbox for a welcome email. | New, needs approval |
| Countdown | Starting over in {n}s | New, needs approval. Counts down from 20 |
| Countdown paused | Paused. Tap Next person when you're ready. | New, needs approval |
| Reset button | Next person | New, needs approval |
