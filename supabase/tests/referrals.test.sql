\set ON_ERROR_STOP 1
-- Referral rules: supabase/migrations/20261120000000_referrals.sql, docs/backend/referrals.md.
-- Referral backend tests. Run after replay.sh. Every check raises on failure.
create schema t; create or replace function t.eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL %: got %, want %', label, got, want; end if;
  raise notice 'ok  %', label;
end $$;

-- ---------- fixture ----------
insert into public.people (id, email, first_name, last_name, unsubscribe_token) values
  ('00000000-0000-0000-0000-00000000000a', 'amara@example.org', 'Amara', 'Okafor', '10000000-0000-0000-0000-00000000000a'),
  ('00000000-0000-0000-0000-00000000000b', 'bea@example.org', 'Bea', 'Ng', '10000000-0000-0000-0000-00000000000b'),
  ('00000000-0000-0000-0000-00000000000c', 'carl@example.org', 'Carl', null, '10000000-0000-0000-0000-00000000000c'),
  ('00000000-0000-0000-0000-00000000000d', 'lee@example.org', 'Lee', null, '10000000-0000-0000-0000-00000000000d'),
  ('00000000-0000-0000-0000-00000000000e', 'unsub@example.org', 'Una', null, '10000000-0000-0000-0000-00000000000e'),
  ('00000000-0000-0000-0000-00000000000f', 'bounce@example.org', 'Bo', null, '10000000-0000-0000-0000-00000000000f');
update public.people set unsubscribed_at = now(), unsubscribe_reason = 'self' where email = 'unsub@example.org';
update public.people set bounced_at = now(), bounce_detail = 'hard' where email = 'bounce@example.org';
insert into public.suppressed_emails (email_hash, reason) values (public.email_hash('gone@example.org'), 'deleted');
insert into public.memberships (person_id, joined_at, join_emails) values
  ('00000000-0000-0000-0000-00000000000a', now() - interval '1 year', false),
  ('00000000-0000-0000-0000-00000000000b', now() - interval '1 year', false),
  ('00000000-0000-0000-0000-00000000000d', now() - interval '1 year', false);
grant usage on schema t to anon; grant execute on all functions in schema t to anon;

\set amara '''10000000-0000-0000-0000-00000000000a'''
\set bea '''10000000-0000-0000-0000-00000000000b'''

-- ---------- as the public (no sign-in) ----------
set role anon;

select t.eq('page: member token gives first name', (select first_name from public.referral_page(:amara)), 'Amara');
select t.eq('page: unknown token gives no row', (select count(*) from public.referral_page(gen_random_uuid())), 0::bigint);
select t.eq('page: non-member token gives no row', (select count(*) from public.referral_page('10000000-0000-0000-0000-00000000000c')), 0::bigint);

select t.eq('unknown token', (select status from public.refer_friend(gen_random_uuid(), 'Sam', 'sam@example.org', true)), 'unknown_link');
select t.eq('non-member token', (select status from public.refer_friend('10000000-0000-0000-0000-00000000000c', 'Sam', 'sam@example.org', true)), 'unknown_link');
select t.eq('null token', (select status from public.refer_friend(null, 'Sam', 'sam@example.org', true)), 'unknown_link');

