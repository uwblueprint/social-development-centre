# Opportunities: decision log

We built Opportunities while SDC wasn't available to answer questions, so most entries below are **assumptions that SDC hasn't confirmed yet**. Entries marked "Decided by owner" are confirmed. Each one is cheap to reverse. Most of them go to the 29 September discovery session.

Each entry gives the decision, which page it's on, what it affects, when someone runs into it, and the client answer that would change it.

## 1. "Other" is a fifth type with a custom shape
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** Besides Event, Petition, Volunteer role and Job, there's a fifth type called **Other**. It has:
  - a required **Call to action** (the button text people see, e.g. "Take the survey");
  - an optional **Deadline**;
  - up to 5 optional **Details**, each a label and a value.

  It covers surveys, programs and calls for input.
- **Page:** Admin and partner → Opportunities → **New opportunity** → **Other**. The form's section is **Details**.
- **Affects:** The type menu, the **Type** filter, the form, and the fields emails can use (for Other, only the call to action and deadline are structured).
- **When encountered:** Posting anything that isn't one of the four named types.
- **Revisit when:** SDC names the real types it promotes. A type that recurs often, such as surveys or Council delegations, should get its own form. If Other is never used, remove it.

## 2. No review step before a partner listing is published
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** Partners publish straight to **Published**. Admins can edit, close or delete any listing afterwards. Notion marks review as P2/TBD.
- **Page:** Partner → Opportunities → form → **Publish**. Admin → Opportunities (every listing is editable).
- **Affects:** When a partner's listing can reach emails, and how much work the Civic Hub coordinator has.
- **When encountered:** Every time a partner clicks **Publish**.
- **Revisit when:** SDC wants to approve partner listings first. That adds a status between draft and published, a queue for admins, and a "waiting for review" label for partners.

## 3. Whoever posts chooses the topics
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** The person posting picks **1 to 3 topics**. At least one is required to publish. The topic list is a placeholder (11 topics in `catalog.ts`) until the taxonomy session on 29 September. Topic IDs stay the same if labels change.
- **Page:** Admin and partner → Opportunities → form → **Basics** → **Topics**.
- **Affects:** Who receives each opportunity by email or as a recommendation, and follow-ups.
- **When encountered:** Every publish.
- **Revisit when:** SDC delivers its taxonomy, or wants SDC staff to tag partner listings instead (which suggests a review step, see 2). If 3 topics proves too few or too many, change `MAX_TOPICS`.

## 4. When a listing ends
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:**
  - **Events** end at their start time (Notion, 24 September).
  - **Petitions and Other** end when their **Deadline** day is over. **Volunteer roles and Jobs** end when their **Apply by** day is over.
  - A listing with no deadline stays published until someone closes it.
  - An ended listing moves to **Closed** by itself with the reason **Ended**. You can't publish or reopen a listing whose date has already passed.
- **Page:** Admin and partner → Opportunities → **Published** and **Closed** tabs.
- **Affects:** Tab counts, emails and recommendations, and the partner's published count on Partners.
- **When encountered:** The moment a date passes; when someone tries to reopen or publish a listing with a past date.
- **Revisit when:** SDC wants events to stay visible until they finish, wants a grace period, or wants undated listings to close after a set time.

## 5. Drafts exist and need only a title
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** **Save as draft** needs only a **Title**. Members never see drafts; only people who can edit the listing do. **Publish** checks every required field. Drafts never end.
- **Page:** Admin and partner → Opportunities → form footer; the **Drafts** tab.
- **Affects:** The form's buttons, the **Drafts** tab, and what "required" means.
- **When encountered:** A partner starts a listing before they have the link or the date.
- **Revisit when:** SDC finds that drafts pile up unused, or wants SDC to prepare drafts for partners to finish.

## 6. Close keeps the record; delete removes it
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:**
  - **Close** stops recommending the listing to members and including it in emails, but keeps it on the **Closed** tab (reason **Closed**), for the record and for follow-ups. A closed listing can be reopened with **Reopen**.
  - **Delete** is permanent and meant for mistakes. It asks for confirmation first. Close, reopen and duplicate don't (UX spec, shared rules).
