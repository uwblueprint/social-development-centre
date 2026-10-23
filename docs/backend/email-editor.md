# Email editor: backend requirements

UI: `src/app/design/email-editor/` (`EmailEditor`), on demo data. Scope and decisions: the Email Editor PRD in Notion (Social Development Centre → Product Requirements). The component holds no data of its own; a page passes data in and saves what `onChange` gives it.

## Draft content
- `onChange` returns `{ subject, body }`, both TipTap JSON (`JSONContent`). Store them as JSON, not HTML, so personalized text stays a chip (`{ type: "personalizedText", attrs: { id } }`) and never becomes code.
- The message can only contain paragraphs, bold, italic, links and bulleted and numbered lists (PRD). Reject anything else server-side.
- **Autosave:** debounce about a second after the last change, then save the draft and pass `saveState` (`saving`, then `saved`). Saving a draft must not publish or approve anything. In the Outbox, edits apply only on **Update** (PRD), and a changed email goes back to waiting for review.

## Personalized text and fallbacks
- The ids and default fallbacks are in `variables.ts` (`first_name` → "there", `full_name` → "friend", referrer and referred names → "a friend", last names → nothing).
- `fallbacks` / `onFallbackChange(id, value)`: one stored fallback per variable, shared by every email. A change applies to every email not yet sent, never to sent ones, so a send must snapshot the fallbacks it used.
- Which variables exist per moment is in `variables.ts`. **Publishing must be blocked** if an email contains a variable its moment doesn't have (the editor shows it red, but the server is the check).
- Rendering: replace each chip with the member's value, or the fallback when empty. Escape values (a name with `<` or `&` must not change the layout). Format `join_date` as "March 4, 2026".

## Limits to enforce server-side
| | Limit |
|---|---|
| Subject | 150 characters (required) |
| Message | Required; warn past 10,000 characters |
| Link | http(s) only, up to 2,048 characters; link text up to 100 |

## Sending
- Render the JSON to email-safe HTML: one column, links as plain `<a>`, footer appended (sender, mailing address, unsubscribe link). Test in Gmail, Outlook and Apple Mail, light and dark.
- Every link counts as a call to action, named by its link text (PRD).
