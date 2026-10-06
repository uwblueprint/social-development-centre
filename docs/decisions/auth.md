# Sign-in: decision log

Each entry: the decision, which page it's on, what it affects, and when someone runs into it.

## 1. Each kind of user has their own sign-in page (owner, 6 Oct 2026)
- **Decision:** Paying members sign in at `/login`, CivicHub partners at `/login/partner` and SDC admins at `/login/admin`. Each portal sends signed-out people to its own page. This replaces the single shared sign-in page.
- **Why:** The three have different rules (paying-member list, invitation, shared password) and different edge cases, so one page couldn't explain any of them well.
- **Page:** `/login`, `/login/partner`, `/login/admin`.
- **Affects:** Portal layouts' redirects, `signOut`, `/auth/confirm`, the proxy (docs/backend/auth.md 6–8).
- **When encountered:** Every sign-in.

## 2. Admins share one account with a password (owner, 6 Oct 2026)
- **Decision:** Admins sign in to the shared SDC admin account with an email and password, and stay signed in for 30 days on that device. Members and partners keep passwordless email links.
- **Why:** SDC staff share one admin login (platform decision "Sidebar footer…": logins can be shared).
- **Page:** `/login/admin`.
- **Affects:** Supersedes "sign-in is passwordless" for admins only (platform decision 3's reasoning).
- **When encountered:** Admin sign-in; again every 30 days.

## 3. Five wrong passwords pause admin sign-in for 15 minutes (owner, 6 Oct 2026)
- **Decision:** Each wrong password keeps the email and says how many attempts are left. After the last one, sign-in pauses for 15 minutes with a countdown on the button; the email field locks and the password field is hidden until the timer ends.
- **Why:** The account is shared, so a lockout affects everyone; the message tells them to wait or ask another admin who knows the password.
- **Page:** `/login/admin`.
- **When encountered:** Mistyped or changed passwords.

## 4. Resend waits 60 seconds after any send (owner, 6 Oct 2026)
- **Decision:** On "Check your email", **Resend link** is disabled for 60 seconds after any send, showing "Resend in 0:48" and a line saying why. Applies to members and partners.
- **Page:** `/login`, `/login/partner`.
- **When encountered:** Someone who doesn't see the email right away.

## 5. Not a paying member: offer membership and the newsletter (owner, 6 Oct 2026)
- **Decision:** An address that isn't on the paying member list gets a full screen with **Become a paying member**, **Join the newsletter** and **Try a different email**, plus how to fix the address on file.
- **Page:** `/login`.
- **Affects:** `SDC_MEMBERSHIP_URL` and `SDC_NEWSLETTER_URL` (`src/lib/contact.ts`) are placeholders until those pages exist.
- **When encountered:** A non-member or a member using a different address.

## 6. Unknown partner email stays on the form with help (owner, 6 Oct 2026)
- **Decision:** "Email not found" shows under the field, the button waits until the address changes, and a help panel lists where to find the invited address and how to contact SDC.
- **Page:** `/login/partner`.
- **When encountered:** A partner using a personal or mistyped address.

## 7. Shared opportunities have a public page (owner, 6 Oct 2026)
- **Decision:** A shared opportunity link opens `/o/{id}`: the post, a newsletter signup and **Member sign in** in the header. Signing up replaces the box in place; an address already on the list is confirmed, not an error. A deleted listing or past event says it's no longer available and keeps the signup. Member sign-in from here returns to the post.
- **Page:** `/o/{id}`.
- **Affects:** Newsletter list, `/login?next=…`.
- **When encountered:** Anyone opening a link a member or partner shared.
- **Note:** Built from the Figma annotations for member screens 8–11; the copy needs the owner's approval.

## 8. Session-ended copy (owner, 6 Oct 2026)
- **Decision:** "For security, admins sign in again every 30 days. Sign in again to keep managing members and partners." (Figma had "required to sign in 30 days".)
- **Page:** `/login/admin?reason=session-ended`.