select t.eq('empty name', (select status from public.refer_friend(:amara, '   ', 'sam@example.org', true)), 'invalid_name');
select t.eq('url in name', (select status from public.refer_friend(:amara, 'Win http://evil.example', 'sam@example.org', true)), 'invalid_name');
select t.eq('slash-free url in name', (select status from public.refer_friend(:amara, 'visit evil.example:8080', 'sam@example.org', true)), 'invalid_name');
select t.eq('email in name', (select status from public.refer_friend(:amara, 'sam@evil.example', 'sam@example.org', true)), 'invalid_name');
select t.eq('markup in name', (select status from public.refer_friend(:amara, '<b>Sam</b>', 'sam@example.org', true)), 'invalid_name');
select t.eq('newline in name', (select status from public.refer_friend(:amara, E'Sam\u0007', 'sam@example.org', true)), 'invalid_name');
select t.eq('right-to-left override in name', (select status from public.refer_friend(:amara, E'Sam \u202Emoc.live', 'sam@example.org', true)), 'invalid_name');
select t.eq('zero-width space in name', (select status from public.refer_friend(:amara, E'Sa\u200Bm', 'sam@example.org', true)), 'invalid_name');
select t.eq('81-char name', (select status from public.refer_friend(:amara, repeat('a', 81), 'sam@example.org', true)), 'invalid_name');
select t.eq('bad email', (select status from public.refer_friend(:amara, 'Sam', 'sam@example', true)), 'invalid_email');
select t.eq('two addresses in one', (select status from public.refer_friend(:amara, 'Sam', 'bob@evil.example,x', true)), 'invalid_email');
select t.eq('quotes in address', (select status from public.refer_friend(:amara, 'Sam', '"bob"@example.org', true)), 'invalid_email');
select t.eq('odd domain', (select status from public.refer_friend(:amara, 'Sam', 'bob@exa_mple.org', true)), 'invalid_email');
select t.eq('long email', (select status from public.refer_friend(:amara, 'Sam', repeat('a', 250) || '@x.org', true)), 'invalid_email');
select t.eq('own email, any case and spacing', (select status from public.refer_friend(:amara, 'Me', '  AMARA@Example.org ', true)), 'own_email');

select t.eq('nothing recorded by failures', (select count(*) from public.referrals), 0::bigint);
reset role;
select t.eq('nothing recorded by failures (as owner)', (select count(*) from public.referrals), 0::bigint);
set role anon;

-- New referral, email them
create temp table r1 as select * from public.refer_friend(:amara, '  Sam   Rivera ', 'Sam@Example.org', true);
select t.eq('new + email: emailed', (select status from r1), 'emailed');
select t.eq('new + email: first name', (select friend_name from r1), 'Sam');
select t.eq('new + email: has referral id', (select referral_id is not null from r1), true);
select t.eq('new + email: no referred_on', (select referred_on from r1), null::timestamptz);

-- Repeat: same link, never another email
create temp table r2 as select * from public.refer_friend(:amara, 'Sammy', 'sam@example.org', true);
select t.eq('repeat: message', (select status from r2), 'message');
select t.eq('repeat: same referral', (select referral_id from r2), (select referral_id from r1));
select t.eq('repeat: has referred_on', (select referred_on is not null from r2), true);

-- New referral, send it myself; then asking for an email still sends none
create temp table r3 as select * from public.refer_friend(:amara, 'Priya', 'priya@example.org', false);
select t.eq('new + self: message', (select status from r3), 'message');
select t.eq('new + self: no referred_on', (select referred_on from r3), null::timestamptz);
select t.eq('self then email: still message', (select status from public.refer_friend(:amara, 'Priya', 'priya@example.org', true)), 'message');

-- Can't be emailed: same answer, no invite
select t.eq('already a member: emailed', (select status from public.refer_friend(:amara, 'Lee', 'lee@example.org', true)), 'emailed');
select t.eq('unsubscribed: emailed', (select status from public.refer_friend(:amara, 'Una', 'UNSUB@example.org', true)), 'emailed');
select t.eq('bounced: emailed', (select status from public.refer_friend(:amara, 'Bo', 'bounce@example.org', true)), 'emailed');
select t.eq('suppressed: emailed', (select status from public.refer_friend(:amara, 'Gone', 'gone@example.org', true)), 'emailed');
select t.eq('a name with apostrophe, hyphen and dot', (select status from public.refer_friend(:amara, 'Siobhán O''Brien-Smith Jr.', 'sio@example.org', true)), 'emailed');

-- The public can't read referrals or call the internal lookup
select t.eq('anon reads no referrals', (select count(*) from public.referrals), 0::bigint);
do $$ begin
  perform public.referrer_by_token('10000000-0000-0000-0000-00000000000a');
  raise exception 'FAIL anon called referrer_by_token';
