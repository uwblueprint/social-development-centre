# People page copy

Every piece of user-facing copy on the People design screens, grouped by type. Where copy changed, the new copy comes first and the old copy follows struck through. "Same" marks copy that stays as it is.

## 1. Toasts

{name} is the person's full name, or their email when the name is missing.

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Connection comes back and the page has caught up (state lab: turn Reconnecting off after it was on) | Back online ~~You're up to date.~~ | — | — | — | Toast | MemberDirectory.tsx:1207 |
| Click an email in the Email column, or the copy icon next to the email in the person panel | Copied {email} ~~Email copied~~ | — | — | — | Toast | MemberDirectory.tsx:1922, MemberDirectory.tsx:1433, MemberSheet.tsx:1070 |
| Copy email addresses from the header, the selection bar or Ctrl/Cmd+C | Same: Copied {count} email address / Copied {count} email addresses | — | — | — | Toast | MemberDirectory.tsx:2019, MemberDirectory.tsx:1433 |
| Copy fails because the browser blocks the clipboard | Couldn't copy. Select it below to copy it yourself ~~Couldn't copy~~ | Same: {text} (the text that could not be copied) | — | — | Toast | MemberDirectory.tsx:1434 |
| Download as spreadsheet with nobody to download | No people to download ~~No one to export~~ | — | — | — | Toast | MemberDirectory.tsx:2011 |
| Download as spreadsheet | Same: Downloaded a spreadsheet of {count} person / Downloaded a spreadsheet of {count} people | — | — | — | Toast | MemberDirectory.tsx:2013 |
| Copy email addresses when no one in the target group has an email | Same: No email addresses to copy | — | — | — | Toast | MemberDirectory.tsx:2018 |
| Any undoable change: the button on the change toast | (the change's title, see rows below) | — | — | Same: Undo | Toast with action | undo.ts:40 |
| Undo is clicked | {restored}: names what was put back (see rows below) | — | — | — | Toast | undo.ts:47 |
| Undo is clicked while state lab Undo expired is on | Couldn't undo because the change was already saved ~~Couldn't undo. The change was already saved.~~ | — | — | — | Toast | undo.ts:44 |
| Close the person panel or press Save tags after adding or removing tags in it | Updated {name}'s tags ~~Tags updated~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:1180 |
| Undo "Updated {name}'s tags" | Restored {name}'s tags ~~Change undone~~ | — | — | — | Toast | MemberDirectory.tsx:1180 |
| Add a tag to the selected people from the selection bar | Tagged {name} {tag} / Tagged {count} people {tag} ~~Added {tags} to {count} person / Added {tags} to {count} people~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:1323 |
| Undo "Tagged ..." | Removed {tag} from {name} / Removed {tag} from {count} people ~~Restored {count} person / Restored {count} people~~ | — | — | — | Toast | MemberDirectory.tsx:1323 |
| Remove a tag from the selected people from the selection bar | Removed {tag} from {name} / Removed {tag} from {count} people ~~Removed {tags} from {count} person / Removed {tags} from {count} people~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:2030 |
| Undo "Removed {tag} from ..." | {tag} put back on {name} / {tag} put back on {count} people ~~Restored {count} person / Restored {count} people~~ | — | — | — | Toast | MemberDirectory.tsx:2030 |
| Finish an import | Added {name} / Added {count} people ~~Added {count} person / Added {count} people~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:1362 |
| Undo "Added ..." after an import | Removed {name} / Removed {count} people ~~Change undone~~ | — | — | — | Toast | MemberDirectory.tsx:1362 |
| Rename a tag in the tag manager | Same: Renamed {from} to {to} | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:1402 |
| Undo "Renamed ..." | Renamed {to} back to {from} ~~Change undone~~ | — | — | — | Toast | MemberDirectory.tsx:1402 |
| Confirm Delete tag in the tag manager | Deleted the {name} tag ~~Deleted tag {name}~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:1425 |
| Undo "Deleted the {name} tag" | Restored the {name} tag ~~Change undone~~ | — | — | — | Toast | MemberDirectory.tsx:1425 |
| Confirm a delete from the selection bar, the Delete key or a bulk delete | Deleted {name} / Deleted {count} people ~~Deleted {count} person / Deleted {count} people~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:2040 |
| Undo "Deleted ..." | Restored {name} / Restored {count} people ~~Restored {count} person / Restored {count} people~~ | — | — | — | Toast | MemberDirectory.tsx:2040 |
| Save the Add person dialog | Added {name} ~~Added {firstName}~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:2449 |
| Undo "Added {name}" | Removed {name} ~~Change undone~~ | — | — | — | Toast | MemberDirectory.tsx:2449 |
| Save the Edit person dialog | Updated {name}'s details ~~Details saved~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:2474 |
| Undo "Updated {name}'s details" | Restored {name}'s previous details ~~Change undone~~ | — | — | — | Toast | MemberDirectory.tsx:2474 |
| Save an edited payment | Updated {name}'s payment ~~Payment updated~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:2492 |
| Undo "Updated {name}'s payment" | Restored the {old amount} payment ~~Change undone~~ | — | — | — | Toast | MemberDirectory.tsx:2492 |
| Record a new payment | Same: Recorded {amount} (Canadian dollars, for example "$25.00") | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:2497 |
| Undo "Recorded {amount}" | Removed the {amount} payment ~~Change undone~~ | — | — | — | Toast | MemberDirectory.tsx:2497 |
| Confirm Delete payment | Deleted the {amount} payment ~~Payment deleted~~ | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:2515 |
| Undo "Deleted the {amount} payment" | Restored the {amount} payment ~~Change undone~~ | — | — | — | Toast | MemberDirectory.tsx:2515 |
| Confirm Delete person from the person panel | Same: Deleted {name} | — | — | Same: Undo | Toast with action | MemberDirectory.tsx:2532 |
| Undo "Deleted {name}" | Restored {name} ~~Restored 1 person~~ | — | — | — | Toast | MemberDirectory.tsx:2532 |

## 2. Empty states

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| The list is empty because there are no people at all (state lab: Empty) | No people yet ~~No one here yet~~ | Add a person, or import people from a spreadsheet ~~Add a member, or import the people who already pay.~~ | UsersRound | Add person ~~Add member~~ (icon Plus) | EmptyState | MemberDirectory.tsx:2314, MemberDirectory.tsx:2315, MemberDirectory.tsx:2317 |
| There are people, but none are subscribed and no search or filter is on | No one is subscribed ~~No subscribed members~~ | Unsubscribed and cancelled people are hidden ~~Unsubscribed and cancelled people are hidden.~~ | UsersRound | Same: Show everyone | EmptyState | MemberDirectory.tsx:2304, MemberDirectory.tsx:2305, MemberDirectory.tsx:2308 |
| A search finds nothing | Same: No people match “{query}” | Same: Searched names, emails and tags. Check the spelling, or clear the search. | SearchX | Same: Clear search (icon X) | EmptyState (kit) | ListPage.tsx:276, ListPage.tsx:277, ListPage.tsx:24 |
| Filters hide everyone | Same: No people with these filters | Clear a filter to see more ~~Try removing a filter to see more.~~ | FunnelX | Same: Clear filters (icon FunnelX) | EmptyState (kit) | ListPage.tsx:294, ListPage.tsx:295, ListPage.tsx:27 |
| A search and filters together find nothing | Same: No people with these filters match “{query}” | Same: Searched names, emails and tags with these filters on. Check the spelling, or clear the search and filters. | SearchX | Same: Clear search and filters (icon X) | EmptyState (kit) | ListPage.tsx:258, ListPage.tsx:259, ListPage.tsx:30 |
| The Tags column filter's own search finds nothing | — | Same: Nothing matches that search. (NEEDS APPROVAL, left for the PM) | — | — | Inline note | Table.tsx:601, Table.tsx:36 |
| The Tags filter in the toolbar has a search that finds nothing | — | No tags match ~~No tags match that search.~~ | — | — | Inline note | MemberDirectory.tsx:846 |
| The Tags or Not tagged filter has no tags at all | — | Same: No tags yet | — | — | Inline note | MemberDirectory.tsx:846 |
| A filter such as Interests or Location has no values | — | No answers yet ~~No values yet~~ | — | — | Inline note | MemberDirectory.tsx:757 |
| The tag manager has no tags | — | No tags yet ~~No tags yet.~~ | — | — | Inline note | TagManager.tsx:312 |
| The bulk tag popover search matches nothing while tags exist | — | No tags match ~~No tags match.~~ | — | — | Inline note | BulkTagsPopover.tsx:241 |
| The bulk tag popover has no tags at all | — | Same: No tags yet. Type a name to create one. | — | — | Inline note | BulkTagsPopover.tsx:241 |
| Person panel, Intake form tab, the person has not answered | — | They haven't filled in the intake form yet ~~They haven't answered the intake questions yet.~~ | — | — | Inline note | MemberSheet.tsx:1749 |
| Person panel, Activity or Emails tab, nothing to show | — | No activity yet (Activity tab) / No emails yet (Emails tab) ~~No activity yet.~~ | — | — | Inline note | MemberSheet.tsx:1802 |
| Person panel, searching the timeline finds nothing | — | No activity matches “{query}” ~~No activity matches “{query}”.~~ | — | — | Inline note | MemberSheet.tsx:1802 |
| Person panel, no email on file | — | No email ~~No email on file~~ | — | — | Inline note | MemberSheet.tsx:1067 |
| Person panel, intake question not answered | — | Same: Skipped | — | — | Inline note | MemberSheet.tsx:601 |
| State lab One section empty on the person panel | (empties the Activity, Emails and Payments sections, so the rows above show) | — | — | — | — | MemberSheet.tsx:1140 |

## 3. Error states

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| The list could not load (state lab: Couldn't load, or One section failed) | Same: Couldn't load people | Same: Try again in a moment. If it keeps happening, tell an SDC admin. | CircleAlert | Same: Try again (icon RotateCw) | EmptyState, role alert | ListStates.tsx:159, ListStates.tsx:160, ListStates.tsx:164 |
| The page does not exist (state lab: Page not found) | Same: Page not found | Same: This page doesn't exist or has moved. Use the sidebar to find what you need. | FileQuestion | — | EmptyState, replaces the page | ListStates.tsx:186, ListStates.tsx:187 |
| The person cannot open the page (state lab: No permission) | Same: You don't have access to People | Ask an SDC admin to give you access, then try again ~~Ask an SDC admin to give you access, then try again.~~ | Lock | — | EmptyState, replaces the page | ListStates.tsx:192, ListStates.tsx:193 |
| The Tags filter cannot load its options (state lab: Couldn't load tags) | — | Couldn't load tags ~~Couldn't load tags.~~ | CircleAlert | Same: Try again | Inline error, role alert | ListStates.tsx:215, ListStates.tsx:217 |
| The person panel cannot load (state lab: Couldn't load) | Couldn't load this person ~~Couldn't load this member.~~ | Same: Try again in a moment. If it keeps happening, tell an SDC admin. | CircleAlert | Same: Try again | InlineAlert, danger | MemberSheet.tsx:1083 |
| The note cannot load (state lab: Couldn't load the note) | Couldn't load the note ~~Couldn't load the note.~~ | Everything else here still works ~~The rest of this member still works.~~ | CircleAlert | Same: Try again | InlineAlert, danger | MemberSheet.tsx:1118 |
| The activity cannot load (state lab: Couldn't load activity, or One section failed) | Couldn't load activity ~~Couldn't load activity.~~ | Emails, payments and changes are hidden until it loads ~~Emails, payments and changes are hidden until it loads.~~ | CircleAlert | Same: Try again | InlineAlert, danger | MemberSheet.tsx:1754 |
| The intake answers cannot load (state lab: Couldn't load intake answers) | Couldn't load the intake answers ~~Couldn't load the intake answers.~~ | Everything else here still works ~~The rest of this member still works.~~ | CircleAlert | Same: Try again | InlineAlert, danger | MemberSheet.tsx:1745 |
| Opening an email in the timeline fails (state lab: Couldn't load an email, or One section failed) | Couldn't load this email ~~Couldn't load this email.~~ | The rest of the timeline still works ~~The rest of the timeline still works.~~ | CircleAlert | Same: Try again | InlineAlert, danger | MemberSheet.tsx:1856 |
| Retrying a failed section | — | (the section shows its loading lines for about 0.8 seconds, then fails again while the toggle is on) | — | — | — | SheetStates.tsx:160, SheetStates.tsx:173 |
| Saving tags in the person panel fails (state lab: Save failed) | Couldn't save the tags ~~Couldn't save the tags.~~ | Your changes are still here ~~Your changes are still here.~~ | CircleAlert | Same: Try again; Discard changes | InlineAlert, danger | MemberSheet.tsx:1300, MemberSheet.tsx:1306 |
| Someone else changed the tags (state lab: Changed by someone else) | Someone else changed these tags ~~Someone else changed these tags.~~ | They changed this person's tags while you were editing. Choose which tags to keep. ~~They updated this member while you were editing. Keep yours to replace theirs, or use theirs.~~ | TriangleAlert | Same: Keep my tags; Use their tags | InlineAlert, warning | MemberSheet.tsx:1312, MemberSheet.tsx:1318 |
| A tag name is rejected (state lab: Validation error) | That tag name is too long ~~That tag name is too long.~~ | Same: Tag names can have up to 30 characters. Shorten “{tag}” and try again. | CircleAlert | Same: Edit tags; Discard changes | InlineAlert, danger | MemberSheet.tsx:1323, MemberSheet.tsx:1329 |
| Saving tags while offline (state lab: Offline) | You're offline ~~You're offline.~~ | Reconnect, then try again. Your changes are still here. ~~Your changes are kept here. Reconnect, then try again.~~ | TriangleAlert | Same: Try again | InlineAlert, info | MemberSheet.tsx:1333, MemberSheet.tsx:1334 |
| Saving tags while signed out (state lab: Session expired) | You've been signed out ~~You've been signed out.~~ | Sign in again, then try again. Your changes are still here. ~~Your changes are kept here. Sign in again, then try again.~~ | TriangleAlert | Same: Try again | InlineAlert, warning | MemberSheet.tsx:1338, MemberSheet.tsx:1339 |
| A dialog or the bulk tag popover save fails (state lab: Save failed) | — | Same: Couldn't save. Your changes are still here. Try again in a moment. | CircleAlert | Same: Try again | Inline note, danger, role alert | DialogStates.tsx:66, DialogStates.tsx:242 |
| A dialog or the bulk tag popover save while signed out (state lab: Session expired) | — | You've been signed out. Sign in again in another tab, then try again. Your changes are still here. ~~You've been signed out. Sign in again in another tab, then come back and try again. Your changes are still here.~~ | CircleAlert | Same: Try again | Inline note, danger, role alert | DialogStates.tsx:67, DialogStates.tsx:242 |
| A dialog or the bulk tag popover save while offline (state lab: Offline) | — | You're offline. Reconnect, then try again. Your changes are still here. ~~You're offline. Check your connection, then try again. Your changes are still here.~~ | CircleAlert | Same: Try again | Inline note, danger, role alert | DialogStates.tsx:68, DialogStates.tsx:242 |
| A dialog save hits an edit by someone else (state lab: Changed by someone else) | Same: Changed by someone else | {conflict message}, see the rows below | TriangleAlert | Use their version; Keep my version ~~Use theirs; Keep mine~~ | Inline note, warning, role alert | DialogStates.tsx:254, DialogStates.tsx:255, DialogStates.tsx:285, DialogStates.tsx:288 |
| Edit person dialog, conflict message | Same: Changed by someone else | Another admin changed this person's email to updated.contact@example.org while you were editing ~~...while you were editing.~~ | TriangleAlert | Use their version; Keep my version ~~Use theirs; Keep mine~~ | Inline note, warning | dialogs.tsx:263 |
| Edit payment dialog, conflict message | Same: Changed by someone else | Another admin changed this payment's amount to 30 while you were editing ~~...while you were editing.~~ | TriangleAlert | Use their version; Keep my version ~~Use theirs; Keep mine~~ | Inline note, warning | dialogs.tsx:159 |
| Edit note dialog, conflict message (NoteDialog is exported but not opened from this page) | Same: Changed by someone else | Same: Someone else edited this note while you were typing. Their version is “Called on 12 March and confirmed the new address.” | TriangleAlert | Use their version; Keep my version ~~Use theirs; Keep mine~~ | Inline note, warning | dialogs.tsx:84 |
| Edit note, server rejects the note (state lab: Validation error; dialog not opened from this page) | — | Same: We couldn't accept this note. Shorten it and try again. | — | — | Field error | dialogs.tsx:96 |
| Payment dialog, amount empty or not above zero | — | Enter an amount, for example 25 ~~Enter an amount, for example 25.~~ | — | — | Field error | dialogs.tsx:178 |
| Payment dialog, date empty or in the future | — | Choose today or an earlier date ~~Choose today or an earlier date.~~ | — | — | Field error | dialogs.tsx:179 |
| Payment dialog, paying for someone else with no one chosen | — | Choose who this payment is for ~~Choose who this payment is for.~~ | — | — | Field error | dialogs.tsx:180 |
| Payment dialog, server rejects the amount (state lab: Validation error) | — | Same: We couldn't accept this amount. Check it and try again. | — | — | Field error | dialogs.tsx:181 |
| Edit person or Add person dialog, first name empty | — | Enter a first name ~~Enter a first name.~~ | — | — | Field error | dialogs.tsx:279, dialogs.tsx:342 |
| Edit person or Add person dialog, email not valid | — | Enter an email like name@example.com ~~Enter an email like name@example.com.~~ | — | — | Field error | dialogs.tsx:280, dialogs.tsx:343 |
| Edit person dialog, email belongs to someone else (state lab: Email already in use) | — | Someone else already uses this email ~~Someone else in the directory uses this email.~~ | — | — | Field error | dialogs.tsx:281 |
| Add person dialog, email already added (state lab: Email already in use) | — | This person is already added ~~This person is already in the directory.~~ | — | — | Field error | dialogs.tsx:344 |
| Edit person or Add person dialog, server rejects the email (state lab: Validation error) | — | Same: We couldn't accept this email. Check it and try again. | — | — | Field error | dialogs.tsx:282, dialogs.tsx:345 |
| Add person dialog, first payment not above zero | — | Enter an amount, for example 25, or leave it blank ~~Enter an amount, for example 25, or leave it blank.~~ | — | — | Field error | dialogs.tsx:346 |
| Add person dialog opened in gift mode (not opened from this page), amount not above zero | — | Enter an amount, for example 25 ~~Enter an amount, for example 25.~~ | — | — | Field error | dialogs.tsx:346 |
| Tag manager, renaming a tag to a name that exists | — | Same: A tag with this name already exists. Choose another name. | — | — | Field error | TagManager.tsx:140 |
| Import step 1, the file has no people or can't be read | — | We couldn't find any people in that file. Check it has a header row and at least one person, then choose it again. ~~We couldn't find any people in that file. Check it's a CSV with a header row and at least one row of data, then choose it again.~~ | CircleAlert | — | Inline error, role alert | ImportMembersDialog.tsx:258 |
| Import step 1, the file has too many rows | — | That file has {rows} rows. You can import up to {max} at a time, so split it into smaller files. ~~That file has {rows} rows. Import up to {max} at a time: split the file and import it in parts.~~ (max is 1,000) | CircleAlert | — | Inline error, role alert | ImportMembersDialog.tsx:262 |
| Import step 2, no column matched to Email | — | Same: Choose which column has email addresses. Every person needs one. | CircleAlert | — | Inline error, role alert | ImportMembersDialog.tsx:283 |
| Import step 3, a row has a problem | — | No email / Check the email address / Repeats an earlier row in this file / Already added ~~Already in the directory~~ (see the Import from a spreadsheet section for the full row text) | CircleAlert or Minus | — | Row result | ImportMembersDialog.tsx:194 |

## 4. Alerts and banners

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| The page is offline (state lab: Offline) | — | You're offline. You can look around, but you'll need to reconnect to make changes. ~~You're offline. You can still look around, but you'll need to reconnect to make changes.~~ | WifiOff | — | Page banner, info | ListStates.tsx:61 |
| The connection is back and the page is loading what changed (state lab: Reconnecting) | — | Reconnecting. Loading the latest changes… ~~Back online. Catching up on changes…~~ | RefreshCw | — | Page banner, info | ListStates.tsx:68 |
| The session expired (state lab: Session expired) | — | You've been signed out. Sign in again to keep working. Your changes are still here. ~~You've been signed out. Sign in again to keep working. Nothing you've entered is lost.~~ | Lock | Same: Sign in again | Page banner, info | ListStates.tsx:75, ListStates.tsx:77 |
| Person panel, the session expired (state lab: Session expired) | You've been signed out ~~You've been signed out.~~ | Sign in again to save. Your changes are still here. ~~Sign in again to save changes. What you've typed here is kept.~~ | TriangleAlert | — | InlineAlert, warning | SheetStates.tsx:186, SheetStates.tsx:187 |
| Person panel, offline (state lab: Offline) | — | You're offline. You can look around, but you'll need to reconnect to make changes. ~~You're offline. You can still read this member, but you'll need to reconnect to make changes.~~ | WifiOff | — | InlineAlert, info | SheetStates.tsx:191 |
| Person panel, reconnecting (state lab: Reconnecting) | — | Reconnecting. Loading the latest changes… ~~Back online. Catching up on changes…~~ | RefreshCw | — | InlineAlert, info | SheetStates.tsx:195 |
| Person panel for a person who cancelled | — | Cancelled their membership on {date} ~~Cancelled their membership on {date}.~~ | UserX | — | InlineAlert, warning | MemberSheet.tsx:1417 |
| Person panel for a person who unsubscribed, date known | — | Unsubscribed from emails on {date} ~~Unsubscribed from member emails on {date}.~~ | MailX | — | InlineAlert, info | MemberSheet.tsx:1425 |
| Person panel for a person who unsubscribed, date unknown | — | Unsubscribed from emails ~~Unsubscribed from member emails.~~ | MailX | — | InlineAlert, info | MemberSheet.tsx:1425 |
| Name column for a person who cancelled | — | Same: Cancelled | — | — | Badge | MemberDirectory.tsx:1895 |
| Name column for a person who unsubscribed | — | Same: Unsubscribed | — | — | Badge | MemberDirectory.tsx:1895 |
| Import step 3, tags that do not exist yet | — | New tags will be created: {tags} ~~New tags will be created: {tags}.~~ | — | — | Hint | ImportMembersDialog.tsx:427 |
| Import step 3, more than 50 rows | — | Showing the first 50 of {count} rows ~~Showing the first 50 of {count} rows.~~ | — | — | Hint | ImportMembersDialog.tsx:451 |
| Import step 3, some people already added | — | People already added are skipped ~~People already in the directory are skipped.~~ | — | — | Hint | ImportMembersDialog.tsx:452 |

## 5. Dialogs and confirmations

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Delete payment from the Edit payment dialog | Delete the {amount} payment? ~~Delete this payment?~~ | {name}'s lifetime value goes down by {amount} ~~It's removed from {fullName}'s payments and their total.~~ | — | Same: Cancel; Delete payment | ConfirmDialog, danger | MemberDirectory.tsx:2508, MemberDirectory.tsx:2509, MemberDirectory.tsx:2510 |
| Delete one person (panel menu, selection bar or Delete key) | Delete {fullName}? | Their payments, note and activity will be deleted too | — | Cancel, Delete person | Alert dialog, focus on the dialog | dialogs.tsx (DeletePeopleDialog) |
| Delete several people | Delete {count} people? | {up to 3 names} and {n} more will be deleted with their payments, notes and activity | — | Cancel, Delete {count} people | Alert dialog, focus on the dialog | dialogs.tsx (DeletePeopleDialog) |
| Every delete, under the description | — | Emails to them stop, including automatic ones / They aren't notified, so tell them yourself if needed | MailX, BellOff | — | Muted list | dialogs.tsx (DeletePeopleDialog) |
| Deleting anyone who pays (recorded payments, not cancelled) | — | {fullName} pays / {up to 3 names} and {n} more pay / Both pay / All {k} pay, then: for a membership. Their payments will be cancelled for good, so you won't receive any more from them. | CreditCard | — | Danger alert | dialogs.tsx (DeletePeopleDialog) |
| Deleting anyone who pays | To confirm, type "I understand" (field label) | Error if Delete is pressed first: Type "I understand" to delete | — | — | Field | dialogs.tsx (DeletePeopleDialog) |
| A delete that included anyone who pays | Deleted {name} / Deleted {count} people | — | — | No Undo | Toast | MemberDirectory.tsx (deletePeople) |
| Delete a tag that people have | Same: Delete the {tag} tag? | This removes it from {count} person / {count} people ~~It will be removed from {count} person. / It will be removed from {count} people.~~ | — | Same: Cancel; Delete tag | ConfirmDialog, danger | TagManager.tsx:367, TagManager.tsx:370, TagManager.tsx:373 |
| Delete a tag nobody has | Same: Delete the {tag} tag? | No one has this tag ~~No one has this tag.~~ | — | Same: Cancel; Delete tag | ConfirmDialog, danger | TagManager.tsx:367, TagManager.tsx:371, TagManager.tsx:373 |
| Any confirm dialog while the action is saving (state lab: Saving) | — | (the confirm button shows a spinner and ignores clicks) | LoaderCircle | — | — | DialogStates.tsx:195, dialogs.tsx:437 |
| Any confirm dialog with state lab Long text on | — | {description} ({long email address}) | — | — | — | dialogs.tsx:425 |
| Add person in the header | Add person ~~Add member~~ | — | Plus on the trigger | Cancel; Add person ~~Add member~~ | Dialog | dialogs.tsx:316, dialogs.tsx:317, MemberDirectory.tsx:2146 |
| Add person dialog fields | — | Same: First name; Last name; Email; First payment (hint: Optional); Paid by (E-transfer, Cash or cheque, Online); Join date; checkbox "Send join emails" | — | — | Fields | dialogs.tsx:364, dialogs.tsx:365, dialogs.tsx:367, dialogs.tsx:369, dialogs.tsx:372, dialogs.tsx:377, dialogs.tsx:381, data.ts:104 |
| Add person dialog opened in gift mode (not opened from this page): amount field | — | Same: Amount (replaces First payment; the Join date field is hidden) | — | — | Fields | dialogs.tsx:369 |
| Edit person from the person panel menu | Edit person ~~Edit details~~ | — | — | Same: Cancel; Save changes | Dialog | dialogs.tsx:273, dialogs.tsx:296 |
| Edit person dialog fields | — | Same: First name; Last name; Email | — | — | Fields | dialogs.tsx:290, dialogs.tsx:291, dialogs.tsx:293 |
| Record payment in the Payments tab | Same: Record payment | — | — | Same: Cancel; Record payment | Dialog | dialogs.tsx:172, dialogs.tsx:232 |
| Edit payment from the pencil on a payment row | Same: Edit payment | — | — | Same: Delete payment (ghost, left); Cancel; Save changes | Dialog | dialogs.tsx:172, dialogs.tsx:223, dialogs.tsx:227 |
| Payment dialog fields | — | Same: Amount; Date; Method (E-transfer, Cash or cheque, Online); This pays for (Their own membership, Someone else's; new payments only); Who it's for (placeholder: Choose a person); Note | — | — | Fields | dialogs.tsx:189, dialogs.tsx:192, dialogs.tsx:197, dialogs.tsx:206, dialogs.tsx:208, dialogs.tsx:209, dialogs.tsx:214, dialogs.tsx:215, dialogs.tsx:218 |
| Add or edit note in a dialog (NoteDialog is exported but not opened from this page) | Same: Edit note / Add note | — | — | Same: Cancel; Save note / Add note | Dialog | dialogs.tsx:91, dialogs.tsx:114 |
| Edit note dialog field (not opened from this page) | — | Same: Note | — | — | Field | dialogs.tsx:102 |
| Any dialog with a conflict (state lab: Changed by someone else) | — | — | — | Use their version; Keep my version ~~Use theirs; Keep mine~~ (replace the submit button) | Dialog actions | DialogStates.tsx:285, DialogStates.tsx:288 |
| Any dialog while saving (state lab: Saving) | — | — | LoaderCircle (spinner on the submit button) | — | — | DialogStates.tsx:196 |
| More ways to add people menu, Import from a spreadsheet | Import people from a spreadsheet ~~Import members from CSV~~ | Same: Step {n} of 3: Choose a file / Match columns / Review | — | see Import from a spreadsheet | Dialog | ImportMembersDialog.tsx:322, ImportMembersDialog.tsx:324 |

## 6. Loading states

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| The list is loading (state lab: Loading, or Slow loading) | — | Same: Loading (screen readers only; the rows are grey placeholders) | — | — | Skeleton rows, aria-busy | ListStates.tsx:131 |
| The list is still loading after about 4 seconds (state lab: Slow loading) | — | Same: Still loading. This is taking longer than usual. | — | — | Note, shown and announced | ListStates.tsx:131, ListStates.tsx:132 |
| Opening a filter popover (state lab: Slow loading) | — | Same: Loading options (screen readers only; the options are grey placeholders) | — | — | Skeleton rows, aria-busy | ListStates.tsx:251 |
| Typing in search, changing a filter or changing page (state lab: Slow loading) | — | Same: Updating results (screen readers only; the table dims) | — | — | Table busy | MemberDirectory.tsx:2277 |
| Person panel is loading (state lab: Loading, or Slow loading) | — | Loading details ~~Loading member details~~ (screen readers only) | — | — | Skeleton | MemberSheet.tsx:1086 |
| Person panel title while loading | — | Loading person ~~Loading member~~ | — | — | aria-label | MemberSheet.tsx:1051 |
| Person panel loading for a while (state lab: Slow loading) | — | Same: Still loading. This is taking longer than usual. | — | — | Note, role status | SheetStates.tsx:61 |
| Person panel timeline refreshing (switching tabs or searching, state lab: Slow loading or Slow activity) | — | Same: Updating activity (screen readers only; rows dim and the tab shows a spinner) | LoaderCircle | — | Spinner on the tab | MemberSheet.tsx:1771 |
| Show earlier years in the timeline (state lab: Slow loading) | — | Same: Loading earlier activity (screen readers only; three placeholder rows) | LoaderCircle | — | Spinner on the button | MemberSheet.tsx:1772 |
| Opening an email in the timeline (state lab: Slow loading) | — | Same: Loading email (screen readers only) | — | — | Skeleton | MemberSheet.tsx:1851 |
| Retrying a failed section | — | (the section shows two placeholder lines) | — | — | Skeleton | SheetStates.tsx:173 |
| Saving tags in the person panel (state lab: Saving) | — | Same: Saving tags… | — | — | Muted text, role status | MemberSheet.tsx:1281 |
| The Save tags button while tags save (state lab: Saving) | — | Same: Saving… | — | (button label) | Muted button | MemberSheet.tsx:1270 |
| Bulk tag popover opens (state lab: Slow loading) | — | Same: Loading tags (screen readers only; four placeholder rows) | — | — | Skeleton rows | BulkTagsPopover.tsx:202 |
| Bulk tag popover while a tag change saves (state lab: Saving) | — | Same: Saving… | — | — | Note, role status | BulkTagsPopover.tsx:249 |
| Import step 3 submit while saving (state lab: Saving) | — | (the Add button shows a spinner at the same width) | LoaderCircle | — | — | DialogStates.tsx:196 |

## 7. Page header, buttons and menus

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Page title (list loaded) | Same: People ({count}) | Screen readers hear: People, {count} subscribed ~~People, {count} member / {count} members~~ | — | — | Page title | MemberDirectory.tsx:2116, MemberDirectory.tsx:2117, MemberDirectory.tsx:2118 |
| Page title while loading or failed | Same: People | — | — | — | Page title | MemberDirectory.tsx:2113 |
| Header, copy emails (tooltip and aria-label) | — | Same: Copy email addresses of {count} selected person / Copy email addresses of {count} selected people (with a selection) | Copy | Copy button | Secondary icon button | MemberDirectory.tsx:1293, MemberDirectory.tsx:2125, MemberDirectory.tsx:2126 |
| Header, copy emails with no selection (tooltip and aria-label) | — | Same: Copy {count} email address / Copy {count} email addresses | Copy | Copy button | Secondary icon button | MemberDirectory.tsx:1293, MemberDirectory.tsx:2125 |
| Header, download | — | Same: Download as spreadsheet | Download | Download button | Secondary icon button | MemberDirectory.tsx:2132, MemberDirectory.tsx:2133 |
| Header, tag manager | — | Same: Manage tags | Tags | Opens the Tags panel | Secondary icon button | MemberDirectory.tsx:2138, MemberDirectory.tsx:2139 |
| Header, primary button | — | — | Plus | Add person ~~Add member~~ | Primary (split button) | MemberDirectory.tsx:2146 |
| Header, arrow next to Add person (aria-label) | — | More ways to add people ~~More ways to add~~ | ChevronDown | Opens the menu | Split button | MemberDirectory.tsx:2150 |
| More ways to add people menu | — | — | FileUp | Import from a spreadsheet ~~Import from CSV~~ | Menu item | MemberDirectory.tsx:2157 |
| More ways to add people menu | — | — | Link2 | Same: Create sign-up link | Menu item | MemberDirectory.tsx:2161 |
| Search box | — | Search names, emails and tags (placeholder and aria-label) ~~Search name, email or tag (placeholder); Search by name, email or tag (aria-label)~~ | search icon (kit) | Same: Clear search (kit) | SearchField | MemberDirectory.tsx:2178, MemberDirectory.tsx:2179 |
| Selection bar appears after selecting people | — | Same: {count} selected | — | — | Bar, role status | MemberDirectory.tsx:2358 |
| Selection bar, fewer than all rows selected | — | Same: Select all {total} (tooltip and aria-label) | ListChecks | Select all | Ghost icon button | MemberDirectory.tsx:2362, MemberDirectory.tsx:2363 |
| Selection bar | — | Add or remove tags ~~Tags~~ (tooltip and aria-label) | Tag | Opens the bulk tag popover | Ghost icon button | MemberDirectory.tsx:423, MemberDirectory.tsx:424 |
| Selection bar | — | Same: Copy email addresses (tooltip and aria-label) | Copy | Copy | Ghost icon button | MemberDirectory.tsx:2377, MemberDirectory.tsx:2378 |
| Selection bar | — | Same: Delete (tooltip and aria-label) | Trash2 | Delete | Ghost icon button | MemberDirectory.tsx:2382, MemberDirectory.tsx:2383 |
| Selection bar | — | Same: Clear selection (tooltip and aria-label) | X | Clear | Ghost icon button | MemberDirectory.tsx:2388, MemberDirectory.tsx:2389 |
| Selection bar (group label) | — | Same: Selected people | — | — | aria-label | MemberDirectory.tsx:2342 |
| State lab: Offline, Session expired, Reconnecting | See Alerts and banners | — | — | — | — | ListStates.tsx:43 |

## 8. Filters

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Filter row (always) | Same: Filters (group label for screen readers) | — | — | — | aria-label | MemberDirectory.tsx:2190 |
| Filter button, Tags | Same: Tags | — | ChevronDown | Opens the Tags filter | Outline button | MemberDirectory.tsx:616, MemberDirectory.tsx:2207 |
| Filter button, Joined | Same: Joined | — | ChevronDown | Opens the Joined filter | Outline button | MemberDirectory.tsx:619, MemberDirectory.tsx:2207 |
| Filter button, Membership | Same: Membership | — | ChevronDown | Opens the Membership filter | Outline button | MemberDirectory.tsx:618, MemberDirectory.tsx:2207 |
| More filters menu button (only while some are unused) | More filters ~~More~~ | — | ChevronDown | Opens the menu | Outline button | MemberDirectory.tsx:2232 |
| More filters menu items | Same: Not tagged; Interests; Ways to help; Location; Availability | — | — | Adds that filter | Menu items | MemberDirectory.tsx:617, MemberDirectory.tsx:620, MemberDirectory.tsx:621, MemberDirectory.tsx:622, MemberDirectory.tsx:623 |
| A filter is applied (aria-label on the button) | — | Same: {filter}, applied: {summary} | — | — | aria-label | MemberDirectory.tsx:2205 |
| Tags filter applied (summary) | — | Same: Tagged {a, b or c} | — | — | Summary | MemberDirectory.tsx:1825 |
| Not tagged filter applied (summary) | — | Same: Not tagged {a, b or c} | — | — | Summary | MemberDirectory.tsx:1827 |
| Membership filter applied (summary) | — | Same: {Subscribed, Unsubscribed or Cancelled} | — | — | Summary | MemberDirectory.tsx:1829, MemberDirectory.tsx:599, MemberDirectory.tsx:600, MemberDirectory.tsx:601 |
| Joined filter applied (summary) | — | Same: Joined {rule in lower case, for example between Nov 1 and Nov 30, 2026} | — | — | Summary | MemberDirectory.tsx:1834, DateRulePicker.tsx:27 |
| Interests, Ways to help, Location or Availability applied (summary) | — | Same: {filter}: {a, b or c} | — | — | Summary | MemberDirectory.tsx:1837 |
| Tags or Not tagged popover | Same: {filter name} (group label) | Search tags (placeholder and aria-label) ~~Search tags (placeholder); Search {filter name in lower case} (aria-label)~~ | search icon (kit) | Clear filter or Remove filter; Cancel; Apply ~~Reset or Remove filter; Cancel; Apply~~ | Popover | MemberDirectory.tsx:825, MemberDirectory.tsx:826, MemberDirectory.tsx:833 |
| Membership popover options | Same: Membership (group label) | Same: Subscribed; Unsubscribed; Cancelled (each with a count) | — | Show subscribed only; Cancel; Apply ~~Reset; Cancel; Apply~~ | Popover | MemberDirectory.tsx:743, MemberDirectory.tsx:599 |
| Interests, Ways to help, Location, Availability popover | Same: {filter name} (group label) | Same: options come from the people's intake answers, each with a count; "Other" for typed answers | — | Clear filter or Remove filter; Cancel; Apply ~~Reset or Remove filter; Cancel; Apply~~ | Popover | MemberDirectory.tsx:743, MemberDirectory.tsx:645 |
| Joined popover | Same: Joined | Same: Between; Before; After (toggle); Pick dates (when no date is chosen) | — | Clear dates; Cancel; Apply ~~Reset; Cancel; Apply~~ | Popover | MemberDirectory.tsx:922, DateRulePicker.tsx:112, DateRulePicker.tsx:113, DateRulePicker.tsx:114, DateRulePicker.tsx:27 |
| Joined rule when a range is chosen | — | Same: Between {date} and {date} / Before {date} / After {date} | — | — | Rule text | DateRulePicker.tsx:28, DateRulePicker.tsx:30, DateRulePicker.tsx:31, DateRulePicker.tsx:33 |
| A filter has a value to clear | — | — | — | Clear filter (Clear dates on Joined, Show subscribed only on Membership) ~~Reset~~ | Ghost button | MemberDirectory.tsx:1698 |
| An extra filter (More filters menu) with no value yet | — | — | — | Same: Remove filter | Ghost button | MemberDirectory.tsx:1699 |
| Filter popover footer | — | — | — | Same: Cancel; Apply | Ghost; Primary | MemberDirectory.tsx:898, MemberDirectory.tsx:901 |
| Screen readers, search or filters changed | — | Same: {count} person matches / {count} people match | — | — | Live region, polite | MemberDirectory.tsx:2270 |
| Filter popover with state lab Slow loading | See Loading states | — | — | — | — | ListStates.tsx:247 |
| The Tags filter fails (state lab: Couldn't load tags) | See Error states | — | — | — | — | ListStates.tsx:211 |
| Tags column header filter (the small funnel on the Tags column) | Same: Show tag | Same: Search tags (placeholder and aria-label); Nothing matches that search.; trigger aria-label: Filter Tag / Filter Tag, {count} selected (NEEDS APPROVAL, left for the PM) | ListFilter | Same: Clear; Apply | Popover | MemberDirectory.tsx:1941, Table.tsx:32, Table.tsx:33, Table.tsx:35, Table.tsx:36, Table.tsx:38, Table.tsx:39 |

## 9. Table columns and cells

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Table (aria-label) | Same: People | — | — | — | aria-label | MemberDirectory.tsx:2279 |
| First column header | — | Same: Select all (checkbox aria-label) | — | Selects every row on the page | Checkbox | MemberDirectory.tsx:1859 |
| First column cell | — | Same: Select {fullName} / Select person (aria-label) | — | Selects the row | Checkbox | MemberDirectory.tsx:1877 |
| Column header | Same: Name | — | — | Sort | Sortable | MemberDirectory.tsx:1888 |
| Name cell with no name (state lab: Partial data) | — | Same: No name | — | — | Cell | MemberDirectory.tsx:1894 |
| Name cell on narrow screens, no email (state lab: Partial data) | — | Same: No email | — | — | Cell | MemberDirectory.tsx:1897 |
| Column header (shown by default) | Same: Email | — | — | Sort | Sortable | MemberDirectory.tsx:950 |
| Email cell | — | Same: {email}; aria-label: Copy {email} | Copy (on hover) | Copies the email | Ghost button | MemberDirectory.tsx:1919, MemberDirectory.tsx:1928 |
| Email cell with no email (state lab: Partial data) | — | Same: No email | — | — | Cell | MemberDirectory.tsx:1932 |
| Column header (shown by default) | Same: Tags | — | ListFilter (filter) | Filter | Filterable | MemberDirectory.tsx:951, MemberDirectory.tsx:1938 |
| Tags cell with more than two tags | — | Same: +{count} | — | — | Cell | MemberDirectory.tsx:1959 |
| Column header (shown by default) | Same: Lifetime value | — | — | Sort | Sortable, right aligned | MemberDirectory.tsx:952 |
| Column header (off by default) | Same: Joined | — | — | Sort | Sortable | MemberDirectory.tsx:953 |
| Column header (off by default) | Same: Location | — | — | Sort | Sortable | MemberDirectory.tsx:954 |
| Column header (off by default) | Same: Referred by | — | — | Sort | Sortable | MemberDirectory.tsx:955 |
| Location or Referred by cell with no value | — | Same: — | — | — | Cell | MemberDirectory.tsx:1905 |
| Last column header | — | Same: Show columns (tooltip and aria-label) | Columns3 | Opens the columns menu | Ghost icon button | MemberDirectory.tsx:1981, MemberDirectory.tsx:1983 |
| Columns menu | — | Same: Name (always checked, disabled); Email; Tags; Lifetime value; Joined; Location; Referred by | — | Show or hide a column | Checkbox items | MemberDirectory.tsx:1991, MemberDirectory.tsx:950 |
| Sorting a column header (screen readers) | — | Same: {Column}, sorted ascending. Select to sort descending / {Column}, sorted descending. Select to sort ascending / {Column}. Select to sort | — | — | aria-label | Table.tsx:25, Table.tsx:27 |
| Below the table | — | Same: Showing {start}–{end} of {total}; Previous; Next; Page {n} (aria-label); Pagination (navigation aria-label) | — | Previous; Next; page numbers | Pagination | Pagination.tsx:105, Pagination.tsx:107, Pagination.tsx:116, Pagination.tsx:129, Pagination.tsx:143 |

## 10. Person panel

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Panel header, name | {fullName} / No name ~~Unnamed member~~ (state lab: Partial data) / Person ~~Member~~ (when the panel failed to load) | — | — | — | Heading | MemberSheet.tsx:1002, MemberSheet.tsx:1055 |
| Panel header, menu button (aria-label) | — | More actions for this person ~~More actions for this member~~ | Ellipsis | Opens the menu | Ghost icon button | MemberSheet.tsx:1031 |
| Panel menu | — | — | Pencil | Edit person ~~Edit member~~ | Menu item | MemberSheet.tsx:1038 |
| Panel menu | — | — | Trash2 | Delete person ~~Delete member~~ | Menu item, danger | MemberSheet.tsx:1043 |
| Panel header, email | — | {email}; No email ~~No email on file~~ (state lab: Partial data) | — | — | Text | MemberSheet.tsx:1067 |
| Panel header, hover the email | — | Same: Copy email (aria-label) | Copy | Copies the email | Ghost icon button | MemberSheet.tsx:1070 |
| Panel header, close (kit) | — | Same: Close panel (aria-label) | X | Close | Kit | Sheet.tsx:198 |
| Panel header, a person has no tags | — | — | Plus | Same: Add tag | Ghost button | MemberSheet.tsx:1291 |
| Panel header, a person has tags (hover) | — | Same: Edit tags (aria-label) | Pencil | Edit tags | Ghost icon button | MemberSheet.tsx:1284 |
| Panel header, editing tags | — | Same: Add a tag (placeholder and aria-label); Create “{query}” | Plus (on Create) | Save tags ~~Done~~ | Combobox, ghost button | MemberSheet.tsx:1257, MemberSheet.tsx:1264, MemberSheet.tsx:1265, MemberSheet.tsx:1270 |
| Note section title | Same: Note | Same: Updated {date} by {name} (tooltip on the title when a note exists; " by {name}" is dropped when there is no name) | — | — | Section | MemberSheet.tsx:1103, MemberSheet.tsx:1107 |
| Note section, no note yet | — | — | Plus | Add note ~~Add~~ | Quiet button | MemberSheet.tsx:1113 |
| Note section, has a note | — | — | Pencil | Edit note ~~Edit~~ | Quiet button | MemberSheet.tsx:1113 |
| Note editor | — | (text area labelled by the Note title) | — | Same: Cancel; Save note | Ghost; Primary | MemberSheet.tsx:1402, MemberSheet.tsx:1405 |
| Section labels while loading (aria-label) | — | Same: Note; Activity | — | — | aria-label | MemberSheet.tsx:1087, MemberSheet.tsx:1091, MemberSheet.tsx:1098 |
| Tabs (aria-label) | — | Details ~~Member details~~ | — | — | aria-label | MemberSheet.tsx:1710 |
| Tab | Same: Activity ({count}) | — | — | Show activity | Tab | MemberSheet.tsx:1711 |
| Tab | Same: Emails ({count}) | — | — | Show emails | Tab | MemberSheet.tsx:1712 |
| Tab | Same: Payments ({count}) | — | — | Show payments | Tab | MemberSheet.tsx:1713 |
| Tab | Same: Intake form | — | — | Show intake answers | Tab | MemberSheet.tsx:1714 |
| Activity or Emails tab, more than 12 items | — | Same: Search activity (placeholder and aria-label); Search emails (when on the Emails tab) | search icon (kit) | Same: Clear search (kit) | SearchField | MemberSheet.tsx:1691, MemberSheet.tsx:1759, MemberSheet.tsx:1760 |
| Activity or Emails tab, searching (screen readers) | — | Same: {count} match / {count} matches | — | — | Live region | MemberSheet.tsx:1773 |
| Activity timeline, group headers | — | Same: {Month} {year} (for example "October 2026"), then {year} for older years | — | — | Group header | MemberSheet.tsx:1494 |
| Activity timeline, older years collapsed | — | — | LoaderCircle (while loading) | Same: Show {year} | Secondary button | MemberSheet.tsx:1813 |
| Activity rows (kinds from the demo data) | — | Paid {amount}; {Method} · Gift for {name} · {note}; Joined via {source} (the demo source Referral ~~Member invite~~); Joined with a gift from {name}; Added by an admin; Tagged {tag}; Removed tag {tag}; Cancelled membership; Unsubscribed from emails ~~Unsubscribed from member emails~~; Rejoined SDC; Changed to {amount} a year; Attended {event}; {name} joined from their invite; Gave a membership to {name}; Sent by Suhanya | Banknote, Mail, UserPlus, CalendarCheck, User, Tag, Clock, CircleCheck | — | Timeline | MemberSheet.tsx:1458, MemberSheet.tsx:1460, data.ts:177, data.ts:351, data.ts:353, data.ts:367, data.ts:402, data.ts:407, data.ts:415, data.ts:421, data.ts:423, data.ts:452, data.ts:463, MemberDirectory.tsx:1307, MemberDirectory.tsx:1308 |
| Activity row, an email | Same: {email subject} | Same: click to open the body; "Sent by Suhanya" for personal emails | ChevronDown | Open or close the email | Collapsible | MemberSheet.tsx:1891, MemberSheet.tsx:1899, data.ts:415 |
| Payments tab, top | Same: {amount} lifetime value | Same: Includes {amount} in gifts for {names} | — | Same: Record payment (icon Plus) | Summary | MemberSheet.tsx:1720, MemberSheet.tsx:1721, MemberSheet.tsx:1725, MemberSheet.tsx:1731 |
| Payments tab, list (aria-label) | — | Same: Payments | — | — | aria-label | MemberSheet.tsx:1736 |
| Payments tab, hover a payment row | — | Same: Edit payment (aria-label) | Pencil | Edit payment | Ghost icon button | MemberSheet.tsx:1915 |
| Payment method labels | — | Same: E-transfer; Cash or cheque; Online | — | — | Detail line | data.ts:104 |
| Intake form tab | — | Same: Answered {date} | — | — | Muted | MemberSheet.tsx:604 |
| Intake form tab, question headings | Same: {topics heading}; {ways heading}; {location heading}; {time heading}; {hopes heading} (from the public intake form's copy, features/intake/copy.ts) | — | Check (for ways) | — | Question list | MemberSheet.tsx:607, MemberSheet.tsx:622, MemberSheet.tsx:637, MemberSheet.tsx:641, MemberSheet.tsx:645, copy.ts:98, copy.ts:103, copy.ts:107, copy.ts:110, copy.ts:114 |
| Intake form tab, a question was skipped | — | Same: Skipped | — | — | Muted | MemberSheet.tsx:601 |

## 11. Tag manager

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Manage tags in the header | Same: Tags | — | — | Same: Close panel (kit) | Sheet title | TagManager.tsx:308 |
| Tag list (aria-label) | — | Same: Tags | — | — | aria-label | TagManager.tsx:314 |
| Tag row (aria-label) | — | Same: {tag}, {count} person / {tag}, {count} people | — | Opens the editor | Row | TagManager.tsx:338 |
| Tag row editor, name | — | Same: Name | — | — | Field | TagManager.tsx:151 |
| Tag row editor, colours | — | Same: Grey; Stone; Sky; Emerald; Amber; Rose | Check (on the current colour) | Choose a colour | Radio menu items | TagManager.tsx:31, TagManager.tsx:32, TagManager.tsx:216 |
| Tag row editor | — | — | Trash2 | Same: Delete tag | Menu item, danger | TagManager.tsx:225 |
| Delete tag confirmation | See Dialogs and confirmations | — | — | — | — | TagManager.tsx:364 |
| Empty tag list, rename error | See Empty states and Error states | — | — | — | — | TagManager.tsx:312, TagManager.tsx:140 |
| Selection bar Add or remove tags opens the bulk tag popover (aria-label) | Same: Tags for 1 person / Tags for {count} people | — | — | — | Popover | BulkTagsPopover.tsx:178 |
| Bulk tag popover search | — | Same: Search or create a tag (placeholder and aria-label) | search icon (kit) | Same: Clear search (kit) | SearchField | BulkTagsPopover.tsx:187, BulkTagsPopover.tsx:188 |
| Bulk tag popover list (aria-label) | — | Same: Tags | — | Tick a tag to add it, untick to remove it | Checkbox list | BulkTagsPopover.tsx:199 |
| Bulk tag popover, typed name does not exist | — | — | Plus | Same: Create “{name}” | Ghost button | BulkTagsPopover.tsx:244 |
| Bulk tag popover, empty or loading or saving | See Empty states, Loading states and Error states | — | — | — | — | BulkTagsPopover.tsx:241, BulkTagsPopover.tsx:249 |

## 12. Import from a spreadsheet

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Dialog title on every step | Import people from a spreadsheet ~~Import members from CSV~~ | Same: Step {n} of 3: Choose a file / Match columns / Review | — | — | Dialog | ImportMembersDialog.tsx:201, ImportMembersDialog.tsx:322, ImportMembersDialog.tsx:324 |
| Step 1, drop zone | — | Drop a spreadsheet here ~~Drop a CSV file here~~ | FileUp | Choose a spreadsheet ~~Choose CSV file~~ | Drop zone | ImportMembersDialog.tsx:343, ImportMembersDialog.tsx:357 |
| Step 1, under the drop zone | — | Save your spreadsheet as .csv. It needs an email column; first name, last name and tags are optional. ~~Needs a column with email. First name, last name and tags are optional.~~ | — | — | Hint | ImportMembersDialog.tsx:366 |
| Step 1 | — | — | Download | Same: Download a template | Ghost, small | ImportMembersDialog.tsx:370 |
| Step 1 | — | — | — | Same: Cancel | Secondary | ImportMembersDialog.tsx:376 |
| Step 1, file errors | See Error states | — | — | — | — | ImportMembersDialog.tsx:258, ImportMembersDialog.tsx:262 |
| Step 2, top | — | Same: We found {count} row in {fileName}. Check what each column holds. / We found {count} rows in {fileName}. Check what each column holds. | — | — | Hint | ImportMembersDialog.tsx:386 |
| Step 2, each column | Same: {column header} / Column {n} (when the header is blank) | Same: For example: {first value} (hint) | — | Same: Select with Email; First name; Last name; Tags; Don't import | Field | ImportMembersDialog.tsx:390, ImportMembersDialog.tsx:187, ImportMembersDialog.tsx:188, ImportMembersDialog.tsx:189, ImportMembersDialog.tsx:190, ImportMembersDialog.tsx:191 |
| Step 2, under the columns | — | Separate several tags in one cell with ; or \| ~~Separate several tags in one cell with ; or \|.~~ | — | — | Hint | ImportMembersDialog.tsx:397 |
| Step 2, buttons | — | — | — | Same: Back; Cancel; Continue | Ghost; Secondary; Primary | ImportMembersDialog.tsx:316, ImportMembersDialog.tsx:408, ImportMembersDialog.tsx:412 |
| Step 2, matching error | See Error states | — | — | — | — | ImportMembersDialog.tsx:283 |
| Step 3, summary line | — | {count} person ready to add / {count} people ready to add, then · {count} already added ~~· {count} already in the directory~~, then · {count} with an error / {count} with errors | — | — | Live region, polite | ImportMembersDialog.tsx:423, ImportMembersDialog.tsx:424, ImportMembersDialog.tsx:425 |
| Step 3, preview list (aria-label) | — | Same: Preview of the file | — | — | aria-label | ImportMembersDialog.tsx:428 |
| Step 3, a row with no name or email | — | Same: No name or email | — | — | Muted | ImportMembersDialog.tsx:437 |
| Step 3, a row with tags | — | Same: Tags: {tags} | — | — | Muted | ImportMembersDialog.tsx:440 |
| Step 3, a row that is ready | — | Same: Row {line}: Ready to add | Check | — | Success | ImportMembersDialog.tsx:433, ImportMembersDialog.tsx:444 |
| Step 3, a row with no email | — | Same: Row {line}: No email. Skipped. | CircleAlert | — | Error | ImportMembersDialog.tsx:195, ImportMembersDialog.tsx:432 |
| Step 3, a row with a bad email | — | Same: Row {line}: Check the email address. Skipped. | CircleAlert | — | Error | ImportMembersDialog.tsx:196, ImportMembersDialog.tsx:432 |
| Step 3, a row repeating an earlier row | — | Same: Row {line}: Repeats an earlier row in this file. Skipped. | CircleAlert | — | Error | ImportMembersDialog.tsx:197, ImportMembersDialog.tsx:432 |
| Step 3, a row already added | — | Row {line}: Already added. Skipped. ~~Row {line}: Already in the directory. Skipped.~~ | Minus | — | Muted | ImportMembersDialog.tsx:198, ImportMembersDialog.tsx:432 |
| Step 3, a row already added with "Add their tags" ticked | — | Row {line}: Already added. Their tags will be added. ~~Row {line}: Already in the directory. Their tags will be added.~~ | Minus | — | Muted | ImportMembersDialog.tsx:432 |
| Step 3, when tags are matched and people are already added | — | Add their tags to the people already added ~~Add their tags to the existing people~~ (checkbox) | — | — | Checkbox | ImportMembersDialog.tsx:454 |
| Step 3, when there are error rows | — | — | Download | Same: Download rows with errors | Outline, small | ImportMembersDialog.tsx:460 |
| Step 3, someone can be added | — | — | — | Same: Back (left); Cancel; Add {count} person / Add {count} people | Ghost; Secondary; Primary | ImportMembersDialog.tsx:467 |
| Step 3, nobody can be added | — | — | — | Same: Back; Cancel; Add 0 people (disabled) | Primary, disabled | ImportMembersDialog.tsx:479 |
| Hover or focus the disabled Add 0 people | — | Same: Nobody in this file can be added yet. Go back to match the columns, or choose another file. (NEEDS APPROVAL, left for the PM) | Lock (kit) | — | Tooltip | ImportMembersDialog.tsx:477 |
| Step 3, save fails or session expired or offline | See Error states | — | — | — | — | DialogStates.tsx:242 |

## 13. Tooltips and screen-reader-only labels

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Hover Copy in the header | — | Same: Copy email addresses of {count} selected person / ...selected people; Copy {count} email address / Copy {count} email addresses | Copy | — | Tooltip and aria-label | MemberDirectory.tsx:2125, MemberDirectory.tsx:2126 |
| Hover Download in the header | — | Same: Download as spreadsheet | Download | — | Tooltip and aria-label | MemberDirectory.tsx:2132, MemberDirectory.tsx:2133 |
| Hover Tags in the header | — | Same: Manage tags | Tags | — | Tooltip and aria-label | MemberDirectory.tsx:2138, MemberDirectory.tsx:2139 |
| Hover the Add person arrow | — | More ways to add people ~~More ways to add~~ | ChevronDown | — | aria-label | MemberDirectory.tsx:2150 |
| Hover Show columns | — | Same: Show columns | Columns3 | — | Tooltip and aria-label | MemberDirectory.tsx:1981, MemberDirectory.tsx:1983 |
| Hover the Note title when a note exists | — | Same: Updated {date} by {name} | — | — | Tooltip | MemberSheet.tsx:1103 |
| Hover selection bar buttons | — | Select all {total}; Add or remove tags ~~Tags~~; Copy email addresses; Delete; Clear selection | ListChecks, Tag, Copy, Trash2, X | — | Tooltips and aria-labels | MemberDirectory.tsx:2362, MemberDirectory.tsx:423, MemberDirectory.tsx:2377, MemberDirectory.tsx:2382, MemberDirectory.tsx:2388 |
| Tooltip on a disabled control (kit) | — | Same: Unavailable: {reason} (aria-label of the lock button) | Lock | — | aria-label | DisabledReason.tsx:53 |
| Screen readers: page list group | — | Same: Filters; People; Selected people | — | — | aria-label | MemberDirectory.tsx:2190, MemberDirectory.tsx:2279, MemberDirectory.tsx:2342 |
| Screen readers: filter popovers | — | Same: {Tags, Joined, Membership, Not tagged, Interests, Ways to help, Location or Availability} | — | — | aria-label | MemberDirectory.tsx:2213, MemberDirectory.tsx:2217, MemberDirectory.tsx:2221, MemberDirectory.tsx:743 |
| Screen readers: filter checkbox groups | — | {filter name}; Search tags ~~Search {filter name in lower case}~~ | — | — | aria-label | MemberDirectory.tsx:825, MemberDirectory.tsx:833 |
| Screen readers: table selection | — | Same: Select all; Select {fullName}; Select person; Copy {email} | — | — | aria-label | MemberDirectory.tsx:1859, MemberDirectory.tsx:1877, MemberDirectory.tsx:1919 |
| Screen readers: page title | — | , {count} subscribed ~~, {count} member / , {count} members~~ | — | — | Visually hidden | MemberDirectory.tsx:2118 |
| Screen readers: search or filters settle | — | Same: {count} person matches / {count} people match | — | — | Live region, polite | MemberDirectory.tsx:2270 |
| Screen readers: list updating (state lab: Slow loading) | — | Same: Updating results | — | — | Live region | MemberDirectory.tsx:2277 |
| Screen readers: list loading | — | Same: Loading; Still loading. This is taking longer than usual. | — | — | Live region | ListStates.tsx:131 |
| Screen readers: filter options loading | — | Same: Loading options | — | — | Live region | ListStates.tsx:251 |
| Screen readers: selection count | — | Same: {count} selected | — | — | Live region, polite | MemberDirectory.tsx:2358 |
| Screen readers: person panel | — | Loading person ~~Loading member~~; Loading details ~~Loading member details~~; More actions for this person ~~More actions for this member~~; Copy email; Edit tags; Add a tag; Edit payment; Details ~~Member details~~; Payments; Note; Activity; Search activity; Search emails | — | — | aria-label | MemberSheet.tsx:1051, MemberSheet.tsx:1086, MemberSheet.tsx:1031, MemberSheet.tsx:1070, MemberSheet.tsx:1284, MemberSheet.tsx:1257, MemberSheet.tsx:1915, MemberSheet.tsx:1710, MemberSheet.tsx:1736, MemberSheet.tsx:1087, MemberSheet.tsx:1091, MemberSheet.tsx:1759 |
| Screen readers: person panel live regions | — | Same: Updating activity; Loading earlier activity; {count} match / {count} matches; Loading email | — | — | Live region | MemberSheet.tsx:1771, MemberSheet.tsx:1772, MemberSheet.tsx:1773, MemberSheet.tsx:1851 |
| Screen readers: tag manager | — | Same: Tags; {tag}, {count} person / {tag}, {count} people | — | — | aria-label | TagManager.tsx:314, TagManager.tsx:338 |
| Screen readers: bulk tag popover | — | Same: Tags for 1 person / Tags for {count} people; Search or create a tag; Tags; Loading tags; Saving… | — | — | aria-label and live region | BulkTagsPopover.tsx:178, BulkTagsPopover.tsx:187, BulkTagsPopover.tsx:199, BulkTagsPopover.tsx:202, BulkTagsPopover.tsx:249 |
| Screen readers: import dialog | — | Same: Preview of the file | — | — | aria-label | ImportMembersDialog.tsx:428 |
| Screen readers: tag picker in the person panel (kit, announced while editing tags) | — | Same: Selected (list label); {tag} added; {tag} removed; {tag} selected. Press Backspace again to remove it.; {count} tag selected / {count} tags selected; Removed {a, b and c}; Between {tag} and {tag}; At the start; At the end; All tags are added; No tags match “{query}” | — | — | Live region | TagCombobox.tsx:14, TagCombobox.tsx:15, TagCombobox.tsx:16, TagCombobox.tsx:17, TagCombobox.tsx:18, TagCombobox.tsx:19, TagCombobox.tsx:21, TagCombobox.tsx:22, TagCombobox.tsx:23, TagCombobox.tsx:24, TagCombobox.tsx:25 |
| Kit close buttons (aria-label) | — | Same: Close (toast, dialog, confirm dialog, popover); Close panel (side panel); Remove {tag} (tag chips); Clear search (search fields); Previous; Next; Open calendar (date pickers); Pagination; Page {n} | X | — | aria-label | Toast.tsx:184, Dialog.tsx:140, AlertDialog.tsx:141, Popover.tsx:82, Sheet.tsx:198, Tag.tsx:218, SearchField.tsx:161, DatePicker.tsx:956, DatePicker.tsx:987, DatePicker.tsx:990, Pagination.tsx:107, Pagination.tsx:129 |
| Joined filter calendar (kit) | — | Same: Joined rule (toggle group aria-label); Previous {step}; Next {step}; {month year}, choose month / choose year; {Calendar name}, {month}; weekday and day names | — | — | aria-label | DateRulePicker.tsx:111, RangeCalendar.tsx:523, RangeCalendar.tsx:531, RangeCalendar.tsx:537, RangeCalendar.tsx:543, RangeCalendar.tsx:546, RangeCalendar.tsx:579 |
| Table column sort and filter (kit) | — | Same: {Column}, sorted ascending. Select to sort descending; {Column}. Select to sort; Filter {label}; Filter {label}, {count} selected | — | — | aria-label | Table.tsx:25, Table.tsx:27, Table.tsx:32 |
| Live region calls named announce | No `announce(` call exists in these files (only the kit's TagCombobox calls it, see above) | — | — | — | — | TagCombobox.tsx:480, TagCombobox.tsx:486, TagCombobox.tsx:506 |

## 14. Spreadsheet columns and file names

| When you see it | Heading | Description / body | Icon | Buttons / actions | Variant | Source |
| --- | --- | --- | --- | --- | --- | --- |
| Download as spreadsheet, always included | Same: First name; Last name; Email | — | — | — | Column header | MemberDirectory.tsx:1027, MemberDirectory.tsx:1028, MemberDirectory.tsx:1029 |
| Download as spreadsheet, when the column is shown | Same: Tags (values joined with "; "); Lifetime value; Joined; Location; Referred by | — | — | — | Column header | MemberDirectory.tsx:1030, MemberDirectory.tsx:1031, MemberDirectory.tsx:1032, MemberDirectory.tsx:1033, MemberDirectory.tsx:1034 |
| Download as spreadsheet, always included | Same: Subscribed (values Yes or No); Cancelled (the date or blank) | — | — | — | Column header | MemberDirectory.tsx:1035, MemberDirectory.tsx:1036 |
| Download as spreadsheet, file name | sdc-people.csv ~~sdc-members.csv~~ | — | — | — | File name | MemberDirectory.tsx:2012 |
| Import step 1, Download a template, file name | people-template.csv ~~members-template.csv~~ | — | — | — | File name | ImportMembersDialog.tsx:368 |
| Import step 1, Download a template, header row | Same: Email; First name; Last name; Tags | — | — | — | Column header | csv.ts:152 |
| Import step 1, Download a template, sample rows | Same: alex@example.com, Alex, Rivera, Ride for Refuge; Volunteer / sam@example.com, Sam, Chen, Ride for Refuge | — | — | — | Sample rows | csv.ts:153, csv.ts:154 |
| Import step 3, Download rows with errors, extra column | Same: the file's own headers, then Issue (values: No email; Check the email address; Repeats an earlier row in this file; Already added ~~Already in the directory~~) | — | — | — | Column header | ImportMembersDialog.tsx:310, ImportMembersDialog.tsx:194 |
| Import step 3, Download rows with errors, file name | Same: {original name without .csv}-errors.csv, or import-errors.csv | — | — | — | File name | ImportMembersDialog.tsx:311 |

## State lab options defined for these screens

These are design-tool labels, not product copy, so they stay as they are.

| Toggle | What it shows | Source |
| --- | --- | --- |
| Couldn't load tags (tag-filter-failed) | The Tags and Not tagged filters show "Couldn't load tags" with Try again | MemberDirectory.tsx:1138 |
| Couldn't load activity (activity-failed) | Person panel Activity failure | MemberSheet.tsx:886 |
| Couldn't load the note (notes-failed) | Person panel Note failure | MemberSheet.tsx:887 |
| Couldn't load intake answers (intake-failed) | Person panel Intake form failure | MemberSheet.tsx:888 |
| Couldn't load an email (email-body-failed) | Opening an email in the timeline fails | MemberSheet.tsx:889 |
| Slow activity (slow-activity) | Switching Activity and Emails tabs takes about a second | MemberSheet.tsx:890 |
| Email already in use (duplicate-email) | Edit person and Add person show a duplicate-email field error | dialogs.tsx:260, dialogs.tsx:329 |
| Marked "Doesn't apply" on the list | Read-only, Stale data | MemberDirectory.tsx:1143 |
| Marked "Doesn't apply" on the person panel | Read-only, Too many requests | MemberSheet.tsx:892 |
| Marked "Doesn't apply" in dialogs | Loading, Slow loading, Couldn't load, Empty, Page not found, No permission, Reconnecting, Read-only, One section failed, One section empty, Stale data, Too many requests, One action not allowed, Undo expired; plus Partial data, Many items and Single item for dialogs without a list; plus Changed by someone else where there is nothing to compare | DialogStates.tsx:13, DialogStates.tsx:31, DialogStates.tsx:34 |

## Decisions

- **Person and people.** Never "member" for someone on the page: Add person, Edit person (menu and dialog title), Delete person, More actions for this person. Membership keeps its name (Membership filter, "Cancelled their membership").
- **Already added.** Replaces "in the directory" for duplicates in the Add person dialog, import rows, import summary and the errors spreadsheet.
- **Spreadsheet.** Never "CSV" in copy. The import hint says ".csv" once so people save the right file type. File names keep the .csv extension.
- **Clear.** "Clear filter" empties a filter, "Clear dates" on Joined; "Reset" is gone. Membership's says "Show subscribed only", because that's what it does. "Remove filter" stays for taking an unused extra filter off the row. The empty state says "Clear a filter to see more".
- **Offline.** "You're offline", then what to do: "You can look around, but you'll need to reconnect to make changes" on the page and panel, "Reconnect, then try again" when a save fails.
- **Reconnecting.** The banner says "Reconnecting. Loading the latest changes…"; the toast afterwards says "Back online".
- **Signed out.** "You've been signed out", then "Sign in again…", then "Your changes are still here" whenever something was being saved.
- **Changed by someone else.** Dialogs use "Use their version" and "Keep my version"; the tag alert uses "Use their tags" and "Keep my tags". No "conflict".
- **Undo.** Change toasts are past tense and name the person, tag or amount ("Deleted Priya Shah", "Tagged 4 people Volunteer"). Undo toasts say what came back: "Restored …", or "{tag} put back on …" for tags. No "Change undone", no hard-coded counts.
- **Missing details.** "No name" and "No email" everywhere (list, panel title, panel email).
- **Search.** One wording for placeholder and aria-label: "Search names, emails and tags", matching "Searched names, emails and tags" in the empty state. Tag filters say "Search tags".
- **Empty tags.** "No tags yet" and "No tags match", with no full stop.
- **Full stops.** None on toasts, titles, labels, buttons, tooltips or one-sentence text. Two-sentence text keeps them.
- **Buttons.** Done became "Save tags"; the note's Add and Edit became "Add note" and "Edit note"; the bar's Tags became "Add or remove tags"; More became "More filters".

## Left for the PM

- **Disabled reason (NEEDS APPROVAL)** on Add 0 people, ImportMembersDialog.tsx:477: "Nobody in this file can be added yet. Go back to match the columns, or choose another file."
- **Column filter copy (NEW, NEEDS APPROVAL)** in the kit, Table.tsx:34: "Search {label}s" and "Nothing matches that search." The People page passes the label "Tag", so it also reads "Filter Tag" and "Show tag". Changing the label to "Tags" would make the search say "Search tagss".
- **No disabled reason** on the Name item in the columns menu, which is always ticked and disabled. Needs a reason from you, or `null`.
- **Button order.** The tag conflict alert puts Keep my tags first; the dialogs put Use their version first. That's a layout change, so I didn't touch it.
- **Demo emails** in demoHistory.ts are written to members ("free for members", "Members can vote"), so they still say "members". They're email content, not page copy.
