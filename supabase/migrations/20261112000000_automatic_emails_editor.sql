-- Automatic Emails, what the admin editor needs on top of 20261111000000_automatic_emails: the
-- "Must have" condition, the subject as Email Editor JSON, the message checks publishing makes, the
-- shared backup text for personalized fields, and each send's member details for the sender to fill
-- them in. docs/backend/automatic-emails.md and docs/backend/email-editor.md explain the model.

-- ---------- Must have ----------

-- require = has every one of these tags. Like only and never, it ignores the tag the email starts from.
-- rows is the editor's: which conditions the admin added, in order. The database doesn't read it.
alter table public.automatic_emails
  alter column conditions set default
    '{"version": 2, "rows": [], "only": [], "require": [], "never": [], "joined": {"op": "any"}}'::jsonb;

create or replace function public.validate_conditions(p jsonb)
returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if jsonb_typeof(p) is distinct from 'object' or p ->> 'version' is distinct from '2'
     or jsonb_typeof(p -> 'only') is distinct from 'array' or jsonb_typeof(p -> 'never') is distinct from 'array'
     or jsonb_typeof(coalesce(p -> 'require', '[]'::jsonb)) <> 'array'
     or jsonb_typeof(coalesce(p -> 'rows', '[]'::jsonb)) <> 'array'
     or jsonb_typeof(p -> 'joined') is distinct from 'object'
     or coalesce(p -> 'joined' ->> 'op', 'any') not in ('any', 'before', 'after', 'between') then
    raise exception 'Conditions are not in the expected shape' using errcode = '22023';
  end if;
  begin
    perform x::uuid from jsonb_array_elements_text((p -> 'only') || (p -> 'never') || coalesce(p -> 'require', '[]'::jsonb)) x;
    perform (p -> 'joined' ->> 'from')::date, (p -> 'joined' ->> 'to')::date;
  exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow then
    raise exception 'Conditions have a bad tag id or date' using errcode = '22023';
  end;
end;
$$;

