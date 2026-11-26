# Automatic emails: decision log (prototype)

Assumptions made while building the flow from the Automatic Emails PRD. Each can be revisited.

## 0. Rewrite: step cards, inline title, counts-only dialogs
- **Why:** the first version explained too much (a summary box, a Name section, hints, a banner) and put everything on one level. The page is now a top bar (back, title you edit in place, status badge, save state, Preview, Publish, ⋯) over five step cards (When, Wait, Who, Email, Send mode), one open at a time. A value on screen is edited where it is; there are no headings that repeat a label and no box that restates the cards.
- **Lists:** tab "Published" is now "Live". No Status column (the tab says it). The row summary is short ("30 days after · Member joins (any way)").
- **Published and trashed emails** show the same cards read-only, with **Details** and **Recipients** tabs.
- **Dialogs:** Publish and Unpublish are alert dialogs: the title is the action, the body is counts only.
- **Errors:** shown on click as one red line on the failing card; the first one opens and scrolls into view.
- **Who scheduled** moved into a side panel from the Who card.

## 1. The list is three tabs: Live, Drafts, Trash
- **Decision:** Tabs with counts (the ListPage pattern). Rows show name, a short summary and send mode. Row click opens the email; a More actions menu holds the rest.
- **Page:** Automatic emails. **Affects:** finding and acting on emails. **When met:** every visit.

## 2. The summary is system-written, not typed
- **Decision:** One function builds the sentence from moment, delay and conditions (`summary.ts`). It is used in the list, on the page and in the publish confirmation.

## 3. Autosave from the first keystroke
- **Decision:** New creates a draft and opens it. Edits save after a short pause. Status reads Saved / Saving… / Not saved with Retry. The text stays on the page when a save fails. Leaving with unsaved changes asks first (browser prompt on reload or close, dialog for in-app links); leaving also tries one last save.

## 4. One confirmation each for Publish and Unpublish
- **Decision:** Each lists only what applies. Moving a published email to trash shows the Unpublish consequences.

## 5. Published emails are read-only
- **Decision:** Cards are read-only; the one button is "Unpublish to edit". Trashed emails are read-only with Restore.

## 6. Publishing is blocked, not warned
- **Decision:** Name, moment, delay, send mode, email checks, incomplete conditions and tag conflicts block Publish. Failures appear as one line on the card that needs fixing. A moment change shows now-invalid variables right away.

## 7. View insights is a placeholder
- **Decision:** Opens a dialog saying Insights is not part of this prototype.

## 8. Recipients are quiet
- **Decision:** A table of every send for the email with a status badge and a short muted note. No red text, no alerts. First 25, then Show more.

## Builder is one sentence and the email (rebuild)
- The step cards are gone. The page is a sticky top bar (back, title, save text, Preview, Publish, ⋯), one sentence of pills ("When a member joins, wait until the next morning, then send automatically to everyone."), and the email, all visible at once. Why: Suhanya thinks in a sentence and must review everything before publishing; nothing is collapsed.
- Pills open popovers only to change a value; conditions live in the "to" pill. Name is the inline title (no separate field). A new draft has no name until she types one.
- Missing items are marked inline at the item on Publish; no error summary. Published view is the same page, read-only, with **Live**, **Unpublish to edit** and **Recipients** (a sheet).
- The list shows Send mode as plain text, not a badge.

## Top bar, menus and variable picker pass (Mobbin-informed)
- **Top bar:** back link on the left; save state, Preview, one primary (Publish, Restore) and ⋯ on the right. The name and a Draft / Live / In trash badge moved to a heading line under the bar.
- **Move to trash** is the last ⋯ item, below a divider, in danger color with a trash icon. Unpublish is a secondary button labelled "Unpublish".
- **Outbox:** the hover-only "Approve all" button is gone (it caused a layout gap). Approve, Send now, Edit and "Don't send" live in ⋯, all with icons; "Don't send" is last, below a divider, in danger color.
- **Outbox dialogs** say who is affected and what happens ("Priya won't get “Welcome”…"), with the action as the button label.
- **Variable picker:** two-column rows (label, example value) sharing one left edge with the group headers.
- **Not done:** row checkboxes with a bulk action bar for the Outbox (Mobbin: ClickUp, folk, Deel).
