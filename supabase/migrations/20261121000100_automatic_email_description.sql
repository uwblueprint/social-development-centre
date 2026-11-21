-- A one-line description for each automatic email ("Thanks them for joining and says what to expect"),
-- shown under its name on the Automatic emails list so an admin can tell emails apart at a glance.
--
-- Existing emails start with a blank description, like a new draft's blank name and subject. Nothing
-- is filled in here, so this is safe to run as is on sdc-dev and on production: it adds no sample data.

alter table public.automatic_emails
  add column description text not null default ''
  check (length(description) <= 80);

-- save_automatic_email: as in 20261112000000_automatic_emails_editor.sql, plus 'description'.
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
    description = case when p_patch ? 'description' then replace(coalesce(p_patch ->> 'description', ''), E'\n', ' ') else description end,
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

-- duplicate_automatic_email: as in 20261112000000_automatic_emails_editor.sql, and the copy keeps the description.
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
    name, description, trigger, trigger_tag_id, delay_amount, delay_unit, conditions, mode, alert_enabled,
    alert_to, alert_when, subject, subject_doc, body, created_by
  )
  select left('Copy of ' || name, 200), description, trigger, trigger_tag_id, delay_amount, delay_unit, conditions,
         mode, alert_enabled, alert_to, alert_when, subject, subject_doc, body, public.current_person_id()
  from public.automatic_emails where id = p_id
  returning id into new_id;
  if new_id is null then
    raise exception 'No automatic email %', p_id using errcode = 'P0002';
  end if;
  return new_id;
end;
$$;
