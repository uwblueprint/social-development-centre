# Join: backend

How someone becomes a member: they open a join link, pick a tier, enter their details, pay, and land on a thank-you page. The screens at `/design/join` (`src/app/design/(member)/join/`) are blank placeholders for now: Start, Details, Payment, Thank you. Justin's `justin/membership-design` branch has the fuller design.

Three other pieces point people here, so the join page is where they meet:
- **Signup links** send people to `/join?source=<slug>` ([signup-links.md](./signup-links.md)).
- **Referrals** send friends to `/join?via=referral&ref=<code>` ([referrals.md](./referrals.md), on #65).
- **Payments** take the money ([payments.md](./payments.md)).

## What the backend needs
1. **Works signed out.** Everyone who joins is new, so every step runs without a sign-in.
2. **Reads where they came from.** On load, record a click against `source` for signup links. For `ref`, look up the inviting member's first name for the heading. Keep both through to the end of the flow, not in a cookie.
3. **Creates the person.** Details creates or updates a `people` row by email. It doesn't create a second person if the email is already known.
4. **Takes payment.** Payment hands off to PayPal (payments wave 1) and comes back with the result. A failed or cancelled payment returns to the Payment step with what they typed kept.
5. **Records the join once.** When payment succeeds, write one `member_events` row of kind `joined`, with `referral_id` set when they came from a referral. Attribute the join to the signup link when they came from one. This one row is what starts the join emails and the admin notification.
6. **Shows the thank-you.** The Thank you step reads the new membership (tier, next payment date) to confirm what they bought.

## Open questions
- Does the intake form's survey (`/intake-form`) run before or after joining? Today it's separate.
- What happens when someone already a member opens a join link?
