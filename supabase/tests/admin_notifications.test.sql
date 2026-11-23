-- Tests for 20261123000000_admin_notifications.sql. Runs against a database with every migration applied
-- and Supabase's auth schema present (auth.uid() reads request.jwt.claim.sub, auth.jwt() reads
-- request.jwt.claims). Each check raises an exception if it fails, so the run stops at the first problem;
-- passing checks print a "pass:" row.

-- ---------- setup: one admin, one non-admin ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'suhanya@example.org'),
  ('00000000-0000-0000-0000-0000000000b2', 'member@example.org');
insert into public.people (id, email, first_name, last_name, user_id) values
  ('10000000-0000-0000-0000-0000000000a1', 'suhanya@example.org', 'Suhanya', 'K', '00000000-0000-0000-0000-0000000000a1'),
  ('10000000-0000-0000-0000-0000000000b2', 'member@example.org', 'Plain', 'Member', '00000000-0000-0000-0000-0000000000b2'),
  ('10000000-0000-0000-0000-0000000000c3', 'priya@example.org', 'Priya', 'Patel', null);
insert into public.admins (person_id) values ('10000000-0000-0000-0000-0000000000a1');
insert into public.memberships (person_id, join_emails) values ('10000000-0000-0000-0000-0000000000c3', false);

-- Helpers in their own schema so every role can call them.
create schema tests;
grant usage on schema tests to public;

