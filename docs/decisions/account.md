# Settings and account: product decisions

Decisions behind `/admin/settings`. Admin access rules are in [admins.md](admins.md).

## 1. Admins can change their own name and delete their own account
- **Decision (owner, 10 Nov 2026):** the Settings page has a **Your name** section (first and last name) and, last on the page, **Delete account**. This reverses the 28 Sep decision that there is no My account screen; that decision is why `docs/backend/README.md` said name editing and account deletion were not needed.
- **Affects:** the Settings page, the sidebar (new **Settings** item), the name shown on the Admins list.
- **When encountered:** an admin's name is wrong or changes, or they leave SDC.

## 2. Delete account means leaving the admin portal
- **Decision:** it uses the same database function as **Remove** on the Admins page (`remove_admin`), on yourself. Admin access ends; the person record and any membership stay; another admin can invite them back.
- **Not deleted:** the person's data. This is not erasure. If someone asks for their data to be removed, that is a separate request.
- **Wording:** "You won’t be able to log in anymore" is true of the admin portal. An admin who is also a member can still sign in to the members' area.
- **Revisit when:** SDC needs real erasure of personal data.

## 3. The last admin cannot leave
- **Decision:** the same rule as `admins.md` decision 2. The button is disabled with "You’re the only admin. Add another admin before you leave." and the database refuses it as well.

## 4. After leaving: sign-out and a goodbye screen
- **Decision:** leaving signs you out and shows `/goodbye`, "Thank you for all the awesome work!", with no navigation. This applies to **Leave** on the Admins page too, so the two routes end the same way. A normal sign-out still goes to the sign-in page.

## 5. Name edits are explicit
- **Decision:** the fields are always editable. A **Save** button appears once something changes; leaving the page without saving discards the edit. Nothing autosaves.
- **Button label:** **Save** for personal changes (name, signature); **Save for all admins** when a change reaches every admin (reply-to, alerts). Only the first exists in the product so far.
