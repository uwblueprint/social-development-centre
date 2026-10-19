# Automatic emails: what the backend must provide

The prototype keeps everything in memory (`src/features/emails/store`). A real backend needs:

- **Automatic email record:** name, moment (type and tag), delay, conditions (match and rules with ids), subject, body HTML with variable tokens, send mode, state (draft / published / trash), `everPublished`, `stoppedLiveAt`, `updatedAt`.
- **Autosave:** `updateAutomatic(id, patch)` after each pause in typing. Idempotent, returns `{ ok }` or an error string, rejects writes to a non-draft.
- **Publish and unpublish previews** for the confirmations: scheduled, come-back-for-review, missed, over the monthly limit; edited sends (with ids), approved, waiting, open by another admin.
- **Publish, unpublish, trash, restore, duplicate** as transactions. Unpublish wipes edited sends and releases other admins' locks; publish runs catch-up.
- **Scheduled-for query:** members whose moment already happened and whose send date is ahead, for a draft. Paginated for large sets.
- **Recipients query:** sends for one email with status, reason and send time; paginated, with counts per status.
- **Tags:** the list of tags in use, for the Tag pickers.
- **Render and test:** render for any member id; send a test to the signed-in admin.
- **Validation** repeated on the server at publish (the UI check is a convenience).
- **Tag deleted, unsubscribe and bounce events** must update scheduled sends.
- **Insights:** not built.
