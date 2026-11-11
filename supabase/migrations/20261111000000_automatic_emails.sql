-- Automatic Emails: storage, the draft / published / trash lifecycle, the Outbox, and the database
-- half of the daily run. docs/backend/automatic-emails.md explains the model. In short:
--
--   automatic_emails   what to send and when (trigger, delay, conditions, template, mode)
--   email_occurrences  facts: "this email is due for this member on this date", queued the moment
--                      the event happens. Conditions play no part here.
--   email_sends        only final or admin-touched sends: approved or edited in the Outbox, being
--                      sent, sent, or not sent with a reason
--
-- Whether an occurrence's member still gets it is decided live by automatic_email_matches(): the
-- Outbox shows who matches now, and the daily run checks again before sending. Nothing is rescheduled when tags change or an
-- email is edited, because nothing stored depends on the conditions.
--
-- This replaces the email sends from 20261023000000_member_events (its own email_sends, the change
-- log and the unsubscribe step that cancelled waiting sends). member_events, notes and subscription
-- history stay; member_email_history and member_timeline are rebuilt on the new tables below.
--
-- Emails go out once a day (PM, 27 Oct 2026: no "immediately"), so due dates are calendar dates in
-- Waterloo Region, not times. Every email starts from an event; there are no recurring emails (PM,
-- 9 Nov 2026).

-- ---------- replaces the member_events email sends ----------

drop view if exists public.member_timeline;
drop view if exists public.member_email_history;
drop table if exists public.email_send_changes;
drop table if exists public.email_sends;
drop function if exists public.email_send_changed();
drop function if exists public.email_send_rules();

-- Keeps the subscription history. The old version also cancelled waiting sends here; the daily run
-- checks can_email() on send day instead.
create or replace function public.subscription_changed()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if old.unsubscribed_at is null and new.unsubscribed_at is not null then
    insert into public.subscription_events (person_id, kind, detail, at)
    values (new.id, 'unsubscribed', new.unsubscribe_reason, new.unsubscribed_at);
  elsif old.unsubscribed_at is not null and new.unsubscribed_at is null then
    insert into public.subscription_events (person_id, kind) values (new.id, 'resubscribed');
  end if;

  if old.bounced_at is null and new.bounced_at is not null then
    insert into public.subscription_events (person_id, kind, detail, at)
    values (new.id, 'bounced', new.bounce_detail, new.bounced_at);
  elsif old.bounced_at is not null and new.bounced_at is null then
    insert into public.subscription_events (person_id, kind) values (new.id, 'bounce_cleared');
  end if;
  return new;
end;
$$;

-- ---------- automatic emails ----------

create table public.automatic_emails (
  id uuid primary key default gen_random_uuid(),
  -- Blank while a draft is being set up; publishing requires one.
  name text not null default '' check (length(name) <= 200),
  state text not null default 'draft' check (state in ('draft', 'published', 'trash')),
  -- join_*: a member joins (any way, without a referral, via a referral). refers / referral_joins:
  -- sent to the referrer. tag_added: trigger_tag_id is added to a member.
  trigger text not null default 'join_any' check (trigger in (
    'join_any', 'join_no_referral', 'join_referral', 'refers', 'referral_joins', 'tag_added'
  )),
  -- Null after the tag is deleted while the email is in trash; publishing asks for a tag again.
  trigger_tag_id uuid references public.tags (id) on delete set null,
  -- 0 = within a day of the event (the next daily run).
  delay_amount integer not null default 0 check (delay_amount >= 0),
  delay_unit text not null default 'days' check (delay_unit in ('days', 'weeks', 'months', 'years')),
  -- Who gets it, checked live by automatic_email_matches(). Tag ids, so a renamed tag still works:
  -- only = has any of these tags, never = has none of them (wins over only), joined = when they
  -- joined. Empty lists and op 'any' = every member.
  conditions jsonb not null default '{"version": 2, "only": [], "never": [], "joined": {"op": "any"}}'::jsonb,
  mode text not null default 'auto' check (mode in ('auto', 'review')),
  -- Review mode only: email someone when a send needs them. Suhanya by default (PM, 3 Nov 2026).
  alert_enabled boolean not null default true,
  alert_to text default 'suhanya@waterlooregion.org',
  alert_when text not null default 'waiting' check (alert_when in ('waiting', 'due_soon', 'past_due')),
  subject text not null default '' check (length(subject) <= 300),
  -- Written by the Email Editor (its own PRD); opaque here.
  body jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint delay_in_range check (delay_amount <= case delay_unit
    when 'days' then 365 when 'weeks' then 52 when 'months' then 24 else 5 end)
);

