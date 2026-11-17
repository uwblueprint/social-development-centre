-- Member Directory, phase 2: what Automatic Emails reads and writes (member events, email sends),
-- notes with history, subscription history, adding many members at once, and one timeline per member.
-- Rename this file to the version Supabase assigns when applied.

-- ---------- member events ----------

-- One row each time something happens to a member that an automatic email can start from. Automatic
-- Emails reads this table and nothing else: "one send per occurrence" is unique (automatic email,
-- event id), and the send date is `at` plus the delay.
--
-- Rows are written by triggers on memberships, referrals and tag_events, so every way of adding a
-- member, recording a referral or tagging someone writes exactly one event, in the same transaction.
--
--   kind              person_id is           automatic email triggers it serves
--   joined            the new member         joins (any way); without a referral (referral_id null);
--                                            via referral (referral_id set)
--   referred_someone  the referrer           member refers someone
--   referral_joined   the referrer           member's referral joins
--   tag_added         the tagged member      tag added to member (tag_id)
create table public.member_events (
  id bigint generated always as identity primary key,
  person_id uuid not null references public.people (id) on delete cascade,
  kind text not null check (kind in ('joined', 'referred_someone', 'referral_joined', 'tag_added')),
  at timestamptz not null,
  -- The tag's name is kept so the history still reads right after a rename or delete.
  tag_id uuid references public.tags (id) on delete set null,
  tag_name text,
  referral_id uuid references public.referrals (id) on delete set null,
  -- The admin's "Send join emails" choice. False means join emails don't start from this event: set on
  -- joined and on referral_joined, so backfilling existing members emails neither them nor whoever
  -- referred them.
  join_emails boolean,
  created_at timestamptz not null default now(),
  constraint tag_added_has_tag check ((kind = 'tag_added') = (tag_name is not null)),
  constraint joins_have_join_emails check ((kind in ('joined', 'referral_joined')) = (join_emails is not null))
);
create index member_events_kind_at on public.member_events (kind, at);
create index member_events_person_id on public.member_events (person_id, at desc);

-- ---------- referrals ----------

-- The friend's name, from the referral link's form, for the "Referred person" personalization fields.
-- Empty until they give it.
alter table public.referrals
  add column referred_first_name text,
  add column referred_last_name text;

-- Records that a member referred someone. The Referrals link (no sign-in) will call its own function;
-- this one is for admins. If the friend later becomes a member, adding them links the referral.
create function public.add_referral(p_referrer_id uuid, p_email text, p_full_name text default null)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  n record;
  referral uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can record referrals' using errcode = '42501';
  end if;
  n := public.split_name(p_full_name);

  insert into public.referrals (referrer_id, referred_email, referred_first_name, referred_last_name)
  values (p_referrer_id, lower(btrim(p_email)), n.first_name, n.last_name)
  on conflict (referrer_id, referred_email) do nothing
  returning id into referral;
  return referral;
end;
$$;

create function public.referral_recorded()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.member_events (person_id, kind, at, referral_id)
  values (new.referrer_id, 'referred_someone', new.created_at, new.id);
  return new;
end;
$$;

create trigger referral_recorded after insert on public.referrals
for each row execute function public.referral_recorded();

-- ---------- joining ----------

-- A new membership links the earliest open referral for the person's address, then records the join.
-- A person links to one referral at most (referrals.referred_id is unique), so rejoining after being
-- removed counts as joining without a referral.
create function public.membership_started()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  referral public.referrals;
begin
  update public.referrals r
  set referred_id = new.person_id, joined_at = new.joined_at
  where r.id = (
    select r2.id from public.referrals r2
    join public.people p on p.email = r2.referred_email
    where p.id = new.person_id and r2.referred_id is null and r2.referrer_id <> new.person_id
      and not exists (select 1 from public.referrals r3 where r3.referred_id = new.person_id)
    order by r2.created_at
    limit 1
  )
  returning r.* into referral;

  if referral.id is not null then
    insert into public.member_events (person_id, kind, at, referral_id, join_emails)
    values (referral.referrer_id, 'referral_joined', new.joined_at, referral.id, new.join_emails);
  end if;

  insert into public.member_events (person_id, kind, at, referral_id, join_emails)
  values (new.person_id, 'joined', new.joined_at, referral.id, new.join_emails);
  return new;
end;
$$;

create trigger membership_started after insert on public.memberships
for each row execute function public.membership_started();

-- Adds many members at once, from a pasted list or a spreadsheet. Same rules as add_member for each
-- row; one bad row doesn't stop the others. p_members is [{ "email": ..., "full_name": ... }].
create function public.add_members(
  p_members jsonb,
  p_joined_at timestamptz default null,
  p_join_emails boolean default true
)
returns table (email text, result text)
language plpgsql security definer set search_path = ''
as $$
declare
  item jsonb;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add members' using errcode = '42501';
  end if;

  for item in select value from jsonb_array_elements(p_members) loop
    email := lower(btrim(coalesce(item ->> 'email', '')));
    if email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
      result := 'invalid_email';
    else
      result := public.add_member(email, coalesce(item ->> 'full_name', ''), p_joined_at, p_join_emails);
    end if;
    return next;
  end loop;
