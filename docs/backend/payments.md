# Membership payments (PayPal)

Members pay for their membership with a PayPal subscription from the members' area. PayPal charges them
automatically each period and tells our server about every payment, failure and cancellation through
webhooks. Admins see it all on **Payments** (`/admin/payments`).

Decisions (19 Nov 2026): subscriptions only, no one-time payments. Two failed payment attempts suspend
the subscription. Cancelling ends the membership: the member loses the members' area. See also
[../decisions/members.md](../decisions/members.md) (decision 1, update).

## How it works

1. A signed-in member clicks **Pay membership** (`startSubscription` in `src/features/payments/actions.ts`).
2. Our server creates the subscription in PayPal with `custom_id` = the member's person id, saves it as
   `pending`, and redirects the member to PayPal's approval page. No PayPal script runs in the browser.
3. The member approves on paypal.com. PayPal sends them back to `/membership/thanks`, which asks PayPal
   for the subscription's status and shows "active" as soon as PayPal says so.
4. PayPal's webhooks (`/api/webhooks/paypal`) record every payment and status change. The thanks page is
   never proof of payment; only a verified webhook writes a payment.

| Status | Set by | Member sees |
| --- | --- | --- |
| `none` (no row) | default | **Pay membership** |
| `pending` | `startSubscription` | "Confirming…", **Start again** |
| `active` | `BILLING.SUBSCRIPTION.ACTIVATED`, a completed payment, or the thanks page | next payment date, **Cancel membership** |
| `payment_problem` | first `BILLING.SUBSCRIPTION.PAYMENT.FAILED` | warning, link to update payment in PayPal, **Cancel** |
| `suspended` | second failed attempt (we suspend it in PayPal), or `BILLING.SUBSCRIPTION.SUSPENDED` | link to PayPal, **Resume membership**, **Cancel** |
| `cancelled` | the member, an admin, or `BILLING.SUBSCRIPTION.CANCELLED` / `EXPIRED` | membership ended: no members' area |

PayPal retries a failed charge every 5 days, twice. We count each failed attempt ourselves
(`FAILED_ATTEMPTS_BEFORE_SUSPEND` in `config.ts`) because PayPal's own threshold counts whole billing
cycles. **Verify in the sandbox that PayPal sends `PAYMENT.FAILED` for each retry**, not only the first;
if it doesn't, suspension happens at PayPal's own threshold instead.

## Code

| Where | What |
| --- | --- |
| `supabase/migrations/20261119000000_payments.sql` | `subscriptions`, `payments`, `paypal_events`; `end_paid_membership()`, `assign_payment()`; row-level security |
| `src/features/payments/config.ts` | Plans (by PayPal Plan id), the failure limit, PayPal URLs |
| `src/features/payments/copy.ts` | Every string members and admins see |
| `src/features/payments/paypal.ts` | PayPal REST calls (server only) |
| `src/features/payments/webhook.ts` | What each webhook event does |
| `src/app/api/webhooks/paypal/route.ts` | Verifies, de-duplicates and dispatches webhooks; exempt from sign-in in `portals.ts` |
| `src/features/payments/actions.ts` | Start, cancel and resume (member); cancel and assign (admin) |
| `src/features/payments/MembershipCard.tsx` | The card in the members' area (`src/app/page.tsx`) |
| `src/app/membership/thanks`, `src/app/membership/cancelled` | Return page from PayPal; confirmation after cancelling |
| `src/features/payments/PaymentsPage.tsx`, `src/app/admin/payments` | Admin → Payments |

Writes to the payment tables only happen on the server with the secret key, after checking who is
signed in. Admins read everything; a member reads only their own subscription. `paypal_events` keeps
every webhook (de-duplicated by PayPal's event id) with its error, if processing failed.

Not included yet: a nightly sync from PayPal's Transaction Search API (catches payments made outside
our button), member reminder emails on a failed payment, and showing payments on a member's timeline.

## Before launch