exception when insufficient_privilege then raise notice 'ok  anon cannot call referrer_by_token';
end $$;
reset role;

select t.eq('invites queued: only sam and sio', (select string_agg(referred_email, ',' order by referred_email) from public.referrals where invite_requested_at is not null), 'sam@example.org,sio@example.org');
select t.eq('names split and stored', (select referred_first_name || '|' || referred_last_name from public.referrals where referred_email = 'sam@example.org'), 'Sam|Rivera');
select t.eq('repeat kept the first name given', (select referred_first_name from public.referrals where referred_email = 'sam@example.org'), 'Sam');
select t.eq('referred_someone event per referral', (select count(*) from public.member_events where kind = 'referred_someone'), (select count(*) from public.referrals));
select t.eq('7 referrals so far', (select count(*) from public.referrals), 7::bigint);

-- ---------- daily limit ----------
set role anon;
select t.eq('8th..10th allowed', (select count(*) from generate_series(8, 10) i, public.refer_friend(:amara, 'F' || i, 'f' || i || '@example.org', false) r where r.status = 'message'), 3::bigint);
select t.eq('11th refused', (select status from public.refer_friend(:amara, 'F11', 'f11@example.org', true)), 'limit');
select t.eq('repeat still works at the limit', (select status from public.refer_friend(:amara, 'Sam', 'sam@example.org', true)), 'message');
select t.eq('another referrer is unaffected', (select status from public.refer_friend(:bea, 'Sam', 'sam@example.org', true)), 'emailed');
reset role;
select t.eq('a friend is emailed once, whoever refers them', (select count(invite_requested_at) from public.referrals where referred_email = 'sam@example.org'), 1::bigint);
select t.eq('the second referrer still gets their own referral', (select count(*) from public.referrals where referred_email = 'sam@example.org'), 2::bigint);
set role anon;
reset role;
update public.referrals set created_at = created_at - interval '25 hours' where referrer_id = '00000000-0000-0000-0000-00000000000a';
set role anon;
select t.eq('limit resets after a day', (select status from public.refer_friend(:amara, 'F11', 'f11@example.org', false)), 'message');
reset role;

-- ---------- the friend's link on the intake form ----------
\set answers '''{"topics": []}'''
\set bea_sam '(select id from public.referrals where referrer_id = ''00000000-0000-0000-0000-00000000000b'' and referred_email = ''sam@example.org'')'
set role anon;
select public.submit_intake('20000000-0000-0000-0000-000000000001', 'Sam', 'Rivera', 'sam.r@example.org', 'sdc-members', :answers, (select referral_id from r1));
select public.submit_intake('20000000-0000-0000-0000-000000000002', 'X', 'Y', 'x@example.org', 'sdc-members', :answers, gen_random_uuid());
select public.submit_intake(p_submission_id => '20000000-0000-0000-0000-000000000003', p_first_name => 'Old', p_last_name => 'Caller', p_email => 'old@example.org', p_form_source => 'ride-for-refuage', p_answers => :answers);
-- retry of submission 1 without the link
select public.submit_intake('20000000-0000-0000-0000-000000000001', 'Sam', 'Rivera', 'sam.r@example.org', 'sdc-members', :answers);
reset role;
select t.eq('link recorded', (select referral_id from public.intake_submissions where submission_id = '20000000-0000-0000-0000-000000000001'), (select referral_id from r1));
select t.eq('unknown link ignored', (select referral_id from public.intake_submissions where submission_id = '20000000-0000-0000-0000-000000000002'), null::uuid);
select t.eq('old callers still work', (select count(*) from public.intake_submissions where submission_id = '20000000-0000-0000-0000-000000000003'), 1::bigint);