end;
$$;

-- ---------- tags ----------

create function public.tag_added()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.kind = 'added' then
    insert into public.member_events (person_id, kind, at, tag_id, tag_name)
    values (new.person_id, 'tag_added', new.at, new.tag_id, new.tag_name);
  end if;
  return new;
end;
$$;

create trigger tag_added after insert on public.tag_events
for each row execute function public.tag_added();

-- ---------- notes ----------

-- Free-text notes an admin keeps about a member ("daughter starts kindergarten in December"). Editing
-- keeps the earlier text in member_note_revisions, and deleting only hides the note, so nothing an
-- admin wrote is lost.
create table public.member_notes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  body text not null check (btrim(body) <> '' and length(body) <= 10000),
  created_by uuid references public.people (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_by uuid references public.people (id) on delete set null,
  updated_at timestamptz,
  deleted_by uuid references public.people (id) on delete set null,
  deleted_at timestamptz
);
create index member_notes_person_id on public.member_notes (person_id, created_at desc);

create table public.member_note_revisions (
  id bigint generated always as identity primary key,
  note_id uuid not null references public.member_notes (id) on delete cascade,
  -- The text as it was before this edit, and who had written it.
  body text not null,
  written_by uuid references public.people (id) on delete set null,
  written_at timestamptz not null
);
create index member_note_revisions_note_id on public.member_note_revisions (note_id, written_at desc);

