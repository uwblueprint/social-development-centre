# Users

One section per user type. Read the section for a user before designing for them.

## SDC admin

### Who they are
- **2–10 staff.** One person's full-time job is managing Civic Hub opportunities and inbound requests: the Civic Hub coordinator.
- **No fundraising or volunteer manager, and very little staff time.** In 2026 SDC is also searching for a new Executive Director.
- **They have the most access of any user:** member data, communications, partner access and analytics.

### What they do today
- **Receive opportunities from partners by email** and through two Google Forms. They reformat each one by hand and put about 10 per monthly Mailchimp newsletter to about 900 people.
- **Send volunteer requests through a Google Group,** with no way to track responses. In one case they found ten volunteers for a group and one responded.
- **Have no view past the click.** They can't see who registered, who attended, who came back, or who brought someone. That means they can't show funders how many connections they create.

### What they need from the product
1. **An intake queue that replaces the inbox.** Review, edit, tag and publish partner opportunities.
2. **Create or fix a listing on a partner's behalf.** This is simpler than requiring every partner to use the portal perfectly.
3. **Require a topic on every opportunity** so it can reach the right people and power the follow-up.
4. **Manage who has access:** invite, edit and remove partners, and manage general and paying members.
5. **See what happened:** clicks on opportunity links first, then attendance and returns, exported as CSV for funders.

### Design implications
- **Optimize for the 10th use, not the first.** Dense tables, one primary action per panel, everything else behind a ⋯ menu.
- **Anything a partner can do, an admin can do for any organization,** including posting as SDC itself.
- **Close, don't only delete.** Stale and cancelled listings need a quick edit or close path; hard delete is for mistakes.
- **Keep the history.** Who last changed a listing matters when both SDC and the partner edit it.

### Open questions
- What does the coordinator's week actually look like? A time audit or a shadowing session is still pending.
- Does SDC want to review partner listings before they go live? This is P2 and still to be decided. **Assumption:** there is no review step, and listings go live when the partner publishes them.

## Civic Hub partner

### Who they are
- **55+ grassroots groups and small nonprofits in the Civic Hub network.** About 50 will be invited. Some are engaged; many aren't.
  - Real examples: Willow River Centre, Adventure4Change, Waterloo Region Community Garden Network, KW Community Coop Kitchen, Women of Dignity International.
- **Often volunteer-run with little tech capacity.** They host on Eventbrite, Luma, Zoom, Google Forms or paper.
- **One organization is not one person.** Several people may post for the same group, using personal work emails or a shared inbox. People leave, and organizations get renamed or dissolve.
- **They get access when SDC or a colleague at their organization invites them.** There is no public signup. Magic-link sign-in is the working assumption.

### What they post
- Events: film screenings with a panel, community meetings, workshops.
- Petitions, such as a safe-tenting framework brought to Regional Council.
- Volunteer roles.
- Jobs.
- Other asks: surveys, programs, calls for input.

### What they get from SDC
- **Audience fit, not reach.** SDC's ~900 are warm, mission-aligned people who sorted themselves by topic. A public Eventbrite listing has more theoretical reach and almost no conversion for grassroots civic events.
- **Cross-network follow-up** that no single partner can run.
- **Measurement they don't have today.** Who's coming, so they can welcome people, and later how their listings performed (P2).

### What they need from the product
1. **Post in under two minutes.** A title, a short description, the key date, a topic, and the link people should go to. Everything else is optional.
2. **See and manage their own listings:** edit, close when full or cancelled, and duplicate a recurring event.
3. **Keep their organization's details current** without it becoming a new chore.

### Design implications
- **Every required field must earn its place.** If the feed and email don't need a field, it's optional or it lives on the partner's own page.
- **A form shaped for the type.** An event asks for a date and location; a petition asks for who it's addressed to and a deadline; a job asks for pay and how to apply.
- **Plain language and no jargon.** Many partners are volunteers who post a few times a year.
- **Partners only ever see their own organization.** They can't see members, other partners or analytics.

### Open questions
- Which types will partners actually publish, and what minimum fields can they supply every time? To be answered at the 29 September session.
- Who keeps the logo, contact details and categories current? Avoid a new maintenance chore if SDC already holds the data.
- ~~Can partners invite their own colleagues?~~ **Decided by owner, 26 Sep 2026:** yes. Partners invite and remove colleagues in their own organization (see [decisions/partners.md](decisions/partners.md) decision 10).

## Community member (subscriber)

### Who they are
- **About 900 people on SDC's email list.** The December 2025 newsletter said "800+".
- **They come from** booths at Kitchener Market and similar spaces, SDC's website, word of mouth (schools) and partner events. Social media hasn't worked as a source.
- **Commitment is low and email is the only surface.** They don't need an account and shouldn't need one.
- **Two groups behave differently:**
  - **Legacy subscribers** are cold and low intent. The best signal about them is their click history, not a survey.
  - **Event entrants** are at peak intent for about 48 hours after their first event. Today they get nothing until the next monthly newsletter.

### How they behave
- **They treat the newsletter like a buffet.** They pick one or two of the ~10 items.
- **The numbers:** about 25% open, 3–4% click-through (at benchmark), and 5–6 signups per event.
- **"No one asked me" is the top reason people don't volunteer:** 45–49% of Canadian non-volunteers say it. Personal asks work; mass broadcasts barely do.

### What they need
- **Fewer, more relevant opportunities**, sent close to the opportunity rather than on the monthly schedule.
- **One clear next step** after they take part.
- **An easy way to invite someone they know:** a personal share link they can send by text or WhatsApp.
- **One-click unsubscribe** that is respected immediately.

### Design implications for opportunity data
- **The title, short description, date and link are what an email shows.** Write the form's hints so partners produce email-ready copy.
- **The topic decides who hears about an opportunity.** A missing or wrong topic means the right people never see it.
- **The primary action link goes straight to the partner's registration page.** There is no SDC form in between.

## Paying member

### Who they are
- **120–150 people** paying $5–60, pay-what-you-can, by e-transfer. There is no form today, and fees aren't receipted.
- **More committed than subscribers.** Membership currently runs on personal relationships.
- **They lapse from disengagement and forgetting** (about 50% and 29% of lapses), not price (about 24%).

### What they get (planned)
- **P2:** a members-only feed of current opportunities, a digest every two weeks, and closer matching from richer preferences.
- **Access has to be low friction.** The feed protects an entitlement, not sensitive data.

### Constraints
- **Gating conflicts with SDC's mission.** Petitions, Council delegations and other civic actions must never be members-only. At most, members could get early access to events with limited capacity. SDC still has to draw this line.
- **Receipting risk.** Tangible software benefits may turn a receiptable donation into a fee. This needs sign-off from SDC's finance lead.

### Design implications for opportunity data
- **Every opportunity SDC or a partner publishes feeds the members' view later.** Keep the fields structured (dates, format, location, topics) so the feed can filter them.

## Invited friend

### Who they are
- **Someone who got a personal share link** from a participant, before or after an event, by text, WhatsApp or whatever channel they already use.
- **They have no SDC relationship yet** and no account.

### Their journey
1. They open the link, which records the referral.
2. They go straight to the partner's existing registration page.
3. If they join SDC's audience, their record is tagged with the person who referred them.

### Design implications for opportunity data
- **The link is the product.** Every opportunity needs a working external action link.
- **Nothing between the link and the partner's page asks for their details.**