-- ---------- joining completes a referral ----------
-- Sam was referred at sam@ by Amara (earlier) and Bea (later), used Amara's link, and joins at sam.r@.
insert into public.people (id, email, first_name) values ('00000000-0000-0000-0000-000000000051', 'sam.r@example.org', 'Sam');
insert into public.memberships (person_id) values ('00000000-0000-0000-0000-000000000051');
select t.eq('link wins even with another address', (select referrer_id from public.referrals where referred_id = '00000000-0000-0000-0000-000000000051'), '00000000-0000-0000-0000-00000000000a'::uuid);
select t.eq('referral_joined for the referrer', (select count(*) from public.member_events where kind = 'referral_joined' and person_id = '00000000-0000-0000-0000-00000000000a'), 1::bigint);
select t.eq('joined carries the referral', (select referral_id from public.member_events where kind = 'joined' and person_id = '00000000-0000-0000-0000-000000000051'), (select referral_id from r1));

-- Without a link: the earliest referral of their address (Bea's sam@ is the only open one left).
insert into public.people (id, email, first_name) values ('00000000-0000-0000-0000-000000000052', 'sam@example.org', 'Sam');
insert into public.memberships (person_id) values ('00000000-0000-0000-0000-000000000052');
select t.eq('no link: earliest open referral by email', (select referrer_id from public.referrals where referred_id = '00000000-0000-0000-0000-000000000052'), '00000000-0000-0000-0000-00000000000b'::uuid);

-- Priya: referred by Amara, then Bea; no link; joins: Amara (earliest).
insert into public.referrals (referrer_id, referred_email, created_at) values ('00000000-0000-0000-0000-00000000000b', 'priya@example.org', now());
insert into public.people (id, email, first_name) values ('00000000-0000-0000-0000-000000000053', 'priya@example.org', 'Priya');
insert into public.memberships (person_id) values ('00000000-0000-0000-0000-000000000053');
select t.eq('two referrers, no link: earliest wins', (select referrer_id from public.referrals where referred_id = '00000000-0000-0000-0000-000000000053'), '00000000-0000-0000-0000-00000000000a'::uuid);

-- Leaving and rejoining doesn't credit anyone twice.
delete from public.memberships where person_id = '00000000-0000-0000-0000-000000000053';
insert into public.memberships (person_id) values ('00000000-0000-0000-0000-000000000053');
select t.eq('rejoin: still one referral', (select count(*) from public.referrals where referred_id = '00000000-0000-0000-0000-000000000053'), 1::bigint);
select t.eq('rejoin: one referral_joined', (select count(*) from public.member_events e join public.referrals r on r.id = e.referral_id where e.kind = 'referral_joined' and r.referred_id = '00000000-0000-0000-0000-000000000053'), 1::bigint);

-- Joining with no referral at all still records the join.
insert into public.people (id, email) values ('00000000-0000-0000-0000-000000000054', 'nobody@example.org');
insert into public.memberships (person_id) values ('00000000-0000-0000-0000-000000000054');
select t.eq('no referral: joined without one', (select referral_id from public.member_events where kind = 'joined' and person_id = '00000000-0000-0000-0000-000000000054'), null::uuid);

-- A link to a referral already completed by someone else falls back to email matching.
insert into public.referrals (id, referrer_id, referred_email) values ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'kim@example.org');
select public.submit_intake('20000000-0000-0000-0000-000000000004', 'Kim', 'L', 'kim@example.org', 'sdc-members', :answers, (select referral_id from r1));
insert into public.people (id, email) values ('00000000-0000-0000-0000-000000000055', 'kim@example.org');
insert into public.memberships (person_id) values ('00000000-0000-0000-0000-000000000055');
select t.eq('used link already completed: falls back to email', (select referrer_id from public.referrals where referred_id = '00000000-0000-0000-0000-000000000055'), '00000000-0000-0000-0000-00000000000b'::uuid);

-- ---------- invites ----------
do $$ begin
  update public.referrals set invite_sent_at = now() where invite_requested_at is null and referred_email = 'priya@example.org';
  raise exception 'FAIL sent without a request';
exception when check_violation then raise notice 'ok  can''t mark sent without a request';
end $$;

\echo ALL REFERRAL TESTS PASSED
