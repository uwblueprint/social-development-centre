# Membership join page: backend

Design only: `src/app/design/membership/` (open `/design/membership` in `pnpm dev`). It's a public,
signed-out page where anyone can become an SDC member and pay. Nothing on it is connected yet. This is
what it needs. Prices, tiers and copy are placeholders until SDC confirms them (see [Open questions](#open-questions)).

## Design change: one form, then PayPal (Justin, Nov 25)
The tier comparison and the on-page payment step are gone. The flow is now:

1. **Why join** (unchanged), then **one form**: first name, last name, email, and a **Membership tier**
   dropdown (`Supporter: $5 a year`, …).
2. **Pay $X with PayPal** hands over to **PayPal's hosted checkout** (external page). This replaces Stripe
   Checkout in the sections below; the same rules apply (hosted page, SDC never sees payment details,
   idempotent order per page load).
3. PayPal sends them back to SDC:
   - **Paid** → return URL `/join/welcome` (design: `/design/membership/welcome`), the thank-you page.
     The server captures the PayPal order and adds the member there (or from PayPal's webhook, whichever
     comes first, once only).
   - **Cancelled** → `/join?paypal=cancelled`: the form again, with what they typed kept and "Payment
     cancelled, so you haven't been charged."
4. `via` and `ref` ride along on both return URLs, so a referral is still credited after the round trip.
   Nothing personal goes in a URL: the server keeps the details against the PayPal order id.

5. **The form always starts empty**, referral links included (Justin, Nov 25: no pre-filling from the
   referral). The join page still looks up the referrer's first name from `ref`, for the heading.
   Browsers' autofill (`given-name`, `family-name`, `email`) still offers saved details.

The design stands in for PayPal with an unbranded page at `/design/membership/paypal`.

## What the page collects

| Field | Required | Notes |
|---|---|---|
| `firstName`, `lastName` | yes | Same as the intake form and `people.first_name` / `last_name`. |
| `email` | yes | Trimmed and lowercased; validated with `EMAIL_PATTERN` (`src/features/intake/submit.ts`). |
| `municipality` | no | One of the intake form's locations, so both can be compared. |
| `newsletter` | no | Unchecked by default. Express consent under CASL, so it needs its own timestamp. Membership emails (receipt, sign-in link, join emails) don't need it. |
| `membership` | yes | `member`, `reduced` or `complimentary`. |
| `donation` | no | `0`, `10`, `25`, `50` (dollars). Kept separate from the fee, because only donations can be receipted. |
| `method` | event links only | `card` or `in-person` (pay at the table). |

Address, phone and date of birth are left out on purpose: every extra field lowers sign-ups, and SDC
doesn't use them today. A donation of $20 or more needs a mailing address for a CRA tax receipt; collect it
on Stripe's page only when there is one (see open questions).

## Where people arrive from

The page reads the channel from its link. Each one changes the page:

| Channel | Link | Changes |
|---|---|---|
| Website | `/join` | Default headline; "Why join" beside the form. |
| Referral | `/join?ref=<code>` | "Join {referrer} at SDC", a banner naming the referrer, and the invitee's name and email prefilled when the referrer typed them. "Not {name}? Clear these details." |
| In person | `/join?via=event&event=<id>` (the QR code at the table) | Event name in the banner, larger buttons, a "Pay at the SDC table" option, and "Start the next sign-up" after joining for a shared tablet. The referral link isn't shown on screen (it would belong to the last person); it goes by email. |
| Social media | `/join?utm_source=<site>` | A shorter, warmer headline with the price up front, and "Why join" beside the form: these visitors know SDC least. |

### Needs
1. **Referral codes.** One per member, e.g. `sam-k4p`, stable and safe to show (not the person id).
   `referral_landing(code)` (public, security definer) returns only the referrer's first name, plus the
   invitee's first name, last name and email when the link came from a specific invitation in `referrals`.
   Unknown code: the page falls back to Website, with no error.
2. **Event links.** Something that names the event for the banner. A `join_links` table (`slug`, `label`,
   `kind`, `active`) would also let SDC print a QR per event or poster. An inactive link falls back to
   Website.
3. **Source on the join.** Store `channel`, `referral_code`, `event` and `utm_source` / `utm_campaign` with the
   join, so SDC can see which channel brings paying members. Referrals also set `referrals.referred_id` and
   `joined_at`, which already fires the `referral_joins` automatic email.

## Joining and paying

```
submit details ──► membership_applications row (status: started)
       │
       ├─ total = 0 ──────────────► add the member now (status: joined)
       ├─ pay at the table ───────► status: awaiting_payment; staff mark it paid in the admin portal
       └─ card ──► Stripe Checkout ──► webhook checkout.session.completed ──► add the member (status: joined)
```

- **Stripe Checkout (hosted), not card fields on our page.** SDC never handles card numbers (PCI scope stays
  minimal), and Apple Pay / Google Pay come free. Return to `/join/welcome?session=<id>`.
- **The webhook is the only thing that makes a paid member**, never the redirect back, which can be lost or faked.
- **Idempotent:** one application id per page load, like the intake form's `submission_id`; the Stripe session
  carries it as `client_reference_id`, so a repeated webhook or retry adds the member once.
- **Existing members:** if the email is already a member, don't charge again. Show "You're already a member"
  with a link to sign in (or renew, once renewals exist).
- **Joining creates the membership** through the same path as `add_member`, so `member_events.joined` fires
  and the existing join emails send. `join_emails` stays true.
- **Receipt:** Stripe sends the payment receipt. The welcome email (automatic emails) sends the sign-in link.
- **Pay at the table:** an "Awaiting payment" list in the admin portal with "Mark as paid (cash / card)".
  Unpaid applications expire after a set time (open question).
- **Spam:** this is a public write. Rate-limit by IP, and add Cloudflare Turnstile or similar to the free path
  (the card path is protected by Stripe).

### Storage (suggested)
`membership_applications`: `id`, `person_id` (once known), `first_name`, `last_name`, `email`, `municipality`,
`newsletter_consent_at`, `kind`, `fee_cents`, `donation_cents`, `method`, `status`
(`started`, `awaiting_payment`, `joined`, `expired`), `stripe_session_id`, `channel`, `referral_code`,
`event_slug`, `utm_source`, `utm_campaign`, `created_at`, `paid_at`.

`memberships` gains `kind` and `expires_on` only if SDC decides memberships are yearly. The
2026-10-21 decision ("one kind of member, no paid tier", [../decisions/members.md](../decisions/members.md))
said a paid tier would come back as a tag or a column. This page needs that decision revisited.

## Open questions
1. **Paid or free?** The platform doesn't take payments today, and the decision log says the paid tier was
   dropped "pending validation". Is paying now the goal, and does a paid membership differ from the
   complimentary (non-voting) one the intake form offers?
2. **Prices and tiers.** The demo uses $25 member, $5 reduced, free (no vote). What are the real ones? Does
   SDC's bylaw tie voting to paying?
3. **Yearly or lifetime?** If yearly: renew automatically (Stripe subscription) or by reminder email? Who gets
   reminded, and when?
4. **Donations.** Offer a donation on this page at all? Is SDC a registered charity that issues receipts, and
   for what minimum?
5. **Pay at the table.** Will staff take cash or a card reader at events, and who marks payments in the admin
   portal? How long before an unpaid application expires?
6. **Referral rewards.** Anything for the referrer (a thank-you email exists) or only recognition?
7. **Copy.** All page copy is a draft for SDC to approve.
