# People delight

Ideas for making the person drawer, and the People list behind it, feel cared for. Everything here builds on what the screens do today: `src/app/design/member-directory/MemberSheet.tsx` (the drawer) and `MemberDirectory.tsx` (the list).

Effort: S is under a day, M is a few days, L needs backend work or a new kit piece.

## The jobs

Staff open one person's drawer for a single reason, finish it, and close it.

| Job | What they need from the drawer | How well today's drawer serves it |
| --- | --- | --- |
| Get ready for a call or meeting | Who this is, how long they've been around, how they came to SDC, the note, what they last came to | Partly. The note and timeline are strong. How and when they joined sits at the very bottom of Activity, often behind "Show 2021". Who referred them isn't shown at all. |
| Check whether they paid | The latest payment and its date, without hunting | Mostly. Payments is one click away. But J and K reset the drawer to Activity, so checking ten people means ten extra clicks. |
| Record a cash payment | A fast path, and certainty it landed | Well. Record payment remembers the last amount and defaults to today. The new row isn't marked once the dialog closes. |
| Note something said at an event | Quick capture that never loses words | Well, but fragile. Escape, a click outside or a closed drawer throws the draft away, and a failed save has no state. |
| Tag them for a group | Add or create a tag in place, with Undo | Well. The inline picker, Create "name" and one Undo per editing session already cover it. |
| Check whether an email reached them | Which emails were sent, and why one wasn't | Partly. Emails lists what was sent, with the body. The platform doesn't track delivery, and the "Unsubscribed" moment disappears from the Emails tab. |
| Understand why they cancelled | When, after how long, and what the team knows | Partly. The banner gives the date only. There's no reason field, so the note is where the reason lives. |

## Person drawer ideas

### Microinteractions