- [ ] Set the env vars below: sandbox in `.env.local` (and Vercel Preview), live in Vercel Production.
- [ ] One entry in `PLANS` (`config.ts`) per membership price. The name and price members see come from
      the Plan in PayPal, so set them there.
- [ ] Review the wording in `copy.ts` with SDC (AGENTS.md: user-facing copy comes from the product owner).
- [ ] Regenerate `src/lib/supabase/database.types.ts` after running the migration (the new tables were
      added by hand).
- [ ] Check webhook payloads against real sandbox events, especially that PayPal sends
      `BILLING.SUBSCRIPTION.PAYMENT.FAILED` for each retry, and that the "update payment method" link
      (`paypalManagePaymentsUrl()` in `config.ts`) opens the right PayPal page.

## Environment variables

| Name | Value |
| --- | --- |
| `PAYPAL_ENV` | `sandbox` (default) or `live` |
| `PAYPAL_CLIENT_ID` | developer.paypal.com → Apps & Credentials → your app |
| `PAYPAL_CLIENT_SECRET` | Same place. Sensitive: server only, never in the repo |
| `PAYPAL_WEBHOOK_ID` | The app's webhook → Webhook ID |
| `PAYPAL_PLAN_ID_INDIVIDUAL` | The Plan id (`P-…`); one variable per plan in `config.ts` |

`SUPABASE_SECRET_KEY` must also be set: the webhook and actions write with it.

## Sandbox setup

1. Sign in at developer.paypal.com with a personal PayPal account. *Sandbox → Accounts* has a sandbox
   Business account (plays SDC) and a sandbox Personal account (plays a member).
2. *Apps & Credentials* (Sandbox on) → **Create App**. Copy the Client ID and Secret into `.env.local`.
3. Sign in to www.sandbox.paypal.com as the sandbox Business account and create a Product and a Plan
   (Subscriptions). Set the Plan's **payment failure threshold** to 1 as a backstop and keep
   **auto bill outstanding** on. Copy the Plan id into `PAYPAL_PLAN_ID_INDIVIDUAL`.
4. Expose your dev server (e.g. `ngrok http 3000`). In the app, **Add Webhook** with
   `https://<your-tunnel>/api/webhooks/paypal` and tick the events in `HANDLED_EVENTS`
   (`src/features/payments/webhook.ts`). Copy the Webhook ID into `PAYPAL_WEBHOOK_ID`.
5. Run the migration on your Supabase project and restart `pnpm dev`.

## Testing

1. Sign in as a member, click **Pay membership**, approve with the sandbox Personal account. You should
   land on the thanks page, then see "active" in the members' area and a row on Admin → Payments.
2. PayPal's dashboard → *Webhooks events* shows each event PayPal sent and what our route answered.
   `paypal_events` has the same events with any processing error.
3. Cancel from the members' area: you should land on "Your membership is cancelled", disappear from
   Admin → Members, and the subscription should show as cancelled in PayPal.
4. Failed payments: in the sandbox, make the buyer's funding fail (e.g. a sandbox card set to decline)
   and wait for the next billing date, or use PayPal's webhook simulator to send
   `BILLING.SUBSCRIPTION.PAYMENT.FAILED`. Simulator events may fail signature verification; a real
   sandbox subscription is the true end-to-end test.
5. Refunds: refund a sandbox payment from the Business account; a negative row should appear.

Without a tunnel, steps 1 and 3 still work locally (the thanks page asks PayPal directly), but no
payments are recorded.

## Going live

1. SDC's PayPal Business account must be verified. Someone from SDC signs in to developer.paypal.com
   with it, switches to **Live**, and creates an app (no application or review).
2. In that Live app, add the webhook pointing at the production URL with the same events.
3. Recreate the Product and Plans in SDC's live account; plan ids differ from sandbox.
4. In Vercel production, set `PAYPAL_ENV=live` and the live Client ID, Secret, Webhook ID and plan ids.
5. Make one small real payment, check it on Admin → Payments, then refund it.
