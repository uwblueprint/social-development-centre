# Intake form (Ride for Refuge pilot): decision log

Decisions behind `/intake-form`, the questionnaire Ride for Refuge supporters fill in. **All copy is draft until SDC confirms the complimentary-membership terms, the topic labels and the contact-details wording.** Each decision can be revisited.

## 1. What it is
- **Decision (6 Oct 2026, client meeting):** Ride for Refuge supporters are offered a complimentary membership, with no new payment ask. The page welcomes them, asks a few questions and confirms. It tests whether people will fill it in.
- **Out of scope:** payment, amounts, e-transfer steps, tiers, sponsorships (client: asking people who just donated to pay again would be unfair).

## 2. Public, with no sign-in (22 Oct 2026)
- **Decision:** `/intake-form` is open to anyone with the link. No sign-in, no session, no shell. Authentication is a separate piece of work that will be built over the top later.
- **This reverses the 6 Oct decision** that put the form behind a magic-link login at `/welcome`. That version is not in the product; this is what ships.
- **Why:** the form's job is to collect answers from a mailing-list campaign. A login in front of it is a second thing to build, a second thing to support, and a reason for people to drop out before answering.
- **No per-person links either.** The same URL goes to everyone: no `?email=` prefill and no token in the URL. A link that identifies someone has to prove it, and a guessable one in a bulk campaign proves nothing.
- **Affects:** `src/app/intake-form/page.tsx`, `src/lib/supabase/proxy.ts` (the form is on the public list beside `/login` and `/auth`).
- **When encountered:** everyone who opens the link.

## 3. The person identifies themselves in the form (22 Oct 2026)
- **Decision:** the first step asks **First name**, **Last name** and **Email**, all three required. They are the only required answers in the form.
- **Why:** with no sign-in there is nothing else to attach answers to. First and last name are separate fields because SDC will use them to address people, and a single "Name" field makes that guesswork.
- **Trust:** the details come from the browser, so they are re-checked on the server and again inside `submit_intake` before anything is stored. Nothing else in the product reads these rows yet, so an address nobody verified cannot grant access to anything.
- **Not done:** the address is not verified, and a typo cannot be corrected after submitting. Both wait for a decision about what SDC does with these rows.
- **When encountered:** the first step, and the error under any field left empty or an address that isn't one.

## 4. The flow
Welcome → Your details → five questions, one per screen → confirmation.
- **Welcome** opens with "Your complimentary SDC membership", then thanks, what it is, "about two minutes" and "no payment request". **Get started** continues; **Maybe later** sits at the bottom of this first screen.
- **Your details:** First name, Last name, Email. All required (decision 3).
- **Questions** (wording from the client questionnaire, shown as cards):
  1. Issues of interest: pick any, **Other** with a text field, **I'm not sure yet** is exclusive (choosing it clears the rest, and choosing another clears it).
  2. Ways to be involved: pick any, **Other** with a text field.
  3. Where you're based: pick one; **Outside Waterloo Region** reveals an optional "City or town" field. City or region only, never an address.
  4. Time that feels manageable: pick one. Framed as a preference, not a commitment.
  5. What would make being part of SDC useful or meaningful: optional text, 600 characters.
- **Skipping:** every question can be skipped. The button reads **Skip for now** while nothing is chosen and **Next** once something is. **Back** keeps what was entered.
- **Progress:** a thin bar reading "Your details" then "Question n of 5".

## 5. "Maybe later" saves nothing (22 Oct 2026)
- **Decision:** **Maybe later** on the first screen shows "No problem — come back any time" with **Fill it in now**, which opens the details step. Nothing is saved and nothing is recorded.
- **Why:** the form is public, so "come back any time" is simply true — the same link works again. The earlier version had to sign people out here, because the login gate would otherwise have sent them straight back.
- **Not done:** SDC cannot see that someone chose it. Counting that needs an event log, which is a separate decision (`docs/backend/intake-form.md`).

## 6. One row per submission, keyed on a per-page-load id (22 Oct 2026)
- **Decision:** each submission is one `intake_submissions` row, keyed on a `submissionId` the browser makes once per page load and resends on every retry, so a failed save that is retried updates the same row instead of adding a second.
- **Answers are stored as labels, not ids**, so a row reads as it was answered without a lookup table.
- **Why not a row per person:** the same address may legitimately answer twice (a correction, a shared family address), and deciding which wins is SDC's call, not the form's.
- **When encountered:** retrying after a failed save.

## 7. Still open
- The complimentary-membership terms, the topic labels, and the contact-details wording ("We'll use these to set up your complimentary membership").
- Whether SDC needs a screen to read submissions, or the Supabase dashboard is enough for the pilot.
- What stops automated submissions if the link is shared publicly (`docs/backend/intake-form.md`).
- Whether a confirmation email is sent, and what it says.
