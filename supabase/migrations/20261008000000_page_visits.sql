create table public.page_visits (
  id bigint generated always as identity primary key,
  person_id uuid not null references public.people (id) on delete cascade,
  link_token text not null,
  page_key text not null,
  total_ms int,
  active_ms int,
  first_answer_ms int,
  last_answer_ms int,
  left_via text,
  answers jsonb,
  created_at timestamptz default now()
);

alter table public.page_visits enable row level security;

create policy "Users can record their own page visits"
  on public.page_visits for insert to authenticated
  with check (
    person_id in (
      select id
      from public.people
      where user_id = (select auth.uid())
    )
  );

grant insert on public.page_visits to authenticated;
grant usage on sequence public.page_visits_id_seq to authenticated;