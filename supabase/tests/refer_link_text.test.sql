\set ON_ERROR_STOP 1
-- Refer link text rules: supabase/migrations/20261127000000_refer_link_text.sql, docs/backend/settings.md.
create schema t; create or replace function t.eq(label text, got anyelement, want anyelement) returns void language plpgsql as $$
begin
  if got is distinct from want then raise exception 'FAIL %: got %, want %', label, got, want; end if;
  raise notice 'ok  %', label;
end $$;
-- The SQLSTATE a call raises, or 'ok'.
create or replace function t.err(p_sql text) returns text language plpgsql as $$
begin
  execute p_sql;
  return 'ok';
exception when others then
  return sqlstate;
end $$;

-- ---------- fixture: one signed-in admin, one member who isn't ----------
insert into auth.users (id) values ('20000000-0000-0000-0000-00000000000a'), ('20000000-0000-0000-0000-00000000000b');
insert into public.people (id, email, first_name, user_id, last_signed_in_at) values
  ('00000000-0000-0000-0000-00000000000a', 'admin@example.org', 'Ada', '20000000-0000-0000-0000-00000000000a', now()),
  ('00000000-0000-0000-0000-00000000000b', 'member@example.org', 'Mo', '20000000-0000-0000-0000-00000000000b', now());
insert into public.admins (person_id) values ('00000000-0000-0000-0000-00000000000a');
grant usage on schema t to anon, authenticated; grant execute on all functions in schema t to anon, authenticated;

select t.eq('seeded with the default', (select refer_link_text from public.email_settings), 'Refer a friend');
select t.eq('one row', (select count(*) from public.email_settings), 1::bigint);
select t.eq('a second row is refused', t.err($$insert into public.email_settings (id) values (false)$$), '23514');
select t.eq('blank text refused by the table too', t.err($$update public.email_settings set refer_link_text = ' '$$), '23514');

-- ---------- the public ----------
set role anon;
select t.eq('anon: cannot set', t.err($$select public.set_refer_link_text('Hi')$$), '42501');
select t.eq('anon: cannot read', t.err($$select * from public.email_settings$$), '42501');
select t.eq('anon: cannot read deliveries', t.err($$select * from public.email_deliveries()$$), '42501');
reset role;

-- ---------- a signed-in member who isn't an admin ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-00000000000b', false);
select t.eq('member: cannot set', t.err($$select public.set_refer_link_text('Hi')$$), '42501');
select t.eq('member: sees no row', (select count(*) from public.email_settings), 0::bigint);
select t.eq('member: cannot update directly', t.err($$update public.email_settings set refer_link_text = 'Hi'$$), '42501');
reset role;

-- ---------- the admin ----------
set role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-0000-0000-00000000000a', false);
select t.eq('admin: reads it', (select refer_link_text from public.email_settings), 'Refer a friend');
select t.eq('admin: saves and gets it back', public.set_refer_link_text('Invite a friend'), 'Invite a friend');
select t.eq('admin: trims and collapses spaces', public.set_refer_link_text(E'  Invite \n\t a   friend  '), 'Invite a friend');
select t.eq('admin: accents and emoji are fine', public.set_refer_link_text('Inviter un·e ami·e 💛'), 'Inviter un·e ami·e 💛');
select t.eq('admin: 40 characters is fine', char_length(public.set_refer_link_text(repeat('a', 40))), 40);
select t.eq('admin: empty', t.err($$select public.set_refer_link_text('   ')$$), '22023');
select t.eq('admin: null', t.err($$select public.set_refer_link_text(null)$$), '22023');
select t.eq('admin: 41 characters', t.err($$select public.set_refer_link_text(repeat('a', 41))$$), '22023');
select t.eq('admin: web address', t.err($$select public.set_refer_link_text('https://evil.example')$$), '22023');
select t.eq('admin: www', t.err($$select public.set_refer_link_text('Visit WWW.sdc.org')$$), '22023');
select t.eq('admin: email address', t.err($$select public.set_refer_link_text('me@sdc.org')$$), '22023');
select t.eq('admin: markup', t.err($$select public.set_refer_link_text('<b>Refer</b>')$$), '22023');
select t.eq('admin: control character', t.err($$select public.set_refer_link_text(E'Refer\u0007')$$), '22023');
select t.eq('admin: right-to-left override', t.err($$select public.set_refer_link_text(E'Refer \u202edneirf')$$), '22023');
select t.eq('admin: zero-width space', t.err($$select public.set_refer_link_text(E'Re\u200bfer')$$), '22023');
select t.eq('admin: cannot delete the row', t.err($$delete from public.email_settings$$), '42501');
select t.eq('admin: cannot update directly', t.err($$update public.email_settings set refer_link_text = 'Hi'$$), '42501');
reset role;
select t.eq('failed saves left the last good text', (select refer_link_text from public.email_settings), repeat('a', 40));
select t.eq('records who saved it', (select updated_by from public.email_settings), '00000000-0000-0000-0000-00000000000a'::uuid);

-- ---------- can_refer on deliveries ----------
-- Two sends that are ready: one to a current member, one to someone whose membership has ended.
insert into public.memberships (person_id, joined_at, join_emails) values ('00000000-0000-0000-0000-00000000000b', now(), false);
insert into public.automatic_emails (id, name, state) values ('30000000-0000-0000-0000-000000000001', 'Test', 'published');
insert into public.email_occurrences (id, automatic_email_id, key, trigger, person_id, event_at, due_on) values
  ('40000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001', 'a', 'join_any', '00000000-0000-0000-0000-00000000000a', now(), current_date),
  ('40000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', 'b', 'join_any', '00000000-0000-0000-0000-00000000000b', now(), current_date);
insert into public.email_sends (occurrence_id, automatic_email_id, person_id, due_on, status) values
  ('40000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', current_date, 'sending'),
  ('40000000-0000-0000-0000-00000000000b', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', current_date, 'sending');
select t.eq('deliveries: member can refer', (select can_refer from public.email_deliveries() where to_email = 'member@example.org'), true);
select t.eq('deliveries: non-member gets no refer link', (select can_refer from public.email_deliveries() where to_email = 'admin@example.org'), false);
select t.eq('deliveries: still has its token', (select unsubscribe_token is not null from public.email_deliveries() where to_email = 'admin@example.org'), true);

select 'ALL REFER LINK TEXT TESTS PASSED';
