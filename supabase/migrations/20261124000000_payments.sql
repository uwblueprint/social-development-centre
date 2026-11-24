-- Membership payments through PayPal Subscriptions. docs/backend/payments.md explains the flow:
-- a member starts a subscription from the members' area, approves it on paypal.com, and PayPal's
-- webhooks (src/app/api/webhooks/paypal) record every payment and status change here.
--
-- Decisions (19 Nov 2026): subscriptions only, no one-time payments. Two failed payment attempts
-- suspend the subscription. Cancelling ends the membership: they lose the members' area.
--
-- Writes come from the server only (the webhook and server actions, with the secret key), after they
-- have checked who is signed in. Admins read everything; a member reads their own subscription.

-- ---------- subscriptions ----------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  -- Null once the person is deleted; the payments stay for SDC's records.
  person_id uuid references public.people (id) on delete set null,
  paypal_subscription_id text not null unique,
  paypal_plan_id text not null,
  -- pending: created, waiting for the member to approve on PayPal (or for PayPal to confirm).
  -- active: paying. payment_problem: the last payment failed and PayPal is retrying.
  -- suspended: too many failed attempts; no charges until resumed. cancelled: ended for good.
  status text not null default 'pending'
    check (status in ('pending', 'active', 'payment_problem', 'suspended', 'cancelled')),
  -- Failed attempts since the last successful payment. Reaching the limit in
  -- src/features/payments/config.ts suspends the subscription.
  failed_attempts integer not null default 0 check (failed_attempts >= 0),
  last_failed_at timestamptz,
  next_billing_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  -- The admin who cancelled it; null when the member or PayPal did.
  cancelled_by uuid references public.people (id) on delete set null
);
create index subscriptions_person_id on public.subscriptions (person_id);

-- One live subscription per member, so nobody is charged twice.
create unique index subscriptions_one_live_per_person on public.subscriptions (person_id)
  where status in ('pending', 'active', 'payment_problem', 'suspended');

-- ---------- payments ----------

-- Money in (payment) and money back (refund, reversal = a chargeback). Refunds and reversals are
-- negative, so a sum is what SDC kept before PayPal's fees.
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  -- Null = unmatched: an admin assigns it to a member with assign_payment().
  person_id uuid references public.people (id) on delete set null,
  subscription_id uuid references public.subscriptions (id) on delete set null,
  kind text not null default 'payment' check (kind in ('payment', 'refund', 'reversal')),
  amount_cents integer not null,
  -- PayPal's fee on this payment, when PayPal reports it.
  fee_cents integer,
  currency text not null,
  paid_at timestamptz not null,
  -- PayPal's id for the sale, refund or reversal. Unique, so a repeated webhook adds nothing.
  paypal_transaction_id text not null unique,
  payer_email text,
  created_at timestamptz not null default now(),
  constraint payment_sign check ((kind = 'payment') = (amount_cents >= 0))
);
create index payments_person_id on public.payments (person_id, paid_at desc);
create index payments_unmatched on public.payments (paid_at desc) where person_id is null;

-- ---------- webhook log ----------

-- Every webhook PayPal sends, by its event id: a repeat delivery is skipped once processed_at is set,
-- and a failed one keeps its error until PayPal retries it. Server only.
create table public.paypal_events (
  id text primary key,
  event_type text not null,
  resource_id text,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);
create index paypal_events_received_at on public.paypal_events (received_at desc);

-- ---------- functions ----------

-- Cancelling ends the membership (decision, 19 Nov 2026): the subscription is cancelled and they lose
-- the members' area, like remove_member(). They stay on SDC's list with their payments. Safe to call
-- twice (the member's own cancel and PayPal's webhook both call it). Server only.
create function public.end_paid_membership(p_subscription_id uuid, p_cancelled_by uuid default null)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  member uuid;
begin
  update public.subscriptions
  set status = 'cancelled',
      cancelled_at = coalesce(cancelled_at, now()),
      cancelled_by = coalesce(cancelled_by, p_cancelled_by),
      updated_at = now()
  where id = p_subscription_id
  returning person_id into member;

  if member is not null then
    delete from public.memberships where person_id = member;
  end if;
end;
$$;

-- An admin links an unmatched payment (someone who paid SDC's PayPal directly) to a member.
create function public.assign_payment(p_payment_id uuid, p_person_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can assign payments' using errcode = '42501';
  end if;
  if not exists (select 1 from public.memberships where person_id = p_person_id) then
    raise exception 'That person is not a member' using errcode = '22023';
  end if;

  update public.payments set person_id = p_person_id where id = p_payment_id and person_id is null;
  if not found then
    raise exception 'That payment is already assigned' using errcode = '22023';
  end if;
end;
$$;

-- ---------- access ----------

revoke execute on function public.assign_payment(uuid, uuid) from public, anon;
revoke execute on function public.end_paid_membership(uuid, uuid) from public, anon, authenticated;

alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.paypal_events enable row level security;

create policy "Admins and the member see subscriptions" on public.subscriptions for select to authenticated
  using (person_id = (select public.current_person_id()) or (select public.is_admin()));
create policy "Admins see payments" on public.payments for select to authenticated
  using ((select public.is_admin()));
-- paypal_events has no policies: only the secret key reads or writes it.
