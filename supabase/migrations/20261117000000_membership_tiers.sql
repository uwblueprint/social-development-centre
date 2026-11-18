-- Membership tiers: what SDC offers and what each member chose. Admins manage the list in Settings;
-- a member picks one tier once, on /tiers. The platform still doesn't take payments: a tier says what a
-- member pays (docs/decisions/members.md, "Tiers").
-- Rename this file to the version Supabase assigns when applied.

-- Prices are whole Canadian dollars. Members point at a tier by id, so deleting one only sets
-- archived_at: its members keep it and keep paying its price. Editing a price changes it for everyone on
-- the tier. A name only has to be unique among tiers still offered, so "Gold" can be deleted and made
-- again (a different row with its own id).
create table public.tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> '' and length(name) <= 60),
  price_cad integer not null check (price_cad > 0),
  -- The order tiers are shown in, set by dragging in Settings. Lower comes first.
  position integer not null,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  archived_by uuid references public.people (id) on delete set null
);
create unique index tiers_active_name on public.tiers (lower(btrim(name))) where archived_at is null;
create index tiers_position on public.tiers (position) where archived_at is null;

-- No cascade: a tier is never erased while a member holds it.
alter table public.memberships
  add column tier_id uuid references public.tiers (id),
  add column tier_chosen_at timestamptz;
create index memberships_tier_id on public.memberships (tier_id) where tier_id is not null;

-- Choosing a tier is one more thing that happens to a member, so it goes in member_events and on their
-- timeline. The tier's name is kept so the history still reads right after a rename or delete.
alter table public.member_events drop constraint member_events_kind_check;
alter table public.member_events
  add column tier_id uuid references public.tiers (id) on delete set null,
  add column tier_name text,
  add constraint member_events_kind_check
    check (kind in ('joined', 'referred_someone', 'referral_joined', 'tag_added', 'tier_chosen')),
  add constraint tier_chosen_has_tier check ((kind = 'tier_chosen') = (tier_name is not null));

-- The timeline shows a chosen tier's name in `body`. Same view as before otherwise.
create or replace view public.member_timeline with (security_invoker = true) as
  select e.person_id, e.at, e.kind, e.tag_name, e.referral_id, null::uuid as note_id,
    null::uuid as send_id, null::text as email_status, e.tier_name as body, null::uuid as by_person_id,
    false as edited
  from public.member_events e
  union all
  select t.person_id, t.at, 'tag_removed', t.tag_name, null, null, null, null, null, t.by_person_id, false
  from public.tag_events t where t.kind = 'removed'
  union all
  select n.person_id, n.created_at, 'note', null, null, n.id, null, null, n.body, n.created_by, n.updated_at is not null
  from public.member_notes n where n.deleted_at is null
  union all
  select h.person_id, coalesce(h.sent_at, h.send_at), 'email', null, null, null, h.send_id, h.status,
    h.email_name, null, h.edited
  from public.member_email_history h
  union all
  select c.person_id, c.at, c.kind, null, null, null, null, null, c.detail, null, false
  from public.subscription_events c;

insert into public.tiers (name, price_cad, position) values ('Gold', 50, 1), ('Silver', 25, 2), ('Bronze', 10, 3);

-- ---------- admins ----------

-- 'added', 'name_taken' or 'invalid'. Goes last in the order.
create function public.add_tier(p_name text, p_price_cad integer)
returns text
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can add tiers' using errcode = '42501';
  end if;
  if btrim(coalesce(p_name, '')) = '' or length(btrim(p_name)) > 60 or p_price_cad is null or p_price_cad < 1 then
    return 'invalid';
  end if;
  insert into public.tiers (name, price_cad, position)
  values (btrim(p_name), p_price_cad, coalesce((select max(position) from public.tiers), 0) + 1);
  return 'added';
exception when unique_violation then
  return 'name_taken';
end;
$$;

