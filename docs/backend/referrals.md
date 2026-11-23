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

## Design additions (Justin, Nov 2026)
From the PM's notes. Design only, on demo data; nothing below is connected yet.

### Member page layout (`/design/referrals`)
One photo banner, centred on the page: "Share SDC referral" on the left; under it the member's invite
link (shown, not editable) with **Copy link**, then "or", then **Recipient's first name** and **Send to
email address** with **Share invite**. After sending, the same "Thanks for inviting…" and repeat-referral states as `ReferPage`.
To ship it, port the layout into
`src/features/referrals/ReferPage.tsx`.

The design changes two things the backend needs to know about:

- **No message to write.** "Email them for me" sends SDC's standard email (an earlier draft let the member
  customize it; it was dropped, so the "no member text in SDC's email" rule above stays as it is).
- **I'll send it myself** shows the invite link with **Copy link** (no separate "message" step). Copy link
  waits for the name and email, calls `refer_friend` with `delivery = 'self'` so the referral is tracked
  against that email, then copies that friend's own link.
- **The form asks for the friend's first name and email address**, the same two things `refer_friend`
  takes today (`p_name`, `p_email`), so nothing changes there.

### The friend's first name

The member types the friend's name however they like: "Priya", "Priya Patel", "Dr. Priya Patel", "dr priya". The invite email greets the friend by first name, and the member's page thanks them by it, so both need the same rule (`firstNameOf` in `src/app/design/referrals/data.ts`):

- Drop leading titles, with or without a full stop and in any case: Mr, Mrs, Ms, Miss, Mx, Dr, Prof, Professor, Rev, Sir, Madam, Dame.
- Use the first word that's left.
- If a title leaves only one word ("Dr. Patel"), keep the title: we can't tell a first name from a last name.
- Keep the case as typed.

Store the name as typed too; admins see it in full.

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
| Two members invite the same person | Each member sees a normal "Invitation sent" (nothing about the other) | Only the first is emailed. Credit goes to the link they join through; if they join with no link, to the earliest invite for that email |
| Friend joins without any link | Nothing on the member page | At join, match the new member's normalised email to an open referral and credit it |
| Ten referrals in a day | "You've referred 10 people today. Try again tomorrow." under the email row | The daily limit stays (see "Daily limit" below) |
| Same person, different spelling (`Sam+sdc@`, `SAM@`, `s.am@gmail.com`) | Treated as already invited | Compare normalised emails: lower case, trimmed, no `+tag`, no dots in Gmail names. Email the address as typed |
| Changing the choice after an error | The old error or result clears; what's typed stays | None |
| Already a member, unsubscribed, or invited by someone else | A normal "Invitation sent", so the form reveals nothing | Never email an unsubscribed person (CASL); still record the referral so a later join can be credited |

### Daily limit
The PM decided to keep the limit (Nov 23): ten new referrals per member per day, because the page works
without signing in. Justin's design had dropped it; the page now shows `refer_friend`'s `limit` result as an
error under the email row. One email per address, ever, also stays.

