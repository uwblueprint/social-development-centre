# Emails: Outbox backend needs

The prototype runs on the in-memory store (`useEmails()`); nothing here talks to a server. What the real backend needs:

- **List:** `GET outbox` = sends due in the next 30 days plus anything past due that is waiting for review or couldn’t send, with batch fields (source, send day), `editedContent`, `lock`, `undo`, `couldntSend`, `missedDueAt`. Page recipients inside a batch (batches can be hundreds).
- **Actions** (each returns `ActionResult`): `approve(sendIds, {now})`, `sendNow(sendIds)`, `dontSend(sendIds)`, `undo(sendIds)`, `retry(sendId)`, `resetToOriginal(sendId)`, `updateSend(sendId, content, {scope, overwriteEdited})`.
- **Locking:** `openForEdit` takes a server-owned 30-minute lock and pauses the send; `keepAlive` extends it; `closeEdit` releases it. The server expires the lock and discards changes; the browser can’t be trusted (background tabs throttle timers).
- **Undo window:** the claim step must not take a send until `undo.until` has passed. A per-minute worker means the real delay can be up to 2 minutes; see the flags file.
- **Re-check before sending:** conditions, unsubscribe, bounce, spam, tag still matched; write `notSentReason`.
- **Realtime:** another admin’s lock and changes need push or polling.
- **Reminders:** a scheduled job for “waiting for review” (at most one a day, never repeating a listed send) and “couldn’t send”.
- **Counts:** `batchEditedCount(sendId)` per batch; `reviewCount` platform-wide.

Gaps worked around with `mutate`: none.