create index automatic_emails_trigger on public.automatic_emails (trigger) where state <> 'trash';

-- ---------- occurrences ----------

create table public.email_occurrences (
  id uuid primary key default gen_random_uuid(),
  automatic_email_id uuid not null references public.automatic_emails (id) on delete cascade,
  -- What makes it unique for this email, so the same event or date never queues twice:
  -- 'join:<person>:<joined epoch>', 'tag:<tag event id>', 'refers:<referral id>',
  -- 'referral_joins:<referral id>'.
  key text not null,
  -- The email's trigger when this was queued. Publishing drops paused ones that no longer match.
  trigger text not null,
  -- Who it goes to: the member the event happened to; for referral triggers, the referrer.
  person_id uuid not null references public.people (id) on delete cascade,
  -- When the event happened. Kept so a changed delay can recompute due_on.
  event_at timestamptz not null,
  -- Extra facts about the event: tag_id, tag_event_id, referral_id, referred_id.
  context jsonb not null default '{}'::jsonb,
  due_on date not null,
  -- Its date passed while the email was unpublished. Its sends wait for review whatever the mode.
  missed boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'paused', 'cancelled')),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (automatic_email_id, key),
  constraint resolved_has_time check ((status = 'resolved') = (resolved_at is not null))
);

create index email_occurrences_due on public.email_occurrences (due_on) where status = 'pending';
create index email_occurrences_person on public.email_occurrences (person_id);

-- ---------- sends ----------

-- A row exists only once something is decided about one person: an admin approved or edited it in
-- the Outbox (pending), the daily run took it (sending), or it finished (sent / not_sent).
-- Everything else upcoming is computed live (outbox_upcoming).
create table public.email_sends (
  id uuid primary key default gen_random_uuid(),
  occurrence_id uuid not null references public.email_occurrences (id) on delete cascade,
  automatic_email_id uuid not null references public.automatic_emails (id) on delete cascade,
  person_id uuid not null references public.people (id) on delete cascade,
  due_on date not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'not_sent')),
  not_sent_reason text check (not_sent_reason in (
    'unsubscribed', 'bounced', 'not_a_member', 'no_longer_matched', 'trashed', 'failed'
  )),
  -- An admin's edits in the Outbox, for this one send. Dropped when the email is unpublished.
  subject_override text,
  body_override jsonb,
  edited_by uuid references public.people (id) on delete set null,
  edited_at timestamptz,
  approved_by uuid references public.people (id) on delete set null,
  approved_at timestamptz,
  attempts integer not null default 0,
  last_error text,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (occurrence_id, person_id),
  constraint not_sent_has_reason check ((status = 'not_sent') = (not_sent_reason is not null)),
  constraint sent_has_time check ((status = 'sent') = (sent_at is not null))
);

create index email_sends_open on public.email_sends (status) where status in ('pending', 'sending');
create index email_sends_email on public.email_sends (automatic_email_id, status);
create index email_sends_person on public.email_sends (person_id);

-- ---------- dates ----------

-- Today in Waterloo Region. Every due date is compared against this.
create function public.toronto_today()
returns date
language sql stable set search_path = ''
as $$
  select (now() at time zone 'America/Toronto')::date
$$;

-- The day an event's email is due. Months and years are calendar ones (31 Jan + 1 month = 28 Feb).
create function public.automatic_email_due_on(p_amount integer, p_unit text, p_event_at timestamptz)
returns date
language sql stable set search_path = ''
as $$
  select ((p_event_at at time zone 'America/Toronto')::date + case p_unit
    when 'weeks' then make_interval(weeks => p_amount)
    when 'months' then make_interval(months => p_amount)
    when 'years' then make_interval(years => p_amount)
    else make_interval(days => p_amount) end)::date
$$;

-- ---------- conditions ----------