-- 'updated', 'name_taken', 'invalid' or 'not_found' (no such tier, or it was deleted).
create function public.update_tier(p_tier_id uuid, p_name text, p_price_cad integer)
returns text
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can edit tiers' using errcode = '42501';
  end if;
  if btrim(coalesce(p_name, '')) = '' or length(btrim(p_name)) > 60 or p_price_cad is null or p_price_cad < 1 then
    return 'invalid';
  end if;
  update public.tiers set name = btrim(p_name), price_cad = p_price_cad
  where id = p_tier_id and archived_at is null;
  if not found then
    return 'not_found';
  end if;
  return 'updated';
exception when unique_violation then
  return 'name_taken';
end;
$$;

-- Members who have it keep it. Deleting twice is fine.
create function public.archive_tier(p_tier_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete tiers' using errcode = '42501';
  end if;
  update public.tiers set archived_at = now(), archived_by = public.current_person_id()
  where id = p_tier_id and archived_at is null;
end;
$$;

-- p_ids is every tier still offered, in the new order.
create function public.reorder_tiers(p_ids uuid[])
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can reorder tiers' using errcode = '42501';
  end if;
  update public.tiers t set position = o.n
  from unnest(p_ids) with ordinality as o(id, n)
  where t.id = o.id and t.archived_at is null;
end;
$$;

-- Who has a tier, for the confirmation before deleting it.
create function public.tier_members(p_tier_id uuid)
returns table (person_id uuid, full_name text, email text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see who has a tier' using errcode = '42501';
  end if;
  return query
    select p.id, p.full_name, p.email
    from public.memberships m
    join public.people p on p.id = m.person_id
    where m.tier_id = p_tier_id
    order by p.full_name nulls last, p.email;
end;
$$;

-- ---------- members ----------

-- The tiers a member can choose from, in the order admins set. Members only.
create function public.list_offered_tiers()
returns table (id uuid, name text, price_cad integer)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (select 1 from public.memberships where person_id = public.current_person_id()) then
    raise exception 'Only members can see tiers' using errcode = '42501';
  end if;
  return query
    select t.id, t.name, t.price_cad from public.tiers t where t.archived_at is null order by t.position;
end;
$$;

-- The caller's chosen tier, or null if they haven't chosen one.
create function public.my_tier_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select tier_id from public.memberships where person_id = public.current_person_id()
$$;

-- A member picks a tier once. 'chosen', 'already_chosen' or 'unavailable' (deleted or unknown).
-- Nothing checks that it's the "right" tier for them.
create function public.choose_tier(p_tier_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  mine public.memberships;
  chosen public.tiers;
begin
  select * into mine from public.memberships where person_id = public.current_person_id() for update;
  if mine.person_id is null then
    raise exception 'Only members can choose a tier' using errcode = '42501';
  end if;
  if mine.tier_id is not null then
    return 'already_chosen';
  end if;
  select * into chosen from public.tiers where id = p_tier_id and archived_at is null;
  if chosen.id is null then
    return 'unavailable';
  end if;
  update public.memberships set tier_id = chosen.id, tier_chosen_at = now() where person_id = mine.person_id;
  insert into public.member_events (person_id, kind, at, tier_id, tier_name)
  values (mine.person_id, 'tier_chosen', now(), chosen.id, chosen.name);
  return 'chosen';
end;
$$;

-- ---------- access ----------

revoke execute on function
  public.add_tier(text, integer),
  public.update_tier(uuid, text, integer),
  public.archive_tier(uuid),
  public.reorder_tiers(uuid[]),
  public.tier_members(uuid),
  public.list_offered_tiers(),
  public.my_tier_id(),
  public.choose_tier(uuid)
from public, anon;

alter table public.tiers enable row level security;

-- Reads for admins; every write goes through the functions above. Members read through list_offered_tiers.
create policy "Admins see tiers" on public.tiers for select to authenticated using ((select public.is_admin()));
