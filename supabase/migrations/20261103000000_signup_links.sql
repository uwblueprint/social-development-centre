-- Signup links: one link and QR code per outreach event, so staff can see which events bring people in.
-- People open /join?source=<slug>; the join steps record a click when the welcome step loads and a join
-- when the thank-you step loads. See docs/backend/signup-links.md.

create table public.signup_links (
  id uuid primary key default gen_random_uuid(),
  -- The event the link was made for, as the admin typed it (trimmed).
  name text not null check (btrim(name) <> '' and length(name) <= 500),
  -- What the link carries as ?source=. Lowercase words joined by hyphens, unique, and never changed:
  -- printed QR codes carry it.
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 520),
  created_at timestamptz not null default now(),
  created_by uuid references public.people (id) on delete set null
);

create index signup_links_created_at_idx on public.signup_links (created_at desc);

-- A link's slug (and id) can't change after it's made, even from the dashboard.
create function public.keep_signup_link_slug()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.slug is distinct from old.slug or new.id is distinct from old.id then
    raise exception 'A signup link''s slug never changes: printed QR codes carry it' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger signup_links_keep_slug
  before update on public.signup_links
  for each row execute function public.keep_signup_link_slug();

-- One row per click or join. visit_id is a random id the join steps make on the welcome step and carry
-- to the thank-you step; it is not a person. It makes each write idempotent (a reloaded thank-you page
-- or a retried request adds nothing) and ties a join to the click it came from.
create table public.signup_link_events (
  id bigint generated always as identity primary key,
  link_id uuid not null references public.signup_links (id) on delete cascade,
  kind text not null check (kind in ('click', 'join')),
  visit_id uuid not null,
  -- Set once the join steps collect who is joining; joins then count once per person per link.
  person_id uuid references public.people (id) on delete set null,
  at timestamptz not null default now(),
  check (kind = 'join' or person_id is null),
  unique (link_id, kind, visit_id)
);

create index signup_link_events_link_id_kind_idx on public.signup_link_events (link_id, kind);
create unique index signup_link_events_one_join_per_person_idx
  on public.signup_link_events (link_id, person_id)
  where kind = 'join' and person_id is not null;

-- Makes a link. p_slug is the slug made from the name in the app (src/features/signup-links/slug.ts);
-- when another link has it, -2, -3 and so on is added. Returns the new link.
create function public.create_signup_link(p_name text, p_slug text)
returns public.signup_links
language plpgsql security definer set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(p_name, ''));
  v_slug text;
  v_n integer := 2;
  v_link public.signup_links;
begin
  if not public.is_admin() then
    raise exception 'Only admins can create signup links' using errcode = '42501';
  end if;
  if v_name = '' then
    raise exception 'An event name is required' using errcode = '22023';
  end if;
  if p_slug is null or p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(p_slug) > 500 then
    raise exception 'Invalid slug' using errcode = '22023';
  end if;

  -- One creation at a time, so two admins naming the same event get -2 and not a unique-key error.
  perform pg_advisory_xact_lock(hashtext('public.signup_links'));

  v_slug := p_slug;
  while exists (select 1 from public.signup_links where slug = v_slug) loop
    v_slug := p_slug || '-' || v_n;
    v_n := v_n + 1;
  end loop;

  insert into public.signup_links (name, slug, created_by)
  values (v_name, v_slug, public.current_person_id())
  returning * into v_link;
  return v_link;
end;
$$;

-- Called by the public join steps, signed in or not, so both treat p_source as untrusted: an unknown or
-- malformed source records nothing and raises nothing.
create function public.record_signup_link_click(p_source text, p_visit_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_link_id uuid;
begin
  if p_source is null or length(p_source) > 520 or p_visit_id is null then
    return;
  end if;
  select id into v_link_id from public.signup_links where slug = p_source;
  if v_link_id is null then
    return;
  end if;
  insert into public.signup_link_events (link_id, kind, visit_id)
  values (v_link_id, 'click', p_visit_id)
  on conflict do nothing;
end;
$$;

-- A join only counts for a visit that recorded a click on the same link, so a join can't be made up
-- without first opening the link.
create function public.record_signup_link_join(p_source text, p_visit_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_link_id uuid;
begin
  if p_source is null or length(p_source) > 520 or p_visit_id is null then
    return;
  end if;
  select l.id into v_link_id
  from public.signup_links l
  where l.slug = p_source
    and exists (
      select 1 from public.signup_link_events e
      where e.link_id = l.id and e.kind = 'click' and e.visit_id = p_visit_id
    );
  if v_link_id is null then
    return;
  end if;
  insert into public.signup_link_events (link_id, kind, visit_id)
  values (v_link_id, 'join', p_visit_id)
  on conflict do nothing;
end;
$$;

revoke execute on function public.create_signup_link(text, text) from public, anon;
revoke execute on function public.keep_signup_link_slug() from public, anon, authenticated;
grant execute on function
  public.record_signup_link_click(text, uuid),
  public.record_signup_link_join(text, uuid)
to anon, authenticated;

-- Admins read; every write goes through the functions above.
alter table public.signup_links enable row level security;
alter table public.signup_link_events enable row level security;
revoke insert, update, delete, truncate on table public.signup_links, public.signup_link_events
  from public, anon, authenticated;

create policy "Admins see signup links"
  on public.signup_links for select to authenticated
  using ((select public.is_admin()));

create policy "Admins see signup link events"
  on public.signup_link_events for select to authenticated
  using ((select public.is_admin()));

-- Every link with its click and join counts, newest first. Reads through the policies above.
create view public.signup_link_counts with (security_invoker = true) as
select
  l.id,
  l.name,
  l.slug,
  l.created_at,
  (count(e.id) filter (where e.kind = 'click'))::integer as clicks,
  (count(e.id) filter (where e.kind = 'join'))::integer as joins
from public.signup_links l
left join public.signup_link_events e on e.link_id = l.id
group by l.id;

revoke all on public.signup_link_counts from public, anon;
grant select on public.signup_link_counts to authenticated;
