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
- **Decision:** the first step asks **First name**, **Last name** and **Email address**, all three required. They are the only required answers in the form.
- **Why:** with no sign-in there is nothing else to attach answers to. First and last name are separate fields because SDC will use them to address people, and a single "Name" field makes that guesswork.
- **Trust:** the details come from the browser, so they are re-checked on the server and again inside `submit_intake` before anything is stored. Nothing else in the product reads these rows yet, so an address nobody verified cannot grant access to anything.
- **Not done:** the address is not verified, and a typo cannot be corrected after submitting. Both wait for a decision about what SDC does with these rows.
- **When encountered:** the first step, and the error under any field left empty or an address that isn't one.

## 4. The flow
Envelope → the welcome letter → Your details → five questions, one per screen → confirmation.
- **Envelope** (decision 7) is a closed, hand-drawn envelope. Clicking or tapping it opens the letter.
- **The letter** thanks them for supporting Ride for Refuge, offers the complimentary membership, and asks for "5 quick questions (about 2 minutes)". **Begin survey** continues; **Not interested** sits at the bottom of the letter.
- **Your details** (headed Details): First name, Last name, Email address. All required (decision 3).
- **Questions** (wording from the client questionnaire, shown as cards):
  1. Issues of interest: pick any, **Other** with a text field. The five issues and their icons were set by the 22 Oct review (decision 8).
  2. Ways to be involved: pick any, **Other** with a text field.
  3. Where you're based: pick one; **Outside Waterloo Region** reveals an optional "City or town" field. City or region only, never an address.
  4. Time that feels manageable: pick one. Framed as a preference, not a commitment.
  5. What would make being part of SDC useful or meaningful: optional text, 600 characters.
- **Skipping:** every question can be skipped. The button reads **Skip for now** while nothing is chosen and **Next** once something is. **Back** keeps what was entered.
- **Progress:** a thin bar reading "Your details" then "Question n of 5".

## 5. "Not interested" doesn't submit (22 Oct 2026; analytics updated 27 Oct 2026)
- **Decision:** **Not interested** on the letter shows "No problem" with **Fill it in after all**, which opens the details step. No submission is saved. Since 27 Oct, analytics records the welcome-page visit and that the person left via `not_interested`; its `answers` array is empty. If an email was already entered on this attempt, the visit can still be associated with that `key_id`.
- **Why:** the form is public, so the same link simply works again. The earlier version had to sign people out here, because the login gate would otherwise have sent them straight back.
- **It is not an unsubscribe.** The review that named it (decision 8) replaced an **Unsubscribe** link belonging to the sign-in-gated version, where there was a session to act on. Here there is no authenticated session; analytics records the choice but does not suppress future invitations. The screen does not promise SDC will stop emailing, and the user guide says to reply to SDC's email instead.
- **Not done:** SDC cannot suppress future invitations from this choice; that needs a suppression list that the mailing-list campaign reads (`docs/backend/intake-form.md`).

## 6. One row per submission, keyed on a per-page-load id (22 Oct 2026)
- **Decision:** each submission is one `intake_submissions` row, keyed on a `submissionId` the browser makes once per page load and resends on every retry, so a failed save that is retried updates the same row instead of adding a second.
- **Answers are stored as labels, not ids**, so a row reads as it was answered without a lookup table.
- **Why not a row per person:** the same address may legitimately answer twice (a correction, a shared family address), and deciding which wins is SDC's call, not the form's.
- **When encountered:** retrying after a failed save.

