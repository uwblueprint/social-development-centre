-- The Ride for Refuge intake form (/intake-form) is open to anyone: there is no sign-in, so the
-- person's name and email arrive from the browser with their answers.
--
-- Nothing reaches this table through the API directly. RLS is on with no policies, so anon and
-- authenticated callers can neither read nor write it; the only way in is submit_intake() below,
-- which is security definer. SDC reads the rows in the Supabase dashboard (service role bypasses
-- RLS) until an admin screen exists.

create table public.intake_submissions (
  -- Made once per page load by the browser and sent again on every retry, so a repeated save
  -- updates the same row instead of adding another.
  submission_id uuid primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  -- Labels, not ids, so a stored row reads as it was answered. Also holds the browser's submittedAt.
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.intake_submissions enable row level security;

create index intake_submissions_created_at_idx on public.intake_submissions (created_at desc);
create index intake_submissions_email_idx on public.intake_submissions (email);

create function public.submit_intake(
  p_submission_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_answers jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first_name text := nullif(btrim(p_first_name), '');
  v_last_name text := nullif(btrim(p_last_name), '');
  v_email text := lower(btrim(coalesce(p_email, '')));
begin
  -- Checked here as well as in the form: this function is reachable by anyone.
  if v_first_name is null or v_last_name is null then
    raise exception 'A first and last name are required' using errcode = '22023';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;

  insert into public.intake_submissions (submission_id, first_name, last_name, email, answers)
  values (p_submission_id, v_first_name, v_last_name, v_email, coalesce(p_answers, '{}'::jsonb))
  on conflict (submission_id) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = excluded.email,
        answers = excluded.answers,
        updated_at = now();
end;
$$;

revoke all on function public.submit_intake(uuid, text, text, text, jsonb) from public;
grant execute on function public.submit_intake(uuid, text, text, text, jsonb) to anon, authenticated;
