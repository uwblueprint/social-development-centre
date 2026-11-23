# Payments: PayPal, wave 1

Make paying, auto-renewing and cancelling work through PayPal. SDC-specific needs (tiers, real amounts, editing amounts, sponsoring and gifting) come in wave 2.

SDC's finance team approved the PayPal integration on 17 Nov 2026.

## Requirements
1. **Pay.** A member can pay with PayPal or a card, monthly or yearly, in Canadian dollars. Use placeholder amounts for now. Wave 2 adds tiers and lets admins change amounts, so build for that.
2. **Auto-renew.** Payments repeat automatically until the member cancels. A month before a yearly renewal, SDC can send the member a reminder email.
3. **Cancel.** A member can cancel on their own, from a link in SDC's emails or from the members' area. Cancelling stops all future charges and asks them why. It doesn't unsubscribe them from emails. No refunds through the platform.
4. **Always up to date.** If a payment goes through, fails, is refunded or disputed, or the member cancels (even from inside PayPal), the platform knows right away. The board pulls the member list at any time, so it has to be accurate.
5. **Visible to admins.** Each member's page shows their PayPal payments alongside payments recorded by hand. Members are flagged when a payment fails or when they cancel, and admins can filter by both.
6. **Triggers emails.** A payment received, a failed payment, a cancellation and an upcoming yearly renewal can each start an automatic email and show on the member's history.
7. **Handoff.** At handoff, SDC switches the platform to its own PayPal keys without needing a developer. Test everything with PayPal's test mode until then.

## Open questions with SDC
- Is monthly billing a 12-month commitment, or can members cancel any month?
- Does membership end as soon as someone cancels, or at the end of the period they paid for? Until SDC answers, end it right away.
- Which emails must still go to people who unsubscribed (members' meetings, AGM, renewal reminders)?
