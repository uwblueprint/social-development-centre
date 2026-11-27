-- Referrals from member emails. A member opens /refer/<token> from an email footer, where the token is
-- their person token (people.unsubscribe_token, the same one the Unsubscribe link uses), and refers a
-- friend by name and email. SDC either emails the friend once, or the member sends a message
-- themselves. The friend's link is /intake-form/sdc-members?r=<referral id>.
--
-- A referral is complete when the friend becomes a member: membership_started (member_events
-- migration) links it and records referral_joined, which the automatic emails engine turns into the
-- referrer's thank-you. Nothing here emails the referrer.
--
-- people.email and intake_submissions.email are stored lowercased, so plain equality uses their indexes.
--
-- Rules (docs/backend/referrals.md):
-- - The referrer never learns anything about the friend: a friend who is already a member, has
--   unsubscribed or is suppressed gets the same answer as anyone else, and is simply not emailed.
-- - At most one email per friend address, ever, whoever refers them (CASL's refer-a-friend exemption,
--   and no member can be used to email someone repeatedly). A repeat referral never sends one.
-- - SDC's email to the friend never includes the name the member typed, so the name can't carry links.
-- - Ten new referrals per referrer per day, since the page works without signing in.

-- ---------- referrals ----------

alter table public.referrals
  -- The member asked SDC to email the friend, and the friend could be emailed at that moment. The
  -- sender sends rows with this set and invite_sent_at empty, then sets invite_sent_at.
  add column invite_requested_at timestamptz,
  add column invite_sent_at timestamptz,
  add constraint invite_sent_after_request check (invite_sent_at is null or invite_requested_at is not null);

create index referrals_invites_due on public.referrals (invite_requested_at)
  where invite_requested_at is not null and invite_sent_at is null;
-- The daily limit counts a referrer's recent referrals.
create index referrals_referrer_created on public.referrals (referrer_id, created_at desc);
-- Joining looks referrals up by the friend's address alone.
create index referrals_referred_email on public.referrals (referred_email);
-- One referral email per address, ever: enforced here, whatever calls in.
create unique index referrals_one_invite_per_address on public.referrals (referred_email)
  where invite_requested_at is not null;

-- ---------- the referral page ----------

-- The referrer behind a person token: a current member. Null for an unknown token or a non-member.
create function public.referrer_by_token(p_token uuid)
returns table (person_id uuid, first_name text, email text)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.first_name, p.email
  from public.people p
  join public.memberships m on m.person_id = p.id
  where p.unsubscribe_token = p_token
$$;

-- What the page needs before showing the form: the referrer's first name, or no row for a bad link.
create function public.referral_page(p_token uuid)
returns table (first_name text)
language sql stable security definer set search_path = ''
as $$
  select coalesce(r.first_name, '') from public.referrer_by_token(p_token) r
$$;

