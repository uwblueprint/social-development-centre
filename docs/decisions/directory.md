# Member directory: product decisions

From the Member Directory PRD's "Required by Automatic Emails" notes (18 Oct 2026). Where these differ from
[community.md](https://github.com/uwblueprint/social-development-centre/blob/all-open-work/docs/decisions/community.md)
on `all-open-work`, these win.

## 1. Admins choose whether new members get join emails
- **Decision (PRD, 18 Oct 2026):** adding one or many members has **Send join emails**, on by default. Admins
  turn it off when loading existing members. Replaces Community decision 5 (no skip option; backfill by
  script only).
- **Affects:** the join moment in Automatic Emails.

## 2. Join date is set once
- **Decision (PRD):** defaults to the day the member is added; the admin can change it only while adding.

## 3. Only the member can resubscribe
- **Decision (PRD):** one global unsubscribe per person. Admins can unsubscribe someone but never undo an
  unsubscribe; the member resubscribes from the unsubscribe page. Replaces Community decision 6 (admins
  resubscribe people an admin unsubscribed). **Confirm with the owner.**

## 4. A spam complaint or one hard bounce stops all email
- **Decision (PRD):** a complaint unsubscribes them (reason shown). One hard bounce stops email to that
  address and shows on the member; changing their email clears it.

## 5. First and last name
- **Decision (PRD, assumption on the split):** names are stored as first and last. Existing full names were
  split at the first space ("Ada King Lovelace" → "Ada" / "King Lovelace"); admins can correct them.

## 6. Bulk tagging is allowed
- **Decision (PRD):** tags can be added to or removed from many members at once. Each member gets its own
  "Tag added" record. Community decision 27 (no bulk actions) still holds for convert, unsubscribe and delete.
