# Automatic emails list: what the design needs from the backend

The list and editor from the design in `src/app/design/automatic-emails/` (demo data), checked against
main as of 21 Nov 2026 (#52 engine, #59 admin list and editor, #69 Outbox backend).

## The design in one paragraph

Tabs for Published, Drafts and Trash, each counting its total. Under them, tag chips drawn like the
editor's tags: click tags to see the journey of someone who has all of them (a picked chip is solid),
double-click a tag to see only the emails that exclude it (red ban). The tag filter belongs to its tab:
switching tabs clears it. Emails are grouped by what starts them, then by timing, each in its own box:
name and description on the left, who-gets-it pills on the right. Drafts look like any other email;
their tab is the only difference. Each email's menu has Duplicate, Split by a tag, and Move to trash
(red), or Discard for a draft that has never been published. Trash is read-only: an email there opens to
read and can't be restored. In the editor, under "Wait for approval before sending", a second checkbox:
"Also send to unsubscribed members". The open email, tab and tag filter are all in the URL.

## Already on main (no backend work)

| Design needs | Main has |
|---|---|
| List of emails with state, trigger, tag, delay, conditions, mode | `listAutomaticEmails()` |
| Draft, publish, unpublish, trash, restore | `save_`, `publish_`, `unpublish_`, `trash_`, `restore_automatic_email` |
| Duplicate as "Copy of …" | `duplicate_automatic_email()` names the copy `Copy of <name>` and returns its id |
| Must have / exclude / any-of / joined date | `conditions` v2: `only`, `require`, `never`, `joined` |
| Tag list for the chips | `listTagOptions()` |
| Deleted tags never break a live email | `delete_tag` returns `in_use` while a draft or published email uses the tag |

## Frontend only (no backend change)

- **Tabs and counts.** Filter the loaded list by `state`. Counts are each tab's total, before search and
  the tag filter. Switching tabs drops `?has=` / `?not=`.
- **Grouping.** By `trigger` (joins, referral, tag added, with the tag), then by `delay_amount` +
  `delay_unit` in days (weeks × 7, months × 30, years × 365) just to order them. Headings use the stored
  value as typed ("After 30 days", "After 1 month"); a journey with only "within 24 hours" emails has no
  timing heading.
- **Tag chip filter.** Pure function over `conditions`: picked tags show the journey of someone with
  exactly those tags; a double-clicked tag shows only emails whose `never` list has it.
- **Pills.** Read `conditions`; tag names and colours from `listTagOptions()`.
- **Discard or Move to trash.** A draft whose `published_at` is null has never been published: it shows
  Discard. Anything published at least once (`published_at` is set, and `unpublish_automatic_email`
  leaves it set) shows Move to trash. Both call `trash_automatic_email`; the Trash tab (and its count)
  only lists trashed emails with `published_at` set, so a discarded draft simply disappears.
- **Duplicate opens the copy.** Call `duplicateAutomaticEmail(id)`, then go to
  `/admin/automatic-emails/<new id>` and show the toast.
- **Trash and discard are final in the UI, after a 5-second Undo.** No confirmation dialog: the row goes
  at once and a toast offers Undo. The server call waits until the toast expires, or is sent straight away
  (`fetch` with `keepalive`) if the tab is hidden or closed. No Restore button; `restore_automatic_email`
  stays on main but nothing calls it.
- **URL state.** `?tab=`, `?has=` / `?not=` (repeated, one per tag) and the email's own route, each change
  pushing a history entry, so the browser's back button returns to the list, tab and filter as they were.
- **Opening an email starts at the top of the page.**

## In review

Four small PRs cover everything the design needs that main doesn't have. Merge in this order:
#71 on its own, then the stack #72, #73, #74.

| Need | PR |
|---|---|
| **Tag colours**: `tags.color` (`stone` by default) and `set_tag_color`, returned by `listTagOptions()` | [#71](https://github.com/uwblueprint/social-development-centre/pull/71) |
| **Email description**: `automatic_emails.description` (≤ 80), saved, duplicated and loaded with the list | [#72](https://github.com/uwblueprint/social-development-centre/pull/72) |
| **Also send to unsubscribed members**: `send_to_unsubscribed`, applied in `email_candidate_state.emailable` (bounced still skipped) | [#73](https://github.com/uwblueprint/social-development-centre/pull/73), stacked on #72 |
| **Split by a tag**: `split_automatic_email`, and `finish_split` run by `publishAutomaticEmail` | [#74](https://github.com/uwblueprint/social-development-centre/pull/74), stacked on #73 |

All are migrations with safe defaults and no data: run each on sdc-dev, regenerate types, then run on
production after merge. #73 needs the PRD's "unsubscribe always wins" line updated for legally required
emails.

### Frontend still to port to `/admin/automatic-emails`

Everything here is in the design; none of it needs more backend:
- The list: tabs and counts, tag chips (picked solid, double-click excludes), grouping, row layout, pills.
- Menu with icons: Duplicate, Split by a tag (Select of tags), Move to trash or Discard (danger). No
  restore anywhere.
- The editor: description under the title (≤ 80, "No description"), the unsubscribed checkbox, no
  Published tag, a trash notice.
- URL state for the tab and filter; the email's own route already exists.
- A colour picker for tags on the People page (`set_tag_color`).

## Requirements (not built, not needed by this design)

| Need | Why | Proposal |
|---|---|---|
| **One email's recipients** | Who an email went to and who's next, if another page wants it. `outbox_upcoming()` stops at 30 days, and nothing lists past sends per email. | `automatic_email_recipients(p_email_id)` → `{ person_id, first_name, last_name, due_on, status }`: pending occurrences that match now (any date), plus `email_sends` with `status = 'sent'`. Admin only. |
| **Link a person to the member directory** | Anywhere a member is named, clicking them should open them. | A person page or a `?person=<id>` deep link in the directory (Member Directory, #48, not merged). |

## Open questions

- Splitting by a tag a published email already sends to many people: the original's pending sends to them
  become Not sent when the copy is published. Fine as the default, or warn with a count in the publish dialog?
- The monthly member email can't be built: there's no recurring trigger (PM, 9 Nov 2026).
