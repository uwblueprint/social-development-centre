create table public.page_visits (
  id bigint generated always as identity primary key,
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

create policy "Signed-in users can record page visits"
  on public.page_visits for insert to authenticated
  with check (true);

grant insert on public.page_visits to authenticated;
grant usage on sequence public.page_visits_id_seq to authenticated;