## 7. The form is a doodled letter (22 Oct 2026)
- **Decision:** `/intake-form` is drawn as a hand-made letter, from the clickable prototype reviewed on 8 Oct 2026 (PR #23, built against the earlier `/welcome` version). A closed envelope opens into the welcome letter; every step then sits on a sheet of paper on a dotted desk, under the SDC and Ride for Refuge logos; the confirmation is a celebrating Canada goose.
- **Why:** the form goes to people who have just donated, not to staff using a tool. A letter reads as a thank-you and an invitation; the portal's taupe chrome reads as administration.
- **Typefaces:** Coming Soon for headings, Nunito for everything else, loaded on this route only so the rest of the app keeps Switzer.
- **Scope:** the look is confined to `/intake-form`. It is carried by `--intake-*` tokens and the page re-points `--color-bg` / `--color-bg-hover` at the paper so kit components sit on it; no kit component changes behaviour, and **design-system owner approval for these tokens is still pending**.
- **Behaviour is unchanged** from decisions 2-6: still public, still First name / Last name / Email required, still skippable questions, still one row per `submissionId`.
- **When encountered:** the moment the link is opened — the envelope is the first thing on screen, and the letter is behind it.

## 8. Frontend review of the letter (22 Oct 2026)
Changes asked for in `#ride-for-refuge` after the letter went up, all applied:
- **No address on the envelope.** The link carries no name, so "To {{full_name}}" and its dashed line are gone. The envelope is now just the envelope.
- **New letter text,** including "complimentary (non-voting) membership" and "Your answers are linked to your name and email and are seen only by SDC. Every question is optional."
- **Buttons are Begin survey and Not interested** (the latter replacing Unsubscribe; see decision 5).
- **The details step is headed "Details"**, with "We'll use your email to send your membership welcome and event invites that match your answers." The email hint is gone and the field reads **Email address**.
- **8px above the progress bar,** clear of the two logos.
- **Five issues, respecified to what they do,** each with its icon: Homelessness and encampments (`tent`), Tenant rights and evictions (`key-round`), Neighbourhood events and community life (`users`), Local elections and civic engagement (`landmark`), Disability rights and accessibility (`accessibility`). **Other** keeps no icon. This drops "Climate and the environment" and **"I'm not sure yet"** — with no exclusive choice left on any question, that handling is gone from `CheckCardGroup` too.
- **No "Select all that apply" hints,** and no per-field "(optional)" markers; the letter already says every question is optional.

**Asked for but not applied as written:** the review asked for a single **Name** field. The form keeps **First name** and **Last name**, because `submit_intake` takes them separately and decision 3 chose them deliberately. Only the label part applies here, and these fields never carried "(optional)". Worth confirming with the reviewer.

## 9. Still open
- The complimentary-membership terms, the topic labels, and the contact-details wording ("We'll use these to set up your complimentary membership").
- Whether SDC needs a screen to read submissions, or the Supabase dashboard is enough for the pilot.
- What stops automated submissions if the link is shared publicly (`docs/backend/intake-form.md`).
- Whether a confirmation email is sent, and what it says.

## 10. Intake form analytics (27 Oct 2026)
- **Decision:** record a visit for each form step, including time on the step, answer timing, non-contact answers entered so far, and how the person left it. Do not collect a referrer: `"from"` is always `NULL`.
- **Identity:** `person_id` is a random UUID per form attempt, not `public.people.id`. `key_id` is the normalized email after it is entered. `user_found` reports whether that email matches a row in `public.people`; it is `NULL` before an email is entered and does not verify identity.
- **Privacy:** start tracking on the welcome letter, after the notice is visible. Contact fields are not copied into `answers`; free-text answers are stored as entered. The email is stored in `key_id`.

## 11. Two member intake links and updated questions
- **Decision:** serve the Ride for Refuge version at `/intake-form/ride-for-refuage` and the existing-member version at `/intake-form/sdc-members`. `/intake-form` redirects to the Ride for Refuge version. Both routes use the same flow and analytics; the existing-member version does not show the Ride for Refuge logo.
- **Source tracking:** store the route slug in `intake_submissions.form_source` and in `page_visits."from"` for each visit. This replaces decision 10's initial `NULL`-only value; it is the form source, not an external referrer.
- **Copy:** the Ride version thanks supporters of the 2026 Ride for Refuge and offers complimentary non-voting membership. The existing-member version thanks SDC members and asks how SDC can keep them informed, connected and engaged. Both retain the shared contact-details explanation and privacy notice.
- **Questions:** use the nine supplied monthly-email topics, the four supplied connection options plus an optional Other response, the eight supplied locations, the five time-commitment choices, and the optional open response. Participants rank the topics by dragging them into order, with accessible move-up/move-down controls as an alternative. A participant may skip the entire ranking; once they begin, the full list is ranked 1–9.
- **Storage:** completed submissions keep ranked topics as `{ "rank": number, "topic": label }` objects and record the route source. The forward migration `20261027000100_intake_form_variants.sql` updates the database writers and the permitted analytics source values.
