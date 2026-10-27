-- Admins sign in again 7 days after signing in (Auth Requirements: admin sessions last 7 days;
-- members stay signed in). is_admin() is the one admin check behind every admin page, server action
-- and row-level security policy, so a week-old session stops being an admin everywhere at once. The
-- person stays signed in to the members' area if they're a member.
--
-- The session's sign-in time is in its JWT (`amr`, most recent first). Entries a refresh adds don't
-- count. If a token has no `amr`, the person's last sign-in link (people.last_signed_in_at) stands in.
create or replace function public.admin_signed_in_at()
returns timestamptz
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select to_timestamp(max((m ->> 'timestamp')::bigint))
     from jsonb_array_elements(coalesce((select auth.jwt()) -> 'amr', '[]'::jsonb)) m
     where m ->> 'method' <> 'token_refresh'),
    (select last_signed_in_at from public.people where id = public.current_person_id())
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  -- coalesce: with no sign-in time at all the answer is no, never NULL (callers test `not is_admin()`).
  select exists (select 1 from public.admins where person_id = public.current_person_id())
    and coalesce(public.admin_signed_in_at() > now() - interval '7 days', false)
$$;

revoke execute on function public.admin_signed_in_at() from public, anon;
