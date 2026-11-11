-- can_sign_in answers "may this email use this sign-in page?", which tells anyone who the admins are.
-- Only the server asks it now, with the secret key, so the admin page's neutral answer ("If this email
-- has access, a sign-in link is on its way") can't be bypassed by asking the database directly.
--
-- Apply only after SUPABASE_SECRET_KEY is set in Vercel and deployed: without the key the sign-in
-- pages still ask with the public key, which this revokes.
revoke execute on function public.can_sign_in(text, text) from public, anon, authenticated;
grant execute on function public.can_sign_in(text, text) to service_role;
