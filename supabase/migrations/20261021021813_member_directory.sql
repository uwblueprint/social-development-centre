-- The member directory's data, ahead of Automatic Emails: first and last names, join date, tags with
-- a log of every change, referrals, and one email subscription state per person (unsubscribes,
-- spam complaints, hard bounces) with a suppression list for addresses we must never email.
-- The sends table (scheduled / waiting for review / sent / not sent) comes with the emails engine.

-- ---------- names ----------

-- First and last name are stored; full name is derived, so the existing readers keep working.
alter table public.people
  add column first_name text,
  add column last_name text;

-- Everything before the first space is the first name; the rest is the last name.
update public.people
set first_name = nullif(split_part(btrim(full_name), ' ', 1), ''),
    last_name = nullif(btrim(substr(btrim(full_name), length(split_part(btrim(full_name), ' ', 1)) + 1)), '')
where full_name is not null;

alter table public.people drop column full_name;
alter table public.people add column full_name text
  generated always as (nullif(btrim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), '')) stored;

-- The functions that still take one name field split it the same way.
create function public.split_name(p_full_name text, out first_name text, out last_name text)
language sql immutable set search_path = ''
as $$
  select nullif(split_part(btrim(p_full_name), ' ', 1), ''),
         nullif(btrim(substr(btrim(p_full_name), length(split_part(btrim(p_full_name), ' ', 1)) + 1)), '')
$$;

