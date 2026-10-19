# Admins: backend requirements

UI: `src/app/admin/admins/`. Decisions: [../decisions/admins.md](../decisions/admins.md). Spec: Auth Requirements (for dev), in Notion.

**Status:** the page is frontend only. `AdminsView` keeps the list in state, and `_lib/demoData.ts` stands in for the backend (sample admins, and `demoSendInvite`, which fails for `@bounce.test` addresses so the "Not sent" flow can be tried). Replace those with the items below, then delete `demoData.ts`.

## Data
- One record per admin (email unique, case-insensitive): `id`, `name` (required), `email`, `status` (`active` | `invited` | `not_sent`), `addedAt` (ISO 8601, optional: set when they accept the invite, absent until then; shown as **Added on**).
- `invited` becomes `active` when the invite link (or its 6-digit code) is used. `not_sent` is set when the email provider reports a bounce or send failure; resending successfully sets it back to `invited`.
- Invite links expire after 7 days. Expired invites stay in the list as `invited`; **Resend invite** sends a new one.
- The first admin is created once at launch, outside the UI.

## Read
- `listAdmins()` returns `AdminRecord[]` (shape in `_data/types.ts`), passed from `page.tsx`.
- `getCurrentAdmin()` (`../_data/session.ts`) supplies `currentEmail`; the row whose email matches shows "(You)".

## Actions (return `ActionState`, see `src/lib/forms.ts`)
- `inviteAdmin({ name, email })`: both required; reject an email that is already an admin or invited (field error on `email`). Sends the invite email with a magic link. If the send fails, still save the record as `not_sent`, return the saved admin, and email the inviting admin (see below).
- `resendAdminInvite({ id, email? })`: used by the row menu (**Resend invite**) and by the **Check the email address** dialog, which may pass a corrected `email`. Rate limit: once per 60 seconds per admin (the UI also disables it; the server must enforce it). Updates the email when given, with the same duplicate check. Returns an error when the send fails so the dialog stays open.
- `removeAdmin({ id })`: reject if it is the last remaining admin. Removal takes effect on the person's next page load (the role is checked on every request, so no session revocation). The UI makes people type the name; the server doesn't need to.

## Emails
- **Invite:** magic link plus a 6-digit code.
- **Invite failed:** when an invite can't be sent (provider bounce or error, including a later bounce), email the admin who sent it: who the invite was for, the address it was sent to, and that they can fix and resend it from **Admins**.
