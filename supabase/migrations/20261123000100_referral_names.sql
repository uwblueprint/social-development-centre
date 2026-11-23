-- The friend's name as members actually type it: "Priya", "Priya Patel", "Dr. Priya Patel", "mrs priya".
-- refer_friend stored the first word as the first name, so "Dr. Priya Patel" became first name "Dr.".
-- Now titles are dropped first, the same rule the refer page uses (firstNameOf in
-- src/features/referrals/recipient.ts), so the page, the stored name and the friend_name it returns agree:
-- - leading titles go, with or without a full stop, in any case: Mr Mrs Ms Miss Mx Dr Prof Professor Rev Sir Madam Dame;
-- - the first word left is the first name, the rest the last name;
-- - a title with only one word after it ("Dr. Patel") can't tell first from last, so it's kept whole:
--   greeting "Dr. Patel", stored as split_name splits it.
-- The name is still validated and normalised exactly as before; only how it's split changes.

-- greeting: what the page thanks them by ("Priya"; "Dr. Patel" when that's all there is).
create function public.split_referred_name(p_name text, out first_name text, out last_name text, out greeting text)
language plpgsql immutable set search_path = ''
as $$
declare
  words text[] := regexp_split_to_array(btrim(coalesce(p_name, '')), '\s+');
  n int := coalesce(array_length(words, 1), 0);
  i int := 1;
  parts record;
begin
  while i <= n and lower(rtrim(words[i], '.')) = any (array[
    'mr', 'mrs', 'ms', 'miss', 'mx', 'dr', 'prof', 'professor', 'rev', 'sir', 'madam', 'dame'
  ]) loop
    i := i + 1;
  end loop;

  -- No title, or a title and at least two words after it: split what's left.
  if i = 1 or n - i + 1 >= 2 then
    parts := public.split_name(array_to_string(words[i:n], ' '));
    first_name := parts.first_name;
    last_name := parts.last_name;
    greeting := parts.first_name;
    return;
  end if;

  -- Only titles, or a title and one word: keep it whole.
  parts := public.split_name(btrim(p_name));
  first_name := parts.first_name;
  last_name := parts.last_name;
  greeting := btrim(p_name);
end;
$$;

-- Internal: refer_friend (security definer) calls it.
revoke execute on function public.split_referred_name(text) from public, anon, authenticated;

create or replace function public.refer_friend(p_token uuid, p_full_name text, p_email text, p_send_email boolean)
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

  n := public.split_referred_name(v_name);
  friend_name := n.greeting;

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
