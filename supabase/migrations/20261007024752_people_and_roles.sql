-- People SDC knows, the roles that let them sign in, and the welcome form members fill in once.
-- Replaces profiles: SDC adds people (paying members, admins) before they ever sign in, so a person
-- can't depend on a login existing. Partners get their own tables later and reuse people.

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();
drop table if exists public.profiles;

create table public.people (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email))),
  full_name text,
  user_id uuid unique references auth.users (id) on delete set null,
  first_signed_in_at timestamptz,
  last_signed_in_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.admins (
  person_id uuid primary key references public.people (id) on delete cascade,
  added_by uuid references public.people (id) on delete set null,
  added_at timestamptz not null default now()
);

-- Paying members are donors, so their access doesn't expire.
create table public.memberships (
  person_id uuid primary key references public.people (id) on delete cascade,
  tier text not null default 'general' check (tier in ('general', 'paying')),
  created_at timestamptz not null default now()
);

create table public.welcome_answers (
  person_id uuid primary key references public.people (id) on delete cascade,
  answers jsonb not null,
  submitted_at timestamptz not null default now()
);

create function public.current_person_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select id from public.people where user_id = (select auth.uid())
$$;

create function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where person_id = public.current_person_id())
$$;

-- Checked before a sign-in link is sent, so signed-out visitors call it. It reveals no more than the
-- sign-in screens do ("This email isn't on our paying member list").
create function public.can_sign_in(p_email text, p_portal text)
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
        when 'member' then m.tier = 'paying'
        else false
      end
  )
$$;

-- Runs once a sign-in link is verified: links the login to the person with that email. False if
-- nobody has that email or it already belongs to another login. Relies on "Confirm email" staying
-- on in Supabase, so a session always proves the person owns the address.
create function public.record_sign_in()
returns boolean
language sql security definer set search_path = ''
as $$
  with signed_in as (
    update public.people
    set user_id = (select auth.uid()),
        first_signed_in_at = coalesce(first_signed_in_at, now()),
        last_signed_in_at = now()
    where email = lower((select auth.jwt()) ->> 'email')
      and (user_id is null or user_id = (select auth.uid()))
    returning id
  )
  select exists (select 1 from signed_in)
$$;

-- Returns false if they're already an admin.
create function public.add_admin(p_email text, p_full_name text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  new_admin_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add admins' using errcode = '42501';
  end if;

  insert into public.people (email, full_name)
  values (lower(btrim(p_email)), nullif(btrim(p_full_name), ''))
  on conflict (email) do update set full_name = coalesce(public.people.full_name, excluded.full_name)
  returning id into new_admin_id;

  insert into public.admins (person_id, added_by)
  values (new_admin_id, public.current_person_id())
  on conflict (person_id) do nothing;

  return found;
end;
$$;

create function public.submit_welcome(p_full_name text, p_answers jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := public.current_person_id();
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  update public.people set full_name = nullif(btrim(p_full_name), '') where id = me;

  insert into public.welcome_answers (person_id, answers)
  values (me, p_answers)
  on conflict (person_id) do update set answers = excluded.answers, submitted_at = now();
end;
$$;

-- Supabase confirms a new login email before changing it; this keeps people.email in step.
create function public.sync_person_email()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.people set email = lower(new.email) where user_id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_person_email();

revoke execute on function
  public.current_person_id(),
  public.is_admin(),
  public.record_sign_in(),
  public.add_admin(text, text),
  public.submit_welcome(text, jsonb)
from public, anon;

grant execute on function public.can_sign_in(text, text) to anon, authenticated;

-- Reads go through these policies; every write goes through the functions above.
alter table public.people enable row level security;
alter table public.admins enable row level security;
alter table public.memberships enable row level security;
alter table public.welcome_answers enable row level security;

create policy "People see themselves, admins see everyone"
  on public.people for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Admins see admins"
  on public.admins for select to authenticated
  using ((select public.is_admin()));

create policy "Members see their membership, admins see all"
  on public.memberships for select to authenticated
  using (person_id = (select public.current_person_id()) or (select public.is_admin()));

create policy "Members see their answers, admins see all"
  on public.welcome_answers for select to authenticated
  using (person_id = (select public.current_person_id()) or (select public.is_admin()));

-- The first admin. Every admin can add more from /admin/admins.
with first_admin as (
  insert into public.people (email, full_name)
  values ('jesshuang5733@gmail.com', 'Jesse Huang')
  returning id
)
insert into public.admins (person_id)
select id from first_admin;
