-- Admin notifications: the bell in the admin sidebar. docs/backend/notifications.md explains the model.
--
--   something happens                     who writes the notification
--   a member joins, with or without       trigger on member_events (same transaction as the join)
--     a referral
--   someone unsubscribes from emails      trigger on subscription_events
--   Outbox: waiting, past due, failed     refresh_outbox_notifications(), at the end of the daily run
--   payments, cancel, pause, tier         notify_admins(), called by the payments webhook and the cancel
--                                         flow (service role) once they're built
--
-- Notifications are stored, not worked out when the panel opens: opening or refreshing the panel is one
-- small read. They can be up to a day old (owner, 23 Nov 2026). Seen is per admin (one timestamp each);
-- done is shared by every admin.

-- ---------- storage ----------

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  -- The same keys as the email alerts in Settings, so the panel and the alerts are one list.
  type text not null check (type in (
    'outboxWaiting', 'outboxPastDue', 'outboxFailed',
    'paymentDeclined', 'paymentsStopped', 'paymentUnmatched', 'refunds', 'paymentReceived',
    'memberJoins', 'cancels', 'pausesOrTierChanges', 'unsubscribes', 'referralJoins'
  )),
  -- One row per situation: a repeated webhook or a second run updates the row instead of adding one.
  -- e.g. 'memberJoins:<member event id>', 'outboxFailed:<date>', 'paymentDeclined:<PayPal event id>'.
  group_key text not null unique check (length(group_key) between 1 and 200),
  -- Facts only (ids, names, counts, cents). The app writes every sentence from type and data, so wording
  -- changes need no migration. Shapes: NotificationData in src/features/notifications/types.ts.
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  -- When it happened, or when the situation last grew (one more email waiting).
  occurred_at timestamptz not null default now(),
  -- Done is shared: one admin checking it off clears it for everyone. done_by null with done_at set means
  -- the daily run closed it because the situation went away (nothing waiting any more).
  done_at timestamptz,
  done_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now()
);

-- The panel's list (not done, newest first, paged by occurred_at then id) and the bell's count.
create index admin_notifications_open on public.admin_notifications (occurred_at desc, id desc) where done_at is null;
-- The daily run's lookups ("is there an open Outbox notification of this type?").
create index admin_notifications_open_type on public.admin_notifications (type) where done_at is null;

-- Each admin's last look at the panel. A notification is new to them if it happened after this.
create table public.admin_notification_seen (
  person_id uuid primary key references public.people (id) on delete cascade,
  seen_at timestamptz not null default now()
);

alter table public.admin_notifications enable row level security;
alter table public.admin_notification_seen enable row level security;
-- Reads go through the functions below; nobody writes the tables directly.
create policy "Admins see notifications" on public.admin_notifications for select to authenticated
  using ((select public.is_admin()));
create policy "Admins see their own last look" on public.admin_notification_seen for select to authenticated
  using (person_id = (select public.current_person_id()) and (select public.is_admin()));
revoke all on public.admin_notifications from public, anon, authenticated;
revoke all on public.admin_notification_seen from public, anon, authenticated;
grant select on public.admin_notifications to authenticated;
grant select on public.admin_notification_seen to authenticated;

-- ---------- writing ----------

-- The one way a notification is written. A second call with the same group_key updates the facts; if
-- p_reopen, it also moves it to now (shows as new again) and undoes done. Server only (triggers, the
-- daily run, the payments webhook).
create function public.notify_admins(
  p_type text,
  p_group_key text,
  p_data jsonb,
  p_occurred_at timestamptz default now(),
  p_reopen boolean default false
)
returns uuid
language sql security definer set search_path = ''
as $$
  insert into public.admin_notifications (type, group_key, data, occurred_at)
  values (p_type, p_group_key, coalesce(p_data, '{}'::jsonb), coalesce(p_occurred_at, now()))
  on conflict (group_key) do update set
    data = excluded.data,
    occurred_at = case when p_reopen then excluded.occurred_at else public.admin_notifications.occurred_at end,
    done_at = case when p_reopen then null else public.admin_notifications.done_at end,
    done_by = case when p_reopen then null else public.admin_notifications.done_by end
  returning id
$$;

