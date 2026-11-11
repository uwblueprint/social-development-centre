-- Lets someone change their own first and last name (the Settings page). Writes go through functions;
-- the browser only reads. full_name is generated from these two columns, so every reader keeps working.
--
-- Raises if they aren't signed in as a person, if the first name is empty, or if either name is longer
-- than 100 characters, so a bad call can never blank a name. The last name is optional (one-word names
-- are stored with last_name null, see split_name); an empty one is stored as null.
-- Members can call this too, on purpose: submit_welcome already lets them set their own name. The app checks the same limits first and shows
-- the message next to the field; this is the backstop.
create function public.update_own_name(p_first_name text, p_last_name text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := public.current_person_id();
  new_first text := btrim(p_first_name);
  new_last text := nullif(btrim(p_last_name), '');
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if coalesce(new_first, '') = '' then
    raise exception 'First name is required' using errcode = '22023';
  end if;
  if char_length(new_first) > 100 or coalesce(char_length(new_last), 0) > 100 then
    raise exception 'Names can''t be longer than 100 characters' using errcode = '22023';
  end if;

  update public.people set first_name = new_first, last_name = new_last where id = me;
end;
$$;

revoke execute on function public.update_own_name(text, text) from public, anon;