-- A member refers a friend. Returns one row:
--   status         unknown_link | invalid_name | invalid_email | own_email | limit | emailed | message
--   friend_name    the friend's first name, as typed
--   referral_id    for the friend's link (emailed and message)
--   referred_on    when this member first referred this address (a repeat referral only)
-- `emailed` means "we've taken it from here", whether or not an email will go out (see the rules).
create function public.refer_friend(p_token uuid, p_full_name text, p_email text, p_send_email boolean)
returns table (status text, friend_name text, referral_id uuid, referred_on timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  referrer record;
  v_name text := regexp_replace(btrim(coalesce(p_full_name, '')), '\s+', ' ', 'g');
  v_email text := lower(btrim(coalesce(p_email, '')));
  n record;
  existing public.referrals;
  created public.referrals;
  reachable boolean;
begin
  select * into referrer from public.referrer_by_token(p_token);
  if referrer.person_id is null then
    status := 'unknown_link';
    return next;
    return;
  end if;

  -- A name: no markup, addresses or URLs, and no control or invisible formatting characters (which can
  -- disguise text, e.g. right-to-left overrides). SDC's email to the friend doesn't use it anyway.
  if v_name = '' or char_length(v_name) > 80
     or v_name ~ '[<>/\\:@[:cntrl:]\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]' then
    status := 'invalid_name';
    return next;
    return;
  end if;
  -- One plain address: no separators or quotes, a domain of letters, digits, dots and hyphens.
  if char_length(v_email) > 254 or v_email !~ '^[^\s@,;"<>()\[\]\\]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$' then
    status := 'invalid_email';
    return next;
    return;
  end if;
  if v_email = referrer.email then
    status := 'own_email';
    return next;
    return;
  end if;

  n := public.split_name(v_name);
  friend_name := n.first_name;

  select * into existing from public.referrals r
  where r.referrer_id = referrer.person_id and r.referred_email = v_email;

  -- Referring the same address again: the same referral and link, and never an email.
  if existing.id is not null then
    status := 'message';
    referral_id := existing.id;
    referred_on := existing.created_at;
    return next;
    return;
  end if;

  -- Serialize one referrer's requests so two at once can't both pass the daily limit.
  perform pg_advisory_xact_lock(hashtextextended(referrer.person_id::text, 0));
  if (select count(*) from public.referrals r
      where r.referrer_id = referrer.person_id and r.created_at > now() - interval '1 day') >= 10 then
    status := 'limit';
    return next;
    return;
  end if;

  -- Emailable: never emailed by SDC as a referral before (by anyone), not already a member, not
  -- unsubscribed or bounced, not on the suppression list. Locked per address, so two members inviting
  -- the same friend at once can't both pass (the unique index is the backstop).
  if p_send_email then
    perform pg_advisory_xact_lock(hashtextextended('referral invite ' || v_email, 0));
  end if;
  reachable := p_send_email
    and not exists (
      select 1 from public.referrals r
      where r.referred_email = v_email and r.invite_requested_at is not null)
    and not exists (
      select 1 from public.people p
      where p.email = v_email
        and (p.unsubscribed_at is not null or p.bounced_at is not null
             or exists (select 1 from public.memberships m where m.person_id = p.id)))
    and not exists (select 1 from public.suppressed_emails s where s.email_hash = public.email_hash(v_email));

  insert into public.referrals (referrer_id, referred_email, referred_first_name, referred_last_name, invite_requested_at)
  values (referrer.person_id, v_email, n.first_name, n.last_name, case when reachable then now() end)
  on conflict (referrer_id, referred_email) do nothing
  returning * into created;

  -- Lost a race with the same referral from another tab: answer as a repeat.
  if created.id is null then
    select * into existing from public.referrals r
    where r.referrer_id = referrer.person_id and r.referred_email = v_email;
    status := 'message';
    referral_id := existing.id;
    referred_on := existing.created_at;
    return next;
    return;
  end if;

  status := case when p_send_email then 'emailed' else 'message' end;
  referral_id := created.id;
  return next;
end;
$$;

-- ---------- the friend's link ----------

-- The intake form records which referral link brought someone, so joining can credit that referral
-- even when they join with a different address than the one they were referred at.
alter table public.intake_submissions
  add column referral_id uuid references public.referrals (id) on delete set null;
create index intake_submissions_referral_id on public.intake_submissions (referral_id) where referral_id is not null;

-- Same as before, plus p_referral_id from the friend's link. An unknown id is ignored, not an error:
-- the form must never fail because a link was mangled.
drop function public.submit_intake(uuid, text, text, text, text, jsonb);

create function public.submit_intake(
  p_submission_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_form_source text,
  p_answers jsonb,
  p_referral_id uuid default null
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first_name text := nullif(btrim(p_first_name), '');
  v_last_name text := nullif(btrim(p_last_name), '');
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_answers jsonb := coalesce(p_answers, '{}'::jsonb);
  v_referral_id uuid := (select r.id from public.referrals r where r.id = p_referral_id);
  v_topics jsonb;
  v_topic jsonb;
  v_rank numeric;
  v_ranks integer[] := array[]::integer[];
begin
  if p_submission_id is null then
    raise exception 'A submission id is required' using errcode = '22023';
  end if;
  if v_first_name is null or v_last_name is null then
    raise exception 'A first and last name are required' using errcode = '22023';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;
  if p_form_source is null or p_form_source not in ('ride-for-refuage', 'sdc-members') then
    raise exception 'A valid form source is required' using errcode = '22023';
  end if;

  if jsonb_typeof(v_answers) is distinct from 'object' then
    raise exception 'Invalid answers' using errcode = '22023';
  end if;
  v_topics := v_answers -> 'topics';
  if jsonb_typeof(v_topics) is distinct from 'array' then
    raise exception 'Rank all nine topics, or skip the question' using errcode = '22023';
  end if;
  if jsonb_array_length(v_topics) not in (0, 9) then
    raise exception 'Rank all nine topics, or skip the question' using errcode = '22023';
  end if;
  for v_topic in select value from jsonb_array_elements(v_topics) loop
    if jsonb_typeof(v_topic) is distinct from 'object' then
      raise exception 'Invalid topic ranking' using errcode = '22023';
    end if;
    if (select count(*) from jsonb_object_keys(v_topic)) <> 2
      or jsonb_typeof(v_topic -> 'rank') is distinct from 'number'
      or jsonb_typeof(v_topic -> 'topic') is distinct from 'string' then
      raise exception 'Invalid topic ranking' using errcode = '22023';
    end if;
    v_rank := (v_topic ->> 'rank')::numeric;
    if v_rank < 1 or v_rank > 9 or v_rank <> trunc(v_rank) or v_rank::integer = any(v_ranks) then
      raise exception 'Ranks must be unique values from 1 to 9' using errcode = '22023';
    end if;
    if length(v_topic ->> 'topic') > 120 then
      raise exception 'Invalid topic label' using errcode = '22023';
    end if;
    v_ranks := array_append(v_ranks, v_rank::integer);
  end loop;

  insert into public.intake_submissions (
    submission_id, first_name, last_name, email, answers, form_source, referral_id
  ) values (
    p_submission_id, v_first_name, v_last_name, v_email, v_answers, p_form_source, v_referral_id
  )
  on conflict (submission_id) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = excluded.email,
        answers = excluded.answers,
        form_source = excluded.form_source,
        -- A retry without the link keeps the referral the first save recorded.
        referral_id = coalesce(excluded.referral_id, public.intake_submissions.referral_id),
        updated_at = now();
end;
$$;

-- ---------- joining ----------

-- Same as before, except which open referral a new member completes: the one whose link they used on
-- the intake form (latest submission with their address), else the earliest referral of their address.
create or replace function public.membership_started()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  referral public.referrals;
begin
  if not exists (select 1 from public.referrals r3 where r3.referred_id = new.person_id) then
    update public.referrals r
    set referred_id = new.person_id, joined_at = new.joined_at
    where r.id = coalesce(
      (select s.referral_id from public.intake_submissions s
       join public.referrals r2 on r2.id = s.referral_id
       join public.people p on p.id = new.person_id
       where s.email = p.email and r2.referred_id is null and r2.referrer_id <> new.person_id
       order by s.created_at desc
       limit 1),
      (select r2.id from public.referrals r2
       join public.people p on p.email = r2.referred_email
       where p.id = new.person_id and r2.referred_id is null and r2.referrer_id <> new.person_id
       order by r2.created_at
       limit 1)
    )
    -- Re-checked after waiting for the row: two people joining at once through one forwarded link
    -- can't both take the same referral.
    and r.referred_id is null
    returning r.* into referral;
  end if;

  if referral.id is not null then
    insert into public.member_events (person_id, kind, at, referral_id, join_emails)
    values (referral.referrer_id, 'referral_joined', new.joined_at, referral.id, new.join_emails);
  end if;

  insert into public.member_events (person_id, kind, at, referral_id, join_emails)
  values (new.person_id, 'joined', new.joined_at, referral.id, new.join_emails);
  return new;
end;
$$;

-- ---------- access ----------

-- The referral page works without signing in; the person token is the proof.
revoke execute on function public.refer_friend(uuid, text, text, boolean), public.referral_page(uuid) from public;
grant execute on function public.refer_friend(uuid, text, text, boolean), public.referral_page(uuid) to anon, authenticated;

-- Internal: returns the referrer's email, so nobody calls it directly.
revoke execute on function public.referrer_by_token(uuid) from public, anon, authenticated;

revoke all on function public.submit_intake(uuid, text, text, text, text, jsonb, uuid) from public;
grant execute on function public.submit_intake(uuid, text, text, text, text, jsonb, uuid) to anon, authenticated;
