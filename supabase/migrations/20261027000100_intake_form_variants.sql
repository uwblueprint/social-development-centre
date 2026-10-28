-- Keep the source link with completed submissions, and identify the source on every page visit.
alter table public.intake_submissions
  add column if not exists form_source text;

alter table public.intake_submissions
  drop constraint if exists intake_submissions_form_source_check;

alter table public.intake_submissions
  add constraint intake_submissions_form_source_check
    check (form_source in ('ride-for-refuage', 'sdc-members'));

alter table public.page_visits
  drop constraint if exists page_visits_from_check;

alter table public.page_visits
  add constraint page_visits_from_check
    check ("from" is null or "from" in ('ride-for-refuage', 'sdc-members'));

-- Replace the original public function so submissions cannot omit their source.
drop function if exists public.submit_intake(uuid, text, text, text, text, jsonb);
drop function if exists public.submit_intake(uuid, text, text, text, jsonb);

create function public.submit_intake(
  p_submission_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_form_source text,
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
  v_answers jsonb := coalesce(p_answers, '{}'::jsonb);
  v_topics jsonb;
  v_topic jsonb;
  v_rank numeric;
  v_ranks integer[] := array[]::integer[];
begin
  if p_submission_id is null then
    raise exception 'A submission id is required' using errcode = '22023';
  end if;
  if v_first_name is null or v_last_name is null then
    raise exception 'A first and last name are required' using errcode = '22023';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;
  if p_form_source is null or p_form_source not in ('ride-for-refuage', 'sdc-members') then
    raise exception 'A valid form source is required' using errcode = '22023';
  end if;

  if jsonb_typeof(v_answers) is distinct from 'object' then
    raise exception 'Invalid answers' using errcode = '22023';
  end if;
  v_topics := v_answers -> 'topics';
  if jsonb_typeof(v_topics) is distinct from 'array' then
    raise exception 'Rank all nine topics, or skip the question' using errcode = '22023';
  end if;
  if jsonb_array_length(v_topics) not in (0, 9) then
    raise exception 'Rank all nine topics, or skip the question' using errcode = '22023';
  end if;
  for v_topic in select value from jsonb_array_elements(v_topics) loop
    if jsonb_typeof(v_topic) is distinct from 'object' then
      raise exception 'Invalid topic ranking' using errcode = '22023';
    end if;
    if (select count(*) from jsonb_object_keys(v_topic)) <> 2
      or jsonb_typeof(v_topic -> 'rank') is distinct from 'number'
      or jsonb_typeof(v_topic -> 'topic') is distinct from 'string' then
      raise exception 'Invalid topic ranking' using errcode = '22023';
    end if;
    v_rank := (v_topic ->> 'rank')::numeric;
    if v_rank < 1 or v_rank > 9 or v_rank <> trunc(v_rank) or v_rank::integer = any(v_ranks) then
      raise exception 'Ranks must be unique values from 1 to 9' using errcode = '22023';
    end if;
    if length(v_topic ->> 'topic') > 120 then
      raise exception 'Invalid topic label' using errcode = '22023';
    end if;
    v_ranks := array_append(v_ranks, v_rank::integer);
  end loop;

  insert into public.intake_submissions (
    submission_id, first_name, last_name, email, answers, form_source
  ) values (
    p_submission_id, v_first_name, v_last_name, v_email, v_answers, p_form_source
  )
  on conflict (submission_id) do update
    set first_name = excluded.first_name,
        last_name = excluded.last_name,
        email = excluded.email,
        answers = excluded.answers,
        form_source = excluded.form_source,
        updated_at = now();
end;
$$;

revoke all on function public.submit_intake(uuid, text, text, text, text, jsonb) from public;
grant execute on function public.submit_intake(uuid, text, text, text, text, jsonb) to anon, authenticated;

-- Replace the previous analytics writer with one that records the route source and accepts
-- explicit rank/label objects for the topics question.
drop function if exists public.record_intake_page_visit(uuid, text, text, text, bigint, bigint, bigint, bigint, text, jsonb);
drop function if exists public.record_intake_page_visit(uuid, text, text, bigint, bigint, bigint, bigint, text, jsonb);

create function public.record_intake_page_visit(
  p_person_id uuid,
  p_key_id text,
  p_from text,
  p_page_key text,
  p_total_ms bigint,
  p_active_ms bigint,
  p_first_answer_ms bigint,
  p_last_answer_ms bigint,
  p_left_via text,
  p_answers jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key_id text := nullif(lower(btrim(p_key_id)), '');
  v_user_found boolean;
  v_answer jsonb;
  v_item jsonb;
  v_field text;
  v_value jsonb;
  v_topic jsonb;
  v_rank numeric;
  v_ranks integer[];
begin
  if p_person_id is null then
    raise exception 'A visit id is required' using errcode = '22023';
  end if;
  if p_from is null or p_from not in ('ride-for-refuage', 'sdc-members') then
    raise exception 'A valid form source is required' using errcode = '22023';
  end if;
  if p_key_id is not null and (v_key_id is null or length(v_key_id) > 254 or v_key_id !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$') then
    raise exception 'A valid email address is required' using errcode = '22023';
  end if;
  if p_total_ms is null or p_total_ms < 0 or p_total_ms > 2592000000
    or p_active_ms is null or p_active_ms < 0 or p_active_ms > p_total_ms then
    raise exception 'Invalid visit duration' using errcode = '22023';
  end if;
  if p_first_answer_ms is not null and (p_first_answer_ms < 0 or p_first_answer_ms > p_total_ms) then
    raise exception 'Invalid first answer time' using errcode = '22023';
  end if;
  if p_last_answer_ms is not null and (p_last_answer_ms < 0 or p_last_answer_ms > p_total_ms) then
    raise exception 'Invalid last answer time' using errcode = '22023';
  end if;
  if (p_first_answer_ms is null) <> (p_last_answer_ms is null)
    or (p_first_answer_ms is not null and p_first_answer_ms > p_last_answer_ms) then
    raise exception 'Invalid answer times' using errcode = '22023';
  end if;
  if p_page_key is null
    or p_left_via is null
    or p_page_key not in ('welcome', 'contact', 'topics', 'ways', 'location', 'time', 'hopes')
    or p_left_via not in ('next', 'skip', 'back', 'submit', 'not_interested', 'exit')
    or p_answers is null then
    raise exception 'Invalid page visit' using errcode = '22023';
  end if;
  if jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'Invalid page visit' using errcode = '22023';
  end if;
  if jsonb_array_length(p_answers) > 8 then
    raise exception 'Invalid page visit' using errcode = '22023';
  end if;

  for v_answer in select value from jsonb_array_elements(p_answers) loop
    if jsonb_typeof(v_answer) is distinct from 'object' then
      raise exception 'Invalid answer data' using errcode = '22023';
    end if;
    if (select count(*) from jsonb_object_keys(v_answer)) <> 2 then
      raise exception 'Invalid answer data' using errcode = '22023';
    end if;
    if jsonb_typeof(v_answer -> 'field') is distinct from 'string' or not (v_answer ? 'value') then
      raise exception 'Invalid answer data' using errcode = '22023';
    end if;

    v_field := v_answer ->> 'field';
    v_value := v_answer -> 'value';
    if not (
      (p_page_key = 'topics' and v_field in ('topics', 'topicsOther'))
      or (p_page_key = 'ways' and v_field in ('ways', 'waysOther'))
      or (p_page_key = 'location' and v_field = 'location')
      or (p_page_key = 'time' and v_field = 'timeAvailable')
      or (p_page_key = 'hopes' and v_field = 'hopes')
    ) then
      raise exception 'Answer field is not allowed for this page' using errcode = '22023';
    end if;

    if p_page_key = 'topics' and v_field = 'topics' then
      if jsonb_typeof(v_value) is distinct from 'array' then
        raise exception 'Invalid topic ranking' using errcode = '22023';
      end if;
      if jsonb_array_length(v_value) > 9 then
        raise exception 'Invalid topic ranking' using errcode = '22023';
      end if;
      v_ranks := array[]::integer[];
      for v_topic in select value from jsonb_array_elements(v_value) loop
        if jsonb_typeof(v_topic) is distinct from 'object' then
          raise exception 'Invalid topic ranking' using errcode = '22023';
        end if;
        if (select count(*) from jsonb_object_keys(v_topic)) <> 2
          or jsonb_typeof(v_topic -> 'rank') is distinct from 'number'
          or jsonb_typeof(v_topic -> 'topic') is distinct from 'string' then
          raise exception 'Invalid topic ranking' using errcode = '22023';
        end if;
        v_rank := (v_topic ->> 'rank')::numeric;
        if v_rank < 1 or v_rank > 9 or v_rank <> trunc(v_rank)
          or v_rank::integer = any(v_ranks) or length(v_topic ->> 'topic') > 120 then
          raise exception 'Invalid topic ranking' using errcode = '22023';
        end if;
        v_ranks := array_append(v_ranks, v_rank::integer);
      end loop;
    elsif v_field in ('ways') then
      if jsonb_typeof(v_value) is distinct from 'array' then
        raise exception 'Invalid choice answer' using errcode = '22023';
      end if;
      if jsonb_array_length(v_value) > 8 then
        raise exception 'Invalid choice answer' using errcode = '22023';
      end if;
      for v_item in select value from jsonb_array_elements(v_value) loop
        if jsonb_typeof(v_item) is distinct from 'string' or length(v_item #>> '{}') > 120 then
          raise exception 'Invalid choice answer' using errcode = '22023';
        end if;
      end loop;
    else
      if jsonb_typeof(v_value) is distinct from 'string' or length(v_value #>> '{}') > 600 then
        raise exception 'Invalid text answer' using errcode = '22023';
      end if;
    end if;
  end loop;

  if v_key_id is null then
    select key_id into v_key_id
    from public.page_visits
    where person_id = p_person_id and "from" = p_from and key_id is not null
    order by created_at desc, id desc
    limit 1;
  end if;

  if v_key_id is not null then
    select exists (select 1 from public.people where email = v_key_id) into v_user_found;
    update public.page_visits
    set key_id = v_key_id, user_found = v_user_found
    where person_id = p_person_id and "from" = p_from;
  end if;

  insert into public.page_visits (
    person_id, key_id, page_key, total_ms, active_ms, first_answer_ms, last_answer_ms,
    left_via, answers, "from", user_found
  ) values (
    p_person_id, v_key_id, p_page_key, p_total_ms, p_active_ms, p_first_answer_ms, p_last_answer_ms,
    p_left_via, p_answers, p_from, v_user_found
  );
end;
$$;

revoke all on function public.record_intake_page_visit(uuid, text, text, text, bigint, bigint, bigint, bigint, text, jsonb) from public;
grant execute on function public.record_intake_page_visit(uuid, text, text, text, bigint, bigint, bigint, bigint, text, jsonb) to anon, authenticated;
