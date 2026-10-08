alter table public.page_visits
  add column person_id uuid references public.people (id) on delete cascade;

drop policy "Signed-in users can record page visits" on public.page_visits;

create policy "Users can record their own page visits"
  on public.page_visits for insert to authenticated
  with check (
    person_id in (
      select id
      from public.people
      where user_id = (select auth.uid())
    )
  );