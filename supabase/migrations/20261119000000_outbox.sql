-- The Outbox page, on top of 20261111000000_automatic_emails and 20261112000000_automatic_emails_editor:
-- fuller upcoming rows, what didn't go out, the calendar's numbers, the member panel, and removing or
-- approving sends one at a time or in bulk. docs/backend/automatic-emails.md explains the model;
-- docs/backend/outbox.md (design #64) lists what the screen asked for.

-- ---------- removing a send ----------

-- removed: an admin took this member out of this one send in the Outbox. The automatic email is untouched.
alter table public.email_sends drop constraint email_sends_not_sent_reason_check;
alter table public.email_sends add constraint email_sends_not_sent_reason_check check (not_sent_reason in (
  'unsubscribed', 'bounced', 'not_a_member', 'no_longer_matched', 'trashed', 'failed', 'removed'
));

-- ---------- runs ----------

-- One row per daily run, so the Outbox can tell whether today's emails have gone out ("N sent" instead
-- of "N emails"). The run route writes it with the secret key; admins read it.
create table public.email_runs (
  id bigint generated always as identity primary key,
  run_on date not null default public.toronto_today(),
  forced boolean not null default false,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  ready integer,
  sent integer,
  failed integer
);

create index email_runs_run_on on public.email_runs (run_on desc);

create function public.start_email_run(p_forced boolean)
returns bigint
language sql security definer set search_path = ''
as $$
  insert into public.email_runs (forced) values (coalesce(p_forced, false)) returning id
$$;

create function public.finish_email_run(p_id bigint, p_ready integer, p_sent integer, p_failed integer)
returns void
language sql security definer set search_path = ''
as $$
  update public.email_runs
  set finished_at = now(), ready = p_ready, sent = p_sent, failed = p_failed
  where id = p_id and finished_at is null
$$;

-- ---------- reading ----------

-- A member's tags as [{id, name}], by name.
create function public.person_tags(p_person_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name) order by t.name), '[]'::jsonb)
  from public.member_tags mt join public.tags t on t.id = mt.tag_id
  where mt.person_id = p_person_id
$$;

