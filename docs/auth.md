# Sign-in

Members and admins sign in with a link emailed to them. There are no passwords.

| Who | Sign-in page | After signing in |
|---|---|---|
| Members | `/login` | `/` |
| Admins | `/login/admin` | the admin page they asked for, or `/admin/admins` |

## How it works

1. The sign-in form calls `sendSignInLink` (`src/features/auth/actions.ts`). It asks the database whether the email may use that page (`can_sign_in`) and only then has Supabase email a link. The admin page answers "If this email has access, a sign-in link is on its way." either way, so it doesn't reveal who the admins are.
2. The link opens `/auth/confirm`, which verifies it, links the Supabase login to the person (`record_sign_in`) and redirects.
3. `src/proxy.ts` sends signed-out visitors of `/` and `/admin/**` to the right sign-in page; admins come back to the page they asked for (`?next=`, admin paths only). Pages check roles themselves with `requireMember()` and `requireAdmin()` (`src/features/auth/session.ts`).
4. Being an admin is decided by the database's `is_admin()`: a row in `admins` **and** a sign-in less than 7 days old (the session's `amr` sign-in time). Pages, server actions and row-level security all use it, so a week-old admin session stops working everywhere at once and the admin signs in again. Member sessions don't expire.

Expired or used links come back to the sign-in page with `?error=expired`; anything else with `?error=failed`.

Email security scanners (e.g. Outlook Safe Links) can open a link before the person does, which uses it up. If people report links that are always expired, make `/auth/confirm` a page with a "Sign in" button that verifies on click.

## Data

`supabase/migrations/`. Types generated from the database are in `src/lib/supabase/database.types.ts`; regenerate them after changing the schema.

- `people`: one row per email SDC knows, whether or not they've signed in. `user_id` links to the Supabase login after the first sign-in; `first_signed_in_at` and `last_signed_in_at` record sign-ins.
- `admins`: everyone here can sign in at `/login/admin` and add or remove admins, themselves included. All admins are equal, and the last one can't be removed.
- `memberships`: who is a member. Everyone with a membership can sign in at `/login`. There is no paid tier; donors are tagged instead.

The browser can only read rows (row-level security). Every write goes through a database function: `add_admin`, `remove_admin`, `add_member`, `remove_member`, `record_sign_in`.

The intake form is not part of sign-in: it lives at `/intake-form`, is open to anyone with the link, and stores its own rows (`intake_submissions`). Nothing here gates on whether someone has filled it in.

Partners will get `partner_organizations` and `partner_contacts` tables pointing at `people`, plus their own sign-in page.

### Adding a member

Admins add them on **Members** (`/admin/members`), which adds them to SDC's list if they're new and emails them a sign-in link.

## Setup

In the Supabase dashboard:

1. **SQL editor:** run the files in `supabase/migrations/` in order (already done for SDC DB).
2. **Authentication → URL Configuration:** Site URL is the production URL. Add `http://localhost:3000/**` and the production URL with `/**` to Redirect URLs. A link whose redirect isn't listed falls back to the Site URL and won't work.
3. **Authentication → Emails → Templates:** paste `supabase/templates/sign-in.html` into both **Magic link** and **Confirm signup**, with the subject "Your SDC sign-in link". The template links straight to `/auth/confirm` with a token, so links work on any device or browser.
4. **Authentication → Emails → SMTP:** set up custom SMTP. Supabase's built-in sender only emails members of the Supabase team and only a few emails an hour.
5. **Authentication → Providers → Email:** keep **Confirm email** on. Sign-in links people to the `people` row with their email, which is only safe when every login has proven it owns its address.

## Decisions

- Every admin signs in with their own email. This replaces the shared admin password in the earlier designs.
- The first admin is seeded by the migration. Admins add and remove admins at `/admin/admins`; the invite is a sign-in link. See [decisions/admins.md](decisions/admins.md).
- One kind of member, and membership doesn't expire. The platform doesn't track payments; admins tag donors instead. See [decisions/members.md](decisions/members.md).
- Changing email: members contact SDC. When someone's login email changes, a trigger updates `people.email` to match. When an admin changes a `people.email` directly, also clear its `user_id` so the new address can sign in.
- Links last 1 hour (Supabase's default). The spec's 7-day invites aren't possible (Supabase allows at most 24 hours); an expired invite never blocks anyone, because the person can ask for a new link on the sign-in page.
- Admin sessions last 7 days from signing in; member sessions don't expire.

## Not built yet

- Partner sign-in.
- The Member Directory screens. The data is built (see [backend/directory.md](backend/directory.md)); `/admin/members` is a plain list of members for now.
- The 6-digit code in the sign-in email, as a fallback for opening the link on another device or links used up by email scanners. Needs `{{ .Token }}` in the template and a code box on Check your email.
- Making the admin page's neutral answer airtight: `can_sign_in` is callable with the public key, so someone could still ask the database directly whether an email is an admin. Fix by calling it from the server with a secret key (`SUPABASE_SECRET_KEY` in Vercel) and revoking it from `anon`.
- Self-service email change.
- Supabase's "Before User Created" hook, to stop people creating logins by calling Supabase directly with an email that has no access. Such logins can't see or do anything today, but the hook would keep them out of `auth.users`.
- Final copy for `/admin/admins` and `/admin/members`, which aren't in Figma yet.
- Separate member, admin and invite emails as in Figma. Supabase uses one template per kind of email, so this needs the Send Email Hook.
