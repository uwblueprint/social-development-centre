# Email editor: backend requirements

The editor is frontend-only. It reads `useEmails()` (`state.fallbacks`, `state.settings`, `renderFor`, `sendTest`, `setFallback`). A real backend needs:

## Content and sanitizing
- Validate and sanitize on the server too. Never trust client HTML: allow only `p, strong, em, a[href], ul, ol, li, br`; allow only `http`, `https`, `mailto` links; drop all attributes except `href`.
- Store `subject` as plain text and `bodyHtml` with `{{category.field}}` tokens. Reject unknown tokens or treat them as text.
- Literal braces are stored as `&#123;` / `&#125;` in HTML. The subject is plain text, so the client strips `{` and `}` from it; decide the server rule.
- Enforce maximum subject and body size (none in the PRD).

## Rendering per send
- Render each send separately: substitute variables, apply fallbacks, escape every value (a first name of `<b>` must not become markup), then attach the footer.
- Dates render as "March 4, 2026" in the Toronto time zone.
- Server-side check at publish and at send: empty subject, empty message, variable not valid for the moment. The client check is a convenience only.

## Fallbacks
- One fallback per variable, shared by every email. Saving one changes every email not yet sent; sent emails keep the text that went out.
- Trim whitespace; decide if an empty fallback is allowed (the prototype allows it).

## Footer and compliance
- Footer comes from settings: name, mailing address, unsubscribe link. Validate that the mailing address and unsubscribe link exist before any send (CASL).
- The unsubscribe link must be unique and signed per send and per member; the editor only shows a placeholder.
- Add the list-unsubscribe header.

## Test email
- `sendTest` needs the signed-in admin's address. Prefix the subject with `[TEST]`. Use a real or sample member for variables. Count against provider limits but not the monthly member limit.

## Email client rendering
- Inline all styles in the final HTML. Gmail and Outlook dark modes may invert colours; test the template.
