# Referrals: backend

A member refers a friend from an email. The page is `/refer/<token>` (`src/app/refer/[token]/`), built from `src/features/referrals/`; `/design/referrals` shows the same component on demo data. Copy is placeholder (`src/features/referrals/copy.ts`) until Gaurav signs it off. Database: `supabase/migrations/20261120000000_referrals.sql`.

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

## Design additions (Justin, Nov 2026)
From the PM's notes. Design only, on demo data; nothing below is connected yet.

### Member page layout (`/design/referrals`)
One banner, centred on the page (the join page's doodle pattern under the green gradient): "Share SDC
referral". Then two steps: **Recipient's full name** and **Recipient's email address** with **Next**; then
who it's for (with **Change**), **Send invite**, "or", and that friend's invite link with **Copy link**, and
**Send another referral** once something has gone out. After sending, the same repeat-referral states as `ReferPage`.
`?link=unknown` shows the broken-link state. To ship it, port the layout into
`src/features/referrals/ReferPage.tsx`.

The design changes two things the backend needs to know about:

- **No message to write.** "Email them for me" sends SDC's standard email (an earlier draft let the member
  customize it; it was dropped, so the "no member text in SDC's email" rule above stays as it is).
- **I'll send it myself** shows the invite link with **Copy link** (no separate "message" step). Copy link
  waits for the name and email, calls `refer_friend` with `delivery = 'self'` so the referral is tracked
  against that email, then copies that friend's own link.
- **The form asks for the friend's full name** (not just their first name) and email address. `refer_friend`
  takes the same two things today (`p_name`, `p_email`), but anything that greets the friend by name (SDC's
  invite email, the join page) should use only the first word, e.g. "Hi Priya", not "Hi Priya Sharma". The
  name is capitalized as it's typed (the first letter of each word).

### Where a referral link goes: the join page
A referral link opens the **join page** (`/design/membership` in the `justin/membership-design` branch),
not the intake form. The join page already reads the channel from the link: `/join?via=referral&ref=<code>`
shows "{member} invited you to join SDC" and keeps the referral code through sign-up and payment, so the
new member is credited to whoever invited them.

So, for the backend:

- `friendLinkPath()` (in `src/features/referrals/types.ts`) builds `/intake-form/sdc-members?r=<id>` today.
  Change it to the join page: `/join?via=referral&ref=<code>`.
- The join page needs a lookup from `ref` to the inviting member's first name (for its heading), and the
  join must record `ref` so "Member joins via referral" can fire and the referral shows as Joined in the
  admin view.

### How links work (Justin, Nov 23)
Researched against common referral programs (Dropbox, Uber: one lasting link per person) and invite links
(Discord, Slack: per-invite links you can reset). The design:

- **One link per member and friend email, no general link.** Copy link (or Send invite) creates the
  referral and its link the first time; doing it again for the same email returns the same link (already
  how `refer_friend` works). Every link is tied to an email, so every join is tracked. The member's general
  link from an earlier draft is gone. The link shows as soon as the friend's email is typed, before Copy
  link records anything, so the backend needs a way to give that email's link up front (for example a
  `referral_link_preview(token, email)` that returns the code the referral will get, or creates a draft
  referral) and to record the referral with that same code on Copy link.
