# Admins: product decisions

Decisions behind the Admins page (`/admin/admins`). Sign-in decisions are in [../auth.md](../auth.md#decisions).

## 1. Any admin can remove any admin, including themselves
- **Decision (Jesse, 8 Oct 2026):** every row except your own has **Remove**; your own row has **Leave**. Both ask first in a small popover ("Remove {name} as an admin?" / "Leave the admin portal?"). Leaving signs you out and shows the goodbye screen (see [account.md](account.md) decision 4). Removed admins keep their person record and any membership; only admin access ends, on their next page load, and a sign-in link they were already sent no longer gets them in.
- **Page:** Admin → Admins → Current admins.
- **Affects:** who can reach the admin portal.
- **When encountered:** someone leaves SDC, or was added by mistake.

## 2. SDC always keeps at least one admin
- **Decision (assumption, 8 Oct 2026):** when you're the only admin, your row has no **Leave**. The database refuses to remove the last admin too (`remove_admin` returns `last_admin`), for two admins leaving at the same moment; the popover then says "You're the only admin. Add another admin before you leave."
- **Why:** nobody could add an admin back without the SQL editor.
- **Revisit when:** SDC wants the last admin to show a disabled **Leave** with a reason instead of no button.

## 3. Removing an invited admin is the same action
- **Decision (assumption, 8 Oct 2026):** admins who haven't signed in yet have **Remove** too. There's no separate "cancel invite".

## 4. The Admins page is a table, and confirmations are dialogs (10 Nov 2026)
- **Decision:** one row per admin with name, email and a status badge, **Active** or **Invited**. Each row has a **Remove** button (**Leave** on your own row). **Invite admin** at the top opens a dialog for name and email. Invited admins also have **Resend invite**, because the invite email can fail and an admin who never gets it needs another.
- **Replaces:** the popover in decision 1. Remove and Leave now ask in a dialog ("Remove {name} as an admin?" / "Leave the admin portal?"); the wording and what happens are unchanged.
- **If the invite email fails:** the person is already added (the row shows **Invited**), so this is reported as a message, not a form error, and **Resend invite** is the way to try again.
- **Page:** Admin → Admins.
- **When encountered:** adding someone, someone leaves SDC, or an invite never arrived.