-- Raises 22023 unless p is the conditions shape: version 2, tag id lists, a joined rule. Dates are
-- optional: a rule missing its date counts as every member, as in the editor.
create function public.validate_conditions(p jsonb)
returns void
language plpgsql immutable set search_path = ''
as $$
begin
  if jsonb_typeof(p) is distinct from 'object' or p ->> 'version' is distinct from '2'
     or jsonb_typeof(p -> 'only') is distinct from 'array' or jsonb_typeof(p -> 'never') is distinct from 'array'
     or jsonb_typeof(p -> 'joined') is distinct from 'object'
     or coalesce(p -> 'joined' ->> 'op', 'any') not in ('any', 'before', 'after', 'between') then
    raise exception 'Conditions are not in the expected shape' using errcode = '22023';
  end if;
  begin
    perform x::uuid from jsonb_array_elements_text((p -> 'only') || (p -> 'never')) x;
    perform (p -> 'joined' ->> 'from')::date, (p -> 'joined' ->> 'to')::date;
  exception when invalid_text_representation or invalid_datetime_format or datetime_field_overflow then
    raise exception 'Conditions have a bad tag id or date' using errcode = '22023';
  end;
end;
$$;

-- Whether this person is in this email's audience right now. Members only. The tag an email starts
-- from is ignored in its own lists. Before and after are exclusive; between includes both ends, and
-- a between with one end means on or after / on or before it.
create function public.automatic_email_matches(p_email_id uuid, p_person_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  with rules as (
    select
      array(select x::uuid from jsonb_array_elements_text(e.conditions -> 'only') x
            where x::uuid is distinct from e.trigger_tag_id or e.trigger <> 'tag_added') as only_ids,
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

-- Every occurrence with what's known about its member now. Join emails that depend on a referral
-- only count while the referral rule holds. matched also requires a tag-triggered email's member to
-- still have that tag. Internal: the Outbox, the daily run and the lifecycle functions read it.
create view public.email_candidate_state as
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
  public.can_email(o.person_id) as emailable,
  s.id as send_id,
  s.status as send_status,
  s.approved_at,
  (s.subject_override is not null or s.body_override is not null) as edited
from public.email_occurrences o
join public.automatic_emails e on e.id = o.automatic_email_id
left join public.email_sends s on s.occurrence_id = o.id and s.person_id = o.person_id
where (e.trigger <> 'join_referral' or exists (select 1 from public.referrals r where r.referred_id = o.person_id))
  and (e.trigger <> 'join_no_referral' or not exists (select 1 from public.referrals r where r.referred_id = o.person_id));

-- ---------- queueing ----------

-- Queues one occurrence per published automatic email that starts from this event. Drafts and
-- unpublished emails aren't live, so they record nothing. An email that would already be overdue
-- (a member added with an old join date) is skipped (PM, 3 Nov 2026).
create function public.queue_occurrences(
  p_triggers text[],
  p_tag_id uuid,
  p_person_id uuid,
  p_key text,
  p_event_at timestamptz,
  p_context jsonb
)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.email_occurrences (automatic_email_id, key, trigger, person_id, event_at, context, due_on)
  select e.id, p_key, e.trigger, p_person_id, p_event_at, p_context, d.due
  from public.automatic_emails e,
    lateral (select public.automatic_email_due_on(e.delay_amount, e.delay_unit, p_event_at) as due) d
  where e.state = 'published'
    and e.trigger = any (p_triggers)
    and (e.trigger <> 'tag_added' or e.trigger_tag_id = p_tag_id)
    and d.due >= public.toronto_today()
  on conflict (automatic_email_id, key) do nothing
$$;

-- ---------- lifecycle ----------

-- A blank draft. Returns its id.
create function public.create_automatic_email()
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can create automatic emails' using errcode = '42501';
  end if;
  insert into public.automatic_emails (created_by) values (public.current_person_id())
  returning id into new_id;
  return new_id;
end;
$$;

-- Autosave for a draft: applies only the fields present in p_patch. Published emails are read-only
-- (unpublish to edit), so this refuses anything that isn't a draft.
create function public.save_automatic_email(p_id uuid, p_patch jsonb)
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
                  'mode', 'alert_enabled', 'alert_to', 'alert_when', 'subject', 'body')
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
    body = case when p_patch ? 'body' then coalesce(p_patch -> 'body', '{}'::jsonb) else body end,
    updated_at = now()
  where id = p_id and state = 'draft';
  if not found then
    raise exception 'Only drafts can be edited' using errcode = '55000';
  end if;
end;
$$;

-- A new draft with the same setup. Its send history stays with the original.
create function public.duplicate_automatic_email(p_id uuid)
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
    alert_to, alert_when, subject, body, created_by
  )
  select left('Copy of ' || name, 200), trigger, trigger_tag_id, delay_amount, delay_unit, conditions,
         mode, alert_enabled, alert_to, alert_when, subject, body, public.current_person_id()
  from public.automatic_emails where id = p_id
  returning id into new_id;
  if new_id is null then
    raise exception 'No automatic email %', p_id using errcode = 'P0002';
  end if;
  return new_id;
