# Emails engine: what a real backend must do differently

The prototype engine (`src/features/emails/engine.ts`, `store.tsx`) runs in the browser with a one-second timer. A real system differs in these ways.

- **One worker, not a tab timer.** Sending runs server-side on a schedule, independent of any open page.
- **Atomic claim.** The worker claims a send (`scheduled` to `sending`) in one conditional update (status is scheduled, `sendAt` has passed, no active undo, no lock). Two workers must never send the same row.
- **Idempotency key.** Unique constraint on `automaticId + memberId + occurrence`. Unpublish marks rows `not-sent: unpublished`; the constraint must ignore those rows (partial unique index).
- **Provider webhooks.** Bounce, spam report and unsubscribe arrive by webhook and update member status. The worker re-checks status and conditions immediately before the provider call; the provider's suppression list is the final guard.
- **Couldn't send.** Retry with backoff for 24 hours, then set the label. The prototype marks it immediately.
- **Undo window.** Store `undo.until` server-side; the claim query respects it. Undo is a conditional update that fails once the worker has claimed the row.
- **Locks.** Store `lock.by` and `expiresAt` with server time; keep-alive is a heartbeat. Expiry is evaluated by the server, not a client tick. Taking a lock is an atomic compare-and-set.
- **Time.** Store UTC instants. Compute windows and calendar days in `America/Toronto` and handle DST (a wall time can be skipped or repeated). Pick the window minute from a stable hash so retries do not move a send.
- **Moments.** Record real events (join, referral sent, referral joined, tag added with timestamp). The prototype uses join dates for tag and referral moments.
- **Publish and catch-up.** Compute the plan in a transaction with the publish. Catch-up has no cap, so page the work and show progress. Preview counts must come from the same function as the commit.
- **Monthly limit.** Count by sent date in the member's month from the sends table, not a stored counter.
- **One-offs.** Freeze the audience in a transaction when sending; create rows with the undo window; the same worker sends them.
- **Rendering.** Render at send time on the server and store the exact subject and body. Escape member data in HTML.
- **Saves.** Return structured errors (offline, conflict, validation) so the UI can show the right message.