create or replace function public.automatic_email_matches(p_email_id uuid, p_person_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  with rules as (
    select
      array(select x::uuid from jsonb_array_elements_text(e.conditions -> 'only') x
            where x::uuid is distinct from e.trigger_tag_id or e.trigger <> 'tag_added') as only_ids,
      array(select x::uuid from jsonb_array_elements_text(coalesce(e.conditions -> 'require', '[]'::jsonb)) x
            where x::uuid is distinct from e.trigger_tag_id or e.trigger <> 'tag_added') as require_ids,
      array(select x::uuid from jsonb_array_elements_text(e.conditions -> 'never') x
            where x::uuid is distinct from e.trigger_tag_id or e.trigger <> 'tag_added') as never_ids,
      coalesce(e.conditions -> 'joined' ->> 'op', 'any') as op,
      (e.conditions -> 'joined' ->> 'from')::date as from_on,
      (e.conditions -> 'joined' ->> 'to')::date as to_on
    from public.automatic_emails e
    where e.id = p_email_id
  )
  select exists (
    select 1
    from rules r, public.memberships m,
      lateral (select (m.joined_at at time zone 'America/Toronto')::date as joined_on) j
    where m.person_id = p_person_id
      and (cardinality(r.only_ids) = 0 or exists (
        select 1 from public.member_tags t where t.person_id = p_person_id and t.tag_id = any (r.only_ids)))
      and not exists (
        select 1 from unnest(r.require_ids) need
        where not exists (select 1 from public.member_tags t where t.person_id = p_person_id and t.tag_id = need))
      and not exists (
        select 1 from public.member_tags t where t.person_id = p_person_id and t.tag_id = any (r.never_ids))
      and case r.op
        when 'before' then r.from_on is null or j.joined_on < r.from_on
        when 'after' then r.from_on is null or j.joined_on > r.from_on
        when 'between' then (r.from_on is null or j.joined_on >= least(r.from_on, coalesce(r.to_on, r.from_on)))
                        and (r.to_on is null or j.joined_on <= greatest(r.to_on, coalesce(r.from_on, r.to_on)))
        else true
      end
  )
$$;

-- Refuses ('in_use') while a draft or published email starts from the tag or lists it in its
-- conditions. Emails in trash just lose it from their conditions.
create or replace function public.delete_tag(p_tag_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  t text := p_tag_id::text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete tags' using errcode = '42501';
  end if;
  if exists (
    select 1 from public.automatic_emails
    where state <> 'trash'
      and (trigger_tag_id = p_tag_id or conditions -> 'only' ? t or conditions -> 'never' ? t
           or conditions -> 'require' ? t)
  ) then
    return 'in_use';
  end if;

  update public.automatic_emails set conditions = conditions
    || jsonb_build_object('only', coalesce((select jsonb_agg(x) from jsonb_array_elements_text(conditions -> 'only') x where x <> t), '[]'::jsonb))
    || jsonb_build_object('never', coalesce((select jsonb_agg(x) from jsonb_array_elements_text(conditions -> 'never') x where x <> t), '[]'::jsonb))
    || jsonb_build_object('require', coalesce((select jsonb_agg(x) from jsonb_array_elements_text(coalesce(conditions -> 'require', '[]'::jsonb)) x where x <> t), '[]'::jsonb))
  where state = 'trash' and (conditions -> 'only' ? t or conditions -> 'never' ? t or conditions -> 'require' ? t);

  -- Through untag_members, so each removal is logged and re-checked.
  perform public.untag_members(p_tag_id, array(select person_id from public.member_tags where tag_id = p_tag_id));
  delete from public.tags where id = p_tag_id;
  return 'deleted';
end;
$$;

-- ---------- subject and message ----------

-- The subject as Email Editor JSON, so personalized text stays a chip. `subject` keeps a plain-text
-- copy ("Welcome, [First name]") for the list and search.
alter table public.automatic_emails add column subject_doc jsonb not null default '{}'::jsonb;

-- The personalized fields an email uses ("first_name", "referrer_first_name"), from its subject and
-- message.
create function public.email_personalized_ids(p_doc jsonb)
returns setof text
language sql immutable set search_path = ''
as $$
  select x #>> '{}' from jsonb_path_query(p_doc, 'strict $.** ? (@.type == "personalizedText").attrs.id') x
$$;

-- Whether this trigger has the field. Member details always exist; a referrer only when someone joins
-- through a referral; the referred person only for the two referral triggers (variables.ts).
create function public.email_field_available(p_trigger text, p_id text)
returns boolean
language sql immutable set search_path = ''
as $$
  select case
    when p_id in ('first_name', 'last_name', 'full_name', 'email', 'join_date') then true
    when p_id in ('referrer_first_name', 'referrer_last_name', 'referrer_full_name') then p_trigger = 'join_referral'
    when p_id in ('referred_first_name', 'referred_last_name', 'referred_full_name') then p_trigger in ('refers', 'referral_joins')
    else false
  end
$$;

-- A message with nothing in it: no text, personalized field or image.
create function public.email_doc_is_empty(p_doc jsonb)
returns boolean
language sql immutable set search_path = ''
as $$
  select not jsonb_path_exists(p_doc,
    'strict $.** ? (@.type == "personalizedText" || @.type == "emailImage" || (@.type == "text" && @.text like_regex "\\S"))')
$$;

create or replace function public.save_automatic_email(p_id uuid, p_patch jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  unknown text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can edit automatic emails' using errcode = '42501';
  end if;
  select k into unknown from jsonb_object_keys(p_patch) k
  where k not in ('name', 'trigger', 'trigger_tag_id', 'delay_amount', 'delay_unit', 'conditions',
                  'mode', 'alert_enabled', 'alert_to', 'alert_when', 'subject', 'subject_doc', 'body')
  limit 1;
  if unknown is not null then
    raise exception 'Unknown field %', unknown using errcode = '22023';
  end if;
  if p_patch ? 'conditions' then
    perform public.validate_conditions(p_patch -> 'conditions');
  end if;

  update public.automatic_emails set
    name = case when p_patch ? 'name' then replace(coalesce(p_patch ->> 'name', ''), E'\n', ' ') else name end,
    trigger = case when p_patch ? 'trigger' then p_patch ->> 'trigger' else trigger end,
    trigger_tag_id = case when p_patch ? 'trigger_tag_id' then (p_patch ->> 'trigger_tag_id')::uuid else trigger_tag_id end,
    delay_amount = case when p_patch ? 'delay_amount' then (p_patch ->> 'delay_amount')::integer else delay_amount end,
    delay_unit = case when p_patch ? 'delay_unit' then p_patch ->> 'delay_unit' else delay_unit end,
    conditions = case when p_patch ? 'conditions' then p_patch -> 'conditions' else conditions end,
    mode = case when p_patch ? 'mode' then p_patch ->> 'mode' else mode end,
    alert_enabled = case when p_patch ? 'alert_enabled' then (p_patch ->> 'alert_enabled')::boolean else alert_enabled end,
    alert_to = case when p_patch ? 'alert_to' then p_patch ->> 'alert_to' else alert_to end,
    alert_when = case when p_patch ? 'alert_when' then p_patch ->> 'alert_when' else alert_when end,
    subject = case when p_patch ? 'subject' then coalesce(p_patch ->> 'subject', '') else subject end,
    subject_doc = case when p_patch ? 'subject_doc' then coalesce(p_patch -> 'subject_doc', '{}'::jsonb) else subject_doc end,
    body = case when p_patch ? 'body' then coalesce(p_patch -> 'body', '{}'::jsonb) else body end,
    updated_at = now()
  where id = p_id and state = 'draft';
  if not found then
    raise exception 'Only drafts can be edited' using errcode = '55000';
  end if;
end;
$$;

create or replace function public.duplicate_automatic_email(p_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can duplicate automatic emails' using errcode = '42501';
  end if;
  insert into public.automatic_emails (
    name, trigger, trigger_tag_id, delay_amount, delay_unit, conditions, mode, alert_enabled,
    alert_to, alert_when, subject, subject_doc, body, created_by
  )
  select left('Copy of ' || name, 200), trigger, trigger_tag_id, delay_amount, delay_unit, conditions,
         mode, alert_enabled, alert_to, alert_when, subject, subject_doc, body, public.current_person_id()
  from public.automatic_emails where id = p_id
  returning id into new_id;
  if new_id is null then
    raise exception 'No automatic email %', p_id using errcode = 'P0002';
  end if;
  return new_id;
end;
$$;

-- As before, plus the editor's message checks: a message to send, and no personalized field the
-- trigger can't fill (switching the trigger can strand a referrer's name on a plain join email).
create or replace function public.publish_automatic_email(p_id uuid)
returns text[]
language plpgsql security definer set search_path = ''
as $$
declare
  e public.automatic_emails;
  blockers text[] := '{}';
  today date := public.toronto_today();
begin
  if not public.is_admin() then
    raise exception 'Only admins can publish automatic emails' using errcode = '42501';
  end if;
  select * into e from public.automatic_emails where id = p_id for update;
  if not found or e.state <> 'draft' then
    raise exception 'Only drafts can be published' using errcode = '55000';
  end if;

  if btrim(e.name) = '' then blockers := blockers || 'add a name'::text; end if;
  if e.trigger = 'tag_added' and e.trigger_tag_id is null then blockers := blockers || 'pick a tag'::text; end if;
  if btrim(e.subject) = '' then blockers := blockers || 'add a subject'::text; end if;
  if public.email_doc_is_empty(e.body) then blockers := blockers || 'write the message'::text; end if;
  if exists (
    select 1 from public.email_personalized_ids(e.subject_doc) id where not public.email_field_available(e.trigger, id)
    union all
    select 1 from public.email_personalized_ids(e.body) id where not public.email_field_available(e.trigger, id)
  ) then
    blockers := blockers || 'remove the personalized text this email can''t fill'::text;
  end if;
  if e.mode = 'review' and e.alert_enabled and coalesce(btrim(e.alert_to), '') !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    blockers := blockers || 'fix the alert email'::text;
  end if;
  if cardinality(blockers) > 0 then
    return blockers;
  end if;

  update public.automatic_emails
  set state = 'published', published_at = now(), updated_at = now()
  where id = p_id;

  -- Paused occurrences from a trigger (or tag) the email no longer uses don't apply any more.
  update public.email_occurrences o set status = 'cancelled'
  where o.automatic_email_id = p_id and o.status = 'paused'
    and (o.trigger <> e.trigger
         or (e.trigger = 'tag_added' and o.context ->> 'tag_id' is distinct from e.trigger_tag_id::text));

  update public.email_occurrences o set
    due_on = greatest(d.due, today),
    missed = d.due < today,
    status = 'pending'
  from (
    select id, public.automatic_email_due_on(e.delay_amount, e.delay_unit, event_at) as due
    from public.email_occurrences
    where automatic_email_id = p_id and status = 'paused'
  ) d
  where o.id = d.id;

  return blockers;
end;
$$;

-- ---------- backup text ----------

-- One backup text per personalized field, shared by every email: what a member without that detail
-- sees. A field with no row uses the editor's default (variables.ts). Changing one applies to every
-- email not yet sent.
create table public.email_fallbacks (
  field text primary key check (field ~ '^[a-z_]{1,40}$'),
  value text not null check (length(value) <= 100),
  updated_by uuid references public.people (id) on delete set null,
  updated_at timestamptz not null default now()
);

create function public.set_email_fallback(p_field text, p_value text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change backup text' using errcode = '42501';
  end if;
  insert into public.email_fallbacks (field, value, updated_by)
  values (p_field, btrim(coalesce(p_value, '')), public.current_person_id())
  on conflict (field) do update
    set value = excluded.value, updated_by = excluded.updated_by, updated_at = now();
end;
$$;

-- ---------- sending ----------

-- What the sender needs for each send that's ready: the email as written (with any Outbox edit), and
-- the member's details for its personalized fields. Referrer details exist when the member joined
-- through a referral; referred-person details come from the referral the email started from.
drop function public.email_deliveries();
create function public.email_deliveries()
returns table (
  send_id uuid,
  to_email text,
  subject text,
  subject_doc jsonb,
  body jsonb,
  fields jsonb,
  unsubscribe_token uuid
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
         p.unsubscribe_token
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

revoke execute on function public.set_email_fallback(text, text) from public, anon;

revoke execute on function
  public.email_personalized_ids(jsonb),
  public.email_field_available(text, text),
  public.email_doc_is_empty(jsonb),
  public.email_deliveries()
from public, anon, authenticated;

alter table public.email_fallbacks enable row level security;
create policy "Admins see backup text" on public.email_fallbacks for select to authenticated using ((select public.is_admin()));
