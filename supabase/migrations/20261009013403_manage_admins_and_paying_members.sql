-- Admins remove admins (themselves included) and add or remove paying members. Writes still go
-- through functions; the browser only reads.

-- Ends someone's admin access and keeps their person record. Returns 'removed' (also when they
-- already weren't an admin) or 'last_admin': SDC always keeps at least one admin.
create function public.remove_admin(p_person_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove admins' using errcode = '42501';
  end if;

  -- Locks every admin row, so two admins removing each other at once can't remove both.
  perform 1 from public.admins for update;
  if not exists (select 1 from public.admins where person_id = p_person_id) then
    return 'removed';
  end if;
  if (select count(*) from public.admins) = 1 then
    return 'last_admin';
  end if;

  delete from public.admins where person_id = p_person_id;
  return 'removed';
end;
$$;

-- Makes someone a paying member, adding them to SDC's list if they're new. Returns 'added' (wasn't
-- on the list), 'converted' (was a general member) or 'already_paying' (nothing changes).
create function public.add_paying_member(p_email text, p_full_name text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  member_id uuid;
  previous_tier text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add paying members' using errcode = '42501';
  end if;

  insert into public.people (email, full_name)
  values (lower(btrim(p_email)), nullif(btrim(p_full_name), ''))
  on conflict (email) do update set full_name = coalesce(public.people.full_name, excluded.full_name)
  returning id into member_id;

  select tier into previous_tier from public.memberships where person_id = member_id for update;

  insert into public.memberships (person_id, tier)
  values (member_id, 'paying')
  on conflict (person_id) do update set tier = 'paying' where public.memberships.tier <> 'paying';

  return case previous_tier when 'paying' then 'already_paying' when 'general' then 'converted' else 'added' end;
end;
$$;

-- Paying to general: they stay on SDC's list and lose paid access on their next page load.
create function public.remove_paying_access(p_person_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove paying access' using errcode = '42501';
  end if;

  update public.memberships set tier = 'general' where person_id = p_person_id and tier = 'paying';
end;
$$;

revoke execute on function
  public.remove_admin(uuid),
  public.add_paying_member(text, text),
  public.remove_paying_access(uuid)
from public, anon;
