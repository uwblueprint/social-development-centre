# Sign-in: backend requirements

The sign-in screens for the three kinds of user are built (Figma: SDC Working File, "Auth — Paying members", "Auth — Admins", "Auth — CivicHub partners"). This lists what the UI needs from the backend. Everything here is still to do; the UI runs on the existing `signIn` action plus dev-only stand-ins that throw in production.

| Who | Page | How they sign in |
|---|---|---|
| Paying members | `/login` | Email link, only for addresses on the paying member list |
| CivicHub partners | `/login/partner` | Email link, only for invited addresses |
| SDC admins | `/login/admin` | Shared admin account: email and password |

## 1. Member links only for paying members
`signIn` (`src/app/login/actions.ts`) is shared by members and partners. From `/login`, refuse the link unless the address is on the **paying member** list, and return `not-permitted`; the page then shows "This email isn't on our paying member list". Today the refusal comes from Supabase (`signup_disabled`, `user_not_found`, …), so any existing account would get a link.
- Tell the action which page asked: add a `portal` field (`member` | `partner`) to the FormData, or split it into two actions. Partners must be checked against invited partner contacts instead.
- Don't reveal more than the screens already do: `not-permitted` for both "unknown" and "not a paying member".

## 2. Return to a shared opportunity (member screen 11)
`/login?next=/o/{id}` posts a `next` field with the email. Carry it through the sign-in link (`emailRedirectTo: ${origin}/auth/confirm?next=…`) and have `/auth/confirm` redirect there after a successful sign-in instead of `/`. Accept only same-site paths (`safeReturnPath` in `src/features/auth/constants.ts`).

## 3. Expired or used links go to the right page
`/auth/confirm` sends every failed link to `/login?error=link`, which shows "This link has expired". A failed **partner** link should go to `/login/partner?error=link`. (The page remembers the last address in `sessionStorage` to offer a one-click resend; nothing is needed from the backend for that.)

## 4. Resend limits
The UI disables Resend for 60 seconds after any send. The backend should still rate-limit per address and return `temporary` (the existing code path) when it does.

## 5. Admin password sign-in
Implement `AdminSignInAction` (`src/features/auth/types.ts`) and pass it to `<AdminSignIn action={…} />` in `src/app/login/admin/page.tsx`. Until then `previewAdminSignIn` (`src/features/auth/adminPreview.ts`) stands in during development (password `preview`) and throws in production.
- FormData: `email`, `password`.
- Wrong password: return `wrong-password` with `attemptsLeft`. After **5** wrong passwords, pause sign-in for the shared account for **15 minutes** and return `paused` with `until` (UTC ISO). While paused, return `paused` without checking the password.
- Success: start a session that lasts **30 days** on this device, then `redirect("/admin")`.
- `getCurrentAdmin()` (`src/app/admin/_data/session.ts`) must still check the admin role.

## 6. Admin sessions end every 30 days
When an admin's session has expired, send them to `/login/admin?reason=session-ended` ("Your session has ended") rather than the plain form. The admin layout currently redirects to `/login/admin`.

## 7. Unauthenticated redirects by portal
`src/lib/supabase/proxy.ts` sends every signed-out request to `/login` (the member page). Send `/admin/**` and `/kiosk` to `/login/admin`, `/partner/**` to `/login/partner`, and let `/o/**` through without sign-in (it's public).

## 8. Sign out lands on the right page
`signOut` redirects to `/login?signedOut=1&name=…`. Redirect admins to `/login/admin?…` and partners to `/login/partner?…`; all three pages show the goodbye line.

## 9. Shared opportunity page (member screens 8–10)
`/o/{id}` is public. Replace `getSharedOpportunity` in `src/app/o/[id]/page.tsx` with a public read that returns only **published, current** listings (null for drafts, closed, ended or removed-partner listings, which show "This opportunity is no longer available").

## 10. Newsletter signup
Implement `NewsletterAction` (`src/features/auth/types.ts`) and pass it to `<NewsletterSignup action={…} />`. Until then a dev-only stand-in is used (`jordan@example.org` is "already subscribed").
- FormData: `email`, `opportunityId` (where they signed up, for reporting).
- Already on the list: return `already-subscribed`, send nothing, show no error.
- Otherwise add them to the newsletter list (Mailchimp today) and return `subscribed`.

## 11. Emails
Three emails are designed: member sign-in link, partner invitation and partner sign-in link. Subjects, preheaders and copy are in [docs/emails/auth.md](../emails/auth.md).
