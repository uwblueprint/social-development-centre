# Email editor: backend requirements

UI: `src/app/design/email-editor/` (`EmailEditor`), on demo data. Scope and decisions: the Email Editor PRD in Notion (Social Development Centre → Product Requirements). The component holds no data of its own; a page passes data in and saves what `onChange` gives it.

## Draft content
- `onChange` returns `{ subject, body, attachments }`. `subject` and `body` are TipTap JSON (`JSONContent`). Store them as JSON, not HTML, so personalized text stays a chip (`{ type: "personalizedText", attrs: { id } }`) and never becomes code.
- The message can only contain paragraphs, one heading level (`heading`, level 1), bold, italic, underline, strikethrough, links, bulleted and numbered lists, quotes (`blockquote`) and images (`emailImage`, attrs `src`, `alt`, `width`). Reject anything else server-side.
- `attachments` is a list of `AttachmentItem` (`id`, `name`, `size`, `kind`, `status`, `progress`, optional `previewUrl`). Save only items with `status: "done"`; pass saved ones back as `initialAttachments`.
- **Autosave:** debounce about a second after the last change, then save the draft and pass `saveState` (`saving`, then `saved`). Saving a draft must not publish or approve anything. In the Outbox, edits apply only on **Update** (PRD), and a changed email goes back to waiting for review.

## Personalized text and fallbacks
- The ids and default fallbacks are in `variables.ts` (`first_name` → "there", `full_name` → "friend", referrer and referred names → "a friend", last names → nothing).
- `fallbacks` / `onFallbackChange(id, value)`: one stored fallback per variable, shared by every email. A change applies to every email not yet sent, never to sent ones, so a send must snapshot the fallbacks it used.
- Which variables exist per moment is in `variables.ts`. **Publishing must be blocked** if an email contains a variable its moment doesn't have (the editor shows it red, but the server is the check).
- Rendering: replace each chip with the member's value, or the fallback when empty. Escape values (a name with `<` or `&` must not change the layout). Format `join_date` as "March 4, 2026".

## Files
- `uploadImage(file) → Promise<url>`: images in the message. PNG, JPG, GIF or WebP, up to 5 MB. The URL must stay reachable from inboxes after sending (public, long-lived). The editor stores the URL and a display `width` (up to 600). A rejected promise shows an upload error under the message. Without it, the editor uses a local `blob:` URL, which only works for the demo.
- `uploadAttachment(file, onProgress) → Promise<void>`: PDF, PNG/JPG/GIF/WebP, TXT, DOCX or CSV. Call `onProgress` with 0 to 1 while uploading; a rejected promise shows "Upload failed" with Retry. Reject the same limits server-side, and reject a type whose content doesn't match its extension.
- Attachments are sent as email attachments, not links. Removing one from a draft should delete its upload.
- Read-only emails (`readOnly`) show images and attachments but can't add, resize or remove them.

## Limits to enforce server-side
| | Limit |
|---|---|
| Subject | 150 characters (required) |
| Message | Required; warn past 10,000 characters |
| Link | http(s) only, up to 2,048 characters; link text up to 100 |
| Images | 5 MB each; PNG, JPG, GIF or WebP |
| Attachments | 10 MB each, 20 MB and 10 files per email |

## Sending
- Render the JSON to email-safe HTML: one column, links as plain `<a>`, images with `width` set, footer appended (sender, mailing address, unsubscribe link). Images, headings and quotes need testing in Gmail, Outlook and Apple Mail, light and dark.
- Highlights are sent as inline `<span style="background-color:#fef08a">`, not `<mark>` (Outlook desktop doesn't reliably style it). No classes or CSS variables. The editor's `getHTML` already outputs this.
- Every link counts as a call to action, named by its link text (PRD).
