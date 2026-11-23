-- Split an automatic email by a tag: a copy for people with the tag, so it can be written just for them
-- ("Welcome pack" → "Welcome pack ($1,000+)"), while nobody gets both.
--
-- 1. split_automatic_email(email, tag) makes a draft copy with the same rule plus "must have the tag",
--    and remembers where it came from.
-- 2. Until the copy is published, people with the tag keep getting the original: no gap.
-- 3. finish_split(copy), called right after the copy is published, adds the tag to the original's
--    "never" list. The original can be published: its conditions are checked live (the Outbox asks who
--    matches now, and the daily run checks again), so people with the tag simply stop matching it.
--
-- Adds two nullable columns and no data, so it's safe to run as is on sdc-dev and production.

alter table public.automatic_emails
  add column split_from_id uuid references public.automatic_emails (id) on delete set null,
  add column split_tag_id uuid references public.tags (id) on delete set null;

create function public.split_automatic_email(p_id uuid, p_tag_id uuid)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  t text := p_tag_id::text;
  tag_name text;
  c jsonb;
  new_conditions jsonb;
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can split automatic emails' using errcode = '42501';
  end if;
  select name into tag_name from public.tags where id = p_tag_id;
  if tag_name is null then
    raise exception 'No tag %', p_tag_id using errcode = 'P0002';
  end if;
  select conditions into c from public.automatic_emails where id = p_id and state <> 'trash';
  if c is null then
    raise exception 'No automatic email %', p_id using errcode = 'P0002';
  end if;

  -- Same rule, plus "must have" the tag; the tag leaves "any of" and "never" if it was there.
  new_conditions := c || jsonb_build_object(
    'rows', case when coalesce(c -> 'rows', '[]'::jsonb) ? 'require' then coalesce(c -> 'rows', '[]'::jsonb)
                 else coalesce(c -> 'rows', '[]'::jsonb) || '["require"]'::jsonb end,
    'require', case when coalesce(c -> 'require', '[]'::jsonb) ? t then coalesce(c -> 'require', '[]'::jsonb)
                    else coalesce(c -> 'require', '[]'::jsonb) || to_jsonb(t) end,
    'only', (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(coalesce(c -> 'only', '[]'::jsonb)) x where x <> t),
    'never', (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(coalesce(c -> 'never', '[]'::jsonb)) x where x <> t)
  );
  perform public.validate_conditions(new_conditions);

  insert into public.automatic_emails (
    name, description, trigger, trigger_tag_id, delay_amount, delay_unit, conditions, mode, send_to_unsubscribed,
    alert_enabled, alert_to, alert_when, subject, subject_doc, body, created_by, split_from_id, split_tag_id
  )
  select left(name || ' (' || tag_name || ')', 200), description, trigger, trigger_tag_id, delay_amount, delay_unit,
         new_conditions, mode, send_to_unsubscribed, alert_enabled, alert_to, alert_when, subject, subject_doc, body,
         public.current_person_id(), p_id, p_tag_id
  from public.automatic_emails where id = p_id
  returning id into new_id;
  return new_id;
end;
$$;

-- Hands the tag over once the copy is live: the original stops going to people with it. Does nothing
-- unless the copy is published, its original still exists outside trash, and the tag still exists.
-- Safe to call twice. Returns 'excluded' or 'nothing'.
create function public.finish_split(p_id uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  from_id uuid;
  t text;
begin
  if not public.is_admin() then
    raise exception 'Only admins can publish automatic emails' using errcode = '42501';
  end if;
  select split_from_id, split_tag_id::text into from_id, t
  from public.automatic_emails where id = p_id and state = 'published';
  if from_id is null or t is null then
    return 'nothing';
  end if;

  update public.automatic_emails set
    conditions = conditions || jsonb_build_object(
      'rows', case when coalesce(conditions -> 'rows', '[]'::jsonb) ? 'never' then coalesce(conditions -> 'rows', '[]'::jsonb)
                   else coalesce(conditions -> 'rows', '[]'::jsonb) || '["never"]'::jsonb end,
      'never', case when coalesce(conditions -> 'never', '[]'::jsonb) ? t then coalesce(conditions -> 'never', '[]'::jsonb)
                    else coalesce(conditions -> 'never', '[]'::jsonb) || to_jsonb(t) end,
      'only', (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(coalesce(conditions -> 'only', '[]'::jsonb)) x where x <> t),
      'require', (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(coalesce(conditions -> 'require', '[]'::jsonb)) x where x <> t)
    ),
    updated_at = now()
  where id = from_id and state <> 'trash';
  return case when found then 'excluded' else 'nothing' end;
end;
$$;

-- Same access as the other automatic email functions: signed-in admins only.
revoke execute on function public.split_automatic_email(uuid, uuid), public.finish_split(uuid) from public, anon;
