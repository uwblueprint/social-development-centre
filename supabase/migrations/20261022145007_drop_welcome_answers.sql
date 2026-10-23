-- The intake form moved to /intake-form, is open to anyone with the link, and keeps its own rows
-- in intake_submissions. Nothing gates on whether someone has filled it in, so neither the table
-- nor its write function has a caller any more.
drop function if exists public.submit_welcome(text, jsonb);
drop table if exists public.welcome_answers;
