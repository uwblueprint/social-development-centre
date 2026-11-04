-- When a membership ends. SDC tracks renewals by it: a membership lasts 12 months from joining, and the
-- 3, 6 and 9-month check-ins count from the start of the current year (the app works those out).
-- Stored rather than derived so an admin can move it, e.g. after a renewal (client, 23 Oct).

alter table public.memberships add column ends_at date;

-- 12 months after the join date, in Waterloo Region's calendar.
update public.memberships
set ends_at = ((joined_at at time zone 'America/Toronto')::date + interval '12 months')::date;

alter table public.memberships alter column ends_at set not null;

-- New memberships default to 12 months after joining, so add_member and add_members don't change.
create function public.membership_ends_by_default()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.ends_at is null then
    new.ends_at := ((new.joined_at at time zone 'America/Toronto')::date + interval '12 months')::date;
  end if;
  return new;
end;
$$;

create trigger membership_ends_by_default before insert on public.memberships
for each row execute function public.membership_ends_by_default();

-- Admins move the end date (a renewal, or a correction). It can't be before they joined.
create function public.set_membership_end(p_person_id uuid, p_ends_at date)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change memberships' using errcode = '42501';
  end if;
  update public.memberships m set ends_at = p_ends_at
  where m.person_id = p_person_id
    and p_ends_at >= (m.joined_at at time zone 'America/Toronto')::date;
  if not found then
    raise exception 'Not a member, or the end date is before they joined' using errcode = '22023';
  end if;
end;
$$;

revoke execute on function public.set_membership_end(uuid, date) from public, anon;
revoke execute on function public.membership_ends_by_default() from public, anon, authenticated;
