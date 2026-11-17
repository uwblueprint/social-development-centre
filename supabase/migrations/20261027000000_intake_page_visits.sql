-- Anonymous, per-step analytics for the public intake form. person_id is a random form-attempt id,
-- not a foreign key to people; key_id becomes the normalized email after the contact step.
create table public.page_visits (
  id bigint generated always as identity primary key,
  person_id uuid not null,
  key_id text,
  page_key text not null check (page_key in ('welcome', 'contact', 'topics', 'ways', 'location', 'time', 'hopes')),
  total_ms bigint not null check (total_ms >= 0),
  active_ms bigint not null check (active_ms >= 0 and active_ms <= total_ms),
  first_answer_ms bigint check (first_answer_ms is null or (first_answer_ms >= 0 and first_answer_ms <= total_ms)),
  last_answer_ms bigint check (last_answer_ms is null or (last_answer_ms >= 0 and last_answer_ms <= total_ms)),
  left_via text not null check (left_via in ('next', 'skip', 'back', 'submit', 'not_interested', 'exit')),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array'),
  created_at timestamptz not null default now(),
  "from" text default null check ("from" is null),
  user_found boolean,
  check ((first_answer_ms is null) = (last_answer_ms is null)),
  check (first_answer_ms is null or first_answer_ms <= last_answer_ms)
);

alter table public.page_visits enable row level security;
revoke all on table public.page_visits from public, anon, authenticated;

create index page_visits_person_id_created_at_idx on public.page_visits (person_id, created_at);
create index page_visits_key_id_created_at_idx on public.page_visits (key_id, created_at desc);

create function public.record_intake_page_visit(
  p_person_id uuid,
  p_key_id text,
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
begin
  if p_person_id is null then
    raise exception 'A visit id is required' using errcode = '22023';
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
    if jsonb_typeof(v_answer) <> 'object' then
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
      or (p_page_key = 'location' and v_field in ('location', 'locationOther'))
      or (p_page_key = 'time' and v_field = 'timeAvailable')
      or (p_page_key = 'hopes' and v_field = 'hopes')
    ) then
      raise exception 'Answer field is not allowed for this page' using errcode = '22023';
    end if;

    if v_field in ('topics', 'ways') then
      if jsonb_typeof(v_value) <> 'array' then
        raise exception 'Invalid choice answer' using errcode = '22023';
      end if;
      if jsonb_array_length(v_value) > 8 then
        raise exception 'Invalid choice answer' using errcode = '22023';
      end if;
      for v_item in select value from jsonb_array_elements(v_value) loop
        if jsonb_typeof(v_item) is distinct from 'string' then
          raise exception 'Invalid choice answer' using errcode = '22023';
        end if;
        if length(v_item #>> '{}') > 120 then
          raise exception 'Invalid choice answer' using errcode = '22023';
        end if;
      end loop;
    else
      if jsonb_typeof(v_value) is distinct from 'string' then
        raise exception 'Invalid text answer' using errcode = '22023';
      end if;
      if length(v_value #>> '{}') > 600 then
        raise exception 'Invalid text answer' using errcode = '22023';
      end if;
    end if;
  end loop;

  if v_key_id is null then
    select key_id into v_key_id
    from public.page_visits
    where person_id = p_person_id and key_id is not null
    order by created_at desc, id desc
    limit 1;
  end if;

  if v_key_id is not null then
    select exists (select 1 from public.people where email = v_key_id) into v_user_found;
    update public.page_visits
    set key_id = v_key_id, user_found = v_user_found
    where person_id = p_person_id;
  end if;

  insert into public.page_visits (
    person_id, key_id, page_key, total_ms, active_ms, first_answer_ms, last_answer_ms,
    left_via, answers, "from", user_found
  ) values (
    p_person_id, v_key_id, p_page_key, p_total_ms, p_active_ms, p_first_answer_ms, p_last_answer_ms,
    p_left_via, p_answers, null, v_user_found
  );
end;
$$;

revoke all on function public.record_intake_page_visit(uuid, text, text, bigint, bigint, bigint, bigint, text, jsonb) from public;
grant execute on function public.record_intake_page_visit(uuid, text, text, bigint, bigint, bigint, bigint, text, jsonb) to anon, authenticated;
