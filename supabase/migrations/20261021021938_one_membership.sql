-- One kind of member. The platform doesn't track payments, so there is no general/paying split:
-- everyone with a membership is a member and can sign in at /login. Donors and paid members are
-- tags ("$1,000+", "Paid 2026"), which Automatic Emails can read. Email subscription stays its own
-- state on people. Decision Log, 6 Oct 2026: "Membership and email subscription are separate states".

-- Existing general members were already on SDC's list, so they stay members.
alter table public.memberships drop column tier;

create or replace function public.can_sign_in(p_email text, p_portal text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.people p
    left join public.admins a on a.person_id = p.id
    left join public.memberships m on m.person_id = p.id
    where p.email = lower(btrim(p_email))
      and case p_portal
        when 'admin' then a.person_id is not null
        when 'member' then m.person_id is not null
        else false
      end
  )
$$;

drop function public.add_paying_member(text, text, timestamptz, boolean);
drop function public.remove_paying_access(uuid);

-- Makes someone a member, adding them to SDC's list if they're new. Returns 'added' or
-- 'already_member' (nothing changes). p_joined_at null = now.
create function public.add_member(
  p_email text,
  p_full_name text,
  p_joined_at timestamptz default null,
  p_join_emails boolean default true
)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  member_id uuid;
  n record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add members' using errcode = '42501';
  end if;
  n := public.split_name(p_full_name);

  insert into public.people (email, first_name, last_name)
  values (lower(btrim(p_email)), n.first_name, n.last_name)
  on conflict (email) do update set
    first_name = case when public.people.full_name is null then excluded.first_name else public.people.first_name end,
    last_name = case when public.people.full_name is null then excluded.last_name else public.people.last_name end
  returning id into member_id;

  insert into public.memberships (person_id, joined_at, join_emails)
  values (member_id, coalesce(p_joined_at, now()), p_join_emails)
  on conflict (person_id) do nothing;
  if not found then
    return 'already_member';
  end if;

  -- An address someone unsubscribed before they were on our list starts out unsubscribed.
  perform public.apply_suppression(member_id);
  return 'added';
end;
$$;

-- Ends the membership: they can't sign in to the members' area from their next page load. Their
-- person record stays, with its tags, tag history and email subscription state.
create function public.remove_member(p_person_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove members' using errcode = '42501';
  end if;

  delete from public.memberships where person_id = p_person_id;
end;
$$;

revoke execute on function
  public.add_member(text, text, timestamptz, boolean),
  public.remove_member(uuid)
from public, anon;
