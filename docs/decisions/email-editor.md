# Email editor: decision log

Decisions made while designing the email editor component (subject, message, attachments) from the Email Editor PRD. Prototype: the SDC Email Editor artifact. Each can be revisited.

## 1. Scope goes past the PRD's formatting list
- **Decision (owner, 21 Oct):** The toolbar has bold, italic, underline, strikethrough, heading, bulleted and numbered lists, quote, image and link. The PRD lists only paragraphs, bold, italic, links and lists, and puts images under "Not in v1". Highlight was dropped.
- **Open:** Confirm with the PM before release. Headings and images render less predictably across email clients than plain text.
- **Page:** Everywhere the editor is used.

## 2. Personalized text, not "variables"
- **Decision (owner):** The toolbar button says **Personalize**, with a braces icon; its tooltip says "Insert a member detail". Chips read `{ First name }`. Typing `{` in the subject or message opens the same list.
- **Esc** while the list is open removes everything typed from the `{`. Clicking away keeps it as plain text.
- With no caret in either field, a picked item goes at the end of the message.
- Hovering a chip says what shows when the detail is empty ("If empty: “there”"). Clicking a name chip edits that fallback for every email not yet sent. Email and join date have no fallback, so they have no hover or click.
- A chip that doesn't exist for the email's moment is red, struck through, and says so on hover.

## 3. Subject
- **Decision (owner):** A grey "Subject:" label sits inline before the field. The underline is always visible: grey, darker on hover, green while typing, red with an error. No placeholder. Enter moves to the message.
- **Limits:** a warning past 60 characters ("Phones may cut off…") and a hard stop at 150.

## 4. Message
- Text uses the default email font (Arial) at 16px, not the app font.
- Lists start from typing `- `, `* ` or `1. `. Their tooltips show no shortcut.
- **Shortcuts:** Quote is ⌘> (⌘⇧B toggles Chrome's bookmarks bar). Heading is ⌘⌥1; on a list item it turns that item into a heading and splits the list.
- **Links:**
  - Sky blue, `--color-link`. Deepened from the requested sky-600 to 4.86:1 for AA.
  - The link popup opens centred above the toolbar's link button, or directly below when there's no room.
  - Pasting a web address over selected text links it.
  - Clicking a link never opens it: it selects the whole link and shows copy, edit and remove beside it.
  - Error: "Please enter a valid link.", cleared on typing.
- **Images:** chosen from the toolbar (PNG, JPG, GIF or WebP, up to 5 MB) or dropped on the message, where a green line shows the row they'll land on. Each image takes its own row. Selected images show corner handles that resize them with proportions locked, between 48px wide and the message width, at most 600px. No rotation.
- Other files dropped on the message go to Attachments.
- **Footer:** shown greyed under the message, with a lock and "Edit footer in Settings".
- **Length:** a warning past 10,000 characters, because Gmail clips long emails and that hides the unsubscribe link.

## 5. Attachments
- **States:**
  - Empty: a small dashed "Add attachment"; on hover only the + stays.
  - Dragging a file anywhere over the section: the whole section becomes one drop target.
  - Populated: tiles with a preview, a name that can be shortened and an extension always shown in full, plus a dashed + tile.
  - Full: the + tile becomes "Max file limit reached" with a solid outline and no hover.
- **Limits:** PDF, image, text, Word (.docx) or CSV; 10 MB per file; 20 MB and 10 files per email. 20 MB rather than 32 because encoding adds about a third and Gmail refuses mail over 25 MB.
- Errors appear in red under the Attachments label. "x/20 MB used" appears under the tiles.

## 6. Preview and saving
- **Preview** is the editor's one button, in SDC green. It looks disabled when the subject or message is empty but stays clickable: clicking shows "Please include a subject." or "Please include a message." under that field. The screen it opens is designed separately (with Automatic Emails); this component only calls `onPreview`.
- **Drafts autosave** about a second after typing stops, with "Saving…" then "Draft saved" next to Preview. In the Outbox, edits still apply only when the admin presses Update (PRD).

## 7. Type and spacing in the editor
- 16/24 for text and controls. 14/20 for errors, hints and status. 12/16 for popups, tooltips and the Attachments overline. 24/32 for headings inside an email.
- Spacing is on a 4px grid; sections are 32px apart.
- Toolbar icons are Lucide at their default 2px stroke and 20px, instead of the kit's 1.5px (owner).
