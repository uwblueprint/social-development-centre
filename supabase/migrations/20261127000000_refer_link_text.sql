-- The "Refer a friend" link in every member email's footer, next to Unsubscribe. The link is always there
-- (it can't be turned off or blanked); admins can only change its text, in Settings.
--
-- One row, ever: `id` can only be true, the row is seeded here, and nobody gets insert or delete.

create table public.email_settings (
  id boolean primary key default true check (id),
  refer_link_text text not null default 'Refer a friend',
  updated_by uuid references public.people (id) on delete set null,
  updated_at timestamptz not null default now(),
  -- Same rules as set_refer_link_text, so nothing can store text the footer can't show.
  constraint refer_link_text_valid check (
    refer_link_text = btrim(refer_link_text)
    and char_length(refer_link_text) between 1 and 40
    and refer_link_text !~ '[<>@[:cntrl:]\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]'
    and refer_link_text !~* '(://|www\.)'
    and refer_link_text !~ '\s{2,}'
  )
);

insert into public.email_settings (id) values (true);

-- Saves new link text and returns it as stored. Turns line breaks, tabs and runs of spaces into one
-- space and trims first. Raises 42501 for non-admins and 22023 for text the footer can't show:
--   empty, over 40 characters, control or invisible characters (e.g. right-to-left overrides), < or >,
--   or anything that looks like a web or email address (@, ://, www.), which spam filters flag
--   when a link's text doesn't match where it goes.
create function public.set_refer_link_text(p_text text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_text text := btrim(regexp_replace(coalesce(p_text, ''), '\s+', ' ', 'g'));
begin
  if not public.is_admin() then
    raise exception 'Only admins can change the email footer' using errcode = '42501';
  end if;
  if char_length(v_text) not between 1 and 40
     or v_text ~ '[<>@[:cntrl:]\u00ad\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff]'
     or v_text ~* '(://|www\.)'
     or v_text ~ '\s{2,}' then
    raise exception 'Refer link text is not valid' using errcode = '22023';
  end if;
  update public.email_settings
    set refer_link_text = v_text, updated_by = public.current_person_id(), updated_at = now()
    where id;
  return v_text;
end;
$$;

-- ---------- sending ----------

-- As before, plus `can_refer`: the recipient is a current member, so their refer link works. Emails that
-- still reach someone whose membership ended (e.g. legally required ones) leave the link out rather than
-- send them to "This link doesn't work".
drop function public.email_deliveries();
create function public.email_deliveries()
returns table (
  send_id uuid,
  to_email text,
  subject text,
  subject_doc jsonb,
  body jsonb,
  fields jsonb,
  unsubscribe_token uuid,
  can_refer boolean
)
language sql stable security definer set search_path = ''
as $$
  select s.id, p.email, coalesce(s.subject_override, e.subject),
         case when s.subject_override is null then e.subject_doc else '{}'::jsonb end,
         coalesce(s.body_override, e.body),
         jsonb_strip_nulls(jsonb_build_object(
           'first_name', p.first_name,
           'last_name', p.last_name,
           'full_name', p.full_name,
           'email', p.email,
           'join_date', to_char(m.joined_at at time zone 'America/Toronto', 'FMMonth FMDD, YYYY'),
           'referrer_first_name', rr.first_name,
           'referrer_last_name', rr.last_name,
           'referrer_full_name', rr.full_name,
           'referred_first_name', coalesce(rd.first_name, ref.referred_first_name),
           'referred_last_name', coalesce(rd.last_name, ref.referred_last_name),
           'referred_full_name', coalesce(rd.full_name,
             nullif(concat_ws(' ', ref.referred_first_name, ref.referred_last_name), ''))
         )),
         p.unsubscribe_token,
         -- The refer page's own test (referrer_by_token): a membership row.
         m.person_id is not null
  from public.email_sends s
  join public.automatic_emails e on e.id = s.automatic_email_id
  join public.email_occurrences o on o.id = s.occurrence_id
  join public.people p on p.id = s.person_id
  left join public.memberships m on m.person_id = p.id
  left join public.referrals joined_by on e.trigger = 'join_referral' and joined_by.referred_id = p.id
  left join public.people rr on rr.id = joined_by.referrer_id
  left join public.referrals ref on ref.id = (o.context ->> 'referral_id')::uuid
  left join public.people rd on rd.id = ref.referred_id
  where s.status = 'sending' and e.state = 'published'
  order by s.due_on, s.created_at
$$;

-- ---------- access ----------

revoke execute on function public.set_refer_link_text(text) from public, anon;
revoke execute on function public.email_deliveries() from public, anon, authenticated;

alter table public.email_settings enable row level security;
-- Admins read it for Settings and the email previews; only set_refer_link_text writes it. The sender
-- uses the secret key. No insert, update or delete policy: the one row can't be added, changed directly
-- or removed.
create policy "Admins see email settings" on public.email_settings for select to authenticated using ((select public.is_admin()));
revoke all on public.email_settings from public, anon;
revoke insert, update, delete, truncate on public.email_settings from authenticated;