-- A person as notifications carry them: {id, name}. Name falls back to the email address.
create function public.notification_person(p_person_id uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('id', p.id, 'name', coalesce(nullif(btrim(p.full_name), ''), p.email))
  from public.people p where p.id = p_person_id
$$;

-- Joins. Members added with "Send join emails" off (backfills and imports) don't notify, the same way
-- they don't start join emails: an admin bringing in 200 existing members doesn't need 200 notifications.
-- A join from a referral is one referralJoins notification instead of memberJoins. Timed when the join is
-- recorded, not the join date an admin typed, so a backdated member still shows as new.
create function public.notify_member_event()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  referrer uuid;
begin
  if new.kind <> 'joined' or not coalesce(new.join_emails, false) then
    return new;
  end if;
  -- A notification must never stop the join itself.
  begin
    if new.referral_id is null then
      perform public.notify_admins('memberJoins', 'memberJoins:' || new.id,
        jsonb_build_object('person', public.notification_person(new.person_id)), new.created_at);
    else
      select r.referrer_id into referrer from public.referrals r where r.id = new.referral_id;
      perform public.notify_admins('referralJoins', 'referralJoins:' || new.id,
        jsonb_build_object(
          'person', public.notification_person(new.person_id),
          'referrer', public.notification_person(referrer)
        ), new.created_at);
    end if;
  exception when others then
    raise warning 'notify_member_event failed for member event %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_member_event after insert on public.member_events
for each row execute function public.notify_member_event();

-- Unsubscribes. Imports (a list of addresses SDC already had) don't notify.
create function public.notify_subscription_event()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.kind <> 'unsubscribed' or new.detail = 'imported' then
    return new;
  end if;
  begin
    perform public.notify_admins('unsubscribes', 'unsubscribes:' || new.id,
      jsonb_build_object('person', public.notification_person(new.person_id)), new.at);
  exception when others then
    raise warning 'notify_subscription_event failed for subscription event %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

create trigger notify_subscription_event after insert on public.subscription_events
for each row execute function public.notify_subscription_event();

-- Outbox notifications, refreshed once a day at the end of the daily run (after sends are recorded).
--   outboxWaiting  any review email due in the next 2 days and not approved. count is every email
--                  waiting, due soon or not, because they're reviewed together.
--   outboxPastDue  review emails whose day passed without approval.
--   outboxFailed   sends that failed their third try today.
-- Waiting and past due are one notification per situation (refresh_count_notification); failed is one
-- per day. An admin's "done" stays done until the number grows. Also clears done notifications older than
-- 180 days. Safe to run twice.
create function public.refresh_outbox_notifications(p_today date default public.toronto_today())
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  waiting integer;
  due_soon integer;
  past_due integer;
  failed integer;
begin
  select
    count(*) filter (where s.due_on >= p_today),
    count(*) filter (where s.due_on between p_today and p_today + 2),
    count(*) filter (where s.due_on < p_today)
  into waiting, due_soon, past_due
  from public.email_candidate_state s
  join public.automatic_emails e on e.id = s.automatic_email_id
  where s.occurrence_status = 'pending' and e.state = 'published'
    and s.needs_review and s.approved_at is null
    and s.matched and s.emailable
    and (s.send_status is null or s.send_status = 'pending');

  perform public.refresh_count_notification('outboxWaiting', case when due_soon > 0 then waiting else 0 end, p_today);
  perform public.refresh_count_notification('outboxPastDue', past_due, p_today);

  select count(*)::integer into failed
  from public.email_sends es
  where es.status = 'not_sent' and es.not_sent_reason = 'failed'
    and (es.updated_at at time zone 'America/Toronto')::date = p_today;
  if failed > 0 then
    perform public.notify_admins('outboxFailed', 'outboxFailed:' || p_today, jsonb_build_object('count', failed),
      now(), (select coalesce((n.data ->> 'count')::integer, 0) < failed
              from public.admin_notifications n where n.group_key = 'outboxFailed:' || p_today));
  end if;

  delete from public.admin_notifications where done_at < now() - interval '180 days';
end;
$$;

-- One notification per Outbox situation, carrying a count. The latest row of the type is the situation:
--   count 0                      it's over: close what's open (done, by nobody)
--   none yet, or the last one    a new situation: open a new notification
--     was closed by the system
--   the count went up            new again: move it to now and reopen it, even if an admin marked it done
--   otherwise                    update the number; an admin's done stays done
create function public.refresh_count_notification(p_type text, p_count integer, p_today date)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  latest public.admin_notifications;
  grew boolean;
begin
  if p_count <= 0 then
    update public.admin_notifications set done_at = now() where type = p_type and done_at is null;
    return;
  end if;

  select * into latest from public.admin_notifications
  where type = p_type
  order by created_at desc, id desc limit 1
  for update;

  if latest.id is null or (latest.done_at is not null and latest.done_by is null) then
    perform public.notify_admins(p_type, p_type || ':' || p_today, jsonb_build_object('count', p_count), now(), true);
  else
    grew := p_count > coalesce((latest.data ->> 'count')::integer, 0);
    update public.admin_notifications set
      data = jsonb_build_object('count', p_count),
      occurred_at = case when grew then now() else occurred_at end,
      done_at = case when grew then null else done_at end,
      done_by = case when grew then null else done_by end
    where id = latest.id;
  end if;
end;
$$;

-- ---------- reading (the panel) ----------

-- The red count on the bell: not done, and newer than this admin's last look.
create function public.admin_notifications_new_count()
returns integer
language plpgsql stable security definer set search_path = ''
as $$
declare
  me uuid := public.current_person_id();
begin
  if not public.is_admin() then
    raise exception 'Only admins can read notifications' using errcode = '42501';
  end if;
  return (
    select count(*)::integer from public.admin_notifications n
    where n.done_at is null
      and n.occurred_at > coalesce((select s.seen_at from public.admin_notification_seen s where s.person_id = me), '-infinity')
  );
end;
$$;

-- The pages after the first (open_admin_notifications): notifications that aren't done, newest first,
-- older than the last row's occurred_at and id. Reads only. seen_at is this admin's last look.
create function public.admin_notifications_page(
  p_before_at timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 15
)
returns table (id uuid, type text, data jsonb, occurred_at timestamptz, seen_at timestamptz)
language plpgsql stable security definer set search_path = ''
as $$
declare
  me uuid := public.current_person_id();
  seen timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Only admins can read notifications' using errcode = '42501';
  end if;
  select s.seen_at into seen from public.admin_notification_seen s where s.person_id = me;
  return query
  select n.id, n.type, n.data, n.occurred_at, seen
  from public.admin_notifications n
  where n.done_at is null
    and (p_before_at is null or (n.occurred_at, n.id) < (p_before_at, coalesce(p_before_id, 'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)))
  order by n.occurred_at desc, n.id desc
  limit least(greatest(coalesce(p_limit, 15), 1), 50);
end;
$$;

-- Opening the panel, in one call: the first page, and this admin has now seen everything up to its newest
-- notification. Not "up to now": one written while this runs stays new. Rows carry the seen time from
-- before, so the panel can still mark which ones were new. Seen never moves backwards.
create function public.open_admin_notifications(p_limit integer default 15)
returns table (id uuid, type text, data jsonb, occurred_at timestamptz, seen_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := public.current_person_id();
  seen timestamptz;
  newest timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Only admins can read notifications' using errcode = '42501';
  end if;
  select s.seen_at into seen from public.admin_notification_seen s where s.person_id = me;
  select max(n.occurred_at) into newest from public.admin_notifications n where n.done_at is null;
  if newest is not null then
    insert into public.admin_notification_seen (person_id, seen_at) values (me, least(newest, now()))
    on conflict (person_id) do update
      set seen_at = greatest(public.admin_notification_seen.seen_at, excluded.seen_at);
  end if;
  return query
  select n.id, n.type, n.data, n.occurred_at, seen
  from public.admin_notifications n
  where n.done_at is null and n.occurred_at <= coalesce(newest, '-infinity')
  order by n.occurred_at desc, n.id desc
  limit least(greatest(coalesce(p_limit, 15), 1), 50);
end;
$$;

-- Mark as done (for every admin), or undo it.
create function public.set_admin_notification_done(p_id uuid, p_done boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change notifications' using errcode = '42501';
  end if;
  update public.admin_notifications
  set done_at = case when p_done then coalesce(done_at, now()) end,
      done_by = case when p_done then coalesce(done_by, public.current_person_id()) end
  where id = p_id;
  if not found then
    raise exception 'That notification is gone' using errcode = 'P0002';
  end if;
end;
$$;

-- ---------- access ----------

revoke execute on function public.notify_admins(text, text, jsonb, timestamptz, boolean) from public, anon, authenticated;
revoke execute on function public.notification_person(uuid) from public, anon, authenticated;
revoke execute on function public.notify_member_event() from public, anon, authenticated;
revoke execute on function public.notify_subscription_event() from public, anon, authenticated;
revoke execute on function public.refresh_outbox_notifications(date) from public, anon, authenticated;
revoke execute on function public.refresh_count_notification(text, integer, date) from public, anon, authenticated;
revoke execute on function public.admin_notifications_new_count() from public, anon;
revoke execute on function public.admin_notifications_page(timestamptz, uuid, integer) from public, anon;
revoke execute on function public.open_admin_notifications(integer) from public, anon;
revoke execute on function public.set_admin_notification_done(uuid, boolean) from public, anon;
grant execute on function public.notify_admins(text, text, jsonb, timestamptz, boolean) to service_role;
grant execute on function public.refresh_outbox_notifications(date) to service_role;
grant execute on function public.admin_notifications_new_count() to authenticated;
grant execute on function public.admin_notifications_page(timestamptz, uuid, integer) to authenticated;
grant execute on function public.open_admin_notifications(integer) to authenticated;
grant execute on function public.set_admin_notification_done(uuid, boolean) to authenticated;
