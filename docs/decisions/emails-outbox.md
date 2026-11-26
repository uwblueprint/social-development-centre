# Emails: Outbox decisions

## 1. Rewrite: accordion, no explanatory text
- **Decision:** The Outbox is the home of the app. Title only. Sections (Waiting for you, Today, Tomorrow, dates) hold kit `Accordion` rows. A batch row shows name, day (only under Waiting for you), recipient count, one status (only when it needs attention) and a ⋯ menu with Approve all, Send now, Edit for everyone and Don’t send (red, last). A batch with one member opens straight to its email. Expanding lists recipients (name, one muted line of tags, one status, ⋯); selecting one shows the email inline with Edit, Don’t send and Approve (split with Send now). Edit swaps to the editor in place with Update and Discard.
- **Why:** The first version explained too much, had two levels of navigation (sheet) and too many tags. The PRD specifies an accordion; a Sheet added clicks. All rules are in `docs/emails-prototype/ux-rules.md`.
- **Affects:** Every Outbox visit. Replaces the Sheet master-detail and the batch footer buttons.

## 2. One status per row
- **Decision:** a batch shows `N need review`, `Scheduled`, `Couldn’t send`, or `N days past due` under Waiting for you. **Edited** shows only on the expanded recipient row. No separate chips.

## 3. Scope choice only when it matters
- **Decision:** Edit changes one member’s email. Choosing between “only this member” and “everyone” shows only when other members already have edits. “Edit for everyone” in the batch menu is the path that doesn’t depend on that.

## 4. Undo
- **Decision:** the toast carries Undo. While the 1-minute window runs, the row shows `Undo (Ns)` and an open email shows one line with Undo. Removed batches show one line at the top with Undo.

## 5. Reminder email
- **Decision:** not surfaced in the product. No link from the Outbox; the preview stays under State lab, Prototype.

## 6. Earlier decisions kept
Approve label names when it sends; Approve all shows mixed due dates as counts; 30-minute edit lock with a 25-minute warning; Waiting for you sorted by days past due, then name; quiet “not sent” reasons.

## 7. Edits never time out
- **Decision:** an email open for editing stays paused until Update or Discard. No 30-minute lock, no warning. A paused email past its send day shows under Waiting for you and is not sent. The Outbox shows one notice with Open while an edit is in progress. Unpublishing deletes edits for good; the unpublish dialog says to edit and publish again in the same sitting.