end;
$$;

-- Returns what still blocks publishing, in the editor's words ("add a name"). Empty = published.
-- Nothing is backfilled: events that happen while an email isn't published are never recorded.
-- Publishing again after an unpublish brings back what was already queued: event occurrences for
-- the current trigger get due dates from the current delay, and any whose date passed are marked
-- missed so they wait for review.
create function public.publish_automatic_email(p_id uuid)
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

-- Back to a draft so it can be edited. It stops being live: nothing sends and new events aren't
-- recorded until it's published again. What was already queued waits, paused. Outbox edits and
-- approvals are dropped.
create function public.unpublish_automatic_email(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can unpublish automatic emails' using errcode = '42501';
  end if;
  update public.automatic_emails set state = 'draft', updated_at = now()
  where id = p_id and state = 'published';
  if not found then
    raise exception 'Only published emails can be unpublished' using errcode = '55000';
  end if;

  update public.email_occurrences set status = 'paused'
  where automatic_email_id = p_id and status = 'pending';

  delete from public.email_sends where automatic_email_id = p_id and status = 'pending';
end;
$$;

-- Future sends stop and are recorded as Not sent for everyone the Outbox listed; history stays, so
-- restoring shows it again.
create function public.trash_automatic_email(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can trash automatic emails' using errcode = '42501';
  end if;
  update public.automatic_emails set state = 'trash', updated_at = now()
  where id = p_id and state <> 'trash';
  if not found then
    raise exception 'No automatic email % outside trash', p_id using errcode = '55000';
  end if;

  insert into public.email_sends (occurrence_id, automatic_email_id, person_id, due_on, status, not_sent_reason)
  select s.occurrence_id, s.automatic_email_id, s.person_id, s.due_on, 'not_sent', 'trashed'
  from public.email_candidate_state s
  where s.automatic_email_id = p_id and s.occurrence_status = 'pending' and s.matched and s.emailable
  on conflict (occurrence_id, person_id) do update
    set status = 'not_sent', not_sent_reason = 'trashed', updated_at = now()
    where public.email_sends.status in ('pending', 'sending');

  update public.email_sends set status = 'not_sent', not_sent_reason = 'trashed', updated_at = now()
  where automatic_email_id = p_id and status in ('pending', 'sending');

  update public.email_occurrences set status = 'cancelled'
  where automatic_email_id = p_id and status in ('pending', 'paused');
end;
$$;

-- Back to Drafts. Nothing it would have sent while in trash comes back.
create function public.restore_automatic_email(p_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can restore automatic emails' using errcode = '42501';
  end if;
  update public.automatic_emails set state = 'draft', updated_at = now()
  where id = p_id and state = 'trash';
  if not found then
    raise exception 'Only emails in trash can be restored' using errcode = '55000';
  end if;
end;
$$;

-- ---------- outbox ----------

-- Everything due in the next p_days, for everyone who matches right now. status: scheduled (sends
-- on its own), waiting_review, approved, past_due (needed review and its day passed).
create function public.outbox_upcoming(p_days integer default 30)
returns table (
  occurrence_id uuid,
  automatic_email_id uuid,
  email_name text,
  person_id uuid,
  full_name text,
  email text,
  due_on date,
  missed boolean,
  status text,
  subject text,
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
  select s.occurrence_id, s.automatic_email_id, e.name, s.person_id, p.full_name, p.email, s.due_on, s.missed,
         case when not s.needs_review then 'scheduled'
              when s.approved_at is not null then 'approved'
              when s.due_on < today then 'past_due'
              else 'waiting_review' end,
         coalesce(es.subject_override, e.subject),
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

-- The editor's "N members currently eligible": every member the conditions match right now.
create function public.automatic_email_eligible(p_email_id uuid)
returns table (person_id uuid, full_name text, email text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can see who is eligible' using errcode = '42501';
  end if;
  return query
  select p.id, p.full_name, p.email
  from public.memberships m join public.people p on p.id = m.person_id
  where public.automatic_email_matches(p_email_id, p.id)
  order by p.full_name;
end;
$$;

-- Raises unless this (occurrence, person) is in the Outbox right now.
create function public.assert_in_outbox(p_occurrence_id uuid, p_person_id uuid)
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.email_candidate_state s
    join public.automatic_emails e on e.id = s.automatic_email_id
    where s.occurrence_id = p_occurrence_id and s.person_id = p_person_id
      and s.occurrence_status = 'pending' and e.state = 'published'
      and s.matched and s.emailable and (s.send_status is null or s.send_status = 'pending')
  ) then
    raise exception 'This email is no longer in the Outbox' using errcode = '55000';
  end if;
end;
$$;

create function public.approve_send(p_occurrence_id uuid, p_person_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can approve emails' using errcode = '42501';
  end if;
  perform public.assert_in_outbox(p_occurrence_id, p_person_id);
  insert into public.email_sends (occurrence_id, automatic_email_id, person_id, due_on, approved_by, approved_at)
  select o.id, o.automatic_email_id, p_person_id, o.due_on, public.current_person_id(), now()
  from public.email_occurrences o where o.id = p_occurrence_id
  on conflict (occurrence_id, person_id) do update
    set approved_by = excluded.approved_by, approved_at = excluded.approved_at, updated_at = now();
end;
$$;

-- This one send's subject and body. Null for either = use the template's.
create function public.edit_send(p_occurrence_id uuid, p_person_id uuid, p_subject text, p_body jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can edit emails' using errcode = '42501';
  end if;
  perform public.assert_in_outbox(p_occurrence_id, p_person_id);
  insert into public.email_sends (occurrence_id, automatic_email_id, person_id, due_on,
                                  subject_override, body_override, edited_by, edited_at)
  select o.id, o.automatic_email_id, p_person_id, o.due_on,
         nullif(btrim(p_subject), ''), p_body, public.current_person_id(), now()
  from public.email_occurrences o where o.id = p_occurrence_id
  on conflict (occurrence_id, person_id) do update
    set subject_override = excluded.subject_override, body_override = excluded.body_override,
        edited_by = excluded.edited_by, edited_at = excluded.edited_at, updated_at = now();
end;
$$;

-- ---------- daily run ----------

-- The database half of the daily run (service role). Every occurrence due on or before p_today is
-- checked once more:
--   still matches and can be emailed -> sending (review mode: only once approved)
--   not a member any more            -> not_sent (not_a_member)
--   no longer matches                -> not_sent (no_longer_matched)
--   unsubscribed or bounced          -> not_sent
-- An occurrence is resolved unless it's waiting for approval. Safe to run twice: a second
-- run finds nothing new. Returns how many sends are ready for email_deliveries().
create function public.prepare_due_sends(p_today date default public.toronto_today())
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  occ record;
  ready integer;
begin
  for occ in
    select o.id from public.email_occurrences o
    join public.automatic_emails e on e.id = o.automatic_email_id
    where o.status = 'pending' and o.due_on <= p_today and e.state = 'published'
    order by o.due_on
    for update of o skip locked
  loop
    insert into public.email_sends (occurrence_id, automatic_email_id, person_id, due_on, status, not_sent_reason)
    select s.occurrence_id, s.automatic_email_id, s.person_id, s.due_on,
           case when r.reason is null then 'sending' else 'not_sent' end, r.reason
    from public.email_candidate_state s
    cross join lateral (
      select case
        when not s.is_member then 'not_a_member'
        when not s.matched then 'no_longer_matched'
        when not s.emailable then case
          when exists (select 1 from public.people p where p.id = s.person_id and p.bounced_at is not null)
          then 'bounced' else 'unsubscribed' end
      end as reason
    ) r
    where s.occurrence_id = occ.id
      and (s.send_status is null or s.send_status = 'pending')
      and not (r.reason is null and s.needs_review and s.approved_at is null)
    on conflict (occurrence_id, person_id) do update
      set status = excluded.status, not_sent_reason = excluded.not_sent_reason, updated_at = now()
      where public.email_sends.status = 'pending';

    update public.email_occurrences set status = 'resolved', resolved_at = now()
    where id = occ.id and not exists (
      select 1 from public.email_candidate_state s
      where s.occurrence_id = occ.id and (s.send_status is null or s.send_status = 'pending')
        and s.needs_review and s.approved_at is null and s.matched and s.emailable);
  end loop;

  select count(*)::integer into ready from public.email_sends where status = 'sending';
  return ready;
end;
$$;

-- What the sender needs for each send that's ready. Paused (unpublished) emails wait; three failed
-- attempts end a send.
create function public.email_deliveries()
returns table (
  send_id uuid,
  to_email text,
  first_name text,
  subject text,
  body jsonb,
  unsubscribe_token uuid
)
language sql stable security definer set search_path = ''
as $$
  select s.id, p.email, p.first_name, coalesce(s.subject_override, e.subject), coalesce(s.body_override, e.body),
         p.unsubscribe_token
  from public.email_sends s
  join public.automatic_emails e on e.id = s.automatic_email_id
  join public.people p on p.id = s.person_id
  where s.status = 'sending' and e.state = 'published'
  order by s.due_on, s.created_at
$$;

-- The sender reports back. p_error null = sent. A third failure marks it not sent (failed).
create function public.record_send_result(p_send_id uuid, p_provider_message_id text, p_error text)
returns void
language sql security definer set search_path = ''
as $$
  update public.email_sends set
    status = case when p_error is null then 'sent' when attempts + 1 >= 3 then 'not_sent' else 'sending' end,
    not_sent_reason = case when p_error is not null and attempts + 1 >= 3 then 'failed' end,
    sent_at = case when p_error is null then now() end,
    provider_message_id = coalesce(p_provider_message_id, provider_message_id),
    attempts = attempts + 1,
    last_error = left(p_error, 1000),
    updated_at = now()
  where id = p_send_id and status = 'sending'
$$;

-- ---------- events ----------

-- Joining, without or with a referral, is checked live (email_candidate_state): how referrals are
-- matched to new members is still open, and by send day the match has had time to happen. Members
-- added with "Send join emails" off never start a join email.
create function public.queue_join_occurrences()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.join_emails then
    perform public.queue_occurrences(
      array['join_any', 'join_no_referral', 'join_referral'], null, new.person_id,
      'join:' || new.person_id || ':' || extract(epoch from new.joined_at), new.joined_at, '{}'::jsonb);
  end if;
  return null;
end;
$$;

create trigger queue_join_occurrences
  after insert on public.memberships
  for each row execute function public.queue_join_occurrences();

create function public.queue_tag_occurrences()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.queue_occurrences(
    array['tag_added'], new.tag_id, new.person_id, 'tag:' || new.id, new.at,
    jsonb_build_object('tag_id', new.tag_id, 'tag_event_id', new.id));
  return null;
end;
$$;

create trigger queue_tag_occurrences
  after insert on public.tag_events
  for each row when (new.kind = 'added' and new.tag_id is not null)
  execute function public.queue_tag_occurrences();

-- Both referral moments go to the referrer.
create function public.queue_referral_occurrences()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.queue_occurrences(
      array['refers'], null, new.referrer_id, 'refers:' || new.id, new.created_at,
      jsonb_build_object('referral_id', new.id));
  elsif old.referred_id is null and new.referred_id is not null then
    perform public.queue_occurrences(
      array['referral_joins'], null, new.referrer_id, 'referral_joins:' || new.id, coalesce(new.joined_at, now()),
      jsonb_build_object('referral_id', new.id, 'referred_id', new.referred_id));
  end if;
  return null;
end;
$$;

create trigger queue_referral_occurrences
  after insert or update of referred_id on public.referrals
  for each row execute function public.queue_referral_occurrences();

-- ---------- tags ----------

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
      and (trigger_tag_id = p_tag_id or conditions -> 'only' ? t or conditions -> 'never' ? t)
  ) then
    return 'in_use';
  end if;

  update public.automatic_emails set conditions = conditions
    || jsonb_build_object('only', coalesce((select jsonb_agg(x) from jsonb_array_elements_text(conditions -> 'only') x where x <> t), '[]'::jsonb))
    || jsonb_build_object('never', coalesce((select jsonb_agg(x) from jsonb_array_elements_text(conditions -> 'never') x where x <> t), '[]'::jsonb))
  where state = 'trash' and (conditions -> 'only' ? t or conditions -> 'never' ? t);

  -- Through untag_members, so each removal is logged and re-checked.
  perform public.untag_members(p_tag_id, array(select person_id from public.member_tags where tag_id = p_tag_id));
  delete from public.tags where id = p_tag_id;
  return 'deleted';
end;
$$;

-- ---------- member page ----------

-- The member page's email history and timeline (src/features/members/queries.ts), rebuilt on
-- email_sends with the columns and statuses it already reads: pending and sending show as
-- scheduled, or waiting_for_review while a review-mode send has no approval. Only sends with a row
-- appear; upcoming ones nobody has touched are in the Outbox. send_at is the 10:30 run on due_on.
create view public.member_email_history with (security_invoker = true) as
  select s.id as send_id, s.person_id, e.name as email_name, s.automatic_email_id, null::uuid as one_off_email_id,
    case o.trigger when 'refers' then 'referred_someone' when 'referral_joins' then 'referral_joined'
      when 'tag_added' then 'tag_added' else 'joined' end as started_by,
    t.name as started_by_tag, o.event_at as started_at,
    case when s.status in ('sent', 'not_sent') then s.status
         when (e.mode = 'review' or o.missed) and s.approved_at is null then 'waiting_for_review'
         else 'scheduled' end as status,
    s.not_sent_reason, (s.due_on + time '10:30') at time zone 'America/Toronto' as send_at, s.sent_at,
    s.not_sent_reason = 'failed' as could_not_send,
    coalesce(s.subject_override, e.subject) as subject, s.edited_at is not null as edited
  from public.email_sends s
  join public.automatic_emails e on e.id = s.automatic_email_id
  join public.email_occurrences o on o.id = s.occurrence_id
  left join public.tags t on t.id = (o.context ->> 'tag_id')::uuid;

-- Everything that happened to one member: joins, referrals, tags added and removed, notes, emails
-- and subscription changes. An email shows once, at its send date, with its current status.
create view public.member_timeline with (security_invoker = true) as
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
  select h.person_id, coalesce(h.sent_at, h.send_at), 'email', null, null, null, h.send_id, h.status,
    h.email_name, null, h.edited
  from public.member_email_history h
  union all
  select c.person_id, c.at, c.kind, null, null, null, null, null, c.detail, null, false
  from public.subscription_events c;

-- ---------- access ----------

revoke execute on function
  public.create_automatic_email(),
  public.save_automatic_email(uuid, jsonb),
  public.duplicate_automatic_email(uuid),
  public.publish_automatic_email(uuid),
  public.unpublish_automatic_email(uuid),
  public.trash_automatic_email(uuid),
  public.restore_automatic_email(uuid),
  public.outbox_upcoming(integer),
  public.automatic_email_eligible(uuid),
  public.approve_send(uuid, uuid),
  public.edit_send(uuid, uuid, text, jsonb),
  public.delete_tag(uuid)
from public, anon;

-- Engine (service role) and triggers only.
revoke execute on function
  public.toronto_today(),
  public.automatic_email_due_on(integer, text, timestamptz),
  public.validate_conditions(jsonb),
  public.automatic_email_matches(uuid, uuid),
  public.assert_in_outbox(uuid, uuid),
  public.queue_occurrences(text[], uuid, uuid, text, timestamptz, jsonb),
  public.prepare_due_sends(date),
  public.email_deliveries(),
  public.record_send_result(uuid, text, text),
  public.queue_join_occurrences(),
  public.queue_tag_occurrences(),
  public.queue_referral_occurrences()
from public, anon, authenticated;

-- Internal: it reads every member's tags without RLS. Admins get the Outbox through outbox_upcoming().
revoke all on public.email_candidate_state from public, anon, authenticated;

alter table public.automatic_emails enable row level security;
alter table public.email_occurrences enable row level security;
alter table public.email_sends enable row level security;

-- Reads for admins (the list, the editor, send history); every write goes through the functions
-- above or the engine (service role).
create policy "Admins see automatic emails" on public.automatic_emails for select to authenticated using ((select public.is_admin()));
create policy "Admins see occurrences" on public.email_occurrences for select to authenticated using ((select public.is_admin()));
create policy "Admins see sends" on public.email_sends for select to authenticated using ((select public.is_admin()));
