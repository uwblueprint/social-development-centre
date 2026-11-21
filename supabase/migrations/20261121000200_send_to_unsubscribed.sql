-- "Also send to unsubscribed members": an automatic email can reach members who unsubscribed, for
-- emails SDC is legally required to send members (they're still members after unsubscribing).
-- Off by default for every email. Bounced addresses are still never emailed.
--
-- Adds no data (every existing email gets false), so it's safe to run as is on sdc-dev and production.

alter table public.automatic_emails
  add column send_to_unsubscribed boolean not null default false;

-- email_candidate_state: as in 20261111000000_automatic_emails.sql, except `emailable`, which now lets
-- an unsubscribed member through when the email allows it. Everything that decides whether a send can
-- go (the Outbox, approving, the daily run) reads `emailable` from here, so this is the one change.
create or replace view public.email_candidate_state as
select
  o.id as occurrence_id,
  o.automatic_email_id,
  o.person_id,
  o.due_on,
  o.missed,
  o.status as occurrence_status,
  (e.mode = 'review' or o.missed) as needs_review,
  exists (select 1 from public.memberships m where m.person_id = o.person_id) as is_member,
  public.automatic_email_matches(e.id, o.person_id)
    and (e.trigger <> 'tag_added' or exists (
      select 1 from public.member_tags t where t.person_id = o.person_id and t.tag_id = e.trigger_tag_id)) as matched,
  public.can_email(o.person_id)
    or (e.send_to_unsubscribed and exists (
      select 1 from public.people p where p.id = o.person_id and p.bounced_at is null)) as emailable,
  s.id as send_id,
  s.status as send_status,
  s.approved_at,
  (s.subject_override is not null or s.body_override is not null) as edited
from public.email_occurrences o
join public.automatic_emails e on e.id = o.automatic_email_id
left join public.email_sends s on s.occurrence_id = o.id and s.person_id = o.person_id
where (e.trigger <> 'join_referral' or exists (select 1 from public.referrals r where r.referred_id = o.person_id))
  and (e.trigger <> 'join_no_referral' or not exists (select 1 from public.referrals r where r.referred_id = o.person_id));

-- save_automatic_email: as in 20261121000100_automatic_email_description.sql, plus 'send_to_unsubscribed'.
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
  where k not in ('name', 'description', 'trigger', 'trigger_tag_id', 'delay_amount', 'delay_unit', 'conditions',
                  'mode', 'send_to_unsubscribed', 'alert_enabled', 'alert_to', 'alert_when', 'subject', 'subject_doc', 'body')
  limit 1;
  if unknown is not null then
    raise exception 'Unknown field %', unknown using errcode = '22023';
  end if;
  if p_patch ? 'conditions' then
    perform public.validate_conditions(p_patch -> 'conditions');
  end if;

  update public.automatic_emails set
    name = case when p_patch ? 'name' then replace(coalesce(p_patch ->> 'name', ''), E'\n', ' ') else name end,
    description = case when p_patch ? 'description' then replace(coalesce(p_patch ->> 'description', ''), E'\n', ' ') else description end,
    trigger = case when p_patch ? 'trigger' then p_patch ->> 'trigger' else trigger end,
    trigger_tag_id = case when p_patch ? 'trigger_tag_id' then (p_patch ->> 'trigger_tag_id')::uuid else trigger_tag_id end,
    delay_amount = case when p_patch ? 'delay_amount' then (p_patch ->> 'delay_amount')::integer else delay_amount end,
    delay_unit = case when p_patch ? 'delay_unit' then p_patch ->> 'delay_unit' else delay_unit end,
    conditions = case when p_patch ? 'conditions' then p_patch -> 'conditions' else conditions end,
    mode = case when p_patch ? 'mode' then p_patch ->> 'mode' else mode end,
    send_to_unsubscribed = case when p_patch ? 'send_to_unsubscribed' then coalesce((p_patch ->> 'send_to_unsubscribed')::boolean, false) else send_to_unsubscribed end,
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

-- duplicate_automatic_email: as in 20261121000100_automatic_email_description.sql; the copy keeps the setting.
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
    name, description, trigger, trigger_tag_id, delay_amount, delay_unit, conditions, mode, send_to_unsubscribed,
    alert_enabled, alert_to, alert_when, subject, subject_doc, body, created_by
  )
  select left('Copy of ' || name, 200), description, trigger, trigger_tag_id, delay_amount, delay_unit, conditions,
         mode, send_to_unsubscribed, alert_enabled, alert_to, alert_when, subject, subject_doc, body, public.current_person_id()
  from public.automatic_emails where id = p_id
  returning id into new_id;
  if new_id is null then
    raise exception 'No automatic email %', p_id using errcode = 'P0002';
  end if;
  return new_id;
end;
$$;
