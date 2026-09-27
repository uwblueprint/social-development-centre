# Opportunities: decision log

We built Opportunities while SDC wasn't available to answer questions, so most entries below are **assumptions that SDC hasn't confirmed yet**. Entries marked "Decided by owner" are confirmed. Each one is cheap to reverse. The questions and the reasoning behind them are in [plan/opportunities-and-partner-portal.md](../plan/opportunities-and-partner-portal.md). Most of them go to the 29 September discovery session.

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
- **Status:** Assumption — not yet confirmed with SDC.
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
  | Event | Date, Start time, How people attend, and Location unless online | End time, Cost (Free/Paid plus Cost details), Accessibility |
  | Petition | Addressed to | Deadline, Signature goal |
  | Volunteer role | Commitment, Where volunteers work, and Location unless remote | Start date, Time commitment, Skills or experience, Minimum age, Apply by |
  | Job | Employment type, Workplace, and Location unless remote | Pay, Apply by, Qualifications |
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
