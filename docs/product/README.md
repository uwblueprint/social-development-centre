# Product context: Second Yes

Read this before designing anything. It condenses the Notion workspace (UW Blueprint Home → Social Development Centre) as of 26 September 2026. Notion is the source of truth. If this file disagrees with it, Notion wins; update this file.

## The client
Social Development Centre Waterloo Region (SDC) is a Kitchener social-planning organization founded in 1967. Its pillars are Housing & Homelessness, Grassroots Infrastructure and Lived Expertise. It runs **Civic Hub Waterloo Region**, which has 55+ partner groups: grassroots groups and small nonprofits that can book free space and share SDC's infrastructure. Its mission is participation: "advance community through participation and knowledge."

## The problem we're solving
> When someone says yes to one Civic Hub opportunity, nothing turns that yes into a second one, and nothing helps them bring someone. SDC is the only organization positioned to run that step across all 55+ partner groups, and today no one does.

- **The email list performs at sector benchmark.** About 900 subscribers produce about 30 clicks per newsletter, which lead to 5–6 signups per event. Optimizing the newsletter is not the lever.
- **The loss happens after the click.** Registration lives on partners' Eventbrite, Luma, Zoom or Google Forms. SDC can't see who registered, who attended or who came back.
- **Intake is manual.** The Civic Hub coordinator receives opportunities by email and form, reformats them by hand, and sends them to everyone.

## What we're building (priorities from the "Second Yes" decision)
| Priority | Capability | What it means for the UI |
|---|---|---|
| P0 | Close the loop after every event: a follow-up within 48 hours with one next action | Opportunities need a topic and a date, so follow-ups can pick a related next step |
| P0 | Personal invitations: every email asks "Who would you bring?" and gives a personal share link | Every opportunity needs an external action link |
| P1 | **Lightweight opportunity hub**: partners submit an opportunity; SDC can create one on a partner's behalf; every opportunity needs a topic | **Opportunities (admin) and the partner portal. This is what we're building now.** |
| P1 | Interest profile from stated and observed behaviour | Topics must be a controlled list |
| P1 | Send each opportunity to the segment that cares | The structured fields feed email templates |
| P2 | Members' feed and digest | Uses the same opportunity records |

## Hard product constraints
- **We don't host events or registrations.** Partners keep their tools, and every opportunity points out to an external link. The hub routes opportunities; it doesn't host them.
- **Participants don't browse a public site.** Email is the participant surface, and the hub is internal.
- **We don't add a second SDC registration form.**
- **No points, streaks or leaderboards.**
- **Store only what the feed and email need**: title, time, location, short description, topics and the partner's link. Full detail stays on the partner's page (24 September scope update).
- **Don't freeze one event-shaped form for every kind of action.** An event's date and accessibility differ from a petition's deadline or a job's qualifications.
- **Dated listings expire.** An event stops showing at its start time. Cancelled or stale listings need a way to edit or close them.
- **Stack:** Next.js, TypeScript, next-yak, Supabase (data plus auth, likely magic links) and an in-house sender such as Resend. The meeting notes say Mailchimp is the delivery layer; that still needs to be reconciled with Resend.

## Open with the client (September 29 discovery session)
- The actual opportunity types SDC promotes, with the common and type-specific details for each.
- The topic taxonomy and the other matching tags: location, accessibility, format, commitment.
- Who enters, corrects and expires each field: SDC or the partner.
- Whether SDC wants a review step before a partner listing goes live. This is P2 and still to be decided.
- Which opportunity types could ever be member-first. The notes say petitions and Council delegations must always be open.

## Sources (Notion)
- The SDC project page, the Product Requirements database, the Product Flows database, "Client meeting 1" (8 September), the "September 29 client sync questions", and "Tech Stack Brainstorm" (22 September).
- The "Second Yes" product decision and research artifact linked from the project page.