-- Sign in as the admin: a fresh sign-in in the JWT, so is_admin() is true.
create function tests.as_user(p_user uuid, p_role text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', p_user::text, false);
  perform set_config('request.jwt.claims',
    jsonb_build_object('amr', jsonb_build_array(jsonb_build_object('method', 'otp', 'timestamp', extract(epoch from now())::bigint)))::text, false);
  execute format('set role %I', p_role);
end;
$$;
create function tests.check(p_ok boolean, p_name text) returns text language plpgsql as $$
begin
  if not coalesce(p_ok, false) then raise exception 'FAILED: %', p_name; end if;
  return 'pass: ' || p_name;
end;
$$;
grant execute on all functions in schema tests to public;

select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');
select tests.check(public.is_admin(), 'the test admin is an admin') as check;

-- ---------- joins ----------
select public.add_member('amira@example.org', 'Amira Khan');
select tests.check(
  (select count(*) = 1 and min(data -> 'person' ->> 'name') = 'Amira Khan'
   from public.admin_notifications where type = 'memberJoins'),
  'a join writes one memberJoins notification with the name') as check;

select public.add_member('old@example.org', 'Old Member', now() - interval '3 years', false);
select tests.check(
  (select count(*) = 1 from public.admin_notifications where type = 'memberJoins'),
  'a join with join emails off (a backfill) writes nothing') as check;

select public.add_member('late@example.org', 'Late Entry', now() - interval '30 days', true);
select tests.check(
  (select occurred_at > now() - interval '1 minute' from public.admin_notifications
   where type = 'memberJoins' and data -> 'person' ->> 'name' = 'Late Entry'),
  'a backdated join is timed when it was recorded, so it shows as new') as check;
reset role;
delete from public.admin_notifications where data -> 'person' ->> 'name' = 'Late Entry';
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');

select public.add_referral('10000000-0000-0000-0000-0000000000c3', 'leo@example.org', 'Leo Chen');
select public.add_member('leo@example.org', 'Leo Chen');
select tests.check(
  (select count(*) = 1 and min(data -> 'person' ->> 'name') = 'Leo Chen' and min(data -> 'referrer' ->> 'name') = 'Priya Patel'
   from public.admin_notifications where type = 'referralJoins'),
  'a referred join writes referralJoins with both names') as check;
select tests.check(
  (select count(*) = 1 from public.admin_notifications where type = 'memberJoins'),
  'a referred join does not also write memberJoins') as check;

-- ---------- unsubscribes ----------
select public.unsubscribe_member((select id from public.people where email = 'amira@example.org'));
select tests.check(
  (select count(*) = 1 from public.admin_notifications where type = 'unsubscribes'),
  'an unsubscribe writes unsubscribes') as check;
reset role;
update public.people set unsubscribed_at = now(), unsubscribe_reason = 'imported' where email = 'old@example.org';
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');
select tests.check(
  (select count(*) = 1 from public.admin_notifications where type = 'unsubscribes'),
  'an imported unsubscribe writes nothing') as check;

-- ---------- seen ----------
select tests.check(public.admin_notifications_new_count() = 3, 'never opened: everything is new (3)') as check;
create temp table opened as select * from public.open_admin_notifications();
select tests.check((select count(*) = 3 from opened), 'opening returns the first page') as check;
select tests.check((select bool_and(seen_at is null) from opened), 'its rows carry the seen time from before opening') as check;
select tests.check(public.admin_notifications_new_count() = 0, 'opening the panel clears the count') as check;

-- Never backwards: with the newest one done, opening again doesn't move seen back to the older ones.
create temp table seen_before as select seen_at from public.admin_notification_seen;
reset role;
update public.admin_notifications set done_at = now()
where id = (select id from public.admin_notifications where done_at is null order by occurred_at desc, id desc limit 1);
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');
select count(*) from public.open_admin_notifications();
select tests.check(
  (select s.seen_at = b.seen_at from public.admin_notification_seen s, seen_before b),
  'seen never moves backwards') as check;
reset role;
update public.admin_notifications set done_at = null where done_at is not null;
update public.admin_notifications set done_at = now() where true;
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');
select count(*) from public.open_admin_notifications();
select tests.check(
  (select s.seen_at = b.seen_at from public.admin_notification_seen s, seen_before b),
  'nothing to show marks nothing') as check;
reset role;
update public.admin_notifications set done_at = null;
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');
select tests.check(
  (select count(*) = 3 from public.admin_notifications_page()),
  'seen notifications stay on the list') as check;

-- One written after the panel loaded (newer than anything it showed) stays new.
reset role;
select public.notify_admins('unsubscribes', 'unsubscribes:late-arrival',
  jsonb_build_object('person', jsonb_build_object('id', gen_random_uuid(), 'name', 'Late Arrival')), now() + interval '1 second');
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');
select tests.check(public.admin_notifications_new_count() = 1, 'a notification newer than what was shown stays new') as check;
reset role;
delete from public.admin_notifications where group_key = 'unsubscribes:late-arrival';
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');

-- ---------- done ----------
select public.set_admin_notification_done((select id from public.admin_notifications where type = 'unsubscribes'), true);
select tests.check(
  (select count(*) = 2 from public.admin_notifications_page()),
  'done leaves the list') as check;
select tests.check(
  (select done_by = '10000000-0000-0000-0000-0000000000a1' from public.admin_notifications where type = 'unsubscribes'),
  'done records who') as check;
select public.set_admin_notification_done((select id from public.admin_notifications where type = 'unsubscribes'), false);
select tests.check(
  (select count(*) = 3 from public.admin_notifications_page()),
  'undo puts it back') as check;

-- ---------- paging ----------
reset role;
select public.notify_admins('paymentReceived', 'paymentReceived:test-' || g,
  jsonb_build_object('person', jsonb_build_object('id', gen_random_uuid(), 'name', 'Payer ' || g), 'amount', 2500),
  now() - interval '10 days')  -- same time for all: paging must still split them by id
from generate_series(1, 20) g;
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');
create temp table page1 as select * from public.admin_notifications_page(null, null, 15);
select tests.check((select count(*) = 15 from page1), 'first page has 15') as check;
create temp table page2 as
  select * from public.admin_notifications_page(
    (select occurred_at from page1 order by occurred_at asc, id asc limit 1),
    (select id from page1 order by occurred_at asc, id asc limit 1), 15);
select tests.check((select count(*) = 8 from page2), 'second page has the other 8 (23 in all)') as check;
select tests.check(
  not exists (select 1 from page1 join page2 using (id)),
  'pages do not overlap, even with equal times') as check;

-- ---------- the same situation twice ----------
reset role;
select public.notify_admins('paymentReceived', 'paymentReceived:test-1', '{"amount": 9999}'::jsonb);
select tests.check(
  (select count(*) = 20 from public.admin_notifications where type = 'paymentReceived'),
  'a repeated group key updates instead of adding') as check;

-- ---------- Outbox ----------
insert into public.automatic_emails (id, name, state, trigger, mode, subject, published_at)
values ('20000000-0000-0000-0000-000000000001', 'Welcome', 'published', 'join_any', 'review', 'Hi', now());
insert into public.email_occurrences (automatic_email_id, key, trigger, person_id, event_at, due_on)
select '20000000-0000-0000-0000-000000000001', 'join:test:' || p.email, 'join_any', p.id, now(), public.toronto_today() + 1
from public.people p where p.email in ('leo@example.org');
insert into public.email_occurrences (automatic_email_id, key, trigger, person_id, event_at, due_on)
select '20000000-0000-0000-0000-000000000001', 'join:test2:' || p.email, 'join_any', p.id, now(), public.toronto_today() + 10
from public.people p where p.email in ('leo@example.org');

select public.refresh_outbox_notifications();
select tests.check(
  (select count(*) = 1 and min((data ->> 'count')::int) = 2 from public.admin_notifications where type = 'outboxWaiting' and done_at is null),
  'one due within 2 days: one outboxWaiting counting every email waiting (2)') as check;
select public.refresh_outbox_notifications();
select tests.check(
  (select count(*) = 1 from public.admin_notifications where type = 'outboxWaiting'),
  'running twice adds nothing') as check;

update public.admin_notifications set done_at = now(), done_by = '10000000-0000-0000-0000-0000000000a1' where type = 'outboxWaiting';
select public.refresh_outbox_notifications();
select tests.check(
  (select done_at is not null from public.admin_notifications where type = 'outboxWaiting'),
  'an admin''s done stays done when the run finds the same count') as check;
insert into public.email_occurrences (automatic_email_id, key, trigger, person_id, event_at, due_on)
select '20000000-0000-0000-0000-000000000001', 'join:test3:' || p.email, 'join_any', p.id, now(), public.toronto_today() + 5
from public.people p where p.email in ('leo@example.org');
select public.refresh_outbox_notifications();
select tests.check(
  (select count(*) = 1 and bool_and(done_at is null) and min((data ->> 'count')::int) = 3
   from public.admin_notifications where type = 'outboxWaiting'),
  'one more waiting reopens it with the new count') as check;
delete from public.email_occurrences where key like 'join:test3:%';

update public.email_occurrences set due_on = public.toronto_today() - 1 where key like 'join:test:%';
update public.email_occurrences set due_on = public.toronto_today() + 10 where key like 'join:test2:%';
select public.refresh_outbox_notifications();
select tests.check(
  (select done_at is not null and done_by is null from public.admin_notifications where type = 'outboxWaiting'),
  'nothing due soon: the run closes outboxWaiting itself') as check;
select tests.check(
  (select count(*) = 1 and min((data ->> 'count')::int) = 1 from public.admin_notifications where type = 'outboxPastDue' and done_at is null),
  'a missed review day writes outboxPastDue') as check;

insert into public.email_sends (occurrence_id, automatic_email_id, person_id, due_on, status, not_sent_reason, attempts, updated_at)
select o.id, o.automatic_email_id, o.person_id, o.due_on, 'not_sent', 'failed', 3, now()
from public.email_occurrences o where o.key like 'join:test2:%';
select public.refresh_outbox_notifications();
select tests.check(
  (select count(*) = 1 and min((data ->> 'count')::int) = 1 from public.admin_notifications where type = 'outboxFailed'),
  'a send that failed today writes outboxFailed') as check;

-- ---------- who can do what ----------
select tests.as_user('00000000-0000-0000-0000-0000000000b2', 'authenticated');
select tests.check((select count(*) = 0 from public.admin_notifications), 'a non-admin sees no notifications') as check;
do $$
begin
  perform public.admin_notifications_new_count();
  raise exception 'FAILED: a non-admin can read the count';
exception when insufficient_privilege then null;
end $$;
select 'pass: a non-admin cannot read the count' as check;
-- The app sends anyone refused with 42501 to sign in, so every reader must refuse with exactly that code.
do $$
begin
  perform public.open_admin_notifications();
  raise exception 'FAILED: a non-admin can open the panel';
exception when insufficient_privilege then null;
end $$;
select 'pass: a non-admin opening the panel is refused with 42501' as check;
reset role;
set role anon;
do $$
begin
  perform public.admin_notifications_page();
  raise exception 'FAILED: a signed-out visitor can read a page';
exception when insufficient_privilege then null;
end $$;
select 'pass: a signed-out visitor is refused with 42501' as check;
reset role;
select tests.as_user('00000000-0000-0000-0000-0000000000b2', 'authenticated');
do $$
begin
  perform public.notify_admins('memberJoins', 'x', '{}'::jsonb);
  raise exception 'FAILED: a signed-in user can write notifications';
exception when insufficient_privilege then null;
end $$;
select 'pass: a signed-in user cannot call notify_admins' as check;
do $$
begin
  insert into public.admin_notifications (type, group_key) values ('memberJoins', 'direct');
  raise exception 'FAILED: a signed-in user can insert directly';
exception when insufficient_privilege then null;
end $$;
select 'pass: nobody inserts into the table directly' as check;
do $$
begin
  truncate public.admin_notifications;
  raise exception 'FAILED: a signed-in user can truncate';
exception when insufficient_privilege then null;
end $$;
select 'pass: nobody truncates the table' as check;

reset role;
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'service_role');
select public.refresh_outbox_notifications();
select 'pass: the service role runs the daily refresh' as check;
reset role;

-- ---------- retention ----------
update public.admin_notifications set done_at = now() - interval '200 days' where group_key = 'paymentReceived:test-2';
select public.refresh_outbox_notifications();
select tests.check(
  not exists (select 1 from public.admin_notifications where group_key = 'paymentReceived:test-2'),
  'done notifications older than 180 days are cleared') as check;

-- ---------- a failing notification never stops a join ----------
alter table public.admin_notifications add constraint test_block check (type <> 'memberJoins') not valid;
select tests.as_user('00000000-0000-0000-0000-0000000000a1', 'authenticated');
select tests.check(public.add_member('blocked@example.org', 'Still Joins') = 'added', 'the join succeeds even when notifying fails') as check;
reset role;
alter table public.admin_notifications drop constraint test_block;

drop schema tests cascade;
