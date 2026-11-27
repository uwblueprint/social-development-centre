-- Cancelling stops payment, not membership (decision, 27 Nov 2026). Replaces "Cancelling ends the
-- membership" from 19 Nov.
--
-- When a paying member cancels, we pause (suspend) their subscription in PayPal, so nothing more is
-- charged, and remember their next billing date as cancel_at. They're a member who isn't paying.
--   - Resubscribe before cancel_at: we reactivate the same PayPal subscription. No PayPal page, no
--     new charge; billing carries on from the date they already had.
--   - Resubscribe after cancel_at: a new subscription through PayPal, as for anyone who never paid.
-- After cancel_at the app treats it as not paying. The paused subscription is only cancelled for good
-- in PayPal when they pay again (no daily job yet: docs/backend/payments.md).

alter table public.subscriptions add column cancel_at timestamptz;

alter table public.subscriptions drop constraint subscriptions_status_check;
alter table public.subscriptions add constraint subscriptions_status_check
  check (status in ('pending', 'active', 'payment_problem', 'suspended', 'cancelling', 'cancelled'));

-- A cancelling subscription still exists in PayPal and can come back, so it counts as live: one per member.
drop index public.subscriptions_one_live_per_person;
create unique index subscriptions_one_live_per_person on public.subscriptions (person_id)
  where status in ('pending', 'active', 'payment_problem', 'suspended', 'cancelling');

create index subscriptions_cancel_due on public.subscriptions (cancel_at) where status = 'cancelling';

-- Ends the subscription for good. The membership stays: they're a member who isn't paying. Safe to
-- call twice (our cancel and PayPal's webhook can both call it). Server only.
create or replace function public.end_paid_membership(p_subscription_id uuid, p_cancelled_by uuid default null)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.subscriptions
  set status = 'cancelled',
      cancelled_at = coalesce(cancelled_at, now()),
      cancelled_by = coalesce(cancelled_by, p_cancelled_by),
      updated_at = now()
  where id = p_subscription_id;
end;
$$;

revoke execute on function public.end_paid_membership(uuid, uuid) from public, anon, authenticated;