| Idea | Job | Reference | Effort | Risks |
| --- | --- | --- | --- | --- |
| **The tab stays put while stepping.** Today `MemberTabs` lives inside the per-person panel, so J and K always land on Activity. Keep the chosen tab (Payments, Intake form) while stepping through the list, and reset to Activity only when the drawer closes. | Check whether they paid | Attio's record view steps through the list with up and down arrows beside its tabs ([Attio](https://mobbin.com/screens/f5a0eb36-47fe-4f4d-9bd6-d4d1b11a8ef5?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | The Activity and Emails search box should still clear on each step, since a search for one person rarely fits the next. |
| **Note drafts survive.** Today Escape, a click outside the drawer and closing it all drop the text in the Note editor. Keep an unsaved draft per person for the session: Edit reopens with it. Escape still cancels, but the words come back next time. | Note something said at an event | Linear keeps unsent comment drafts. OpenAI Platform asks before leaving unsaved work ([OpenAI Platform](https://mobbin.com/screens/27ee1460-45f9-4307-a0f3-da5ce1b4a250?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). A kept draft is lighter than a dialog. | S | Drafts live in memory only, never in browser storage, because logins can be shared. |
| **Clearing or replacing a note can be undone.** Every other change in the drawer shows an Undo toast. The note deliberately doesn't, since the saved text is its own confirmation. But saving an empty note, or writing over a colleague's, can't be taken back. Show Undo only in those two cases. | Note something said at an event | The drawer's own Undo toasts (`undo.ts`) | S | Keep the toast off for ordinary edits, so it still means something. |
| **Copy confirms where you clicked.** The email's copy button swaps its icon for a check for about 1.5 seconds, and the "Email copied" toast goes away for single copies. Clicking the address itself copies it too, as the email cell in the list already does. Today the copy button only appears on hover. | Get ready for a call | Typeform's "Copied!" appears in place ([Typeform](https://mobbin.com/screens/6ce65787-bbd6-4db9-9a7d-3ec7b2d24a5a?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). HubSpot's copy icon sits right beside the email ([HubSpot](https://mobbin.com/screens/f93e89bd-1b63-4d1d-92d6-9753e9f4c8ba?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | Announce "Email copied" to screen readers through a live region, since the toast was doing that job. Keep the failure toast, which shows the address to copy by hand. |
| **Shortcuts are taught where they're used.** The Save note button and tag Done get a tooltip naming Ctrl+Enter (Cmd+Enter on a Mac). Today the shortcut works but nothing shows it. | Note something said at an event | Linear's tooltips name the shortcut for every action ([Linear](https://mobbin.com/screens/953e88d0-de6c-4eaf-9921-cd0c55bb8412?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | Tooltip only. No hint text under the field. |

### Animation

| Idea | Job | Reference | Effort | Risks |
| --- | --- | --- | --- | --- |
| **A new or edited payment row shows where it landed.** After Record payment or Edit payment saves, that row in Payments (and Activity) starts with the hover fill and fades to clear over `--duration-slow`. The lifetime value above it changes in the same moment. | Record a cash payment | `motion.md`: motion exists to show where something came from or lives, as a checkbox fill confirms a change. | S | `motion.md` lists list rows as static, so this needs a line added there. Play it once, never on load, and skip it under reduced motion. |
| **Stepping to the next person registers.** When J or K swaps the person, the body fades in over `--duration-fast`, and the name changes at once. Today two people with similar histories can look identical, so a step can feel like nothing happened. | Check whether they paid | Linear's issue view changes in place with its "2 / 5" stepper ([Linear](https://mobbin.com/screens/953e88d0-de6c-4eaf-9921-cd0c55bb8412?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | It must never hold back a fast run of J presses. It's opacity only, with no slide. |

### Content

| Idea | Job | Reference | Effort | Risks |
| --- | --- | --- | --- | --- |
| **One "joined" line in the header.** Under the email, in muted text: "Joined Apr 2021 · Referred by Dan Petrov", "Joined Oct 2026 · Ride for Refuge" or "Joined Oct 2026 · Gift from Helen Brooks". It's built from `joinedAt`, `howJoined` and `referredBy`, which are in the data but not shown anywhere in the drawer today. | Get ready for a call | Stripe's "Customer since" ([Stripe](https://mobbin.com/screens/d0203ce6-56d8-4a16-b4b6-08cbf7eb4c68?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). Intercom's "created at" ([Intercom](https://mobbin.com/screens/fd466242-dd9b-4916-931e-4fb2b5ac4637?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). HubSpot's "Create date" ([HubSpot](https://mobbin.com/screens/f93e89bd-1b63-4d1d-92d6-9753e9f4c8ba?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | One line, never two. For someone who rejoined (like Ines), show the first join and let the timeline tell the rest. |
| **The cancelled banner says how long they stayed.** "Cancelled their membership on Apr 14, 2025, after 3 years." Today it gives the date only. Tenure is often the first clue to why someone left. | Understand why they cancelled | Stripe's customer page puts the dates that matter beside the status ([Stripe](https://mobbin.com/screens/d0203ce6-56d8-4a16-b4b6-08cbf7eb4c68?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | Use plain years, rounded down. Under a year, say "after 5 months". |
| **"lifetime value" becomes plain words**, such as "paid in total", in the Payments tab. "Lifetime value" is sales language. | Check whether they paid | Plain words over product terms (`principles.md`, section 7) | S | Settle the wording in the copy pass that's under way. |

### Information architecture

| Idea | Job | Reference | Effort | Risks |
| --- | --- | --- | --- | --- |
| **The Emails tab keeps the moments that stop email.** Today Emails shows only `kind === "email"` rows, so "Unsubscribed from member emails" and "Cancelled membership" disappear from it. Keep those two status rows in the Emails timeline, so a gap after September explains itself. | Check whether an email reached them | HubSpot's conversation shows "You blocked this email address" inline among the messages ([HubSpot](https://mobbin.com/screens/fad60278-43a3-41cc-83b1-5af8048043b5?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | The Emails (N) count should still count emails only. |

### Visual design

| Idea | Job | Reference | Effort | Risks |
| --- | --- | --- | --- | --- |
| **Status as a badge by the name, not a box in the body.** Replace the `StatusAlert` banner with the same Cancelled or Unsubscribed `Badge` the list shows beside the name, and put the date in the joined line ("Joined Apr 2021 · Cancelled Apr 2025"). That's one less container inside the sheet, and the drawer matches the row you clicked. | Understand why they cancelled | Lightfield shows a "Deleted" badge beside the record name in its panel ([Lightfield](https://mobbin.com/screens/631fa16c-0aee-46e0-bfc7-d7ca58618b08?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). Stripe puts "Open" beside the invoice title ([Stripe](https://mobbin.com/screens/e9266461-9e6f-475f-b48d-9320c24c835a?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | It reverses an earlier choice to make status "the first thing anyone sees". The header is still first, but check this with the PM. |

### Elements

| Idea | Job | Reference | Effort | Risks |
| --- | --- | --- | --- | --- |
| **Names in the drawer open that person.** "Gift for Tomas Rivera" in Payments, "Joined with a gift from Helen Brooks", "Tara Novak joined from their invite" and the new "Referred by" line all become links that switch the drawer to that person. | Get ready for a call | Stripe links "Billed to Jane Smith" to the customer ([Stripe](https://mobbin.com/screens/e9266461-9e6f-475f-b48d-9320c24c835a?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). Pipedrive links related people ([Pipedrive](https://mobbin.com/screens/359d27a3-f1d7-45a4-8af8-b5c8aec8f3ce?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | M | Today these are names stored as text, so they need person ids from the backend. A linked person may be outside the filtered list, so decide what J and K do from there. A deleted person's name stays plain text. |

### Empty states

| Idea | Job | Reference | Effort | Risks |
| --- | --- | --- | --- | --- |
| **No note: the empty space is the button.** Today an empty Note shows the heading and a small "Add" action, with nothing below. Put one quiet line under the heading, "Add a note", that opens the editor, and drop the separate Add action. It's a bigger target in the place your eye already is. | Note something said at an event | Linear's "Add description…" ([Linear](https://mobbin.com/screens/beb9d6b3-ec34-46d7-9332-320fcb32a338?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). Attio's "Create note" ([Attio](https://mobbin.com/screens/b646ac90-19c2-455c-9b7f-2fa490403c27?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | It's a button, not a fake field. It needs hover and focus states, and enough contrast that nobody reads it as a saved note. |
| **No payments says how they're covered.** Today a gifted or Ride for Refuge person sees "$0 lifetime value" and an empty list, which reads like money owed. When there are no payments, show one line from `howJoined` instead: "No payments. Joined with a gift from Helen Brooks." or "No payments. Joined through Ride for Refuge." | Check whether they paid | Stripe's plain "No payments" ([Stripe](https://mobbin.com/screens/d0203ce6-56d8-4a16-b4b6-08cbf7eb4c68?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)) | S | Keep Record payment beside it. For "Website" or "Added by an admin", just say "No payments yet." |
| **Intake not answered tells two cases apart.** Today everyone gets "They haven't answered the intake questions yet." People who joined before the form launched (Oct 2026) were never asked, so for them: "They joined before the intake form existed." | Get ready for a call | Plain, true empty states (`principles.md`, section 7) | S | It needs the form's launch date as a setting, not a guess. |
| **No search matches offers a way back.** "No activity matches 'AGM'." gets a Clear search button, as the People list's empty state already has. | Check whether an email reached them | The list's own `ListEmptyState` | S | None |

### Error states

| Idea | Job | Reference | Effort | Risks |
| --- | --- | --- | --- | --- |
| **A failed note save keeps the words.** Today `onSaveNote` closes the editor straight away, and the note has no save-failure state. On failure, keep the editor open with the text and show the same InlineAlert the tags use: "Couldn't save the note. Your text is still here." with Try again. Add it to the state lab beside the tag states. | Note something said at an event | The drawer's own `TagsRow` failure states | M | The copy needs the PM's words. Ctrl+Enter must not fire twice while a save is pending. |
| **Someone else changed the note.** If another admin saved the note while you were editing, show both versions, with "Keep mine" and "Use theirs", as the tags conflict state already does. | Note something said at an event | The drawer's own tag conflict state | L | Needs a version check on save. |
| **A person deleted elsewhere.** If a load or save comes back "not found", keep the name in the header and replace the body with "This person has been deleted." Disable the actions, and keep any note draft visible so it can be copied. J, K and Close still work. | Every job | Lightfield keeps a deleted record readable, marked "Deleted" ([Lightfield](https://mobbin.com/screens/631fa16c-0aee-46e0-bfc7-d7ca58618b08?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | L | Needs the backend to tell "deleted" apart from "failed". Don't offer Restore: SDC has no bin, and Undo only lives in the session of whoever deleted. |

## People list ideas

| Idea | Job | Reference | Effort | Risks |
| --- | --- | --- | --- | --- |
| **Copy emails leaves out people who said no.** Today the copy-emails header button and the selection bar copy every address in view, unsubscribed and cancelled people included once "Show everyone" is on. Leave them out by default, and say so: "Copied 46 email addresses. Left out 3 unsubscribed people." | Emailing a group from their own mail app | A protective default: an unsubscribe should hold everywhere SDC hands out addresses. | S | Someone may need a cancelled person's address for a one-off, and the drawer's copy button still gives it to them. The wording needs PM approval. |
| **Copy reports what it skipped.** People with no email are dropped silently today. Add "2 people have no email" to the same toast. | Same | Same | S | Keep it one toast, not two. |
| **Apply says what it will show.** In the staged Tags, Joined, Membership and More popovers, Apply becomes "Show 12 people" while the draft changes. | Tagging them for a group | Tripadvisor's "Show 16 results" ([Tripadvisor](https://mobbin.com/screens/ad39a8e4-dabb-4521-9832-1a7aca58082b?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)), H&M's "View [813]" ([H&M](https://mobbin.com/screens/b501ce82-b239-4e20-a7f7-a6f24354f197?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)) | M | Easy on today's client-side list. With a server, the count needs its own fast query. The button's width must not jump as the number changes. |
| **The row you came from stays marked.** When the drawer closes after a pointer click, that row keeps the hover fill until you point at another row. Keyboard users already get focus back on it. | Every job | Braintrust keeps the open row highlighted beside its panel ([Braintrust](https://mobbin.com/screens/80308e7f-102b-45b2-862a-81187d020464?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)). | S | It must look different from a selected row (selected rows also use the hover fill), so this may need the focus outline instead. Check this in the browser. |
| **The email cell confirms in place.** Same as in the drawer: the copy icon becomes a check for 1.5 seconds, in place of the toast. | Get ready for a call | Typeform ([Typeform](https://mobbin.com/screens/6ce65787-bbd6-4db9-9a7d-3ec7b2d24a5a?utm_source=claude&utm_medium=ai-assistant&utm_source_platform=mcp)) | S | Same screen reader note as the drawer. |
| **Downloads are named for the day.** `sdc-members.csv` becomes `sdc-people-2026-11-18.csv`, so a second export doesn't turn into "(1)" and the file says when it was taken. | Pulling a list for a meeting | None needed: it's a file name. | S | None |

## Shortlist, ranked

1. **The tab stays put while stepping.** Checking who paid goes from two clicks per person to one key.
2. **Note drafts survive Escape and close.** Words said at an event are the hardest thing to get back.
3. **One "joined" line in the header.** The best call prep in the fewest words, from data that's already there.
4. **Copy emails leaves out people who said no.** It's a protective default that respects an unsubscribe.
5. **The Emails tab keeps the unsubscribe and cancel moments.** "Why didn't they get it?" answers itself.
6. **A failed note save keeps the words.** It closes the one gap in the drawer's error states.
7. **No payments says how they're covered.** Gifted and Ride for Refuge people stop looking like they owe money.

## Skip

- **A next renewal date in Payments.** It's very useful, but the person record has no renewal date. Revisit when the backend has one.
- **Email delivery or open status.** The platform doesn't track it, and open tracking would feel like watching people.
- **A cancellation reason picker.** It means new data and a new form. The note already holds the reason, and the banner's tenure line gives the context.
- **Relative dates ("3 days ago").** They change under you, and they'd mix two date styles in one timeline.
- **An initials avatar in the header.** It adds a shape without telling a couple of hundred people apart any better than the name does.
- **A default tab that changes with status** (opening on Payments for some people). It's clever, but it breaks the calm, stable drawer.
- **Inline editing of every field, Attio-style.** Edit person is already the one way to change details. Two ways is worse.
- **A "Saved" flash or a celebration after a payment.** Fun once, noise by the tenth time. The row fade and Undo toast do the job.
- **Sticky month headers.** They were tried, and they cut into the row above.
- **Previous and next buttons in the header.** They were there and were removed on purpose. J and K stay as the shortcut.
