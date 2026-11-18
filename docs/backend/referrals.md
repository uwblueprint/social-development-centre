# Referrals: backend

A member refers a friend from an email. The page is `/refer/<token>` (`src/app/refer/[token]/`), built from `src/features/referrals/`; `/design/referrals` shows the same component on demo data. Copy is placeholder (`src/features/referrals/copy.ts`) until Gaurav signs it off. Database: `supabase/migrations/20261112000000_referrals.sql`.

## Flow
1. Every member email's footer has a **Refer a friend** link: `/refer/<token>`, where `token` is the member's person token, `people.unsubscribe_token` (the same one the Unsubscribe link uses). No sign-in: the token is the proof. **#52's footer needs to add this link.**
2. The page calls `referral_page(token)`: the referrer's first name, or no row (shown as "This link doesn't work") when the token isn't a current member's.
3. The member enters the friend's name and email and picks **Email them for me** or **I'll send it myself**. Server action `referFriend` (`src/features/referrals/actions.ts`) → `refer_friend(token, name, email, send_email)`.
4. The friend's link is `/intake-form/sdc-members?r=<referral id>`. The intake form stores the referral on `intake_submissions.referral_id` (`submit_intake`'s new `p_referral_id`; an unknown id is ignored).
5. **Complete when the friend becomes a member.** `membership_started` links the referral whose link they used on the intake form (latest submission with their address), else the earliest open referral of their address, and records `referral_joined`. The automatic emails engine sends the referrer's thank-you from that event (trigger `referral_joins`). Nothing else emails the referrer.

## `refer_friend` results
| status | When | Page shows |
|---|---|---|
| `unknown_link` | Token isn't a current member's | This link doesn't work |
| `invalid_name` | Empty, over 80 characters, or contains `< > / \ : @`, control characters or invisible formatting characters (e.g. right-to-left overrides) | Field error |
| `invalid_email` | Not one plain address (no separators or quotes; domain of letters, digits, dots, hyphens), or over 254 characters | Field error |
| `own_email` | The referrer's own address | Field error |
| `limit` | Ten new referrals in the last 24 hours | Form error |
| `emailed` | New referral, member chose email | "Thanks for inviting {name}" |
| `message` | Member chose to send it, or a repeat referral (`referred_on` set) | The message with the friend's link |

## Rules
- **Never reveals anything about the friend.** Already a member, unsubscribed, bounced or suppressed: the same `emailed` answer, and `invite_requested_at` stays empty, so nothing is sent.
- **At most one referral email per friend address, ever, whoever refers them** (CASL's refer-a-friend exemption, to confirm with SDC; and no group of members can bombard one address). Enforced by the unique index `referrals_one_invite_per_address`. A second member referring the same friend still gets their own referral (and credit if the friend joins through their link), just no second email. A repeat referral by the same member returns the same referral and link.
- **SDC's email to the friend never includes the name the member typed** ("Hi," not "Hi Sam,"), so the name can't carry a link into an email from SDC. The member's own copied message does include it.
- **Ten new referrals per referrer per day.** Repeats don't count. Serialized per referrer, so parallel requests can't pass it.
- **Credit:** the link they used, else the earliest referral of their address. One referral per person, ever (rejoining doesn't credit twice). Two people joining at once through one forwarded link: the first takes it.

## For the sender (#52)
- **Referral invites:** send rows of `referrals` with `invite_requested_at` set and `invite_sent_at` empty (index `referrals_invites_due`), then set `invite_sent_at`. Before sending, re-check the friend can still be emailed (they may have joined or unsubscribed since). The email greets the friend without the typed name, names the referrer in full (`people.full_name` of `referrer_id`), says it's sent because they referred them, links to `/intake-form/sdc-members?r=<referrals.id>`, and has an unsubscribe link. One email; no reminders.
- **Footer:** add **Refer a friend** → `/refer/<unsubscribe_token>` next to Unsubscribe.
- **Don't configure a "Member refers someone" (`refers`) email** for SDC: the decision is to email the referrer only when their friend joins.

## Tests
`supabase/tests/`: replays every migration on a local Postgres and checks every rule above (65 checks), see its README. Also checked by hand: 15 parallel requests create exactly 10 referrals; 8 parallel requests for one friend create one referral and one invite; 12 members referring one friend at once create 12 referrals and one invite; two people joining at once through one link credit one. An independent review found no security issues; its three email-option findings are fixed.

## Open
- N for the daily limit (10 for now).
- A way to rotate a member's person token if one leaks (it's in every email and never changes).
- Removing a friend's details on request: admins can read referrals but there's no delete function yet.