- **A 30-day credit window, not an expiring link.** The link keeps working (a friend who opens it in week
  five can still join), but it only counts as the member's referral if they join within 30 days of the
  referral. The page says so after Send invite ("If they join within 30 days, it counts as your
  referral."). Backend: check
  `joined_at - referred_at <= 30 days` when crediting; after that the join is a normal one.

- **Send another referral.** Shown only after Send invite or Copy link; clears the form for the next
  person, who gets their own referral and link. No backend change.

### Edge cases (`/design/referrals/states`)
Every state of the form, live, is laid out at `/design/referrals/states`. What the page does, and the rule
the backend needs for each:

| Case | What the member sees | Backend rule needed |
|---|---|---|
| Copy fails after the referral is recorded (Safari blocks a copy after a network wait) | The link stays, selected, with "copy it yourself"; Copy link copies again without recording twice | Recording with `delivery = 'self'` is idempotent for the same member and email (returns the same link) |
| Typo in the email (`priya@gmial.com`) | "Did you mean priya@gmail.com?" under the field, before sending | None; the suggestion is client-side only |
| Friend joins with a different email | Admin profile: the referral turns Joined, with "Joined with another email: …" | Credit follows the link's `ref` code, not the email. Store the joining address on the referral (`joined_email`) |
| Link passed on to someone else | Admin profile: "Link passed on: Rosa Moreno (…) joined with it" | Same as above: the code credits the member; store who joined (`joined_person_id`). Any number of joins per code (see "A link isn't limited to one person") |
| Two members invite the same person | Each member sees a normal "Invitation sent" (nothing about the other) | Only the first is emailed. Credit goes to the link they join through; if they join with no link, to the earliest invite for that email |
| Friend joins without any link | Nothing on the member page | At join, match the new member's normalised email to an open referral and credit it |
| No limit on how many people a member invites | Never a "try again tomorrow" message | Drop the daily limit from `refer_friend` (see "No daily limit" below) |
| Same person, different spelling (`Sam+sdc@`, `SAM@`, `s.am@gmail.com`) | Treated as already invited | Compare normalised emails: lower case, trimmed, no `+tag`, no dots in Gmail names. Email the address as typed |
| Changing the choice after an error | The old error or result clears; what's typed stays | None |
| Already a member, unsubscribed, or invited by someone else | A normal "Invitation sent", so the form reveals nothing | Never email an unsubscribed person (CASL); still record the referral so a later join can be credited |

### A link isn't limited to one person (Justin, Nov 26)
Many people can join with the same link, and each one counts as the member's referral. The page no longer
says "Only the first person to join with this link counts as your referral." For the backend: change the
credit rule above ("Two people joining at once through one forwarded link: the first takes it", and one
`joined_person_id` per referral) so a code credits every person who joins with it, e.g. a join row per
person (`referral_joins`: referral id, person id, joined email, joined at) instead of one joined person on
the referral. "One referral per person, ever" still holds from the friend's side: each new member is
credited to one referral only.

### No daily limit
The design removes the limit on how many people a member can invite (Justin, Nov 23): no "ten a day", and
no `limit` result. For the backend: drop the "Ten new referrals per referrer per day" rule and the `limit`
result from `refer_friend` (the page no longer handles it). The protection that matters for friends stays:
SDC still emails any one address at most once, ever, whoever refers them. Worth a check with the PM: without
a cap, one member could make many referrals (e.g. a pasted list); if that's a worry, an alert to admins
above some number is gentler than a hard stop.

### Email footer (`/design/referrals/footer`)
The **Refer a friend** line sits above the legal footer (why they get the email, SDC's address, Unsubscribe),
so it reads as an invitation, not small print. Three copy options for the PM; the recommendation is
"Know someone who'd care about this? **Refer a friend**", which matches the page title.

### Admin: referring for a member (`/design/members`)
On a member's profile in the Member Directory, for members who aren't comfortable with the email link.

| Needs | Notes |
|---|---|
| `admin_refer_friend(person_id, name, email, send_email)` (admins only) | The same rules and results as `refer_friend` (one SDC email per friend address, ever; own email refused), with the referral credited to that member. No daily limit for admins. Record who created it (`created_by`), so the profile can say "added by an admin". |
| The friend's link when `send_email` is false | `/intake-form/sdc-members?r=<referral id>`, shown in the dialog to copy and pass on. |
| The member's own refer page link | `/refer/<unsubscribe_token>`, for the "Copy Maya's refer link" button. Admins can read it. |
| A member's referrals | Friend name and email, referred date, made by the member or an admin, and status: **Invite emailed** (`invite_requested_at` set), **Link shared** (not emailed), **Joined** (`referred_id` set, with `joined_at`). Admins see all of this; the member's page never does. |
| Activity entries | "Referred {friend}" on the referrer (with "added by an admin" when an admin made it), "{friend} joined through {member}'s referral" on the referrer, and "Joined via referral by {member}" on the friend. These are the Member Directory timeline entries from the PRD. |
| "Referred by" on the friend's profile | The referrer's name once the friend is a member. |

Open for the PM: should the member be told when an admin refers someone for them? (Whether admin referrals
count toward the daily limit no longer matters: the design has no limit.)

## Tests
`supabase/tests/`: replays every migration on a local Postgres and checks every rule above (65 checks), see its README. Also checked by hand: 15 parallel requests create exactly 10 referrals; 8 parallel requests for one friend create one referral and one invite; 12 members referring one friend at once create 12 referrals and one invite; two people joining at once through one link credit one. An independent review found no security issues; its three email-option findings are fixed.

## Open
- Daily limit: removed in the design (see "No daily limit"); confirm with the PM before dropping it from `refer_friend`.
- A way to rotate a member's person token if one leaks (it's in every email and never changes).
- Removing a friend's details on request: admins can read referrals but there's no delete function yet.