- **Page:** Admin and partner → Opportunities → side panel → **More actions** (⋯) → **Close**, **Reopen** or **Delete**.
- **Affects:** Emails, recommendations, history, and reporting to funders later on.
- **When encountered:** An event is full or cancelled (close), or something was posted by mistake (delete).
- **Revisit when:** SDC needs deletes to be recoverable, or wants partners to be unable to delete listings that were already emailed.

## 7. No recurring events; Duplicate instead
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** There's no repeat schedule. **Duplicate** copies a listing into a new draft titled "Copy of …", which you then edit and publish.
- **Page:** Admin and partner → Opportunities → side panel → **More actions** (⋯) → **Duplicate**.
- **Affects:** How partners post monthly or weekly events.
- **When encountered:** A partner's second run of the same event.
- **Revisit when:** SDC or partners say they post the same event many times a month, and duplicating becomes a chore.

## 8. Partners invite and remove their own colleagues
- **Status:** Decided by owner, 26 Sep 2026. Replaces the earlier assumption that only SDC manages partner contacts.
- **Decision:** Partners manage their own **Team**: **Invite colleague** (name and email), and from each person's ⋯ menu **Resend invitation** or **Cancel invitation** (pending) and **Remove from organization** (active, after a confirmation). Nobody can remove themselves; that option isn't shown on your own row. SDC can still do all of this from Partners. Details in [partners decision 10](./partners.md).
- **Page:** Partner → **Organization** → **Team**.
- **Affects:** How much admin work SDC has when partner staff change, and the partner's control over their own team.
- **When encountered:** A new colleague needs access, or someone leaves the organization.

## 9. Partners can edit their organization's details
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** Partners can edit their organization's **name**, **website** and **short description**. Admins can edit the same fields from Partners.
- **Page:** Partner → **Organization**. Admin → Partners → side panel.
- **Affects:** The name shown on every listing, the partner portal sidebar, and Partners in the admin portal.
- **When encountered:** A partner rebrands or updates their website.
- **Revisit when:** SDC wants to control organization names (for example, to keep the Civic Hub directory consistent), or already keeps these details elsewhere.

## 10. No images or logos
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** Listings are text only. Emails are text-first, and there's nowhere to upload files yet.
- **Page:** Admin and partner → Opportunities → form.
- **Affects:** The email templates and the future members' pages.
- **When encountered:** A partner looks for a way to add an event poster.
- **Revisit when:** SDC's emails or members' pages need images, and there's somewhere to store them.