create or replace function public.add_admin(p_email text, p_full_name text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  new_admin_id uuid;
  n record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add admins' using errcode = '42501';
  end if;
  n := public.split_name(p_full_name);

  insert into public.people (email, first_name, last_name)
  values (lower(btrim(p_email)), n.first_name, n.last_name)
  on conflict (email) do update set
    first_name = case when public.people.full_name is null then excluded.first_name else public.people.first_name end,
    last_name = case when public.people.full_name is null then excluded.last_name else public.people.last_name end
  returning id into new_admin_id;

  insert into public.admins (person_id, added_by)
  values (new_admin_id, public.current_person_id())
  on conflict (person_id) do nothing;

  return found;
end;
$$;

create or replace function public.submit_welcome(p_full_name text, p_answers jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := public.current_person_id();
  n record;
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  n := public.split_name(p_full_name);

  update public.people set first_name = n.first_name, last_name = n.last_name where id = me;

  insert into public.welcome_answers (person_id, answers)
  values (me, p_answers)
  on conflict (person_id) do update set answers = excluded.answers, submitted_at = now();
end;
$$;

-- ---------- join date ----------

-- When they joined SDC's community: today unless the admin backdates them while adding (existing
-- members being loaded in). There is no function to change it afterwards, on purpose.
alter table public.memberships
  add column joined_at timestamptz not null default now(),
  -- The admin's "Send join emails" choice when adding. Off for backfilled members, so the join
  -- moment never fires for them.
  add column join_emails boolean not null default true;

update public.memberships set joined_at = created_at;

-- p_joined_at null = now; only applied when the person is new to SDC's list.
create or replace function public.add_paying_member(
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
  previous_tier text;
  n record;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add paying members' using errcode = '42501';
  end if;
  n := public.split_name(p_full_name);

  insert into public.people (email, first_name, last_name)
  values (lower(btrim(p_email)), n.first_name, n.last_name)
  on conflict (email) do update set
    first_name = case when public.people.full_name is null then excluded.first_name else public.people.first_name end,
    last_name = case when public.people.full_name is null then excluded.last_name else public.people.last_name end
  returning id into member_id;

  select tier into previous_tier from public.memberships where person_id = member_id for update;

  insert into public.memberships (person_id, tier, joined_at, join_emails)
  values (member_id, 'paying', coalesce(p_joined_at, now()), p_join_emails)
  on conflict (person_id) do update set tier = 'paying' where public.memberships.tier <> 'paying';

  -- An address someone unsubscribed before they were on our list starts out unsubscribed.
  if previous_tier is null then
    perform public.apply_suppression(member_id);
  end if;

  return case previous_tier when 'paying' then 'already_paying' when 'general' then 'converted' else 'added' end;
end;
$$;

-- The old two-argument version would otherwise stay callable beside the new one.
drop function if exists public.add_paying_member(text, text);

-- ---------- email subscription ----------

-- One state per person for every email we send, automatic or one-off. Unsubscribed and bounced are
-- separate: a bounce clears when the address changes, an unsubscribe only when they resubscribe.
alter table public.people
  add column unsubscribed_at timestamptz,
  -- self: their unsubscribe link. admin: an admin stopped their emails. complaint: they marked an
  -- email as spam. imported: on a list of existing unsubscribes an admin uploaded.
  add column unsubscribe_reason text check (unsubscribe_reason in ('self', 'admin', 'complaint', 'imported')),
  add column bounced_at timestamptz,
  add column bounce_detail text,
  -- The unsubscribe page's link, so a member can act without signing in.
  add column unsubscribe_token uuid not null unique default gen_random_uuid(),
  add constraint unsubscribed_has_reason check ((unsubscribed_at is null) = (unsubscribe_reason is null));

-- Addresses we must not email even though nobody on the list has them: people deleted at their
-- request, and imported unsubscribes for addresses we don't know yet. Hashed, never stored plainly.
create table public.suppressed_emails (
  email_hash text primary key,
  reason text not null check (reason in ('deleted', 'unsubscribed')),
  created_at timestamptz not null default now()
);

create function public.email_hash(p_email text)
returns text
language sql immutable set search_path = ''
as $$
  select encode(sha256(convert_to(lower(btrim(p_email)), 'UTF8')), 'hex')
$$;

-- For a person just added: unsubscribe them if their address was on the list as unsubscribed.
create function public.apply_suppression(p_person_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.people p
  set unsubscribed_at = now(), unsubscribe_reason = 'imported'
  from public.suppressed_emails s
  where p.id = p_person_id
    and p.unsubscribed_at is null
    and s.email_hash = public.email_hash(p.email)
    and s.reason = 'unsubscribed'
$$;

-- Whether we may email this person at all. The one check every send makes.
create function public.can_email(p_person_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.people
    where id = p_person_id and unsubscribed_at is null and bounced_at is null
  )
$$;

-- An admin stops someone's emails. Admins can't undo it: only the member resubscribes, from the
-- unsubscribe page.
create function public.unsubscribe_member(p_person_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can unsubscribe members' using errcode = '42501';
  end if;
  update public.people set unsubscribed_at = now(), unsubscribe_reason = 'admin'
  where id = p_person_id and unsubscribed_at is null;
end;
$$;

-- The unsubscribe page. Both return the first name for the page to greet them with, or null for an
-- unknown link.
create function public.unsubscribe_by_token(p_token uuid)
returns text
language sql security definer set search_path = ''
as $$
  update public.people
  set unsubscribed_at = coalesce(unsubscribed_at, now()),
      unsubscribe_reason = coalesce(unsubscribe_reason, 'self')
  where unsubscribe_token = p_token
  returning coalesce(first_name, '')
$$;

create function public.resubscribe_by_token(p_token uuid)
returns text
language sql security definer set search_path = ''
as $$
  update public.people
  set unsubscribed_at = null, unsubscribe_reason = null
  where unsubscribe_token = p_token
  returning coalesce(first_name, '')
$$;

-- An admin uploads existing unsubscribes. Known addresses are unsubscribed; unknown ones are kept as
-- hashes so the person starts unsubscribed if they're added later.
create function public.import_unsubscribes(p_emails text[])
returns table (unsubscribed integer, already integer, remembered integer)
language plpgsql security definer set search_path = ''
as $$
declare
  cleaned text[];
begin
  if not public.is_admin() then
    raise exception 'Only admins can import unsubscribes' using errcode = '42501';
  end if;
  select coalesce(array_agg(distinct lower(btrim(e))), '{}') into cleaned
  from unnest(p_emails) e where btrim(e) like '%_@_%';

  select count(*) filter (where p.unsubscribed_at is not null)::integer
  into already
  from public.people p where p.email = any (cleaned);

  update public.people set unsubscribed_at = now(), unsubscribe_reason = 'imported'
  where email = any (cleaned) and unsubscribed_at is null;
  get diagnostics unsubscribed = row_count;

  insert into public.suppressed_emails (email_hash, reason)
  select public.email_hash(e), 'unsubscribed'
  from unnest(cleaned) e
  where not exists (select 1 from public.people p where p.email = e)
  on conflict (email_hash) do nothing;
  get diagnostics remembered = row_count;

  return next;
end;
$$;

-- What the email provider tells us, through its webhook (server-side, service role only). One hard
-- bounce stops all email to that address; a spam complaint unsubscribes them.
create function public.record_email_event(p_email text, p_kind text, p_detail text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  case p_kind
    when 'hard_bounce' then
      update public.people set bounced_at = coalesce(bounced_at, now()), bounce_detail = left(p_detail, 500)
      where email = lower(btrim(p_email));
    when 'complaint' then
      update public.people set unsubscribed_at = coalesce(unsubscribed_at, now()), unsubscribe_reason = 'complaint'
      where email = lower(btrim(p_email))
        and (unsubscribe_reason is distinct from 'complaint');
    else
      raise exception 'Unknown email event %', p_kind using errcode = '22023';
  end case;
end;
$$;

-- A bounce belongs to the address, so a new address clears it.
create function public.clear_bounce_on_email_change()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.bounced_at := null;
  new.bounce_detail := null;
  return new;
end;
$$;

create trigger clear_bounce_on_email_change
  before update of email on public.people
  for each row when (old.email is distinct from new.email)
  execute function public.clear_bounce_on_email_change();

-- ---------- tags ----------

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> '' and length(name) <= 60),
  created_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index tags_name_key on public.tags (lower(btrim(name)));

-- Who has which tag now.
create table public.member_tags (
  person_id uuid not null references public.people (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  added_by uuid references public.people (id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (person_id, tag_id)
);
create index member_tags_tag_id on public.member_tags (tag_id);

-- Every add and remove, kept when the tag is deleted. "Tag added" is a moment Automatic Emails can
-- start from, so tagging 30 people at once writes 30 rows with the same time.
create table public.tag_events (
  id bigint generated always as identity primary key,
  person_id uuid not null references public.people (id) on delete cascade,
  tag_id uuid references public.tags (id) on delete set null,
  tag_name text not null,
  kind text not null check (kind in ('added', 'removed')),
  by_person_id uuid references public.people (id) on delete set null,
  at timestamptz not null default now()
);
create index tag_events_person_id on public.tag_events (person_id, at desc);
create index tag_events_tag_added on public.tag_events (tag_id, at) where kind = 'added';

-- Re-checks a member's waiting automatic emails after their tags change. Nothing to check until the
-- emails engine lands; it fills this in.
create function public.recheck_member(p_person_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  select
$$;

-- Creates the tag, or returns the one with that name.
create function public.create_tag(p_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  tag uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can create tags' using errcode = '42501';
  end if;
  select id into tag from public.tags where lower(btrim(name)) = lower(btrim(p_name));
  if tag is null then
    insert into public.tags (name, created_by) values (btrim(p_name), public.current_person_id())
    returning id into tag;
  end if;
  return tag;
end;
$$;

-- Returns 'renamed' or 'taken' (another tag has that name).
create function public.rename_tag(p_tag_id uuid, p_name text)
returns text
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can rename tags' using errcode = '42501';
  end if;
  update public.tags set name = btrim(p_name) where id = p_tag_id;
  return 'renamed';
exception when unique_violation then
  return 'taken';
end;
$$;

-- Removes the tag from everyone. The emails engine adds the refusal for tags an automatic email
-- uses ('in_use'); until then it returns 'deleted'.
create function public.delete_tag(p_tag_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete tags' using errcode = '42501';
  end if;
  -- Through untag_members, so each removal is logged and re-checked.
  perform public.untag_members(p_tag_id, array(select person_id from public.member_tags where tag_id = p_tag_id));
  delete from public.tags where id = p_tag_id;
  return 'deleted';
end;
$$;

-- Tags everyone listed who doesn't have it yet; returns how many changed. One person or 30 at once.
create function public.tag_members(p_tag_id uuid, p_person_ids uuid[])
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := public.current_person_id();
  changed uuid[];
  person uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can tag members' using errcode = '42501';
  end if;

  with added as (
    insert into public.member_tags (person_id, tag_id, added_by)
    select p.id, p_tag_id, me from public.people p where p.id = any (p_person_ids)
    on conflict do nothing
    returning person_id
  )
  select coalesce(array_agg(person_id), '{}') into changed from added;

  insert into public.tag_events (person_id, tag_id, tag_name, kind, by_person_id)
  select c, t.id, t.name, 'added', me from unnest(changed) c, public.tags t where t.id = p_tag_id;

  foreach person in array changed loop
    perform public.recheck_member(person);
  end loop;
  return cardinality(changed);
end;
$$;

create function public.untag_members(p_tag_id uuid, p_person_ids uuid[])
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := public.current_person_id();
  changed uuid[];
  person uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can untag members' using errcode = '42501';
  end if;

  with removed as (
    delete from public.member_tags where tag_id = p_tag_id and person_id = any (p_person_ids)
    returning person_id
  )
  select coalesce(array_agg(person_id), '{}') into changed from removed;

  insert into public.tag_events (person_id, tag_id, tag_name, kind, by_person_id)
  select c, t.id, t.name, 'removed', me from unnest(changed) c, public.tags t where t.id = p_tag_id;

  foreach person in array changed loop
    perform public.recheck_member(person);
  end loop;
  return cardinality(changed);
end;
$$;

-- ---------- referrals ----------

-- One row per invitation a member sends. `referred_id` is set when the invited address joins, so
-- both referral moments (someone refers, the referred person joins) have a time. How invitations
-- are created and matched is still open with tech; this is the least the directory needs to show
-- "Referred by" and "Referred".
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.people (id) on delete cascade,
  referred_email text not null check (referred_email = lower(btrim(referred_email))),
  referred_id uuid unique references public.people (id) on delete set null,
  created_at timestamptz not null default now(),
  joined_at timestamptz
);
create index referrals_referrer_id on public.referrals (referrer_id);
create unique index referrals_once_per_pair on public.referrals (referrer_id, referred_email);

-- ---------- access ----------

revoke execute on function
  public.split_name(text),
  public.add_admin(text, text),
  public.submit_welcome(text, jsonb),
  public.add_paying_member(text, text, timestamptz, boolean),
  public.email_hash(text),
  public.apply_suppression(uuid),
  public.can_email(uuid),
  public.unsubscribe_member(uuid),
  public.import_unsubscribes(text[]),
  public.recheck_member(uuid),
  public.create_tag(text),
  public.rename_tag(uuid, text),
  public.delete_tag(uuid),
  public.tag_members(uuid, uuid[]),
  public.untag_members(uuid, uuid[])
from public, anon;

-- The unsubscribe page works without signing in; the token is the proof.
revoke execute on function public.unsubscribe_by_token(uuid), public.resubscribe_by_token(uuid) from public;
grant execute on function public.unsubscribe_by_token(uuid), public.resubscribe_by_token(uuid) to anon, authenticated;

-- Webhook and trigger only.
revoke execute on function public.record_email_event(text, text, text), public.clear_bounce_on_email_change()
from public, anon, authenticated;

alter table public.suppressed_emails enable row level security;
alter table public.tags enable row level security;
alter table public.member_tags enable row level security;
alter table public.tag_events enable row level security;
alter table public.referrals enable row level security;

-- Reads for admins; every write goes through the functions above. Nobody reads the suppression
-- list: no policy.
create policy "Admins see tags" on public.tags for select to authenticated using ((select public.is_admin()));
create policy "Admins see member tags" on public.member_tags for select to authenticated using ((select public.is_admin()));
create policy "Admins see tag history" on public.tag_events for select to authenticated using ((select public.is_admin()));
create policy "Admins see referrals" on public.referrals for select to authenticated using ((select public.is_admin()));
