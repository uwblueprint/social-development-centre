-- The footer under every email SDC sends, edited in Settings (src/features/email-footer). One row.
-- `doc` is TipTap JSON with exactly one unsubscribe and one cancel link (footerLink nodes). The sender reads
-- it when each email goes out, so emails waiting to send get the latest footer. No history is kept.
-- No row yet means the default footer (defaultFooterDoc in src/features/email-footer/doc.ts).

create table public.email_footer (
  id boolean primary key default true check (id),
  doc jsonb not null,
  updated_by uuid references public.people (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.email_footer enable row level security;
create policy "Admins see the email footer" on public.email_footer for select to authenticated using ((select public.is_admin()));

-- Saving checks the same things the editor does (footerProblem in doc.ts), so a bad call can't drop the
-- unsubscribe link that every email needs.
create function public.set_email_footer(p_doc jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_unsubscribe int;
  v_cancel int;
begin
  if not public.is_admin() then
    raise exception 'Only admins can change the email footer' using errcode = '42501';
  end if;
  if p_doc is null or p_doc->>'type' is distinct from 'doc' or jsonb_typeof(p_doc->'content') is distinct from 'array'
     or pg_column_size(p_doc) > 20000 then
    raise exception 'The footer isn''t a footer document' using errcode = '22023';
  end if;
  select count(*) into v_unsubscribe
    from jsonb_path_query(p_doc, 'strict $.** ? (@.type == "footerLink" && @.attrs.kind == "unsubscribe")');
  select count(*) into v_cancel
    from jsonb_path_query(p_doc, 'strict $.** ? (@.type == "footerLink" && @.attrs.kind == "cancel")');
  if v_unsubscribe <> 1 or v_cancel <> 1 then
    raise exception 'The footer needs exactly one unsubscribe and one cancel link' using errcode = '22023';
  end if;

  insert into public.email_footer (id, doc, updated_by)
  values (true, p_doc, public.current_person_id())
  on conflict (id) do update
    set doc = excluded.doc, updated_by = excluded.updated_by, updated_at = now();
end;
$$;

revoke all on function public.set_email_footer(jsonb) from public, anon;
grant execute on function public.set_email_footer(jsonb) to authenticated;
