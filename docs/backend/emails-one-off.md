# One-off emails: what the backend must provide

The prototype keeps everything in memory (`src/features/emails/store`). A real backend needs:

- **One-off record:** subject, body HTML with variable tokens, audience (all / conditions with rules / hand-picked member ids), `removedIds`, status (draft / sending / sent), `updatedAt`, `sentAt`, and at send time `recipientIds` and `excludedIds` (a snapshot).
- **Autosave:** `updateOneOff(id, patch)` after each pause in typing. Idempotent, returns `{ ok }` or an error string, rejects writes to a non-draft. Needs a version check so two tabs or two admins don't overwrite each other.
- **Create, delete (drafts only), duplicate.** Create accepts an optional member id (hand-picked). Duplicate copies content and audience, not removals.
- **Resolve audience:** recipients and excluded (with reason) for an audience and removals, paginated with counts, searchable by name or email. The UI pages 25 at a time; the real list must be server-side.
- **Member search** for hand-picking (name or email), returning status so excluded members show their reason.
- **Over-limit query:** members this send would push past the monthly limit, with how many emails each has had this month (what counts is flagged).
- **Send:** one transaction that freezes the audience (snapshot of recipients and excluded), creates one send per recipient with a 1-minute undo, and fails if there are zero recipients or no subject.
- **Undo:** within the window, deletes the sends and returns the email to a draft. After the window it fails with a message the UI shows.
- **Update email:** pausing the sends and opening one in the Outbox (see the Outbox backend notes).
- **Render and test:** render for any member id; send a test to the signed-in admin, returning the address it went to.
- **Per-recipient status** for the sent page: sent / sending / not sent with reason, paginated.
- **Settings:** sender name, reply-to, monthly limit.
- **Tags:** the list of tags for the conditions pickers.
- **Member history:** each send appears in the member's email history (Member Directory, out of scope).
- **Insights:** not built.
