-- Tag colours. Each tag gets one of the kit's ten tag colours (src/components/ui/Tag.tsx, TAG_COLORS),
-- so a tag looks the same everywhere it appears: People, the Automatic emails editor and list.
--
-- Every existing and new tag starts as 'stone' (the kit's grey). No colours are assigned here, so this
-- is safe to run as is on sdc-dev and on production: it adds no sample data.

alter table public.tags
  add column color text not null default 'stone'
  check (color in ('stone', 'rose', 'pink', 'orange', 'amber', 'emerald', 'teal', 'sky', 'indigo', 'violet'));

-- Admins set a tag's colour; like the other tag writes, it goes through a function.
create function public.set_tag_color(p_tag_id uuid, p_color text)
returns text
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change tag colours' using errcode = '42501';
  end if;
  update public.tags set color = p_color where id = p_tag_id;
  if not found then
    return 'not_found';
  end if;
  return 'updated';
exception when check_violation then
  return 'invalid_color';
end;
$$;

-- Same access as the other tag functions (create_tag, rename_tag, …): signed-in admins only.
revoke execute on function public.set_tag_color(uuid, text) from public, anon;
