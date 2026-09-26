# Opportunities: decision log

We built Opportunities while SDC wasn't available to answer questions, so every entry below is an **assumption that SDC hasn't confirmed yet**. Each one is cheap to reverse. The questions and the reasoning behind them are in [plan/opportunities-and-partner-portal.md](../plan/opportunities-and-partner-portal.md). Most of them go to the 29 September discovery session.

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

## 2. No review step before a partner listing goes live
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** Partners publish straight to **Live**. Admins can edit, close or delete any listing afterwards. Notion marks review as P2/TBD.
- **Page:** Partner → Opportunities → form → **Publish**. Admin → Opportunities (every listing is editable).
- **Affects:** When a partner's listing can reach emails, and how much work the Civic Hub coordinator has.
- **When encountered:** Every time a partner clicks **Publish**.
- **Revisit when:** SDC wants to approve partner listings first. That adds a status between draft and live, a queue for admins, and a "waiting for review" label for partners.

## 3. Whoever posts chooses the topics
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** The person posting picks **1 to 3 topics**. At least one is required to publish. The topic list is a placeholder (11 topics in `catalog.ts`) until the taxonomy session on 29 September. Topic IDs stay the same if labels change.
- **Page:** Admin and partner → Opportunities → form → **Basics** → **Topics**.
- **Affects:** Who receives each opportunity by email, follow-ups, and the future members' feed.
- **When encountered:** Every publish.
- **Revisit when:** SDC delivers its taxonomy, or wants SDC staff to tag partner listings instead (which suggests a review step, see 2). If 3 topics proves too few or too many, change `MAX_TOPICS`.

## 4. When a listing leaves the feed
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:**
  - **Events** end at their start time (Notion, 24 September).
  - **Petitions and Other** end when their **Deadline** day is over. **Volunteer roles and Jobs** end when their **Apply by** day is over.
  - A listing with no deadline stays live until someone closes it.
  - An ended listing moves to **Closed** by itself and shows **Ended**. You can't publish or reopen a listing whose date has already passed.
- **Page:** Admin and partner → Opportunities → **Live** and **Closed** tabs.
- **Affects:** Tab counts, emails and the feed, and the partner's live count on Partners.
- **When encountered:** The moment a date passes; when someone tries to reopen or publish a listing with a past date.
- **Revisit when:** SDC wants events to stay visible until they finish, wants a grace period, or wants undated listings to expire after a set time.

## 5. Drafts exist and need only a title
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** **Save as draft** needs only a **Title**. Members never see drafts; only people who can edit the listing do. **Publish** checks every required field. Drafts never expire.
- **Page:** Admin and partner → Opportunities → form footer; the **Drafts** tab.
- **Affects:** The form's buttons, the **Drafts** tab, and what "required" means.
- **When encountered:** A partner starts a listing before they have the link or the date.
- **Revisit when:** SDC finds that drafts pile up unused, or wants SDC to prepare drafts for partners to finish.

## 6. Close keeps the record; delete removes it
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:**
  - **Close** takes a listing out of emails and the feed but keeps it on the **Closed** tab, for the record and for follow-ups. A closed listing can be reopened with **Reopen**.
  - **Delete** is permanent and meant for mistakes. It asks for confirmation first.
- **Page:** Admin and partner → Opportunities → side panel → **More actions** (⋯) → **Close**, **Reopen** or **Delete**.
- **Affects:** Emails, the feed, history, and reporting to funders later on.
- **When encountered:** An event is full or cancelled (close), or something was posted by mistake (delete).
- **Revisit when:** SDC needs deletes to be recoverable, or wants partners to be unable to delete listings that were already emailed.

## 7. No recurring events; Duplicate instead
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** There's no repeat schedule. **Duplicate** copies a listing into a new draft titled "Copy of …", which you then edit and publish.
- **Page:** Admin and partner → Opportunities → side panel → **More actions** (⋯) → **Duplicate**.
- **Affects:** How partners post monthly or weekly events.
- **When encountered:** A partner's second run of the same event.
- **Revisit when:** SDC or partners say they post the same event many times a month, and duplicating becomes a chore.

## 8. Partners can't invite or remove colleagues
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** Only SDC invites and removes partner contacts (as in [partners decision 4](./partners.md)). The partner portal shows the **Team** read-only.
- **Page:** Partner → **Organization**.
- **Affects:** How much admin work SDC has when partner staff change, and the partner's control over their own team.
- **When encountered:** A partner contact leaves or a new colleague needs access.
- **Revisit when:** SDC finds invite requests are a burden and trusts partners to manage their own team.

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
- **Affects:** The email templates and the future feed.
- **When encountered:** A partner looks for a way to add an event poster.
- **Revisit when:** SDC's emails or the members' feed need images, and there's somewhere to store them.

## 11. No prefill from an Eventbrite link
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** Partners type every field. Prefilling from a pasted Eventbrite link is still being explored. The link field stays prominent so prefill can be added later without redesigning the form.
- **Page:** Admin and partner → Opportunities → form → **Basics** → the link field (**Registration link** for events).
- **Affects:** How long it takes to post, especially for partners who already use Eventbrite.
- **When encountered:** Every new event.
- **Revisit when:** The prefill spike shows it's reliable, or partners say retyping is what stops them posting.

## 12. The fewest fields each type needs
- **Status:** Assumption — not yet confirmed with SDC.
- **Decision:** Each type asks only for what emails and the feed need, following Notion's rule "store only what the feed and email need". Everything else is optional.

  | Type | Required to publish | Optional |
  |---|---|---|
  | Event | Date, Start time, How people attend, and Location unless online | End time, Cost (Free/Paid plus Cost details), Accessibility |
  | Petition | Addressed to | Deadline, Signature goal |
  | Volunteer role | Commitment, Where volunteers work, and Location unless remote | Start date, Time commitment, Skills or experience, Minimum age, Apply by |
  | Job | Employment type, Workplace, and Location unless remote | Pay, Apply by, Qualifications |
  | Other | Call to action | Deadline, up to 5 Details |

  Every type also needs a Title (up to 100 characters), a Short description (up to 280), 1–3 Topics and a link.
- **Page:** Admin and partner → Opportunities → form, in each type's section.
- **Affects:** How long posting takes, what emails can show, and how the future feed can filter.
- **When encountered:** Every new listing.
- **Revisit when:** SDC confirms each type's fields at the 29 September session, especially whether events need capacity or an age range, and whether jobs must include pay.
