-- Attribution: every email carries its own link token, so we know who acted and from which email.
-- The same token powers the intake form link (who is filling it in), the unsubscribe link (who
-- unsubscribed, from which email) and the referral link (who referred, from which email).
-- Rename this file to the version Supabase assigns when applied.

-- ---------- links ----------

-- One row per link token. Every send gets one automatically; every email goes through our own sender
-- (SMTP, no Mailchimp), so there are no links without a send.
create table public.email_links (
  token uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  send_id uuid not null unique references public.email_sends (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index email_links_person_id on public.email_links (person_id);

-- What happened through a link, and when.
create table public.link_events (
  id bigint generated always as identity primary key,
  token uuid not null references public.email_links (token) on delete cascade,
  kind text not null check (kind in (
    'intake_opened', 'intake_submitted',
    'unsubscribe_opened', 'unsubscribed', 'resubscribed',
    'referral_opened', 'referral_submitted'
  )),
  at timestamptz not null default now()
);
create index link_events_token on public.link_events (token, at);

create function public.send_link_created()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.email_links (person_id, send_id) values (new.person_id, new.id);
  return new;
end;
$$;

create trigger send_link_created after insert on public.email_sends
for each row execute function public.send_link_created();

-- ---------- opening a link (no sign-in: the token is the proof) ----------

-- Records that a link page was opened and returns the person's first name for a greeting, or no row
-- if the token isn't real. Never returns who they are beyond that.
create function public.open_link(p_token uuid, p_page text)
returns table (first_name text)
language plpgsql security definer set search_path = ''
as $$
declare
  person uuid;
begin
  if p_page not in ('intake', 'unsubscribe', 'referral') then
    raise exception 'Unknown page' using errcode = '22023';
  end if;
  select l.person_id into person from public.email_links l where l.token = p_token;
  if person is null then
    return;
  end if;
  insert into public.link_events (token, kind) values (p_token, p_page || '_opened');
  return query select p.first_name from public.people p where p.id = person;
end;
$$;

-- ---------- unsubscribe ----------

-- Which send someone unsubscribed from, on top of the unsubscribe itself, and why (if they say). The
-- reason is an id from the app's list (src/features/links/reasons.ts), so the list can change without
-- a migration.
alter table public.subscription_events
  add column send_id uuid references public.email_sends (id) on delete set null,
  add column reason text check (reason ~ '^[a-z_]{1,40}$');

-- 'unsubscribed', 'already' or null for an unknown token. Opening the page never unsubscribes; this
-- runs when they click Unsubscribe.
create function public.unsubscribe_by_link(p_token uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  link public.email_links;
begin
  select * into link from public.email_links where token = p_token;
  if link.token is null then
    return null;
  end if;
  update public.people set unsubscribed_at = now(), unsubscribe_reason = 'self'
  where id = link.person_id and unsubscribed_at is null;
  if not found then
    return 'already';
  end if;

  update public.subscription_events set send_id = link.send_id
  where id = (select max(id) from public.subscription_events where person_id = link.person_id and kind = 'unsubscribed');
  insert into public.link_events (token, kind) values (p_token, 'unsubscribed');
  return 'unsubscribed';
end;
$$;

-- Only the member can undo an unsubscribe, from the same page. 'resubscribed', 'already' or null.
create function public.resubscribe_by_link(p_token uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  link public.email_links;
begin
  select * into link from public.email_links where token = p_token;
  if link.token is null then
    return null;
  end if;
  update public.people set unsubscribed_at = null, unsubscribe_reason = null
  where id = link.person_id and unsubscribed_at is not null;
  if not found then
    return 'already';
  end if;

  update public.subscription_events set send_id = link.send_id
  where id = (select max(id) from public.subscription_events where person_id = link.person_id and kind = 'resubscribed');
  insert into public.link_events (token, kind) values (p_token, 'resubscribed');
  return 'resubscribed';
end;
$$;

-- After unsubscribing, the member can say why (optional, a short dropdown). Sets the reason on their
-- latest unsubscribe from this link. True if it was recorded; false for an unknown token or if they
-- aren't unsubscribed through this link (e.g. they resubscribed since).
create function public.give_unsubscribe_reason(p_token uuid, p_reason text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  link public.email_links;
begin
  if p_reason is null or p_reason !~ '^[a-z_]{1,40}$' then
    raise exception 'Unknown reason' using errcode = '22023';
  end if;
  select * into link from public.email_links where token = p_token;
  if link.token is null then
    return false;
  end if;

  update public.subscription_events e set reason = p_reason
  where e.id = (select max(id) from public.subscription_events where person_id = link.person_id and kind = 'unsubscribed')
    and e.send_id = link.send_id
    and exists (select 1 from public.people p where p.id = link.person_id and p.unsubscribed_at is not null);
  return found;
end;
$$;

-- ---------- referrals ----------

alter table public.referrals add column link_token uuid references public.email_links (token) on delete set null;

-- A friend leaves their name and email on the referral link's page. The referrer is whoever the link
-- was sent to. 'recorded', 'already' (this member already referred that address) or null.
create function public.refer_by_link(p_token uuid, p_email text, p_full_name text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  link public.email_links;
  n record;
  email text := lower(btrim(coalesce(p_email, '')));
begin
  select * into link from public.email_links where token = p_token;
  if link.token is null then
    return null;
  end if;
  if email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;
  n := public.split_name(p_full_name);

  insert into public.referrals (referrer_id, referred_email, referred_first_name, referred_last_name, link_token)
  values (link.person_id, email, n.first_name, n.last_name, p_token)
  on conflict (referrer_id, referred_email) do nothing;
  if not found then
    return 'already';
  end if;
  insert into public.link_events (token, kind) values (p_token, 'referral_submitted');
  return 'recorded';
end;
$$;

-- ---------- intake form ----------

-- Who filled it in, when they came from their own link. Null for the open link.
alter table public.intake_submissions
  add column link_token uuid references public.email_links (token) on delete set null,
  add column person_id uuid references public.people (id) on delete set null;

drop function public.submit_intake(uuid, text, text, text, jsonb);

create function public.submit_intake(
  p_submission_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_answers jsonb,
  p_link_token uuid default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first_name text := nullif(btrim(p_first_name), '');
  v_last_name text := nullif(btrim(p_last_name), '');
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_person uuid;
begin
  -- Checked here as well as in the form: this function is reachable by anyone.
  if v_first_name is null or v_last_name is null then
    raise exception 'A first and last name are required' using errcode = '22023';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;
  -- An unknown token is ignored rather than refused: the answers still matter.
  select person_id into v_person from public.email_links where token = p_link_token;

  insert into public.intake_submissions (submission_id, first_name, last_name, email, answers, link_token, person_id)
  values (p_submission_id, v_first_name, v_last_name, v_email, coalesce(p_answers, '{}'::jsonb),
    case when v_person is null then null else p_link_token end, v_person)
  on conflict (submission_id) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = excluded.email,
        answers = excluded.answers,
        link_token = coalesce(public.intake_submissions.link_token, excluded.link_token),
        person_id = coalesce(public.intake_submissions.person_id, excluded.person_id),
        updated_at = now();

  if v_person is not null and not exists (
    select 1 from public.link_events where token = p_link_token and kind = 'intake_submitted'
  ) then
    insert into public.link_events (token, kind) values (p_link_token, 'intake_submitted');
  end if;
end;
$$;

-- ---------- links on the member timeline ----------

create or replace view public.member_timeline with (security_invoker = true) as
  select e.person_id, e.at, e.kind, e.tag_name, e.referral_id, null::uuid as note_id,
    null::uuid as send_id, null::text as email_status, null::text as body, null::uuid as by_person_id,
    false as edited
  from public.member_events e
  union all
  select t.person_id, t.at, 'tag_removed', t.tag_name, null, null, null, null, null, t.by_person_id, false
  from public.tag_events t where t.kind = 'removed'
  union all
  select n.person_id, n.created_at, 'note', null, null, n.id, null, null, n.body, n.created_by, n.updated_at is not null
  from public.member_notes n where n.deleted_at is null
  union all
  select s.person_id, coalesce(s.sent_at, s.send_at), 'email', null, null, null, s.id, s.status,
    s.email_name, null, s.edited_at is not null
  from public.email_sends s
  union all
  select c.person_id, c.at, c.kind, null, null, null, c.send_id, null, c.detail, null, false
  from public.subscription_events c
  union all
  -- Intake opened and submitted (unsubscribes and referrals already show through the rows above).
  select l.person_id, ev.at, ev.kind, null, null, null, l.send_id, null, s.email_name, null, false
  from public.link_events ev
  join public.email_links l on l.token = ev.token
  join public.email_sends s on s.id = l.send_id
  where ev.kind in ('intake_opened', 'intake_submitted');

-- ---------- access ----------

-- The link pages work without signing in; the token is the proof.
revoke execute on function
  public.open_link(uuid, text), public.unsubscribe_by_link(uuid), public.resubscribe_by_link(uuid),
  public.give_unsubscribe_reason(uuid, text), public.refer_by_link(uuid, text, text),
  public.submit_intake(uuid, text, text, text, jsonb, uuid)
from public;
grant execute on function
  public.open_link(uuid, text), public.unsubscribe_by_link(uuid), public.resubscribe_by_link(uuid),
  public.give_unsubscribe_reason(uuid, text), public.refer_by_link(uuid, text, text),
  public.submit_intake(uuid, text, text, text, jsonb, uuid)
to anon, authenticated;
revoke execute on function public.send_link_created() from public, anon, authenticated;

alter table public.email_links enable row level security;
alter table public.link_events enable row level security;

-- Reads for admins; nobody else reads tokens.
create policy "Admins see links" on public.email_links for select to authenticated using ((select public.is_admin()));
create policy "Admins see link events" on public.link_events for select to authenticated using ((select public.is_admin()));