### Email footer (`/design/referrals/footer`)
The **Refer a friend** line sits above the legal footer (why they get the email, SDC's address, Unsubscribe),
so it reads as an invitation, not small print. Three copy options for the PM; the recommendation is
"Know someone who'd care about this? **Refer a friend**", which matches the page title.
## The redesigned page (Nov 2026)

`/refer/[token]` renders the redesigned page (`src/features/referrals/ReferPage.tsx`, from the referrals design). It calls `referFriend` unchanged. Step 1 asks for the friend's name and email; step 2 offers both ways to invite them (we email them, or the member copies their link); Send invite goes to a thank-you screen. The step is in the URL (`?step=how`, `?step=thanks`) so Back and Forward work; a step URL opened fresh shows step 1.

### Edge cases

| Case | What the member sees | Handled by |
|---|---|---|
| Link's token isn't a current member's (on load, or it stops working mid-way) | "This link doesn't work" | `referral_page` / `unknown_link`; the page swaps to that screen |
| Name or email missing on Next | The error under each field; Next is never disabled | Page |
| Name with links or symbols (`@`, `/`, `<`) | "Enter just their name…" on step 1 | Page and `refer_friend` (`invalid_name`) |
| Email the server rejects, or the member's own address | The error under the email field on step 2 (the page stays there) | `refer_friend` (`invalid_email`, `own_email`) |
| Likely typo (`priya@gmial.com`) | "Did you mean priya@gmail.com?", one click fixes it | Page only |
| Partly typed domain (`priya@g`) | `mail.com` offered inline; Tab, →, or a click on the Tab key fills it | Page only |
<<<<<<< HEAD
| Titles and full names ("Dr. Priya Patel", "mrs priya") | Thanked and labelled as "Priya"; "Dr. Patel" stays whole | Page (`firstNameOf`) and `refer_friend` (`split_referred_name`, migration `20261123000000_referral_names`), so the stored first name agrees |
=======
| Titles and full names ("Dr. Priya Patel", "mrs priya") | Thanked and labelled as "Priya"; "Dr. Patel" stays whole | Page (`firstNameOf`) and `refer_friend` (`split_referred_name`, migration `20261123000100_referral_names`), so the stored first name agrees |
>>>>>>> origin/gaurav/referrals-wired
| Already a member, unsubscribed, bounced, suppressed, or already invited by someone else | Exactly what a new referral shows | `refer_friend`: never emailed, still recorded |
| This member already referred this address | "You invited Priya on Nov 3, thank you! We only email once…" with their link | `refer_friend` (`message` with `referred_on`) |
| Send invite fails (connection) | Thank-you screen, then back to step 2 with "We couldn't send that…" | Page |
| Ten referrals today | "You've referred 10 people today…" under the email | `refer_friend` (`limit`) |
| Copy link before anything is recorded | The link field is empty ("Their link appears here when you copy it"), then fills | `refer_friend` with `delivery: "self"` records it and returns the link |
| Copy link after the email went out (thank-you screen) | Copies their link; no second email | A second `refer_friend` call returns the existing referral's link |
| The browser blocks the copy (Safari after a network wait) | The link shown, selected, with "copy it yourself" | Page |
| Phones | Share (the system share sheet) instead of Copy link | Page: a touch screen that can share |
| Two tabs or double clicks | One referral, one email | `refer_friend` (locks and the unique index) |

### Decided
- **The daily limit stays** (PM, Nov 23): ten new referrals per member per day, because the page works without signing in. The page shows `copy.limit` under the email row.

### Decisions for the PM
- **Same person, different spelling.** `sam+sdc@` and `s.am@gmail.com` reach the same inbox but count as different addresses, so each could get one email. Normalising them (lower case, no `+tag`, no dots in Gmail names) would need a change to the one-email-per-address index.

### Later (not designed yet)
- A friend who joins with a different email, or through a link passed on to someone else, and how admins see a member's referrals.
- A broken or incomplete refer-page link should open the join page, not an error screen.
- Friend links open the intake form (`friendLinkPath`); they should open the join page once it exists.
- Showing the friend's link before anything is recorded would need the backend to hand out a link ahead of the referral. Not worth it yet: the empty field explains itself.

## Tests
`supabase/tests/`: replays every migration on a local Postgres and checks every rule above (73 checks, including the name splitting), see its README. Also checked by hand: 15 parallel requests create exactly 10 referrals; 8 parallel requests for one friend create one referral and one invite; 12 members referring one friend at once create 12 referrals and one invite; two people joining at once through one link credit one. An independent review found no security issues; its three email-option findings are fixed.

## Open
- Later (PM, Nov 23): a friend who joins with a different email, or through a link passed on to someone else, and how admins see referrals on a member's profile. Not designed yet.
- Later (PM, Nov 23): a broken or incomplete refer-page link should open the join page, not an error screen. Not designed yet.
- A way to rotate a member's person token if one leaks (it's in every email and never changes).
- Removing a friend's details on request: admins can read referrals but there's no delete function yet.