-- As before, plus what the list and email view show: the member's names and tags, and the email as it
-- will go out. subject is plain text (with any Outbox edit); subject_doc is the template's Email Editor
-- subject when there's no edit, else empty. body is the edit if there is one, else the template's.
drop function public.outbox_upcoming(integer);
create function public.outbox_upcoming(p_days integer default 30)
returns table (
  occurrence_id uuid,
  automatic_email_id uuid,
  email_name text,
  person_id uuid,
  first_name text,
  last_name text,
  full_name text,
  email text,
  tags jsonb,
  due_on date,
  missed boolean,
  status text,
  subject text,
  subject_doc jsonb,
  body jsonb,
  edited boolean
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  today date := public.toronto_today();
begin
  if not public.is_admin() then
    raise exception 'Only admins can read the Outbox' using errcode = '42501';
  end if;
  return query
  select s.occurrence_id, s.automatic_email_id, e.name, s.person_id, p.first_name, p.last_name, p.full_name, p.email,
         public.person_tags(s.person_id), s.due_on, s.missed,
         case when not s.needs_review then 'scheduled'
              when s.approved_at is not null then 'approved'
              when s.due_on < today then 'past_due'
              else 'waiting_review' end,
         coalesce(es.subject_override, e.subject),
         case when es.subject_override is null then e.subject_doc else '{}'::jsonb end,
         coalesce(es.body_override, e.body),
         coalesce(s.edited, false)
  from public.email_candidate_state s
  join public.automatic_emails e on e.id = s.automatic_email_id
  join public.people p on p.id = s.person_id
  left join public.email_sends es on es.id = s.send_id
  where s.occurrence_status = 'pending' and e.state = 'published'
    and s.due_on <= today + p_days
    and s.matched and s.emailable
    and (s.send_status is null or s.send_status = 'pending')
  order by s.due_on, e.name, p.full_name;
end;
$$;

-- The Couldn't send tab: sends from the last p_days that didn't go out and need someone to look.
-- failed = three attempts failed on our side; bounced = the address bounced. Sends past their day
-- without approval are in outbox_upcoming (status past_due). Other reasons (unsubscribed, no longer
-- matched, removed...) need no one to act, so they aren't here.
create function public.outbox_not_sent(p_days integer default 30)
returns table (
  send_id uuid,
  occurrence_id uuid,
  automatic_email_id uuid,
  email_name text,
  person_id uuid,
  first_name text,
  last_name text,
  full_name text,
  email text,
  tags jsonb,
  due_on date,
  reason text,
  failed_at timestamptz,
  attempts integer,
  last_error text,
  subject text,
  subject_doc jsonb,
  body jsonb
)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can read the Outbox' using errcode = '42501';
  end if;
  return query
  select es.id, es.occurrence_id, es.automatic_email_id, e.name, es.person_id, p.first_name, p.last_name,
         p.full_name, p.email, public.person_tags(es.person_id), es.due_on, es.not_sent_reason, es.updated_at,
         es.attempts, es.last_error,
         coalesce(es.subject_override, e.subject),
         case when es.subject_override is null then e.subject_doc else '{}'::jsonb end,
         coalesce(es.body_override, e.body)
  from public.email_sends es
  join public.automatic_emails e on e.id = es.automatic_email_id
  join public.people p on p.id = es.person_id
  where es.status = 'not_sent' and es.not_sent_reason in ('failed', 'bounced')
    and es.updated_at >= now() - make_interval(days => greatest(p_days, 0))
  order by es.updated_at desc, p.full_name;
end;
$$;

-- The calendar's numbers for past days and today, by the day they happened in Waterloo Region: how many
-- went out, and how many couldn't (failed or bounced). Upcoming and past-due counts come from
-- outbox_upcoming; whether today's run has happened comes from email_runs.
create function public.outbox_calendar(p_from date, p_to date)
returns table (day date, sent integer, not_sent integer)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can read the Outbox' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_from > p_to or p_to - p_from > 366 then
    raise exception 'Pick a range of up to a year' using errcode = '22023';
  end if;
  return query
  select d.day,
         count(*) filter (where d.kind = 'sent')::integer,
         count(*) filter (where d.kind = 'not_sent')::integer
  from (
    select (es.sent_at at time zone 'America/Toronto')::date as day, 'sent' as kind
    from public.email_sends es where es.status = 'sent'
    union all
    select (es.updated_at at time zone 'America/Toronto')::date, 'not_sent'
    from public.email_sends es where es.status = 'not_sent' and es.not_sent_reason in ('failed', 'bounced')
  ) d
  where d.day between p_from and p_to
  group by d.day
  order by d.day;
end;
$$;

-- The member panel beside an open email: who they are, why this email reaches them, and their other
-- emails from 30 days back to 30 days ahead. Works for a send that already left the Outbox (e.g. one
-- that couldn't send). The rule is the email's as it is now.
--   event_at: when the trigger happened for them (joined, tag added, referral).
--   matched_tags: which of their tags meet each tag condition, {only, require, never} as tag ids.
--   other_sends: [{occurrence_id, automatic_email_id, email_name, on, status}], nearest first. status is
--   an outbox_upcoming status, or sent, failed or bounced.
create function public.outbox_member(p_occurrence_id uuid, p_person_id uuid)
returns table (
  person_id uuid,
  first_name text,
  last_name text,
  full_name text,
  email text,
  joined_at timestamptz,
  tags jsonb,
  automatic_email_id uuid,
  email_name text,
  trigger text,
  trigger_tag_id uuid,
  trigger_tag_name text,
  delay_amount integer,
  delay_unit text,
  mode text,
  conditions jsonb,
  event_at timestamptz,
  due_on date,
  matched_tags jsonb,
  other_sends jsonb
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  today date := public.toronto_today();
begin
  if not public.is_admin() then
    raise exception 'Only admins can read the Outbox' using errcode = '42501';
  end if;
  if not exists (select 1 from public.email_occurrences o where o.id = p_occurrence_id and o.person_id = p_person_id) then
    raise exception 'No such email in the Outbox' using errcode = 'P0002';
  end if;
  return query
  with mine as (
    select array(select mt.tag_id::text from public.member_tags mt where mt.person_id = p_person_id) as ids
  ),
  others as (
    select u.occurrence_id, u.automatic_email_id, u.email_name, u.due_on as on_day, u.status
    from public.outbox_upcoming(30) u
    where u.person_id = p_person_id and u.occurrence_id <> p_occurrence_id
    union all
    select es.occurrence_id, es.automatic_email_id, e.name,
           (coalesce(es.sent_at, es.updated_at) at time zone 'America/Toronto')::date,
           case when es.status = 'sent' then 'sent' else es.not_sent_reason end
    from public.email_sends es join public.automatic_emails e on e.id = es.automatic_email_id
    where es.person_id = p_person_id and es.occurrence_id <> p_occurrence_id
      and (es.status = 'sent' or (es.status = 'not_sent' and es.not_sent_reason in ('failed', 'bounced')))
      and coalesce(es.sent_at, es.updated_at) >= now() - interval '30 days'
  )
  select p.id, p.first_name, p.last_name, p.full_name, p.email, m.joined_at, public.person_tags(p.id),
         e.id, e.name, e.trigger, e.trigger_tag_id, tt.name, e.delay_amount, e.delay_unit, e.mode, e.conditions,
         o.event_at, o.due_on,
         jsonb_build_object(
           'only', (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(e.conditions -> 'only') x where x = any (mine.ids)),
           'require', (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(coalesce(e.conditions -> 'require', '[]'::jsonb)) x where x = any (mine.ids)),
           'never', (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(e.conditions -> 'never') x where x = any (mine.ids))
         ),
         (select coalesce(jsonb_agg(jsonb_build_object(
                   'occurrence_id', x.occurrence_id, 'automatic_email_id', x.automatic_email_id,
                   'email_name', x.email_name, 'on', x.on_day, 'status', x.status)
                 order by abs(x.on_day - today), x.on_day), '[]'::jsonb)
          from others x)
  from public.email_occurrences o
  join public.automatic_emails e on e.id = o.automatic_email_id
  join public.people p on p.id = o.person_id
  left join public.memberships m on m.person_id = p.id
  left join public.tags tt on tt.id = e.trigger_tag_id
  cross join mine
  where o.id = p_occurrence_id and o.person_id = p_person_id;
end;
$$;

-- ---------- actions ----------

-- Takes one member out of one send, recorded Not sent (removed). Works on anything in the Outbox
-- (including past due) and on a send that couldn't go out, which then leaves the Couldn't send tab.
create function public.remove_send(p_occurrence_id uuid, p_person_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove emails' using errcode = '42501';
  end if;
  update public.email_sends set not_sent_reason = 'removed', updated_at = now()
  where occurrence_id = p_occurrence_id and person_id = p_person_id
    and status = 'not_sent' and not_sent_reason in ('failed', 'bounced');
  if found then
    return;
  end if;

  perform public.assert_in_outbox(p_occurrence_id, p_person_id);
  insert into public.email_sends (occurrence_id, automatic_email_id, person_id, due_on, status, not_sent_reason)
  select o.id, o.automatic_email_id, p_person_id, o.due_on, 'not_sent', 'removed'
  from public.email_occurrences o where o.id = p_occurrence_id
  on conflict (occurrence_id, person_id) do update
    set status = 'not_sent', not_sent_reason = 'removed', updated_at = now()
    where public.email_sends.status = 'pending';
end;
$$;

-- Bulk approve and remove: p_items is [{"occurrence_id": ..., "person_id": ...}]. Each one is tried on
-- its own; result is done, or gone when it had already left the Outbox (another admin, the daily run).
create function public.approve_sends(p_items jsonb)
returns table (occurrence_id uuid, person_id uuid, result text)
language plpgsql security definer set search_path = ''
as $$
declare
  item jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve emails' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Expected a list of emails' using errcode = '22023';
  end if;
  for item in select * from jsonb_array_elements(p_items) loop
    occurrence_id := (item ->> 'occurrence_id')::uuid;
    person_id := (item ->> 'person_id')::uuid;
    begin
      perform public.approve_send(occurrence_id, person_id);
      result := 'done';
    exception when sqlstate '55000' then
      result := 'gone';
    end;
    return next;
  end loop;
end;
$$;

create function public.remove_sends(p_items jsonb)
returns table (occurrence_id uuid, person_id uuid, result text)
language plpgsql security definer set search_path = ''
as $$
declare
  item jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can remove emails' using errcode = '42501';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Expected a list of emails' using errcode = '22023';
  end if;
  for item in select * from jsonb_array_elements(p_items) loop
    occurrence_id := (item ->> 'occurrence_id')::uuid;
    person_id := (item ->> 'person_id')::uuid;
    begin
      perform public.remove_send(occurrence_id, person_id);
      result := 'done';
    exception when sqlstate '55000' then
      result := 'gone';
    end;
    return next;
  end loop;
end;
$$;

-- ---------- access ----------

revoke execute on function
  public.outbox_upcoming(integer),
  public.outbox_not_sent(integer),
  public.outbox_calendar(date, date),
  public.outbox_member(uuid, uuid),
  public.remove_send(uuid, uuid),
  public.approve_sends(jsonb),
  public.remove_sends(jsonb)
from public, anon;

-- Engine (service role) and the functions above only.
revoke execute on function
  public.start_email_run(boolean),
  public.finish_email_run(bigint, integer, integer, integer),
  public.person_tags(uuid)
from public, anon, authenticated;

alter table public.email_runs enable row level security;
create policy "Admins see runs" on public.email_runs for select to authenticated using ((select public.is_admin()));