create function public.add_note(p_person_id uuid, p_body text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  note uuid;
begin
  if not public.is_admin() then
    raise exception 'Only admins can add notes' using errcode = '42501';
  end if;
  insert into public.member_notes (person_id, body, created_by)
  values (p_person_id, btrim(p_body), public.current_person_id())
  returning id into note;
  return note;
end;
$$;

create function public.edit_note(p_note_id uuid, p_body text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  old public.member_notes;
begin
  if not public.is_admin() then
    raise exception 'Only admins can edit notes' using errcode = '42501';
  end if;
  select * into old from public.member_notes where id = p_note_id and deleted_at is null for update;
  if old.id is null then
    raise exception 'Note not found' using errcode = 'P0002';
  end if;
  if old.body = btrim(p_body) then
    return;
  end if;

  insert into public.member_note_revisions (note_id, body, written_by, written_at)
  values (old.id, old.body, coalesce(old.updated_by, old.created_by), coalesce(old.updated_at, old.created_at));
  update public.member_notes
  set body = btrim(p_body), updated_by = public.current_person_id(), updated_at = now()
  where id = p_note_id;
end;
$$;

create function public.delete_note(p_note_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can delete notes' using errcode = '42501';
  end if;
  update public.member_notes
  set deleted_by = public.current_person_id(), deleted_at = now()
  where id = p_note_id and deleted_at is null;
end;
$$;

-- ---------- subscription history ----------

-- people holds only the current state (unsubscribed_at, bounced_at). This keeps every change, so the
-- timeline still shows an unsubscribe after the member resubscribes.
create table public.subscription_events (
  id bigint generated always as identity primary key,
  person_id uuid not null references public.people (id) on delete cascade,
  kind text not null check (kind in ('unsubscribed', 'resubscribed', 'bounced', 'bounce_cleared')),
  -- unsubscribed: self, admin, complaint or imported. bounced: the provider's detail.
  detail text,
  at timestamptz not null default now()
);
create index subscription_events_person_id on public.subscription_events (person_id, at desc);

create function public.subscription_changed()
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

  -- Unsubscribe always wins: nothing waiting goes out. These stay Not sent if they resubscribe.
  if (old.unsubscribed_at is null and new.unsubscribed_at is not null)
    or (old.bounced_at is null and new.bounced_at is not null) then
    update public.email_sends
    set status = 'not_sent', not_sent_reason = case when new.unsubscribed_at is not null then 'unsubscribed' else 'bounced' end
    where person_id = new.id and status in ('scheduled', 'waiting_for_review');
  end if;
  return new;
end;
$$;

-- ---------- email sends ----------

-- One email going to one member: the unit behind the Outbox, each email's recipients, a member's email
-- history and Email Insights. Automatic and one-off emails both create sends. The worker that sends
-- them uses the service role; admins only read here.
--
-- Statuses (shared by every email): scheduled, waiting_for_review, sent, not_sent (always with a
-- reason). "Couldn't send" is not a status: it's a send still scheduled or waiting with failed_at set.
create table public.email_sends (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people (id) on delete cascade,
  -- Which email: exactly one. Automatic Emails and One-off Emails add the foreign keys when they add
  -- their tables.
  automatic_email_id uuid,
  one_off_email_id uuid,
  -- The email's name when the send was made, so history reads right after a rename or trash.
  email_name text not null,
  -- The occurrence an automatic send came from. Unique per automatic email: one send per occurrence.
  member_event_id bigint references public.member_events (id) on delete cascade,
  send_at timestamptz not null,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'waiting_for_review', 'sent', 'not_sent')),
  not_sent_reason text
    check (not_sent_reason in ('no_longer_matched', 'unpublished', 'unsubscribed', 'bounced', 'removed_by_admin')),
  -- The admin's own copy for this member, edited in the Outbox. Null means the email's own text.
  edited_subject text,
  edited_body text,
  edited_by uuid references public.people (id) on delete set null,
  edited_at timestamptz,
  -- Exactly what went out.
  sent_subject text,
  sent_body text,
  sent_at timestamptz,
  provider_message_id text,
  -- Provider failures: retried for 24 hours, then shown as Couldn't send.
  attempts integer not null default 0,
  last_error text,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint one_email check ((automatic_email_id is null) <> (one_off_email_id is null)),
  constraint automatic_has_occurrence check ((automatic_email_id is null) = (member_event_id is null)),
  constraint not_sent_has_reason check ((status = 'not_sent') = (not_sent_reason is not null)),
  constraint sent_keeps_copy check ((status = 'sent') = (sent_at is not null and sent_subject is not null and sent_body is not null))
);
create unique index email_sends_once_per_occurrence on public.email_sends (automatic_email_id, member_event_id);
create index email_sends_person_id on public.email_sends (person_id, send_at desc);
create index email_sends_due on public.email_sends (send_at) where status in ('scheduled', 'waiting_for_review');
create index email_sends_automatic_email_id on public.email_sends (automatic_email_id) where automatic_email_id is not null;
create index email_sends_one_off_email_id on public.email_sends (one_off_email_id) where one_off_email_id is not null;

-- Every status a send has been through, and who moved it: how the admin answers "why didn't Jane get
-- it?" after we've left.
create table public.email_send_changes (
  id bigint generated always as identity primary key,
  send_id uuid not null references public.email_sends (id) on delete cascade,
  status text not null,
  not_sent_reason text,
  by_person_id uuid references public.people (id) on delete set null,
  at timestamptz not null default now()
);
create index email_send_changes_send_id on public.email_send_changes (send_id, at);

-- The rules that never break, enforced here so no code path can get them wrong.
create function public.email_send_rules()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.member_event_id is not null
      and (select person_id from public.member_events where id = new.member_event_id) <> new.person_id then
      raise exception 'A send goes to the member its occurrence happened to' using errcode = '23514';
    end if;
    -- Unsubscribed or bounced: recorded, never sent.
    if new.status in ('scheduled', 'waiting_for_review') and not public.can_email(new.person_id) then
      new.status := 'not_sent';
      new.not_sent_reason := case
        when (select unsubscribed_at from public.people where id = new.person_id) is not null then 'unsubscribed'
        else 'bounced' end;
    end if;
    return new;
  end if;

  if old.status = 'sent' then
    -- Nothing about a sent email changes, except edited_by emptying when that admin's record is
    -- deleted (its foreign key), which must not block deleting a person.
    if (new.id, new.person_id, new.automatic_email_id, new.one_off_email_id, new.email_name, new.member_event_id,
        new.send_at, new.status, new.not_sent_reason, new.edited_subject, new.edited_body, new.edited_at,
        new.sent_subject, new.sent_body, new.sent_at, new.provider_message_id)
      is distinct from
       (old.id, old.person_id, old.automatic_email_id, old.one_off_email_id, old.email_name, old.member_event_id,
        old.send_at, old.status, old.not_sent_reason, old.edited_subject, old.edited_body, old.edited_at,
        old.sent_subject, old.sent_body, old.sent_at, old.provider_message_id) then
      raise exception 'A sent email can''t change' using errcode = '23514';
    end if;
    return new;
  end if;
  -- Not sent is final, except that republishing brings back sends removed by unpublishing.
  if old.status = 'not_sent' and new.status <> 'not_sent'
    and (old.not_sent_reason <> 'unpublished' or new.status = 'sent') then
    raise exception 'This send was not sent and can''t come back' using errcode = '23514';
  end if;
  if new.status = 'sent' and not public.can_email(new.person_id) then
    raise exception 'This member can''t be emailed' using errcode = '23514';
  end if;
  -- Unsubscribe always wins: a send coming back (republished) to someone who can't be emailed stays
  -- Not sent, with the reason.
  if new.status in ('scheduled', 'waiting_for_review') and not public.can_email(new.person_id) then
    new.status := 'not_sent';
    new.not_sent_reason := case
      when (select unsubscribed_at from public.people where id = new.person_id) is not null then 'unsubscribed'
      else 'bounced' end;
  end if;
  if new.status <> 'not_sent' then
    new.not_sent_reason := null;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger email_send_rules before insert or update on public.email_sends
for each row execute function public.email_send_rules();

create function public.email_send_changed()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.email_send_changes (send_id, status, not_sent_reason, by_person_id)
    values (new.id, new.status, new.not_sent_reason, public.current_person_id());
  end if;
  return new;
end;
$$;

create trigger email_send_changed after insert or update of status on public.email_sends
for each row execute function public.email_send_changed();

create trigger subscription_changed after update of unsubscribed_at, bounced_at on public.people
for each row execute function public.subscription_changed();

-- A member's email history: every send, upcoming ones included however far out, with what started it.
create view public.member_email_history with (security_invoker = true) as
  select s.id as send_id, s.person_id, s.email_name, s.automatic_email_id, s.one_off_email_id,
    e.kind as started_by, e.tag_name as started_by_tag, e.at as started_at,
    s.status, s.not_sent_reason, s.send_at, s.sent_at, s.failed_at is not null as could_not_send,
    coalesce(s.sent_subject, s.edited_subject) as subject, s.edited_at is not null as edited
  from public.email_sends s
  left join public.member_events e on e.id = s.member_event_id;

-- ---------- timeline ----------

-- Everything that happened to one member, for the member page: joins, referrals, tags added and
-- removed, notes, emails and subscription changes. An email shows once, at its send date, with its
-- current status. Runs with the caller's rights, so only admins see rows.
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
  select s.person_id, coalesce(s.sent_at, s.send_at), 'email', null, null, null, s.id, s.status,
    s.email_name, null, s.edited_at is not null
  from public.email_sends s
  union all
  select c.person_id, c.at, c.kind, null, null, null, null, null, c.detail, null, false
  from public.subscription_events c;

-- ---------- what already happened ----------

-- Events for members, referrals and tags added before this migration, so the timeline is complete.
-- Automatic Emails never sends for the past (no retroactive sends), so this can't email anyone.
insert into public.member_events (person_id, kind, at, referral_id, join_emails)
select m.person_id, 'joined', m.joined_at, r.id, m.join_emails
from public.memberships m left join public.referrals r on r.referred_id = m.person_id;

insert into public.member_events (person_id, kind, at, referral_id)
select referrer_id, 'referred_someone', created_at, id from public.referrals;

insert into public.member_events (person_id, kind, at, referral_id, join_emails)
select r.referrer_id, 'referral_joined', r.joined_at, r.id, m.join_emails
from public.referrals r join public.memberships m on m.person_id = r.referred_id
where r.joined_at is not null;

insert into public.member_events (person_id, kind, at, tag_id, tag_name)
select person_id, 'tag_added', at, tag_id, tag_name from public.tag_events where kind = 'added';

-- Who is unsubscribed or bounced today. Earlier changes weren't kept, so history starts here.
insert into public.subscription_events (person_id, kind, detail, at)
select id, 'unsubscribed', unsubscribe_reason, unsubscribed_at from public.people where unsubscribed_at is not null;
insert into public.subscription_events (person_id, kind, detail, at)
select id, 'bounced', bounce_detail, bounced_at from public.people where bounced_at is not null;

-- ---------- access ----------

revoke execute on function
  public.add_referral(uuid, text, text),
  public.add_members(jsonb, timestamptz, boolean),
  public.add_note(uuid, text),
  public.edit_note(uuid, text),
  public.delete_note(uuid)
from public, anon;

-- Triggers only.
revoke execute on function
  public.referral_recorded(), public.membership_started(), public.tag_added(),
  public.subscription_changed(), public.email_send_rules(), public.email_send_changed()
from public, anon, authenticated;

alter table public.member_events enable row level security;
alter table public.member_notes enable row level security;
alter table public.member_note_revisions enable row level security;
alter table public.subscription_events enable row level security;
alter table public.email_sends enable row level security;
alter table public.email_send_changes enable row level security;

-- Reads for admins; every write goes through the functions and triggers above.
create policy "Admins see member events" on public.member_events for select to authenticated using ((select public.is_admin()));
create policy "Admins see notes" on public.member_notes for select to authenticated using ((select public.is_admin()));
create policy "Admins see note history" on public.member_note_revisions for select to authenticated using ((select public.is_admin()));
create policy "Admins see subscription history" on public.subscription_events for select to authenticated using ((select public.is_admin()));
create policy "Admins see email sends" on public.email_sends for select to authenticated using ((select public.is_admin()));
create policy "Admins see email send history" on public.email_send_changes for select to authenticated using ((select public.is_admin()));
