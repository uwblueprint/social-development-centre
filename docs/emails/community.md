# Community emails: drafts

Drafts for the four Community emails. Placeholders in `{braces}`. **Before sending:** confirm the paid benefits and access link, and which system sends each email so nobody gets duplicates (see [backend requirements](../backend/community.md)).

---

## 1. General welcome
**Sent when:** a new general member is added with **Add members** (one person or a file), or signs up at a booth with the sign-up kiosk (not during the initial backfill, not when someone is resubscribed, and not when an existing email signs up at the kiosk again).
**Open question (27 Sep):** booth and legacy sign-ups start as **Invited** (onboarding not started), so this email should also invite them to finish setting up their preferences. Add a {finish setting up link} once onboarding exists.
**Subject:** Welcome to the Social Development Centre community

Hi {name|there},

You're now on the Social Development Centre community list. About {frequency}, we'll email you opportunities from SDC and our partner organizations: volunteering, programs, events and jobs in your community.

You don't need an account to get these emails.

Don't want them? Use the unsubscribe link at the bottom of any email, and we'll stop right away.

The Social Development Centre team

---

## 2. New paying-member welcome
**Sent when:** someone who wasn't already a member is added with **Make them paying members** (or **Make them a paying member**) checked.
**Subject:** Welcome to the Social Development Centre: your membership is active

Hi {name|there},

Welcome to the Social Development Centre. You're now a paying member, which means you get:

- **Community emails:** about {frequency}, opportunities from SDC and our partners.
- **Member benefits:** {paid benefits, confirmed with SDC}.

**Get started:** [Access the member platform]({access link})
{One line on how sign-in works, per the Authentication PRD.}

You can unsubscribe from emails at any time with the link at the bottom of any email. Your membership stays active if you do.

The Social Development Centre team

---

## 3. Paying membership added
**Sent when:** an existing general member is converted to a paying member (**Convert to paying member**, or re-added with the paying checkbox checked). Not sent to someone who is unsubscribed; they get paying access without an email. After a successful send the admin sees "Paying member email sent."
**Subject:** Your Social Development Centre membership is now active

Hi {name|there},

Good news: your account now includes paid membership. You'll keep getting our community emails, and you now also have:

- {paid benefits, confirmed with SDC}

**Get started:** [Access the member platform]({access link})

The Social Development Centre team

---

## 4. Paying access removed
**Sent when:** an admin chooses **Remove paying access** (not when they unsubscribe). Not sent to someone who is unsubscribed.
**Subject:** Your Social Development Centre membership has ended

Hi {name|there},

Your paid membership with the Social Development Centre has ended, so member benefits like {benefit} are no longer available.

You'll still get our community emails about opportunities. If you'd rather not, use the unsubscribe link at the bottom of any email.

Questions? Reply to this email or contact {SDC contact}.

The Social Development Centre team

---

## No email: deleting someone
**Delete member** (for data-removal requests) sends nothing. The person is also deleted from the email provider, so no later email can reach them. Unsubscribing sends nothing either.
