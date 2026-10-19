# Admins: decision log

From the Auth Requirements (for dev) page in Notion (6 Oct), plus changes from the owner while building the UI.

## 1. A lightweight admin list in the sidebar footer
- **Decision:** One page, **Admins**, with a table of name, email and status (**Active**, **Invited**, **Not sent**). Any admin can invite and remove admins. No roles or permission levels. The sidebar item sits at the bottom left, above **Sign out**, not in the main list: it's an account-level task, not a daily section.
- **Page:** Admin → Admins.
- **When encountered:** Rarely: staff changes.

## 2. Name and email are both required to invite
- **Decision (owner, 6 Oct):** Name is required, so every row has a name to show and to type when removing.

## 3. A fun send
- **Decision (owner, 6 Oct):** A sent invite fires confetti (`celebrate()`, skipped for reduced motion) plus a toast. Resending a checked "Not sent" invite does the same.

## 4. Your own row reads "Name (You)"
- **Decision (owner, 6 Oct).** Matched on email.

## 5. Unsent invites need a second look at the email
- **Decision (owner, 6 Oct):** If the email can't be sent, the admin who invited gets an email about it (backend), the row becomes **Not sent**, and its **Resend invite** button is on the row. It opens a dialog with the address editable and a required checkbox confirming it's correct.
- **Why:** Failures are usually a typo; resending the same address would fail again.

## 6. Remove means typing the name
- **Decision (owner, 6 Oct):** Removing needs the admin's full name typed. It's compared ignoring capitals and surrounding spaces (assumption), so it slows people down without punishing a wrong capital letter.
- **Last admin (spec):** the last remaining admin can't be removed.
- **Removing yourself (assumption):** allowed; the dialog says you lose access right away.

## 7. Resend is limited to once a minute
- **Decision (spec):** per admin. The disabled reason is "You can resend an invite once a minute." Sending an invite also starts the minute.

## Copy to confirm
Not from the owner: the Name and Email field labels, the invite dialog description ("They'll get an email with a link to sign in. The link expires after 7 days."), the empty state ("No admins" / "Invite someone to manage members and other admins.") and the toast wording.

## 8. Row actions are buttons, not a ⋯ menu
- **Decision (owner, 6 Oct):** a row has at most two actions, so a menu hides choices behind an extra click. Invited and Not sent rows show a labelled **Resend invite** button; every row has an icon button to remove (tooltip **Remove admin**). Menus in comparable products (Clerk, Tailscale, TravelPerk, Airwallex on Mobbin) hold three or four actions.
- Disabled states carry their reason: the last admin's remove button and a resend within the minute.

## 9. Added on, Copy all emails, status colors
- **Added on (owner, 6 Oct):** the date the person accepted the invite. Invited and Not sent people have no date (a dash), and their name, email and date are grey. Status and actions stay at full strength.
- **Copy all emails (owner, 6 Oct):** secondary button at the top right; copies every address, comma-separated, including people who haven't accepted.
- **Status colors** follow the Partners people list: **Active** success, **Invited** neutral with a send icon, **Not sent** danger with an alert icon.
- **Narrow screens:** the table scrolls sideways with the **Name** column frozen.
- **Click an email to copy it (owner, 6 Oct):** the same control as Community and Partners. Rows no longer highlight on hover (`rowHover={false}`), because they do nothing on click and the row actions' hover fill blended into the highlight. The last row button ends at the table's right edge, in line with the header buttons.
