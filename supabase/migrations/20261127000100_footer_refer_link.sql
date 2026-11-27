-- The "Refer a friend" link in every member email's footer, next to Unsubscribe: a third fixed link in the
-- footer document (20261124000000_email_footer.sql), to the member's own refer-a-friend page. Admins can change
-- its words (the link's `attrs.label`, in Settings) but never remove it. From #95, folded into the one footer.
--
-- Footers saved before this have no refer link; the app adds it when it reads them (withReferLink in
-- src/features/email-footer/doc.ts), so nothing here rewrites stored data.

-- As in 20261124000000_email_footer.sql, plus: exactly one refer link, and words the footer can show.
-- The words are optional (no label = "Refer a friend"); when set they must be 1-40 characters, already
-- trimmed with single spaces, with no control or invisible characters (zero-width, right-to-left overrides),
-- no < or >, and nothing that looks like an address (@, ://, www.): spam filters flag link text that
-- doesn't match where it goes. referTextError in doc.ts checks the same before saving.
create or replace function public.set_email_footer(p_doc jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_unsubscribe int;
  v_cancel int;
  v_refer int;
  v_label text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change the email footer' using errcode = '42501';
  end if;
  if p_doc is null or p_doc->>'type' is distinct from 'doc' or jsonb_typeof(p_doc->'content') is distinct from 'array'
     or pg_column_size(p_doc) > 20000 then
    raise exception 'The footer isn''t a footer document' using errcode = '22023';
  end if;
  select count(*) into v_unsubscribe
    from jsonb_path_query(p_doc, 'strict $.** ? (@.type == "footerLink" && @.attrs.kind == "unsubscribe")');
  select count(*) into v_cancel
    from jsonb_path_query(p_doc, 'strict $.** ? (@.type == "footerLink" && @.attrs.kind == "cancel")');
  select count(*) into v_refer
    from jsonb_path_query(p_doc, 'strict $.** ? (@.type == "footerLink" && @.attrs.kind == "refer")');
  if v_unsubscribe <> 1 or v_cancel <> 1 or v_refer <> 1 then
    raise exception 'The footer needs exactly one unsubscribe, refer and cancel link' using errcode = '22023';
  end if;

  v_label := jsonb_path_query_first(p_doc, 'strict $.** ? (@.type == "footerLink" && @.attrs.kind == "refer").attrs.label') #>> '{}';
  if v_label is not null and (
       v_label <> btrim(v_label)
       or char_length(v_label) not between 1 and 40
       or v_label ~ '[<>@[:cntrl:]­​-‏‪-‮⁠-⁩﻿]'
       or v_label ~* '(://|www\.)'
       or v_label ~ '\s{2,}'
     ) then
    raise exception 'Refer link text is not valid' using errcode = '22023';
  end if;

  insert into public.email_footer (id, doc, updated_by)
  values (true, p_doc, public.current_person_id())
  on conflict (id) do update
    set doc = excluded.doc, updated_by = excluded.updated_by, updated_at = now();
end;
$$;

-- ---------- sending ----------

-- As in 20261112000000_automatic_emails_editor.sql, plus `can_refer`: the recipient is a current member, so
-- their refer link works. Emails that still reach someone whose membership ended leave the link out rather
-- than send them to "This link doesn't work". (From #95.)
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

revoke execute on function public.email_deliveries() from public, anon, authenticated;
