# Email editor: decision log (prototype)

Assumptions made while building the editor from the Email Editor PRD. Each can be revisited.

## 1. One editor, three places
- **Decision:** `EmailEditor` is used for automatic emails, one-off emails and a single Outbox email. It never saves; it only calls `onChange`. The page owns autosave (automatic, one-off) or Update / Discard (Outbox).
- **Page:** Automatic emails, One-off emails, Outbox. **Affects:** every email written. **When met:** writing or editing any email.

## 2. Formatting is paragraphs, bold, italic, links, bulleted and numbered lists
- **Decision:** Stored HTML is limited to `p, strong, em, a[href], ul, ol, li, br`. Pasted content and everything typed goes through one sanitizer; unsafe links (not http, https or mailto) are dropped.

## 3. Variables are chips; content stores tokens
- **Decision:** `{{member.firstName}}` is stored; the editor shows a labeled chip. Chips work in the subject and the message. Hover or focus shows an example; click (or Shift+Arrow then Enter) opens the fallback popover.
- **Decision:** Typing `{` opens the variable list and the brace is not typed. A literal brace can still be pasted into the message; it is stored as an entity so it can never become a variable.

## 4. One fallback per variable, shared by all emails
- **Decision:** Editing a fallback in the popover calls `setFallback` and says it applies to every email not yet sent.
- **Decision:** A fallback of only spaces is saved as empty (shows nothing).

## 5. Variables that don't apply stay visible
- **Decision:** If the moment changes, chips that no longer apply stay in place, struck through with "Not available:", and are reported by `checkEmail`. They are not removed automatically.

## 6. Checks are plain words with "Jump to it"
- **Decision:** Empty subject, empty message, and variables that don't apply. The parent runs `checkEmail` and passes `issues`; each shows under its field with **Jump to it**.

## 7. Footer is shown, never edited here
- **Decision:** Greyed out under the message and inside the preview. Content comes from settings.

## 8. Test emails
- **Decision:** **Send test email** calls `sendTest` with the subject prefixed `[TEST]`. The confirmation says "your inbox" because the prototype doesn't know the admin's address.

## 9. Writing prompts
- **Decision:** One prompt per moment, and one general prompt for one-off emails. Wording is a draft for the PM to confirm.
