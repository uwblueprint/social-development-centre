# Referrals: backend

A member refers a friend from their emails. `/design/referrals` is the page on demo data (`src/app/design/referrals/`); the real page replaces `/refer/[token]` from #47. Copy is placeholder (`copy.ts`) until Gaurav signs it off.

## Flow
1. Every member email's footer has a **Refer a friend** button: `/refer/<token>`, where `token` is that email's link token (`email_links`, #47). The token says who is referring and from which email; no sign-in.
2. The member enters the friend's name and email and picks **Email them for me** or **I'll send it myself**.
3. Each referral gets its own friend link, `/r/<referral token>`. It goes in our email, or in the message the member copies.
4. The friend opens it: we log it and send them to the intake form with the referral attached.
5. The referral is **complete when the friend signs up**. Then, and only then, the referrer gets an automatic thank-you email.

## Rules
- **Already a member:** the referrer sees the normal result (a referral link must never reveal who is a member). Record the referral as `already_member`, send nothing.
- **Same member, same email again:** reuse the referral and its link. **Never send a second email**: return the message instead, with the date of the first referral (`referredOn`).
- **One email per referral, ever** (CASL's refer-a-friend exemption, to confirm with SDC): it names the referrer in full, says it's sent because they referred them, and has an unsubscribe link. No reminders.
- **Never email an address that has unsubscribed** from SDC. The member can still send the message themselves.
- **Own email:** refused with a field error.
- **Credit:** the referral whose link the friend signed up through. If they sign up without a link, the earliest pending referral for that email. Two members referring one friend: one credit, by those rules.
- **Rate limit:** at most N referral emails per referrer per day (N to decide), since the page sends email to any address.

## Needed
### Database (new migration; #47 is already applied to sdc-dev, so don't edit it)
- `referrals`: add `token uuid unique` (the friend link), `status` (`pending`, `already_member`, `completed`), `emailed_at timestamptz` (null = we never emailed), `completed_at`, `completed_by_submission` (the intake submission that completed it).
- `refer_friend(p_link_token, p_full_name, p_email, p_send_email bool)` replaces `refer_by_link` (in #47 the friend filled the form in; now the member does). Callable without signing in: the link token is the proof. Validates, applies every rule above, and returns one of:
  - `{ status: 'emailed', friend_name }`: we will send the one email (queue it, don't send inline)
  - `{ status: 'message', friend_name, link, referred_on? }`
  - field errors for a bad name or email, or the referrer's own address
  - `unknown_link` for a bad token
- `open_referral(p_token)`: logs the open, returns whether the link is valid. The page then redirects to `/intake-form?r=<token>`.
- `submit_intake` takes `p_referral_token` and completes the matching referral (else matches by email), then queues the referrer's thank-you email.

### Server actions (`src/features/links/`)
- `referFriend(token, values)` → `ActionState`-style result matching the union in `src/app/design/referrals/data.ts` (`emailed` | `message` | `invalid` | `failed`).

### Emails (need the sender from #52)
- **Referral email to the friend** (once): names the referrer, links to `/r/<token>`, unsubscribe footer.
- **Thank-you to the referrer** when the friend signs up.
- **Refer a friend** button in every member email footer, next to unsubscribe.

## Open
- N for the daily limit.
- Whether "already a member" referrals show anywhere for staff (member timeline?).
