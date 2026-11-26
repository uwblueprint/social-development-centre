# Membership survey (Ride for Refuge pilot): decision log

Decisions and assumptions behind `/welcome`, the questionnaire Ride for Refuge supporters answer after their first sign-in. **All copy is draft until SDC confirms the complimentary-membership terms and the topic labels.** Each decision can be revisited.

## 0. Superseded by the first-login gate (6 Oct 2026, later the same day)

Sections 2 and 4 below record the original frontend-only design and are kept as the record of what
was decided and why. Two of those decisions have since been replaced; the rest still stand.

- **Where it lives (was §2):** the survey moved to `/welcome`, **behind sign-in**, not public. Members receive a
  magic-link login rather than a survey link, and the app shows the survey until their answers are
  saved. The URL prefill (`?email=`, `?name=`) is gone: the email is the signed-in account,
  shown as read-only context, so a forwarded link cannot file answers under someone else.
  *Why:* a link that identifies someone has to prove it. Reusing auth avoids a second identity
  system, and a tokenized URL would have been both guessable and fragile in a bulk campaign.
- **Unsubscribe (was §4):** replaced by **"Maybe later"**. It saves nothing, so the survey is
  waiting at their next sign-in. Recording that someone chose it needs the event log that
  `docs/backend/member-survey.md` §3 still asks for.
  *Why:* once the survey sits behind a login, "unsubscribe" promised something the page does not
  do. Leaving the mailing list stays with Mailchimp's own unsubscribe link in the invitation email.
- **Still open:** §7's wording items carry over, with "unsubscribed-screen wording" now being the
  "Maybe later" screen.

How it is wired now: [docs/backend/member-survey.md](../backend/member-survey.md).

## 1. What it is
- **Decision (6 Oct 2026, client meeting):** Ride for Refuge supporters are offered a complimentary membership, with an unsubscribe option and no new payment ask. One email carries one link; the page welcomes them, asks a few questions and confirms. It tests whether people will fill it in and where they drop off.
- **Out of scope:** payment, amounts, e-transfer steps, tiers, sponsorships (client: asking people who just donated to pay again would be unfair).

## 2. Where it lives and who can open it
- **Decision:** `/join`, public, no sign-in, no shell. It must be reachable signed out (see `docs/backend/member-survey.md`).
- **Prefill:** `?email=` and `?name=` fill the contact step (Mailchimp merge tags). Both stay visible and editable, and a line under Email says it was filled in from the invitation.

## 3. The flow
Welcome → Your details → five questions, one per screen → confirmation.
- **Welcome** opens with "Your complimentary SDC membership", then thanks, what it is, "about two minutes" and "no payment request". **Get started** continues. **Unsubscribe** sits at the bottom of this first screen (owner, 6 Oct 2026).
- **Your details:** Name (optional) and Email address (required). Email is the only required field in the whole survey.
- **Questions** (wording from the client questionnaire, shown as cards):
  1. Issues of interest: pick any, **Other** with a text field, **I’m not sure yet** is exclusive (choosing it clears the rest, and choosing another clears it).
  2. Ways to be involved: pick any, **Other** with a text field.
  3. Where you’re based: pick one; **Outside Waterloo Region** reveals an optional "City or town" field. City or region only, never an address.
  4. Time that feels manageable: pick one. Framed as a preference, not a commitment.
  5. What would make being part of SDC useful or meaningful: optional text, 600 characters.
- **Skipping:** every question can be skipped. The button reads **Skip for now** while nothing is chosen and **Next** once something is. **Back** keeps what was entered.
- **Progress:** a thin bar with "Your details" then "Question n of 5" (six steps, so a light indicator, not a heavy one).
- **Confirmation:** "Thanks for sharing!" with a check, a short confetti burst (skipped for reduced motion) and a soft green screen. No payment, no next step to take.

## 4. Unsubscribe (owner, 6 Oct 2026)
- One **Unsubscribe** button at the bottom of the welcome screen, and one in the invitation email.
- Clicking it records the event in SDC's analytics tool (`survey_unsubscribe_clicked`) and shows "You’re unsubscribed". The page itself changes no mailing list; that is the backend/analytics follow-up in `docs/backend/member-survey.md`.
- **Assumption:** the unsubscribed screen wording is draft. It does not offer an undo.

## 5. Saving and failure
- Answers stay on screen if the save fails; the error says what happened and to choose **Share my preferences** again.
- **Share my preferences** is disabled and shows a spinner while saving, so a double tap never sends twice. Each page load has one submission id, reused on retry, so the backend can ignore a repeat.

## 6. Delight, within the kit
Cards with an icon, a check and a fill (never colour alone); a gentle stagger as cards arrive; a spring hover lift; a live "2 selected" count; focus moves to each step's heading; confetti on success. The accent stays on the primary button, and reduced motion is respected.

## 7. Open wording (track separately, not for this build)
- Final complimentary-membership terms and whether "complimentary" stays.
- Final topic labels (draft, not a confirmed taxonomy).
- Whether "about two minutes" holds once timed.
- Unsubscribed-screen wording.