## 11. No prefill from an Eventbrite link
- **Status:** Superseded by [decision 18](#18-eventbrite-first-for-events) (27 Sep 2026).
- **Decision:** Partners type every field. Prefilling from a pasted Eventbrite link is still being explored. The link field stays prominent so prefill can be added later without redesigning the form.
- **Page:** Admin and partner → Opportunities → form → **Basics** → **Link**.
- **Affects:** How long it takes to post, especially for partners who already use Eventbrite.
- **When encountered:** Every new event.
- **Revisit when:** The prefill spike shows it's reliable, or partners say retyping is what stops them posting.

## 12. The fewest fields each type needs
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** Each type asks only for what emails and recommendations need, following Notion's rule "store only what the feed and email need". Everything else is optional.

  | Type | Required to publish | Optional |
  |---|---|---|
  | Event | Date, Start time, How people attend, Area | End time, Address or venue, Cost (Free/Paid plus Cost details), Accessibility (checkboxes), Accessibility note |
  | Petition | Addressed to | Deadline, Signature goal |
  | Volunteer role | Time commitment, Where volunteers work, Area | Address or venue, Start date, Apply by, Skills, Minimum age |
  | Job | Employment type, Workplace, Area | Address or venue, Pay, Apply by, Qualifications |
  | Other | Call to action | Deadline, up to 5 Details |

  Every type also needs a Title (up to 100 characters), a Short description (up to 280), 1–3 Topics and a link.
- **Page:** Admin and partner → Opportunities → form, in each type's section.
- **Affects:** How long posting takes, what emails can show, and how recommendations can filter.
- **When encountered:** Every new listing.
- **Revisit when:** SDC confirms each type's fields at the 29 September session, especially whether events need capacity or an age range, and whether jobs must include pay.

## 13. A removed partner's listings close with the reason "Partner access removed"
- **Status:** Decided by owner, 26 Sep 2026 (UX spec, Partners → Remove an organization's access). Replaces the earlier **No longer emailed** badge on Live and the **Partner removed** reason.
- **Decision:**
  - Listings have three statuses: **Draft**, **Published** and **Closed**. **Ended**, **Closed** and **Partner access removed** are reasons shown with Closed, never statuses of their own.
  - When SDC removes a partner, its published listings move to **Closed** with the reason **Partner access removed** at once. They're no longer recommended or included in emails. A listing whose date had already passed before the removal keeps the reason **Ended**.
  - People who already got a listing by email can still view it until it ends or one month after removal, whichever comes first. That's a member-side rule ([backend](../backend/opportunities.md#removed-partners)); admins just see Closed with the reason.
  - While the partner is removed, **Reopen** is refused: "This partner no longer has access. Reinvite them before reopening their opportunities."
  - Admins can still find these listings: the **Organization** filter lists removed partners as "{name} (removed)". That label names the organization, not a listing status.
- **Page:** Admin → Opportunities (**Closed** tab, side panel, **Organization** filter).
- **Affects:** Emails, recommendations, the Published and Closed tabs, the partner's published count on Partners.
- **When encountered:** After an admin removes a partner that has published listings.

## 14. Access returning reopens a partner's listings
- **Status:** Decided by owner, 26 Sep 2026 (owner decision 8).
- **Decision:** Reinviting a removed partner doesn't change its listings. When someone accepts and the organization's access returns, its listings closed with **Partner access removed** reopen automatically if their dates haven't passed. Those whose date passed in the meantime stay closed as **Ended**. Listings someone closed by hand stay closed.
- **Page:** Admin → Partners (reinvite); Admin → Opportunities (**Published** and **Closed** tabs).
- **Affects:** What members are recommended and emailed once a partner is back.
- **When encountered:** The first time someone at a reinvited partner accepts their invitation.

## 15. One "Link" field, no https:// needed
- **Status:** Decided by owner, 26 Sep 2026 (UX spec, shared rules → Web addresses).
- **Decision:** Every type's link field is labelled **Link**, with a hint for the type (for example "Where people register, like your Eventbrite or Luma page."). People can type `sdckw.ca` or `https://sdckw.ca`; the listing stores the normalized `https://` address. An invalid entry shows "Enter a web address, like sdckw.ca."
- **Page:** Admin and partner → Opportunities → form → **Basics** → **Link**.
- **Affects:** The form, the side panel's **Link** row, and the stored links used in emails.
- **When encountered:** Every new listing.

## 16. Form errors: inline, summarised, no toast
- **Status:** Decided by owner, 26 Sep 2026 (UX spec, shared rules → Form errors).
- **Decision:** When publishing or saving fails validation, each field shows its error, entered values are kept, a summary at the top of the form ("Fix 2 fields to publish this event") links to each invalid field, and focus moves to the first one. There's no toast for validation errors. The summary stays until the next submit.
- **Page:** Admin and partner → Opportunities → form.
- **Affects:** Every failed publish, save or draft save.
- **When encountered:** Clicking **Publish**, **Save changes** or **Save as draft** with a missing or invalid field.

## 17. The form has three steps: Type, Details, Review
- **Status:** Requested by owner, 27 Sep 2026. Step names, **Next**, **Back** and the Review copy are new and need approval.
- **Decision:** New and edited listings use one full-page form in three steps: **1 Type** (the type and its link; for events, the Eventbrite link first), **2 Details** (organization, title, short description, topics and the type's own fields) and **3 Review** (a read-only preview of the listing as it appears in members' emails: title, date and area, short description, topics and the button, with **Edit type and link** and **Edit details**). A step indicator reads "1 Type · 2 Details · 3 Review". **Back** and **Next** move between steps without losing anything; the step isn't in the page address. **Save as draft** (or **Save changes** once published) is on every step; **Publish** is on Review. If publishing fails validation, the form opens the step with the first invalid field and shows the error summary there; its links open other steps too.
- **Page:** Admin and partner → Opportunities → **New opportunity** or **Edit**.
- **Affects:** Every new and edited listing; the error-summary rule in decision 16 now spans steps.
- **When encountered:** Every time someone posts or edits a listing.
- **Revisit when:** Partners find three steps slower than one page for short listings like petitions.

## 18. Eventbrite first for events
- **Status:** Requested by owner, 27 Sep 2026. A spike: the dev version returns made-up details. Label, hint, button and messages are new and need approval.
- **Decision:** For events, the first field after **Type** is **Eventbrite link (optional)** with a **Fill in details** button. It fills the title, short description, date, start and end times, area and address, and uses the Eventbrite page as the **Link** if that's empty. It overwrites those fields, and a toast says to check them on the next step. It accepts eventbrite.ca and eventbrite.com event pages only. The real version reads the event from the Eventbrite API ([backend](../backend/opportunities.md#eventbrite-prefill)).
- **Page:** Admin and partner → Opportunities → form → **Type** step (events).
- **Affects:** How fast partners who already use Eventbrite can post. Replaces decision 11.
- **When encountered:** Posting an event.
- **Revisit when:** The API spike shows which fields Eventbrite returns reliably (for example, the area from the venue's city).

## 19. Structured fields instead of free text, for matching
- **Status:** Requested by owner, 27 Sep 2026. The option lists are proposals until SDC confirms its tags at the 29 September session; they need approval.
- **Decision:** Fields that emails and recommendations match on are chosen from fixed lists:
  - **Area** (event, volunteer role, job; required to publish): Kitchener, Waterloo, Cambridge, North Dumfries, Wellesley, Wilmot, Woolwich, Online / remote. Choosing an online or remote format fills in Online / remote. **Address or venue** stays optional free text, hidden for Online / remote. Replaces the free-text **Location**.
  - **Time commitment** (volunteer role; required to publish): Under 2 hours a week, 2–5 hours a week, 5+ hours a week, One-time. It replaces the old **Commitment** (One-time/Ongoing) choice, which it made redundant.
  - **Skills** (volunteer role; optional, any number): No experience needed, Driving, Languages, Tech, Childcare, Cooking, Writing, Event setup.
  - **Accessibility** (event; optional checkboxes): Step-free access, Accessible washroom, ASL on request, Childcare, Quiet space, plus an optional **Accessibility note**.
  The dev seed was migrated to these values.
- **Page:** Admin and partner → Opportunities → form → **Details** step; the side panel.
- **Affects:** Matching members by area, time, skills and access needs; what emails can say.
- **When encountered:** Posting an event, volunteer role or job.
- **Revisit when:** SDC confirms its location, commitment, skill and accessibility tags.

## 20. Each type has its own tag color in the table
- **Status:** Requested by owner, 27 Sep 2026.
- **Decision:** The table has a **Type** column (with the Type filter) showing a colored tag: the type's icon and name in one of five category colors (Event 1, Petition 2, Volunteer role 3, Job 4, Other 5). Color is never the only signal: the name is always there. The kind text under each title is gone. The table's rows are one line with fixed column widths; long titles end in "…" and show in full on hover. **Updated** became **Last change**, reading "Created {when}" or "Edited {when}" (new copy, needs approval). The search box moved to the page header. The open panel is in the page address (`?opportunity=<id>`), so a link opens it.
- **Page:** Admin and partner → Opportunities (list).
- **Affects:** Scanning the list by type; sharing a listing with a colleague.
- **When encountered:** Every visit to Opportunities.

## 21. Topics are capped at 3 in the form
- **Status:** Decided by owner, 27 Sep 2026 (the disabled reason is the owner's words; "{n} of 3 selected" is new and needs approval).
- **Decision:** "{n} of 3 selected" shows beside **Topics**. Once 3 are chosen, the other topics are unavailable, and pointing at or focusing one shows "You can choose up to 3 topics. Unselect one to choose another." The server still refuses more than 3.
- **Page:** Admin and partner → Opportunities → form → **Details** step → **Topics**.
- **Affects:** Keeps recommendations focused; replaces the server-only "Choose up to 3 topics." error.
- **When encountered:** Choosing a fourth topic.

## 22. Hints only where they prevent a mistake
- **Status:** Requested by owner, 27 Sep 2026.
- **Decision:** The form keeps a hint only where it prevents a mistake: the **Link** (where people take part, per type), the **Short description** (it's for the email), the **Eventbrite link**, the type description, **Call to action**, and deadlines ("It closes after this day."). Title and the other fields have none; a field without "(required)" is optional, so "Optional." hints are gone. Hints and character counters share one line.
- **Page:** Admin and partner → Opportunities → form.
- **Affects:** How long the form looks and reads.
- **When encountered:** Every listing.

## 23. One "Closes" date column, and reach in the table
**What:** The list's date column is **Closes**: the event date (with start time), deadline or apply-by date, same format for every type. **Sent to** and **Clicks** columns sit after the title on Published and Closed. The title column stays frozen when the table scrolls sideways, and each row ends in an arrow to show it opens the panel.
**Why:** The owner scans for "when does this close" and "did it reach people". Type-specific wording ("Apply by", "Closes") made the dates hard to scan.
**Affects:** Both portals' Opportunities lists. Needs `performance` from the backend (backend/opportunities.md).

## 24. The panel leads with when and how it performed
**What:** The panel shows the date on one line, then **Sent to** and **Clicks** tiles, then the summary and topics, then a **Details** list (posted by, link, kind-specific fields). Event date, start and end are one line. A published listing closing within 7 days that hasn't been emailed shows a warning.
**Why:** Admins rarely attend; they check reach, topics and timing first.

## 25. Panel layout, round two (owner, 28 Sep 2026)
**What:** The panel header is the name, the description right under it, then status and type badges (the table's styles) and topic badges (plain outline, same size). Below: **Sent to** and **Clicks** tiles, with the click rate in brackets beside the count. The date is the first row of **Details** ("Wed, Oct 7 · 6:30 p.m. – 9:00 p.m. · In 9 days"). The footer shows Open link, Duplicate, Close/Reopen and Delete (red) as secondary icon buttons with tooltips, and **Edit** as the primary button; there's no ⋯ menu. Panels are 480px wide.

## 26. Type step, event details and review, round two (owner, 28 Sep 2026)
**What:**
- A real stepper (numbered circles joined by lines; done steps show a check).
- Type is a set of cards (icon and name only); the step heading is the only "Type" label.
- One **Link** field, required for every type. Volunteer roles and jobs say **Link or email** and accept an email address. An event's link that is an Eventbrite page offers **Fill in details** (sparkle icon); there is no separate Eventbrite field.
- Events: online events ask for no place; in person and hybrid ask only for **Area** (no address, no meeting link). No type has an address or venue field.
- Paid events give **From ($)** and optional **To ($)**: one price or a range, matched against members' budgets.
- Drafts never need an area. The review preview shows the email: title with the type badge, description, when / where / hosted by, then **Register** (or the type's action) and **Send to a friend**. Topics aren't shown; they decide who gets the email.
**Why:** The owner found the old step confusing and the address unused; a link click is how a listing's success is measured.
Round three (owner, 28 Sep): the stepper is a thin three-segment bar with "1 Type" labels (Calendly, fal, Higgsfield), no filled circle. The Type step has no visible heading. Type cards use each type's category colour: an icon tile, a blurred glow placed differently on each card that drifts on hover, a lift on hover, and when selected the light fill with the tile one shade darker. An Eventbrite link shows the Eventbrite mark in their brand orange with a primary **Fill in details** button.
Round four (owner, 28 Sep): type cards are compact rows (icon tile beside the name, no descriptions, no glow). On hover a 1px border draws itself around the card in the type's light (200) shade; selected keeps the fill, accent border and check. The stepper's segment fills like a loading bar, and each step's content rises and fades in.
Form action bar (owner, 28 Sep): the primary action (Next, Publish or Save changes) sits at the far right with **Back** just left of it; **Cancel** and **Save as draft** sit apart on the left. Enter in a field presses the primary button. Type cards have even padding on every side, and the icon tile's corner radius is smaller than the card's so the corners nest.
Eventbrite fill (owner, 28 Sep): **Fill in details** moves straight to Details, where a band in Eventbrite orange sweeps down the step and each field glows briefly as it's filled.
Enter in an event's Eventbrite **Link** runs Fill in details (validating the link); the scan pauses 300ms, then sweeps down over 4s (`--delay-scan`, `--duration-scan`).
Scan detail (owner, 28 Sep): a 2px glowing line; fields start empty and each fills in (text appears with a brief glow) as the line passes it.
Eventbrite fill, round three (owner, 28 Sep): Details opens at once with the line bobbing at the top while Eventbrite answers (at least 300ms, at most 5s, then 'Timed out. Couldn't fetch details from Eventbrite.' and back to the link). The line then sweeps down over 3s and the page scrolls with it. After a fill Details is split: From Eventbrite first, Add the rest (organization, topics, cost, accessibility) at the bottom. Step headings take focus without a ring.
Scan, round four (owner, 28 Sep): the line only sweeps From Eventbrite (never Add the rest), and it's Eventbrite orange only: a 3px core brightening to full orange, then five halos stepping out through translucent orange to its lightest tint, each wider and softer (largest blur 128px).
Action bar (owner, 28 Sep): Cancel and Save as draft (and Save changes on published listings) are outline buttons; no success toast after an Eventbrite fill.
Form errors (owner, 28 Sep): changing a field clears its error inline and in the summary (the count updates; the summary disappears when all are fixed) until the next save attempt re-checks. Partner Opportunities search reads "Search by title" (partners only see their own organization's listings).
Images (owner, 28 Sep): "the ability to add an image is very, very important." Every listing can have one optional image (JPG, PNG or WebP; the browser scales it to 1200px wide). It shows on partner cards, at the top of the Review preview (the email) and in the details panel. Partner Published and Drafts are image-led cards with only type, title, closing date and one status line (reach, or last change for drafts); Closed stays a table because it grows long. Admin lists stay tables.
Type cards (owner, 28 Sep): the hover border draw stays, drawn over the grey border in the 500 shade of the type's colour (200 lighter than its icon; `--color-category-N-line`); the border is 1px in every state (rest, hover, selected), never 2px.
Image shapes (owner, 28 Sep): the browser shrinks any large image (longest side 1600px). Shapes beyond 8:1 or 1:8 are refused with a message; anything else is kept as is. Cards and the details panel are always exactly 16:9: the whole image sits inside a 4px taupe matte (taupe-100 via `--color-bg-hover`), with taupe bars filling any leftover width or height; the email shows it at its own shape. The empty image field is a full-width dashed drop zone like the other fields' width.
Form density (owner, 28 Sep): 32px between fields and above each section divider; character counters appear only in the last 25% of a limit; fewer hints (no image hint, a shorter Short description hint, no "From ($)" hint, no "Add the rest" line); the empty image field has a taupe ground (taupe-50, taupe-100 on hover). Cost, From ($) and To ($) sit on one line and wrap on narrow screens. Images on cards, the panel and the form preview have 4px corners inside the taupe matte.

Unsaved work (owner, 28 Sep): no "leave page?" warning. The form keeps unsaved work in the browser; coming back restores it with a toast ("We restored your unsaved changes.") and a **Discard** action. It's cleared once the listing saves.
Broken images (owner, 28 Sep): an image that fails to load falls back to the type's colour and icon on cards, and isn't shown in the panel, the Review preview or emails.
Scan, round five (owner feedback, 28 Sep): the layered halos read as a lightsaber. Now one simple 2px line in a brighter orange (`--color-eventbrite-bright`) with a single soft, sun-like radial glow.
Drafts, round two (owner, 28 Sep): the restore toast says when: "We restored your unsaved changes from today at 3:42 p.m." (or yesterday, or a date). Clicking **Cancel** is an explicit discard: it clears the saved draft too.
