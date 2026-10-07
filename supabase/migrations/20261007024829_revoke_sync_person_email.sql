-- Trigger functions can't run outside their trigger, but revoking keeps Supabase's security checks clean.
revoke execute on function public.sync_person_email() from public, anon, authenticated;
