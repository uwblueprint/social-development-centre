# Sign-in

Paying members and admins sign in with a link emailed to them. There are no passwords.

| Who | Sign-in page | After signing in |
|---|---|---|
| Paying members | `/login` | `/welcome` the first time, then `/` |
| Admins | `/login/admin` | `/admin/admins` |

## How it works

1. The sign-in form calls `sendSignInLink` (`src/features/auth/actions.ts`). It asks the database whether the email may use that page (`can_sign_in`) and only then has Supabase email a link.
2. The link opens `/auth/confirm`, which verifies it, links the Supabase login to the person (`record_sign_in`) and redirects.
3. `src/proxy.ts` sends signed-out visitors of `/`, `/welcome` and `/admin/**` to the right sign-in page. Pages check roles themselves with `requireMember()` and `requireAdmin()` (`src/features/auth/session.ts`).

Expired or used links come back to the sign-in page with `?error=expired`; anything else with `?error=failed`.

Email security scanners (e.g. Outlook Safe Links) can open a link before the person does, which uses it up. If people report links that are always expired, make `/auth/confirm` a page with a "Sign in" button that verifies on click.

## Data

`supabase/migrations/`. Types generated from the database are in `src/lib/supabase/database.types.ts`; regenerate them after changing the schema.

- `people`: one row per email SDC knows, whether or not they've signed in. `user_id` links to the Supabase login after the first sign-in; `first_signed_in_at` and `last_signed_in_at` record sign-ins.
- `admins`: everyone here can sign in at `/login/admin` and add other admins. All admins are equal.
- `memberships`: SDC's list, `tier` `general` or `paying`. Only `paying` can sign in at `/login`.
- `welcome_answers`: the form members fill in once, after their first sign-in.

The browser can only read rows (row-level security). Every write goes through a database function: `add_admin`, `submit_welcome`, `record_sign_in`.

Partners will get `partner_organizations` and `partner_contacts` tables pointing at `people`, plus their own sign-in page.

### Adding a paying member

Until the Community page saves to the database, add them in the SQL editor:

```sql
with person as (
  insert into people (email, full_name) values ('name@example.org', 'Full Name') returning id
)
insert into memberships (person_id, tier) select id, 'paying' from person;
```

## Setup

In the Supabase dashboard:

1. **SQL editor:** run the files in `supabase/migrations/` in order (already done for SDC DB).
2. **Authentication → URL Configuration:** Site URL is the production URL. Add `http://localhost:3000/**` and the production URL with `/**` to Redirect URLs. A link whose redirect isn't listed falls back to the Site URL and won't work.
3. **Authentication → Emails → Templates:** paste `supabase/templates/sign-in.html` into both **Magic link** and **Confirm signup**, with the subject "Your SDC sign-in link". The template links straight to `/auth/confirm` with a token, so links work on any device or browser.
4. **Authentication → Emails → SMTP:** set up custom SMTP. Supabase's built-in sender only emails members of the Supabase team and only a few emails an hour.
5. **Authentication → Providers → Email:** keep **Confirm email** on. Sign-in links people to the `people` row with their email, which is only safe when every login has proven it owns its address.

## Decisions

- Every admin signs in with their own email. This replaces the shared admin password in the earlier designs.
- The first admin is seeded by the migration. Admins add other admins at `/admin/admins`; the invite is a sign-in link. Admins can't be removed yet.
- Paying members are donors, so membership doesn't expire. Payments happen by e-transfer outside the app; an admin marks someone as paying once it arrives.
- Changing email: members contact SDC. When someone's login email changes, a trigger updates `people.email` to match. When an admin changes a `people.email` directly, also clear its `user_id` so the new address can sign in.
- Links last 1 hour (Supabase's default).

## Not built yet

- Partner sign-in.
- Adding paying members from the Community page.
- Self-service email change.
- Supabase's "Before User Created" hook, to stop people creating logins by calling Supabase directly with an email that has no access. Such logins can't see or do anything today, but the hook would keep them out of `auth.users`.
- Final copy for `/welcome` and `/admin/admins`, which aren't in Figma yet.
- Separate member, admin and invite emails as in Figma. Supabase uses one template per kind of email, so this needs the Send Email Hook.
