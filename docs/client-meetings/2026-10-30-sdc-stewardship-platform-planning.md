# SDC Stewardship Platform Planning

- **Date:** Friday, 30 October 2026, 12:02 to 2:37 PM (Eastern)
- **Who:** Suhanya Ketheeswaran, Sarah Ranco (SDC), Gaurav Shah, Jesse Huang, Carolyn Zhang (Blueprint)
- **Source:** [Wispr Flow notes](https://notes.wisprflow.ai/shared/L1Y9iLiU9hyyKJSdlHzJpw2-xBx0LAmgCrVkN6lhMmg)

## Summary

SDC and Blueprint aligned on sending the member survey now, using the $3,000 budget, demoed automatic emails and the editor, and agreed the platform can extend to donors, CivicHub members, and volunteers.

### Budget Allocation
- Board may provide about a $3,000 budget for the project.
- CRM costs estimated at most $30 a month over 5 years, about $1,800, leaving $1,200 to spare.
- Landing page is already covered by the project, so no budget is needed for it.

### Member Survey (Ride for Refuge Forms)
- Two forms segment existing members from new Ride for Refuge riders offered complimentary membership.
- Responses and drop-off analytics go to a database, are exported to Excel, then migrated to the platform by December.
- Intro message can be edited to drop the ride reference; later the survey becomes an automated intake email.
- Responses will auto-tag members (e.g. housing) and also appear in the profile timeline.

### Prototype Feedback and Membership Model
- Expiry date showed October 26 instead of a year from signup; likely a prototype bug.
- Monthly auto-renewing membership weighed against annual: helps retention but raises cancellation and quorum questions.
    - Renewal reminder emails add transparency but invite cancellations
    - Sarah Ranco flagged fluctuating voting membership affecting AGM quorum
- Payment handling (currently EMTs, ideally PayPal or Square) parked until next week.
- Timeline will stay manageable via search, filters by type, and loading more on scroll.

### Email Replies and Tool Scope
- Carolyn Zhang advised against importing inbox replies: security risk and effectively rebuilding Gmail.
- Manual copy-paste of important replies into the timeline is possible but does not scale.
- Sarah Ranco suggested flagging sent emails that need a response for follow-up.
- Gaurav Shah open to a cancel button variable in the email editor (from user notes).

### Demo and Stewardship Extension
- Automatic emails: name, template, join conditions, timing incl. months, tag-based recipient rules, optional review via outbox.
    - Review email alert recommended off by default
    - Must unpublish to edit; unpublished emails stop sending
- Email editor: subject variables, formatting, images, attachments; standard footer with unsubscribe link edited in settings.
- Platform can extend to donors, CivicHub members (Rithika's spreadsheet), and volunteers via tabs on members page.

### Next Steps
- (Gaurav Shah) Share an update on payment processing research next week
- (Gaurav Shah) Send test emails to SDC staff to preview how system emails look
- (Suhanya Ketheeswaran) Send the member survey emails with the form links
- (Suhanya Ketheeswaran) Discuss monthly vs annual membership, cancellation, and quorum at next week's ad hoc
- (Suhanya Ketheeswaran) Gather real member communication use cases the product does not support
- (Suhanya Ketheeswaran) Ask Rithika how CivicHub members should be added to the platform

### Decisions Made
- Remaining $1,200 of the budget goes to marketing the membership program, such as community outreach and tabling.
- Member survey goes out now rather than waiting a week to send through the CRM.
- Emails send directly from the system as plain text, not through Mailchimp.
- Tool scope stays on bulk and automated member emails; no inbox integration for replies.
- Donors and CivicHub members will be added manually; no extra landing page.

## Transcript

Jesse Huang: Ugh.
Gaurav Shah:  Is messy.
Jesse Huang:  Bro, I'm just— I'm just going to kill myself.
Gaurav Shah:  Oh great. What happened? What happened to the cheese?
Gaurav Shah:  What did one—
Jesse Huang:  Huh? Oh, no, no, not that. Like, did you read—
Gaurav Shah:  Oh, up to 12:30. My bad.
Jesse Huang:  Oh, yeah.
Gaurav Shah:  Did I read what?
Jesse Huang:  Did you read your— your— your text?
Gaurav Shah:  Uh.
Jesse Huang:  Within the last, uh, 20 minutes.
Gaurav Shah:  The one with Sean?
Jesse Huang:  Yeah.
Gaurav Shah:  Yeah.
Jesse Huang:  Ah.
Gaurav Shah:  I mean, I think he's going to leave anyway. I— I also think it's at a point where, like, is retaining him actually going to help? Also, I really hope that Suhanya doesn't join, but I'm just going to—
Jesse Huang:  What's wrong?
Gaurav Shah:  I just got out of the shower. Um, but what was I going to say? Um, I think we're at a point where, like, even if Suhan joins back, he's not going to join back with the full force because, like, it's like, um, you know, like in a friendship if someone fucks up?
Gaurav Shah:  Like, you can never be the same level of friends again.
Jesse Huang:  Yeah. Like—
Gaurav Shah:  Hi, Suhanya.
Suhanya Ketheeswaran:  Morning. How are you?
Jesse Huang:  Pretty good, yeah.
Gaurav Shah:  How are you?
Suhanya Ketheeswaran:  Good, thank you. Or good afternoon, sorry. It's already—
Jesse Huang:  Just a— three minutes ago.
Gaurav Shah:  Um, but yeah, I'm excited to meet, um, the two new members joining us today.
Suhanya Ketheeswaran:  Oh, me too. I'm excited for them to meet you. So, Sarah should be coming.
Suhanya Ketheeswaran:  Megan, unfortunately, is feeling ill, so she won't be able to join us this week. Hopefully she'll be here next week.
Gaurav Shah:  That's all good. Yeah. We've got a good agenda today.
Gaurav Shah:  So I'm hoping to demo a few prototypes, um, and then also discuss what we discussed yesterday with, like, this being a general stewardship platform. What does that mean?
Gaurav Shah:  Um, with not just having members, but then other folks on here. I don't think it changes much from a product side for us, as in what we change, uh, what we build.
Gaurav Shah:  It does just mean that we have a few additional rules on payments and who is, you know, what payments we're tracking for folks and things like that. Um, and then, yeah, we'll also spend— I'm hoping to spend a little bit of time near the end on, um, the different tags that we talked about last week.
Gaurav Shah:  So if you remember, yeah, what do we want to sort of classify people as on the platform?
Suhanya Ketheeswaran:  Okay. Sounds good.
Gaurav Shah:  Fantastic.
Suhanya Ketheeswaran:  I have a few questions for you as well, as I've been thinking about— as I've been playing around in the prototype. Um, I have questions about just the timeline that you see under each donor profile or member profile, um, and how quickly it can become really unwieldy.
Gaurav Shah:  Yes.
Suhanya Ketheeswaran:  As we start sending communications out and the— and more time elapses in a member's sort of, like, relationship with us. So I had some questions about that.
Gaurav Shah:  Sounds great. Let's talk about it. Um, we'll just give her a minute to join.
Gaurav Shah:  In the meantime, how is— how's life, Suhanya?
Suhanya Ketheeswaran:  Life is good. Life is good. I'm visiting my sister right now.
Suhanya Ketheeswaran:  She lives in Arizona, in Sedona.
Gaurav Shah:  Oh, wow. Nice.
Suhanya Ketheeswaran:  Yeah.
Gaurav Shah:  I was wondering if the background looks different.
Suhanya Ketheeswaran:  Yeah. That's right. She works from home as well, so she's got— she's got a little ergonomic setup here for me, which is nice.
Suhanya Ketheeswaran:  And I had told her that I would need to work even while I'm here with her, so we negotiated when I would work my 20 hours. And, uh, she holds me to it.
Suhanya Ketheeswaran:  So I've been very efficient and focused.
Gaurav Shah:  That's good. That way you can enjoy the rest of your vacation.
Suhanya Ketheeswaran:  That's right. Yeah. I don't know if either of you have ever traveled to Arizona.
Suhanya Ketheeswaran:  I haven't. Um, but it is incredible, the terrain here.
Suhanya Ketheeswaran:  It feels otherworldly. Like, I've seen pictures of, um, like the hoodoos that you find out in Western Canada, like Dinosaur Provincial Park.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  And sort of, like, the rock formations that look otherworldly. But definitely the rock formations and the mountains here, they don't look like hoodoos, but also look very, very different.
Gaurav Shah:  Oh my gosh. Yeah. I remember going to the Grand Canyon when I was a kid, and it was— it was crazy.
Suhanya Ketheeswaran:  Oh, yeah. I'm so excited.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  We're hoping— I think it's about, I don't know, maybe like enough of a short enough drive that we could do it as a day trip. So I think if the weather cooperates, we might try and do that drive at some point. But we've done a couple of hikes already.
Suhanya Ketheeswaran:  Um, and there was a night where people, like, gather and dance on the rocks as the sun sets. It's like a silent disco.
Suhanya Ketheeswaran:  So that was really cool. And then, uh, UFO tours are a real thing here.
Suhanya Ketheeswaran:  So.
Gaurav Shah:  Hi, Sarah.
Suhanya Ketheeswaran:  Hi, Sarah.
Gaurav Shah:  How's it going?
Sarah Ranco:  Hi. Sorry I was late. The elevator was broken in my apartment, so that's—
Gaurav Shah:  It's all good. It's nice to see you again.
Sarah Ranco:  Yeah. Nice to see you too.
Gaurav Shah:  Yeah. How have you been?
Sarah Ranco:  I've been okay. Yeah. It's been all right.
Sarah Ranco:  How— like, Suhanya's been sharing updates with the team over the last several weeks, and it looks like it's going pretty well. So I'm excited to be a part of this.
Gaurav Shah:  Nice. I'm really glad. Um, yeah, I know the few weeks we were really trying to figure out what problem do we want to solve together, and I'm glad that we've kind of landed on something that is meaningful, um, for you folks, something that we can also feasibly build, um, in time for our handoff.
Gaurav Shah:  So this is fantastic. Um, okay.
Suhanya Ketheeswaran:  And Jesse, I think this is your first time meeting Sarah, yes?
Jesse Huang:  It is awesome.
Suhanya Ketheeswaran:  Both of you introduced yourselves so you can get to know each other a little bit.
Jesse Huang:  Oh, do I give my— like, my internship— like, like my— hi, I'm Jesse. I'm fourth year here.
Suhanya Ketheeswaran:  Maybe your role on the UW blueprint team.
Jesse Huang:  Yeah. So for, um, SDC, I'm working as a technical lead right now. So I mainly do all of the, like, little technical scoping and the little button presses.
Gaurav Shah:  Um, Jesse's also our longest-standing blueprint member so far. He's been here for more than three years, which is—
Jesse Huang:  Guys.
Gaurav Shah:  For a student club. For a student club is wild.
Jesse Huang:  That was— that was not—
Gaurav Shah:  Yeah. I remember last term— last term we gave everyone Legos for— to commemorate each semester that they'd been on blueprint, and Jesse's tower was, like, three times taller than anyone else.
Suhanya Ketheeswaran:  Brilliant.
Jesse Huang:  That's embarrassing.
Gaurav Shah:  Hey, no, you love this club. You love the work that we do. It's great.
Suhanya Ketheeswaran:  Yeah. And then we get to benefit, Jesse, when— because when Gaurav came on, or even before Gaurav came on, when Rohan told us who was going to be working on this project, he's like, "You're going to have the most senior members at UW blueprint working on this," and that means you're going to have a completed product in four months instead of in 16 months. So we were like, "That's very exciting."
Suhanya Ketheeswaran:  So thank you. We're very excited to have some senior folks.
Sarah Ranco:  I also think having, like, a— showing, like, kind of a commitment to a student club for that long is also very impressive. As someone who used to run committees at the university and it struggles to get people to, like, be involved for more than, like, a couple months, like, that's—
Jesse Huang:  Oh, she understands.
Sarah Ranco:  Yeah. So, um, yeah. And so for me, I'm the research coordinator at the Social Development Center.
Sarah Ranco:  Um, I generally work with the Lived Expertise Engagement Program, um, but we're kind of, like, uh, distributing, I guess, um, our— our skills and stuff across, like, the entire SDC. Um, I don't know what else.
Sarah Ranco:  I had the best— yesterday I just did a research meeting for, uh, the team or whatever last, uh, over at Laurier because we're doing a partnership project right now. And we had the best icebreaker question, which was, I was like, "Tell— tell us something about you that would surprise other people."
Sarah Ranco:  And it was a bunch of people from our roster, and then, like, Menwell, um, who's over— a prof over at Laurier, and then, like, a couple of research assistants. And between all of us, we were like, "Oh, we have all the skills to do a government coup and, like, take over."
Sarah Ranco:  Because it was like— because, like, so I'm curious of, like— because mine was that, um, like, that I have a black belt and that I'm, like, a gold medalist, like, star in that. Got a little card that says that, like, my hands are an official weapon.
Sarah Ranco:  It's so ridiculous.
Jesse Huang:  Oh, wow.
Sarah Ranco:  But, like, then we found out that on the roster we have someone who speaks seven languages, someone who is a trained pilot, there's someone with a commercial boating license, and then, like, we had another person who knows six types of martial arts, and we're like, "Oh, we could just take over the government."
Gaurav Shah:  Yeah. Oh my gosh.
Sarah Ranco:  I don't know if anyone's—
Gaurav Shah:  When they stop funding you.
Sarah Ranco:  So yeah, I wasn't sure if, like, in introductions, if anyone wants to share something that— about them that would surprise someone that you think might surprise people.
Gaurav Shah:  Ooh. Uh, do you want to kick us off? Or was— was yours the black belt hand?
Sarah Ranco:  Mine is that I'm, uh, I think that one and the other, which is actually generally a low-hanging fruit, is, uh, my age because people always underguess it. So, like, which is that, like, I'm 40, but most people usually— yeah, senior's very good. So, like.
Gaurav Shah:  I mean, I was— when I met you, I fully thought you were 23. Like.
Sarah Ranco:  Yeah. Most people do.
Gaurav Shah:  Yeah. Oh my gosh. Okay.
Gaurav Shah:  Well, hey, it just means you have a lot of amazing energy to bring to the table.
Sarah Ranco:  Yeah.
Gaurav Shah:  Um, yeah. Suhanya, do you want to go next?
Suhanya Ketheeswaran:  No, I don't. I need some time to think.
Gaurav Shah:  Oh my gosh.
Suhanya Ketheeswaran:  I feel like I'm so open about everything. I don't know what would surprise people. So you go.
Gaurav Shah:  Uh, what would surprise people about me? Uh, I can go either my age or I can also say I grew up on— like, I've lived on four continents so far.
Sarah Ranco:  That's impressive.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Yeah.
Gaurav Shah:  Yeah. Jesse, do you want to go next?
Jesse Huang:  Uh, what do I say?
Jesse Huang:  Wait, lucky I was, like, kind of tuned out for a little bit.
Gaurav Shah:  What's the thing about you that would surprise other folks?
Jesse Huang:  I actually— oh, I actually still don't know.
Gaurav Shah:  Great. Isn't that such a good question?
Suhanya Ketheeswaran:  Yeah.
Sarah Ranco:  It's not a requirement. I was just like, "Yeah, it's usually—" I'm like, "This is going to become my new icebreaker of choice."
Jesse Huang:  Wait, I will not— I will not back down. I will answer this question.
Sarah Ranco:  Commitment.
Jesse Huang:  I think, um, hmm. I think— ooh, okay, I got it. I think people really underestimate how little I eat.
Jesse Huang:  Like, I think— or my ability to not eat anything. I think I can easily go a day with only eating, like, a coffee.
Jesse Huang:  Ah, that's about it. Um, but then I can also flex until, like, I eat a big, terribly big lunch and then also eat, like, all you can eat for dinner.
Jesse Huang:  I think I have a very, very flexible eating ratio compared to most people.
Suhanya Ketheeswaran:  That feels like a superpower, Jesse. It feels like you could survive all kinds of situations with that superpower.
Jesse Huang:  I'm praying ready. I've been praying my life for, like, a stranded island situation.
Sarah Ranco:  You're like, "That feels like a superpower," and I'm like, "That sounds a little bit like undiagnosed ADHD." Someone who— who has that. And, like, that is part of the thing, is that you could go 24 hours without thinking about food.
Gaurav Shah:  Wait, do you not— do you not feel your blood sugar drop, though? Like, are you not like, "Oh, I'm getting angry now if I—"
Jesse Huang:  I don't think so. Like, I feel like— well, maybe other people can realize, like, if I'm getting hangry, but, like, I don't think me personally, I can realize if I have any changes, but.
Gaurav Shah:  Oh, interesting. I also.
Jesse Huang:  I will say it is okay.
Gaurav Shah:  Cool. Okay, Suhanya?
Suhanya Ketheeswaran:  I— well, I'm going to— I'll piggyback off of that one because I also feel like I— I can— if I'm hyper-focused, I can go extended periods of time without sleep or food.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  Um, but, uh, if I'm not hyper-focused, I need to be able to eat, like, every two to three hours. And sometimes I'm not great at keeping track of that, but the people around me know. And usually, for their own safety, they make sure that I'm fed.
Gaurav Shah:  Oh my gosh.
Suhanya Ketheeswaran:  I do get hangry, Gaurav. I totally get hangry. It's like a family trait.
Gaurav Shah:  Yeah. I think I've noticed that about me too. I don't know if it's something about the genetics.
Gaurav Shah:  Like, I've noticed my parents get the same thing as well. Where, like, if they haven't eaten, the mood snaps immediately.
Gaurav Shah:  Um.
Sarah Ranco:  All of, like, my best friends over the years and, like, my roommates were like that. And so, like, when I went traveling with my best friend, like, to, like, Newfoundland, I just had preset snacks in my bag, like hard-boiled eggs while they're driving. And I'm like, "Have an egg."
Sarah Ranco:  Just to, like, kind of forget that.
Gaurav Shah:  That's hilarious.
Suhanya Ketheeswaran:  That's exactly what my husband has to do. He'll be like, "I think we should eat now." I'd be like, "Why?
Suhanya Ketheeswaran:  Why would we stop? Why would we just keep driving?"
Suhanya Ketheeswaran:  He's like, "Let's eat."
Gaurav Shah:  Oh my gosh. You can really tell how fed I am by how— how I talk to my clod. Like, it knows.
Gaurav Shah:  It knows. Um, but yeah.
Gaurav Shah:  Oh my gosh. Okay.
Gaurav Shah:  With that amazing icebreaker, um, I think we should get started on, um, SDC business. So, uh, the agenda for today is, uh, to discuss a little bit of the, uh, Ride for Refuge intake forms that are going out, how are they going to work, what needs to happen there, um, and just kind of plan out logistics, uh, and explain kind of what we're hoping to learn.
Gaurav Shah:  Um, then I want to, uh, take a second and, like, answer your questions about the prototype, Suhanya. Um, I'm hoping to walk you through some of the— the prototypes that— or not prototypes.
Gaurav Shah:  Now we're starting to build the actual front-end UI and, um, working pieces of it. So I want to show you some of that.
Gaurav Shah:  And, um, then hopefully we can discuss how this extends to, like, other— other stewardship forms. So you have members, but you also have donors, you also have volunteers.
Gaurav Shah:  What— this is a— this is generally a stewardship platform. The idea is you— you have people in here and you can send them emails.
Gaurav Shah:  Um, so ultimately, however you want to use this, um, you know, we can— we can chat about what that looks like. And then, um, we can also chat about the DAGs if we have time near the end.
Gaurav Shah:  Okay?
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  With that, let's start with Ride for—
Suhanya Ketheeswaran:  Can I add one more thing to the agenda? If we have time and the need to prioritize accordingly. I just heard from the board yesterday that we might have access to about a small $3,000 budget.
Gaurav Shah:  Okay.
Suhanya Ketheeswaran:  To support, um, this project. And I had initially asked for it for us to be able to build out— I had asked for a larger budget to be able to build a new website for SDC.
Gaurav Shah:  Okay.
Suhanya Ketheeswaran:  And if not, I had asked for a smaller budget for us to be able to build a landing page that we can direct new members to. Um, but I also know that there are going to be ongoing costs potentially associated with the CRM.
Gaurav Shah:  Yes.
Suhanya Ketheeswaran:  So I wanted to, like, just talk about if we have $3,000, what is the best way for us to be able to use that, um, in the context of this product.
Gaurav Shah:  That makes sense. Let's, um, I'm going to assume for the sake of— of this chat that this is operating for around five years for now, and then, like, after that, maybe the $3,000 budget resets or, you know, at— at a certain point, blueprint also has plans to start paying for, um, the work that we do with nonprofits. Like, we— you know, the— the costs are not as big as so that, like, blueprint can cover them.
Gaurav Shah:  So hopefully that's coming in the future, but we shall see. Um, that tells me that for the next five years, if the costs are around $30 a month, um, at the max, then we're at $1,800.
Gaurav Shah:  That leaves us with $1,200 to spare. Um, and that's if I were to sort of think about where to allocate that, that would be in marketing the membership program.
Gaurav Shah:  So, um, whatever you think is best with, like, whether that is hosting an event, trying to get people to be members, whether that is, um, you know, trying to— actually, I'm not sure what other marketing channels you could use there.
Suhanya Ketheeswaran:  It could be community outreach. Like, we've been trying to table at different events where we think that there are people attending that would be interested.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  In, um, becoming a member at SDC. And often being— even being able to table carries costs with it.
Gaurav Shah:  Exactly.
Suhanya Ketheeswaran:  Um, in order to set up a booth and then creating the materials or setting up the booth. Um, so it could be used for that as well.
Gaurav Shah:  Yeah. That's exactly it. So I think that's where the rest of the $1,200 could go.
Gaurav Shah:  Um, that's my estimate, but how do you feel about that?
Suhanya Ketheeswaran:  Uh, I feel good, particularly because last week when we spoke, you were already thinking about what the landing page could look like.
Gaurav Shah:  Yes.
Suhanya Ketheeswaran:  Um, right? That it would— it would live somewhere else, that it wouldn't look like the— the page that we currently have on the existing website. And so if that need is being taken care of, um, as part of this project.
Gaurav Shah:  Yes.
Suhanya Ketheeswaran:  Then we could use the $1,200 for, yeah, marketing instead or thinking about how we do that community outreach.
Gaurav Shah:  Fantastic. Okay.
Suhanya Ketheeswaran:  Okay. Great.
Gaurav Shah:  Awesome. Um, all right. Let's talk about Ride for Refuge forms then.
Gaurav Shah:  Um, so from— from what I gathered from the email, Suhanya, we have two sets of folks. We have the existing members who we want to understand this information from, and then we have the new Ride for Refuge members who we're offering a complimentary membership and then trying to understand this information from.
Gaurav Shah:  Um, right now, the rest of the product hasn't fully been built out, right? So we're not able to upload this information into the product just yet.
Gaurav Shah:  Um, but the forms are ready. So folks, you can send out these links that I sent you yesterday.
Gaurav Shah:  Um, just in an email, they'll open the form, they'll fill out their name, their email, and they will continue through the form. We will save the responses.
Gaurav Shah:  And we will save general analytics on, like, folks dropped off at X, you know, like X number of people dropped off at Y page, for example, and then just seeing where the drop-offs are happening. That way we can edit the questions in the form or edit the number of questions, edit the structure, edit the wording, things like that.
Gaurav Shah:  Hopefully that data helps. Um, and so we'll still collect that data.
Gaurav Shah:  We're just collecting it in a database for now, and then we'll export it and send it over to you in an Excel file. Um, and as soon as this platform is built by December, um, so in about a month's time, to be honest, there's not much time that this data is going to be living outside of this, um, we'll migrate it over to this, um, platform.
Gaurav Shah:  And then you'll have all of the members that have filled out this form and their details based on their, um, responses in this form. Um.
Suhanya Ketheeswaran:  Okay. Perfect.
Gaurav Shah:  Yeah. Uh, so I guess the— the only thing that's kind of remaining then for of you, Suhanya, is just to send out those emails with the links. And then we'll.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  Everything else is handled.
Suhanya Ketheeswaran:  Okay. Question for you. A couple questions for you.
Gaurav Shah:  Yes.
Suhanya Ketheeswaran:  So one was when— when this product is built, um, and the survey data is no longer living in a spreadsheet and it's actually living in the— the CRM itself, where would we see that? Like, would we click on a— a member's profile and then would we see it in the timeline?
Gaurav Shah:  Yeah. Um, I mean, that's a design decision TBD, but I would imagine that these are all tags for folks. Um, for example, if they're selected that they care about housing, um, then we could— we could sort those as tags and we can also show these responses in the timeline if it helps.
Gaurav Shah:  Um.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  Yeah. We have options. So I'm curious what you think might be the best for you.
Suhanya Ketheeswaran:  Um, I like that we have both. I like that it would automatically tag them based on their responses and that we don't have to do that manually. That feels like that saves a ton of time.
Suhanya Ketheeswaran:  Um, especially when we're doing like a bulk send like this, right? Um, and we're getting responses back from dozens of people potentially.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  But I also like the ability to be able to look at the timeline and say, "This person filled out the questionnaire. Let's get a full scope of how they answered all of their questions at that given point in time when we first asked them."
Gaurav Shah:  Absolutely. Okay. Sounds great then.
Gaurav Shah:  Um, and the ideal flow for us essentially is, like, a member joins, um, you know, they fill out this form, they get automatically tagged. And now if you're ever hosting a housing event, you go to the CRM, you filter for all the folks who selected housing, you can copy their emails in one click, and then over on Mailchimp, you can send them the event reminder.
Gaurav Shah:  Um.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  Yeah. Awesome.
Suhanya Ketheeswaran:  Perfect. And actually, we're not going to send through Mailchimp anymore. We're just going to send it directly from the system.
Suhanya Ketheeswaran:  So it'll just go as a plain text email and it'll show up as coming from Members Act.
Gaurav Shah:  Fantastic. Okay. That's even better.
Gaurav Shah:  Um, okay. So that's the— are everything good about the Ride for Refuge forms though, Suhanya?
Gaurav Shah:  Is everything good to send out on your end?
Suhanya Ketheeswaran:  Yeah. They're— they're looking great. I appreciate all of the edits, the— the multiple rounds of edits that you've done.
Suhanya Ketheeswaran:  This is definitely the final it. We— we feel good about the questions that we've landed on for the survey, and we're so grateful that the board member caught the fact that we were about to send complimentary membership to people who had already paid to be real members.
Suhanya Ketheeswaran:  So thank you for creating two forms so that we can segment. Now, in your email that you sent yesterday, I saw that you said something about as of November 6th, you believe that we may be able to send it through the CRM.
Suhanya Ketheeswaran:  Is your recommendation that we wait? Because we could wait.
Suhanya Ketheeswaran:  I mean, it's only a week away.
Gaurav Shah:  Mm-hmm. I— my recommendation would be to send it.
Suhanya Ketheeswaran:  If that allows you to test it.
Gaurav Shah:  Yeah. My recommendation would actually just be to send it because we're also short on time. We only have a month before actual handoff.
Gaurav Shah:  And so, um, I would rather that we start collecting data now rather than, you know, wait for it. Um.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  And then, yeah, we can test by sending test emails to you and— and members at, you know, like, not actual members at SDC, but, you know, staff at SDC, just so you can kind of get a feel for how those emails might look, feel, and send. Um.
Suhanya Ketheeswaran:  Okay. Perfect. I appreciate you clarifying that because I was just going to say if from your end, being able to test sending this out through the system would be helpful for you as you're building things, then I— we would be happy to, like, postpone it by a week.
Suhanya Ketheeswaran:  But if the priority is to just get it out and start collecting the data, then we can do that as well.
Gaurav Shah:  Awesome. Yeah. Let's— let's get— get it out then.
Gaurav Shah:  Um.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  Fantastic. Okay. So we have the Ride for Refuge forms done.
Gaurav Shah:  Um, now I wanted to just, uh, Suhanya, I know you had a couple of questions with the member directory and as you were clicking around the prototype, um, uh, I don't know if they've already been answered or, uh, if you want to spend some time on those.
Suhanya Ketheeswaran:  Sure. And when you say the Ride for Refuge forms, you just mean like the member survey that we've created, yeah?
Gaurav Shah:  Yeah. Sorry. I should call them a member survey.
Suhanya Ketheeswaran:  And that— that will— because I'm thinking that that will just remain our member survey. So if in the short term, in the next month or two, if somebody joins on as a member, that will be the same survey that we send out to them.
Gaurav Shah:  Yes. Yeah.
Suhanya Ketheeswaran:  Okay. And what we might need to do is just change the introductory message so that it doesn't reference the ride. Is that an easy thing to do from your end?
Gaurav Shah:  Yes.
Suhanya Ketheeswaran:  If we have to?
Gaurav Shah:  Yeah. Absolutely. I— I'm almost considering that as part of the— what will actually happen is once we— once the membership form is sent out, we collect the data, we will analyze where people are dropping off, we will edit the form hopefully so that we're getting less drop-offs and more folks are filling out the form.
Gaurav Shah:  And then we will, um, make it part of the product so that, um, you know, maybe you can set it up so that, like, on day three of them joining or on day one of them joining, they get this intake form automatically. Um, so that way you're not sending it out manually after that.
Suhanya Ketheeswaran:  Okay. Perfect.
Gaurav Shah:  Um, okay. Fantastic. Let me— let me just quickly find the prototype if I can.
Gaurav Shah:  Uh, okay. I believe— sorry, it might take me a second.
Gaurav Shah:  If you have it handy, by the way, and if you'd like to screen share and walk us— walk me through your questions, that would also be— that would also work.
Suhanya Ketheeswaran:  Sure. I can do that. Um, and just remember that I think that the prototype that I have is an older version.
Gaurav Shah:  Yes. Yeah. This is it.
Gaurav Shah:  Um.
Suhanya Ketheeswaran:  Even the one that you had created.
Gaurav Shah:  Oh, this is the— I think this is the— the prototype that we're operating off of for now that, you know, we're like.
Suhanya Ketheeswaran:  Oh, it is.
Gaurav Shah:  Yeah. Our platform might look a little bit different. We might have some more nuances that this prototype doesn't really capture.
Gaurav Shah:  Um, this is very much a let's put something in front of you so that you can react to.
Suhanya Ketheeswaran:  Okay. Perfect. So I— I also got a chance to share this with the team and, uh, they were playing around in it.
Suhanya Ketheeswaran:  And so I think everyone's just feeling a little bit more clear about what the product itself is.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Outside of just hearing me talk about it. Um, so we a— see, during our meeting this week, during our ad hoc meeting on Wednesday, we actually added myself so that we can see what the process looks like. Um, we— we did things like add notes.
Suhanya Ketheeswaran:  Uh, we sent an email from, uh, from the system so that we could see what that looks like. And it was really easy to do.
Suhanya Ketheeswaran:  It felt— I have to say that it felt as soon as we removed the expectation that it needs to go through Mailchimp and it needs to have all these, like, graphic elements to it and it needs to have multiple blocks, and instead it just feels like a personal email. It was something that we could do in a matter of minutes, which was really nice.
Gaurav Shah:  That's really good.
Suhanya Ketheeswaran:  And we pretended that this was going to go out to all 31 members that you have as placeholders in the system, the 31st person being me who we added as, uh, together. Um, so we were able to get that out. So once we did that, there were a couple of questions that came up.
Suhanya Ketheeswaran:  So our meeting was on October the 28th.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And we saw that as soon as this profile was created, it said that my expiry date was October 26th. So we had a question about how the system was, like, calculating when the expiry was. Because I think in my head, I thought it would just be October 28th, 2027.
Gaurav Shah:  That might have just been a mistake of the system, to be honest. Again, as I said, prototype is very much like a, um, it might have a couple of mistakes in the way that it— it calculates things. Um.
Suhanya Ketheeswaran:  Uh-huh.
Gaurav Shah:  Yeah. We would expect it to be the— the yearly, um, or, sorry, the monthly or yearly membership. I— we— we discussed monthly last time, right?
Gaurav Shah:  So it'd probably be monthly. You remember we talked about how, like, members would be paying monthly rather than on a yearly basis?
Gaurav Shah:  Or did we want to allow for both?
Suhanya Ketheeswaran:  Yes. Yes. But the— but their monthly thing would still be automatic, right, for a year's time.
Suhanya Ketheeswaran:  But they would still be— that's a good point. So could we make it so that when they sign up, they're signing up for an annual membership, but they're— they can choose whether they want to pay as a one-time fee or as a monthly fee?
Suhanya Ketheeswaran:  And if— if that's too complicated, can we just make it that they would pay on a monthly basis?
Gaurav Shah:  Yeah. We can make it so that they pay on a monthly basis. Typically, monthly payments are indefinite until you cancel them, right?
Gaurav Shah:  And so.
Suhanya Ketheeswaran:  Yeah. Yeah.
Gaurav Shah:  Um, I mean, I— I was wondering if that's probably the system that we just want to adopt. They will know that they're subscribed to the membership because they will receive emails from you. So it's not like money is just going out of their bank account.
Gaurav Shah:  Um, and we will let them know very clearly that, like, thank you for supporting SDC, like, your membership is monthly, you know, and you can cancel at any time.
Suhanya Ketheeswaran:  You can cancel at any time. And then maybe the practice that we need to build is that as they get close to their 12-month period, we say, you know, your annual membership is about to expire. We will automatically renew it for your convenience, but if you would like to cancel, you could— I think we'd said that instead of having, like, a portal that they could sign into, they would just email us, or there could be a button to say that they want to cancel their membership,
Suhanya Ketheeswaran:  which would notify us, and then we can make sure that finance knows to cancel their payments.
Gaurav Shah:  Yeah. That makes sense. Um, sorry.
Suhanya Ketheeswaran:  Does that sound like it could work?
Gaurav Shah:  Uh, yeah. That works. I mean, honestly, if you— the way I'm thinking about it, you could— I mean, if— if you'd like to send that email, it's good.
Gaurav Shah:  It's transparent. Um, right?
Gaurav Shah:  It— it makes sure that they know that their membership is active and we're taking money from the bank account. I don't see a lot of other platforms also emailing folks for their one-year, um, you know, like, membership, your renewal is coming up because there is kind of nothing for them to do.
Gaurav Shah:  And it increases the chances that they will cancel. Um, and so depending on, like, how we want to balance the transparency versus, like, um, op— opportunity for them to— giving them an opportunity to cancel means some people might take it, um, very clearly.
Gaurav Shah:  So, like, how do we want to balance that? I will leave that up to SDC.
Gaurav Shah:  Um.
Suhanya Ketheeswaran:  Yeah. I will take that back to the team so we can have a conversation about that.
Gaurav Shah:  Yeah. Sounds good.
Sarah Ranco:  Yeah. Suhanya, because I'm just wondering, like, the subscription or, like, the membership, it's already a sliding scale for the year, right? Like, or are we looking at this point around, like, people can donate, like, a certain amount every month?
Sarah Ranco:  Because the one thing of two is, like, if someone is a paying member who is donating every month, then they are also in our voting constituent. And, like, if people are able to cancel at any point throughout the year, that will mean that our membership numbers will be constantly fluctuating.
Sarah Ranco:  Um, and I'm just thinking about when AGMs come in and, like, it's almost like you'd have to become strategic about when you're putting forward stuff that the voting membership has to vote on. Because, like, if we're using a set number, like, instead of a percentage, but a set number of what counts as quorum, um.
Gaurav Shah:  Mm-hmm.
Sarah Ranco:  Like, I'm— I'm— I'm thinking about it from the— the— the board side of it. Um.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Yeah. No, that's— that's a good point as well. So I think we need to— yeah, we need to think about how.
Sarah Ranco:  Yeah.
Suhanya Ketheeswaran:  Because we've never offered monthly payments. We've always offered annual membership with a one-time payment.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And then there's never been an option to auto-renew, right? So every— every year we have to go back to our members and encourage them to renew. And I think that takes some, like, work and a lot of follow-up in some cases, and it might explain why our membership numbers have declined over the years.
Suhanya Ketheeswaran:  Um, so the thought around doing it monthly was just that when people get into the habit of seeing a certain amount getting deducted, um, from, like, a— a fundraising perspective, they're more likely to be okay with just continuing past that one year. Like, it would just continue in perpetuity until they really have a reason to stop.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Um, and it removes the need for us to keep following up with people at the 12-year mark.
Gaurav Shah:  Exactly.
Suhanya Ketheeswaran:  But it— but then it has these other— other considerations around quorum and things like that. If people are paying monthly and they can cancel at any time.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  So let's think about that. I know that there are— like, I remember when I used to have an Adobe subscription, even though you paid monthly, you were still signing up for the year. Um.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And so, yeah, I'm just— maybe we can look at some different models and we can have a conversation internally about, you know, whether we offer the option for people to cancel their memberships. How does that work in other nonprofits? How does that impact quorum?
Suhanya Ketheeswaran:  Let's take that back to, like, the team and maybe discuss it at next week's ad hoc.
Gaurav Shah:  Sounds good. I know that the Adobe model is very famously hated, though. Um, like, you know, you pay for— you pay— you feel like you're paying monthly, but then, uh, you try to cancel it and you're like, "Oh, wait, I cannot cancel it until the year ends."
Gaurav Shah:  Um, and that might cause some kind of, like, um, you know, that people might feel like, "Oh, I'm trapped in it dipping." Now, so yeah, again, I think it needs a discussion on, like, how you want to balance transparency and also just keeping donors retained.
Gaurav Shah:  Um, yeah, I— I look forward to, like, hearing what you— what you folks decide there. Um, just to keep the meeting moving, um, so, uh, Suhanya, was that the question with the prototype?
Gaurav Shah:  Were there any other questions as well?
Suhanya Ketheeswaran:  No. So that was one that we noticed immediately. And then the second one, um, that we wanted, when we had the option to create a new member and I could choose between the options of whether they paid or whether they were complimentary or whether they were, um, sponsored.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  Uh, there was just a question from the team around, like, how are we figuring all of that out? Like, how are we going to manage payments? Because right now we receive them through EMTs and we want to ideally go back to doing it through PayPal or Square so that we could have tick boxes for people.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And so we were just curious to know from your end, like, how that research and how, um, you know, that's coming along. And if you don't have an update on that for today, that's totally fine. We'll just park it for next week.
Gaurav Shah:  Yeah. I think, unfortunately, we might have to park it for next week.
Suhanya Ketheeswaran:  Okay. No problem at all.
Gaurav Shah:  Okay.
Suhanya Ketheeswaran:  No problem at all.
Gaurav Shah:  Thanks. Um.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  For you. Yeah.
Suhanya Ketheeswaran:  And then the last one was emails. Actually, I'll go to people and we'll pick myself again. And it's just, yeah, when we saw, okay, so as of now, the timeline is looking really easy to take in.
Suhanya Ketheeswaran:  Um, and we just wondered, you know, as more communications are going out or more things are happening, payments are happening, um, how or notes are being added.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  How do we make sure that this is not overwhelming to look at? Will it only load, like, 10 or 15 things at a time? And then can we scroll down if we need to see more?
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Will we be able to filter by keywords? Uh, will we be able to filter by tags that are attached to different kinds of notifications? So notes are one tag.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And then maybe, like, blast emails are another tag. And then personal one-to-one emails are a separate tag.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  So that we can both filter and also search by keyword.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And then, um, the last piece was, is there a way to integrate with the— with our emails so that we have the option to upload, um, communications directly to the CRM in addition to the ones that we send out of here?
Gaurav Shah:  Oh, I see.
Suhanya Ketheeswaran:  Um, that— like, especially if we get a reply back, where does that show up in the CRM?
Gaurav Shah:  Right. Um, just to answer your first set of questions on how are we making it easier, it's literally those— exactly those three things that you mentioned. Search.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  Filters, and, uh, loading only when you scroll. Um, so that's a good idea.
Suhanya Ketheeswaran:  Beautiful.
Gaurav Shah:  I think the responses might be Carolyn's question. Um, Carolyn, I don't know if you are here.
Sarah Ranco:  Yeah.
Gaurav Shah:  Oh, awesome.
Carolyn Zhang:  Yeah, I am here. Sorry. My— my internet's a little bit questionable right now, so I'm just going to keep my camera off.
Gaurav Shah:  Oh, you're good.
Carolyn Zhang:  Um, I'm not sure if her reply is, like, would you prefer to see responses directly through the platform, or would you prefer to be, like, browsing that in, like, your usual, like, Gmail flow? Because I think it would probably be significantly harder to, like, also show replies because, like, then we're just kind of building Gmail inside of our application. Um, and I think there's maybe some, like, slight security risk because then you're going to just give us access to, like, your entire inbox effectively.
Carolyn Zhang:  I don't know.
Gaurav Shah:  Oh.
Carolyn Zhang:  I would generally prefer to keep, like, the email functionality, like, separate and just, like, focus on, like, the templating and the automatic emails that we're providing. Um, but, no, open to your thoughts.
Suhanya Ketheeswaran:  Okay. Um, so fully, I— I really appreciate you, like, flagging the— the security issue, um, because that's a really valid point. Um, the reason I think that we were thinking we would like to see all communications captured here is so that we can, if we looked up somebody, we could see the full picture of communications that have happened between SDC and that member, knowing that some of those communications could be, um, just, like, one-off conversations that happen.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  Um, and then when— when people reply back, we were like, if that's living just in an inbox, then it means that we have to— there's opportunities for things to get missed and it, um, we're not going to be able to see some parts of that relationship here in the CRM. We'll still have to go between two different systems to make sure that that's being captured. So maybe what we could do.
Sarah Ranco:  Yeah.
Suhanya Ketheeswaran:  Is if we get a reply back from a member, I'm wondering, is there a way to copy-paste that email so that we— it's not integrated with the email addresses.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  At SDC, but we can actually just copy-paste it and make sure that we add it into the timeline here somehow.
Gaurav Shah:  Add it into the timeline and show them if it works.
Sarah Ranco:  I'm— I'm sorry.
Gaurav Shah:  Oh, sorry, Carolyn.
Sarah Ranco:  I was going to say it might be some work.
Gaurav Shah:  Oh, really? Okay.
Sarah Ranco:  So if it's just copy— if it's just copy and paste, like, as in, like, admin is going to go copy and paste their reply into the platform.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Yeah.
Carolyn Zhang:  I think it's not that much work. I think it's not ideal. Like, I think it doesn't scale to, like, if you have, like, more than 10 email threads going on.
Carolyn Zhang:  Um, my thought was that Gmail already has search functionality, and I don't think we need to roll our own search functionality. Like, if you want to filter by email sent by, like, X person or, like, received that that X person received, you can just do that in Gmail.
Carolyn Zhang:  Um, so I wonder if that might just be, like, a more suitable solution rather than— yeah. I guess, like, I totally see your point of, like, you know, like, sending emails in one platform, reading emails in another.
Carolyn Zhang:  It's, like, a little awkward. But I think maybe, like, what we're focused on is less, like, the nature of, like, the sending, but more just, like, being able to automate things or, like, filter on conditions.
Carolyn Zhang:  Like, we're more so managing, like, the conditions of, like, sending emails. And then maybe, like, the actual, like, email interface is, I mean, better done by a professional platform like Gmail.
Gaurav Shah:  Yeah. Um, the one thing I will say is what we could do, Suhanya, is, um, you know, on this page, we can— I mean, if the search and— and those one-off emails prob— okay. First of all, those one-off emails would probably still live in Gmail with, um, like, even the ones that you sent to a member, right?
Gaurav Shah:  Because a lot of this is, like, sending emails if a condition is met, um, and automatic emails, um, and maybe to a larger group of people as well. Um, but what we could do is we could give you the search query that you could use to put into Gmail, right?
Gaurav Shah:  So search from this— I— I don't know. It's not— I don't know.
Gaurav Shah:  It's not that much work, but, like, not that much, um, of a time-saving. If it helps, um, I'm not opposed to adding the copy-paste functionality.
Gaurav Shah:  I think, like, even though it doesn't scale, if you think that there's some value in it, if there's, like, an important conversation that you would like to save to the CRM, um, and you want to just copy-paste those, then that makes sense. But then internally, your process, um, would probably have to evolve past just copy-pasting every single member email into the platform.
Sarah Ranco:  Right.
Gaurav Shah:  Maybe the important ones. Like, you feel like, oh, someone coming— taking over in the future might need to know about this one email, then maybe adding it to the platform helps.
Suhanya Ketheeswaran:  Yeah.
Sarah Ranco:  Suhanya.
Gaurav Shah:  Right.
Sarah Ranco:  Something I'm thinking about right now is all of these email— like, this whole, like, CRM thing is being attached to that membership@waterlooregion.org, right? Like, it's not, like, individual members or, like, individual staff are emailing out. So, like, that— the— theoretically, that email is only being used to contact members about membership stuff.
Sarah Ranco:  So that kind of is that repository right there. Um, so, like, I actually— like, I kind of— I agree with Carolyn on this one as, like, it's being, like, kind of worked out.
Sarah Ranco:  Like, it makes sense that this is more of, like, a reminder piece of all the different things that need to happen in the different steps. The only thing I could think that that would potentially could be added to this one is if— if an email is sent out, if there's the option to, like, flag, like, for the CRM to let us— like, maybe you can flag, like, this email, like, necessitates— needs a response.
Sarah Ranco:  And then, like, the CRM can then, like, if a response hasn't happened or something, like, if there was some way to flag it here so that then, like, like, you know to follow up or something. I don't know if that's a function that might— because if— if, Suhanya, if the concern is about missing something, like, maybe, like, because some emails it wouldn't matter if someone doesn't respond or something, but maybe some of them do.
Sarah Ranco:  I don't know if there's a function there to be able to be like, "This is an important thing to get a response back. If we haven't heard back in a month, please let us know so we can send another email out."
Gaurav Shah:  I wonder if— like, I wonder what kinds of emails do we see requiring a response back.
Sarah Ranco:  Like, I could imagine something like, um, if someone had— if there was a question about someone's membership that was, like, a potentially time-sensitive thing or something. Like, maybe there was a mix-up with, like, payment, or there was, like— I'm thinking about if there's, like, a human error aspect somewhere where the, like, we kind of need to get that piece sorted. I think another, um, option I can think of is.
Gaurav Shah:  Because in that case, you probably— if it's a one-off email to that one member whose membership is expiring, or— or you need a question about that, you'd probably just send it via Gmail.
Sarah Ranco:  Okay.
Gaurav Shah:  Right.
Sarah Ranco:  Um, yeah. I guess, like, the other thing I was just thinking too is because I know there was a whole series of, like, people sign up and then there was a reminder to have an e-transfer, like, sent out and stuff like that. So I'm assuming that it just baked in if there's additional reminders for that after.
Gaurav Shah:  Yeah. I think that— that's what we can do, right? So if there's, like, a— if— if they have not paid, then send them a reminder email.
Gaurav Shah:  If they have paid, then send them a thank-you email. Like, those kinds of conditions is what— kind of what we're building here.
Gaurav Shah:  Exactly what Suhanya is showing us too.
Suhanya Ketheeswaran:  Right. So this is, like, this em— when we— when you click on emails, it kind of has the— some sample email. These aren't necessarily the final ones, but it's just this a— a way for us to be able to see.
Suhanya Ketheeswaran:  So they get the welcome email, um, they— they know how to pay, and then if seven days after receiving their welcome email, they still haven't filled out their— their member survey, then a reminder would get sent.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And we could build as many of these as we need. Like, so as— as we're sending new emails out, if there's a reminder that needs to go out, we can set the conditions, template the email, and turn it on so that the system automatically sends that out.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Okay. I like that. I like that.
Suhanya Ketheeswaran:  I think that— I think in— so what— what I'm hearing, the distinction, I think, that is clear for me, Carolyn, after hearing you speak, is that we need to, like, look at this tool not necessarily as a full stewardship system, but more of, like, something that's helping to improve our workflows around bulk emails or automated emails that need to go out to our members.
Gaurav Shah:  Yeah. That's exactly.
Sarah Ranco:  Yeah. I think that'd be right. Yeah.
Gaurav Shah:  And as we— as we are going through, um, this, let's— I— I want to keep scope to that for now, but I do see the— the value in the CRM system as well, where it's able to give you a better picture. Maybe not just— maybe we're not able to import all the emails, right, because security reasons and— and just scope of work. Um, but we can talk about how we can make that CRM more helpful for you, uh, Suhanya, like, more in— in meetings as we go
Gaurav Shah:  down the line. Um.
Suhanya Ketheeswaran:  Sure. And I'll also think of, like, some use cases.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Like, I'll think about, like, some of the communications that we might have with members or that we've had in recent times, even with, like, ride participants.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And just think about, like, how is this current, uh, product not going to enable that? And then so that I can bring something tangible to you and we can problem-solve.
Gaurav Shah:  Absolutely. Awesome.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  Okay. Uh, so we've chatted about this prototype. Um, I think the— the next things are demoing the current work of our design team.
Gaurav Shah:  So I'm just going to— it's taking me a second to find that. We— we have incredibly long Slack threads for things.
Gaurav Shah:  Um.
Speaker 6:  I'm so happy to not be on it. Because I think it was offered to me at the beginning, and I was like, "No, thank you."
Gaurav Shah:  Oh my gosh. No, that's— that's very valid. Um, I mean, a lot of it is just, um, a lot of it is just joking around, to be honest.
Suhanya Ketheeswaran:  Oh, that's nice. That's important.
Gaurav Shah:  Yeah. Exactly. Um, I'm so sorry.
Gaurav Shah:  Give me one more minute. Um.
Suhanya Ketheeswaran:  No problem. Take your time. Carolyn, can I ask you, um, because you and Sarah are meeting each other for the first time, to just introduce your role on the UW blueprint team and what parts of this product you're working on?
Sarah Ranco:  Yeah. Wait, sorry. Give me one second.
Sarah Ranco:  I'm finishing my lunch. I will turn my camera on in one minute and we can talk.
Sarah Ranco:  I'm sorry.
Suhanya Ketheeswaran:  No, it's totally fine.
Sarah Ranco:  I have a mouth— I have a mouth full of food right now. I feel bad.
Suhanya Ketheeswaran:  No, that's okay.
Sarah Ranco:  Um.
Suhanya Ketheeswaran:  That's all right. It's lunchtime.
Gaurav Shah:  Okay. Sarah, do you want to introduce yourself in the meantime?
Sarah Ranco:  Yeah. Um, research coordinator for Social Development Center. Um, I work largely with the Lived Expertise Engagement Program.
Sarah Ranco:  And, um, I am not concerned about eating lunch in front of camera, and I do this all the time.
Gaurav Shah:  We all do.
Sarah Ranco:  Yeah. I had a sandwich.
Gaurav Shah:  That's great, Carolyn.
Sarah Ranco:  So it's not really bad. But yeah, nice to meet you. I'm Carolyn.
Sarah Ranco:  I'm the other technical lead. I think you met Jessie earlier in the call.
Sarah Ranco:  Um, so both of us were working
Carolyn Zhang:  to scope out things from a technical perspective. Um, although I think the roles are kind of a bit more blurred now with, like, AI. Like, you can see Gaurav's prototypes are working just as fine as our— our actual project.
Carolyn Zhang:  Um, but yeah. I've been working with Gaurav for a while on a couple of things, but it's nice to be working on SDC together now.
Gaurav Shah:  Yeah. Carolyn and I were, um, we're working on this project with Extended Family, if you've heard of that nonprofit before. Um, yeah, for, like, about two years.
Gaurav Shah:  Like, I— I think we both dropped off a little bit before the end, um.
Sarah Ranco:  Yeah.
Gaurav Shah:  Life and school commitments, but, um, it was great. Um, okay. I have— I'm trying to find Justin's automatic emails.
Gaurav Shah:  I feel like we need to label our prototypes on the Slack. We just send links to each other with no labels, and now I'm just searching for which link is the right one.
Gaurav Shah:  Okay, there we go. Um, found it.
Gaurav Shah:  Let's share my screen. Uh, so this is the— the emails we say you were looking at, Suhanya.
Gaurav Shah:  This is what our final, um, actually, still work in progress, but I just wanted to give you a quick demo of, um, how the UI might look a little bit different. Um, so you are able to give it a— give— as— as you know, you've seen in the prototype, you're able to give it a name.
Gaurav Shah:  Um, you have an email template, which I will show you the email editor separately. You're able to, um, select, uh, conditions here.
Gaurav Shah:  So when a member joins, um, in any way without a referral, you know, you're used to those conditions that you saw on the prototype. Um, you can send this email immediately, the same day, or after, and we added months, finally.
Gaurav Shah:  So after— after 12 months, uh, you could send them, for example, their 1-year anniversary email. Um, the recipient must have certain conditions.
Gaurav Shah:  So you can have— have a tag, not have a tag, they've joined before certain dates, um, things like that. And again, you're— you're used to the tags that you've seen on the prototype.
Gaurav Shah:  Um, and then you can— you can choose to review before sending. So what this means is, um, sometimes you have a thank-you email that— or, like, a certain sensitive email that you might want to add, like, a little personal touch to before it actually sends out.
Gaurav Shah:  Um, right? So, for example, if the condition is of a high-value donor, then maybe we want to actually add, like, a little line ourselves.
Gaurav Shah:  Um, and so you can choose to review before sending. Um, and it's going to show up in a— in a— on a separate page called the outbox, and we'll— we talked about that a little bit last time, uh, where you can kind of review it and then, um, and then send it out.
Gaurav Shah:  Uh, and if something is waiting on your review, then it can— you can also just say, "Send me an email alert," so it'll send, um, you, Suhanya, an email saying, "Hey, like, there's some emails waiting for your review before they send out." Um, by default, my recommendation is to keep this off.
Gaurav Shah:  Um, when, you know, most emails, like, you don't need to review, they look good, you've made the template yourselves. Um, but if you specifically think you might need to add a little personal touch to something, um, then I would recommend that you use this feature.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  Okay. Fantastic. And it shows you the people that will receive it if there's certain, um, if the conditions are already met, you can see who will be receiving it, um, who's already in the CRM.
Gaurav Shah:  We don't know about future members, of course. Um, but yeah.
Gaurav Shah:  And then you can save it as a draft, or once you have the actual email, you can publish it as well. Um, once an email is published, you'll see it in this list under Published.
Gaurav Shah:  Um, once an email is published, you will have to unpublish to edit it. You cannot edit a live published email.
Gaurav Shah:  So you'll unpublish it. Um, you can edit the thing, and then once it looks good, you can republish it.
Gaurav Shah:  And now it'll start sending it out. So if anything has been, um, between the time that something is unpublished and republished, um, we will not be sending emails.
Gaurav Shah:  Okay? If it's unpublished, basically, it will no longer send emails, right?
Gaurav Shah:  So my recommendation is that you're typically— if you want to edit an email, unpublish it in one sitting, finish it, and then re-u uh, republish it. Or maybe, like, write out the draft on— on a Google Doc separately before you put it in here.
Gaurav Shah:  Because if you unpublish it and then forget to come back to it, that email is not going to be sent out for the duration that it's been sent— it's been unpublished.
Suhanya Ketheeswaran:  Okay. Got it.
Gaurav Shah:  Um, and so yeah, that's— uh, and then you'll be able to see the members who have received this email so far. Um, and that's— that's kind of what automatic emails is looking like. On the actual email, uh, actually, you know what?
Gaurav Shah:  I'll give you a time— give you a second to react to that. Sorry, it's going too quickly.
Gaurav Shah:  Um, but does everything kind of make sense? Sorry.
Sarah Ranco:  Personally, this looks really great. And this is just a point of personal interest because I— like, it might have nothing connected at all. Is this, like, kind of set up, like, based off of— like, I'm thinking of, like, different survey systems, like Qualtrics and things like that, that are very similar in that, like, you have to unpublish to, like, be able to do edits before you can publish and send out.
Sarah Ranco:  It's like, I wasn't sure if, like, you're basing yours off of a pre, like, other, like, programs that are, like, inspiring or whatever.
Gaurav Shah:  Yeah. It's a— it's a common pattern in— in products that we see, right? Because if you start editing a published email, should we send the old version?
Gaurav Shah:  Should we send the new version? Should we send the one mid-published?
Gaurav Shah:  Um, and so it becomes a little complicated with all the different cases they have to deal with. And so we decided, you know what?
Gaurav Shah:  No, just unpublish it, then edit it, and then republish it. Um, but yeah.
Gaurav Shah:  Yes. Typically, in software, we draw, like, so much from other pieces of software, right?
Gaurav Shah:  Like, common patterns. Um, okay.
Gaurav Shah:  Let me walk you through the email editor. Ignore the— the top piece, the prototype controls.
Gaurav Shah:  Just let's look at this. Um, so as part of the, uh, email editor, you have a few more— a few more things than the prototype that you saw, uh, Suhanya.
Gaurav Shah:  Uh, so you'll have a subject, um, that you can add variables to. So what are variables?
Gaurav Shah:  Um, something like first name, last name, um, right, their email, things like that. Um, and so you can say, "Hello, welcome to SDC, first name."
Gaurav Shah:  Um, and that's— that's them. Um, you can do all the things, like bold, italics.
Gaurav Shah:  Again, regular email controls. Um, and then you have a footer, right?
Gaurav Shah:  So that's probably your name, like, where it's coming from, um, the unsubscribe link, um, what SDC is supposed to be. This is standard across all the emails that you send, right?
Gaurav Shah:  It has to have the unsubscribe link. It has to have, like, some— maybe the SDC mailing address, if you'd like to have it.
Gaurav Shah:  Um, and you can edit the footer in the settings tab. We don't let you edit it here because we want it to be standard across emails, and accidental edits would— would cause more harm.
Gaurav Shah:  Um, and then you're also able to upload, um, attachments directly here. So I'm able to, like— oh, sorry.
Gaurav Shah:  Clicking on the plus sign, um, adding an attachment. There we go.
Gaurav Shah:  The attachment has been added. Um, I can also add an image directly in the email if I'd like to.
Gaurav Shah:  So, uh, let's see if I can find an image. Um, okay.
Gaurav Shah:  I got that image. And I can resize it or, um, add text above or below it.
Gaurav Shah:  So basically, the things that we discussed last week. Um, and you can pre.
Suhanya Ketheeswaran:  Beautiful.
Gaurav Shah:  Okay. Awesome. Um, and so that's— that's the work that our designers have been working on so far, automatic emails and the email editor.
Gaurav Shah:  Um, we'll have more designs to— to demo next week as well, but hopefully, you can get a sense of, like, things are slowly starting to come together with all the nuances of the platform that we need, right? Like variables in an email editor, for example.
Gaurav Shah:  Um, fantastic. Okay.
Gaurav Shah:  So that was the demo. Um, the last thing that, uh, I— I guess I'll give you a second to react to this just to— just to make sense.
Gaurav Shah:  Some thumbs up. Any questions for email editor?
Suhanya Ketheeswaran:  Yeah. I— I mean, it has even more features than the prototype had because it has the ability to tap things, to create bullets, to add headings, uh, to drop images right into it. It's beautiful.
Gaurav Shah:  Fantastic. Okay.
Suhanya Ketheeswaran:  It feels like it has all of the functionality that, like, Gmail allows us to create, uh, without getting, like, so extensive that it looks like a full HTML, like, marketing email.
Gaurav Shah:  Exactly. No, it's kind of the goal. I'm glad.
Gaurav Shah:  Um, okay. The last thing to— for— to chat about for today is just, um, Suhanya, you mentioned, um, maybe wanting to add, you know, other folks to this platform as well.
Gaurav Shah:  So, um, volunteers or, um, you know, or donors, if you're separating them from members. And so I'm curious how you see this platform being used in the general stewardship mission of SDC.
Suhanya Ketheeswaran:  Um.
Gaurav Shah:  Are you good for me?
Suhanya Ketheeswaran:  I think that when I took this back to the team and everyone was able to see the actual tool, the actual prototype, they just saw additional use cases beyond our membership program.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  Because they were like, if the idea is to kind of streamline our ability to send automated emails to members, we have other groups of people that we could be doing the same thing to, that currently nobody is managing because, um, it's just so much work, and there isn't a— a dedicated staff person at SDC to be able to do that. But if we could streamline it so that, you know, we could create some templated emails, even a couple that go out to our— our donors over the
Suhanya Ketheeswaran:  course of the year.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Um, then it would at least mean that those— that group of people is receiving some level of stewardship that they're not receiving right now. And the functionality is no different than what you've already built for members. It would just mean applying the exact same features to an— an additional group.
Gaurav Shah:  Absolutely.
Suhanya Ketheeswaran:  And then Rithika pointed out, you know, the CivicHub members right now, they live on a separate spreadsheet.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And there is— they, like our SDC members, they also pay membership dues. It's different.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  The benefits that they receive are different, uh, in exchange for that. But there are certain standard emails that she sends to welcome them, to onboard them, to check in with them, to remind them if we haven't received their payment yet, uh, if finance lets her know that they haven't received it. Um, and so we thought, okay, that's an additional group.
Suhanya Ketheeswaran:  And then the last group is we're finally building, like, a volunteer list.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  And we've— this is the first year that we've actually had some, uh, some volunteer stewardship and volunteer management start to take place, and we're building up that infrastructure that— so that felt like an additional group that we could build into this.
Gaurav Shah:  That makes sense.
Suhanya Ketheeswaran:  So I think that was the thinking was, like, if we could do this for members, there's all these other groups that we could also, yeah, do it for, that this tool could be really helpful to. But we weren't sure how scalable it was, and so we wanted to ask you about it.
Gaurav Shah:  Yeah. That's fair. I mean, you know, honestly, we were thinking about it from a member perspective, but I don't see a lot of, like, additional functionality that needs to be built.
Gaurav Shah:  Just some things that we should think about. Um, the smallest thing is on the members page, we can separate it out by tabs, so you— you see which, you know, you see members in one list, volunteers in another list, things like that.
Gaurav Shah:  The bigger thing to think about is how they enter the platform. Because if you're a member, then you enter through this link landing page that we're creating where, you know, you come in, you learn the membership benefits, you sign up, you pay, um, maybe you fill out the intake form.
Gaurav Shah:  Um, as a CivicHub partner, are we hoping that Rithika would add people to the platform herself then?
Suhanya Ketheeswaran:  Manually?
Gaurav Shah:  Yeah. Or would we—
Suhanya Ketheeswaran:  I think so, because there currently isn't, like, an online button that people use to be able to sign up. I think that if they want to sign up, there's a form that they fill out, and then they submit it.
Gaurav Shah:  Okay.
Suhanya Ketheeswaran:  To an email address at CivicHub.
Gaurav Shah:  Okay. Makes sense. And so if that form, if you think, is going to stay relatively similar, um, then we're happy to sort of, like, just— or if it's a Google form and Rithika wants to manually add folks, that either way works.
Gaurav Shah:  Um, we can build.
Suhanya Ketheeswaran:  Let me take that back to her and ask her.
Gaurav Shah:  Sounds good. Yeah. Like, how people can enter this platform.
Gaurav Shah:  Of course, we wouldn't want to add, like, another landing page to our scope. It's, again, given that we only have a month.
Gaurav Shah:  Um, but, um, if there's a simple way that Rithika just wants to add folks, we can add that input. Uh, and then same for donors as well.
Gaurav Shah:  Um, depending on how frequently they're joining the platform, right? Like, how many donors are you getting every week or something like that?
Gaurav Shah:  We can decide if we want to build, like, a system, or do we want to just let you manually add folks to the system?
Suhanya Ketheeswaran:  Yeah. I think for donors as well, maybe manually for now makes sense because there are multiple ways that people could come on as donors. They could send a check, they could send an EMT, they can come on through our Canada Helps page.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Um, and— and I don't know how frequently donors are coming on because we don't have, outside of the Ride for Refuge, we don't have a fundraising strategy.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  Or a, like, you know, fund— like, targeted fundraising outreach that we do throughout the year. So it probably happens on a very ad hoc basis throughout the year. So I think adding manually makes sense there too.
Gaurav Shah:  Fantastic. Music to my ears. Um, last word for us, right?
Gaurav Shah:  Um, but okay. So I think that that's very helpful.
Gaurav Shah:  Um, we're also at time, but to— like, today was such a productive discussion. Um, I'm very glad.
Gaurav Shah:  And then, uh, Suhanya, I'm excited to see what the Ride for Refuge— uh, I'm sorry, the membership survey emails, um, you know, once they're sent out. I'm excited to see the data start coming in.
Gaurav Shah:  And I'll let you know when that's done.
Suhanya Ketheeswaran:  Absolutely.
Gaurav Shah:  Okay.
Suhanya Ketheeswaran:  Absolutely.
Gaurav Shah:  All right.
Suhanya Ketheeswaran:  Okay. Thank you. Thank you for a very productive meeting today.
Suhanya Ketheeswaran:  It's really exciting. I think as— as things become more tangible, it's like, and we can, like, visualize it and imagine the use cases, I think that we're— we're— we're having good discussions.
Gaurav Shah:  I'm really glad. Okay. We'll have more for you next week.
Gaurav Shah:  Thank you, everyone.
Suhanya Ketheeswaran:  Okay. Thank you.
Sarah Ranco:  Bye.
Suhanya Ketheeswaran:  Thank you.
Sarah Ranco:  Bye.
Gaurav Shah:  Bye.
Speaker 7:  Hi, gang. Are you at the bun place?
Speaker 7:  Hello?
Speaker 8:  Uh, hello, Gourav.
Gaurav Shah:  Hi. Are you guys at the bun place?
Speaker 8:  Yeah.
Gaurav Shah:  Oh, the bao place? Sorry.
Speaker 8:  The bao— yes, we are.
Gaurav Shah:  Okay. Can you get me a bao as well on your way?
Speaker 8:  I got you a bao already. Do you want to come here, or are you busy?
Gaurav Shah:  What? No, I'm not busy. What the— are you— how long are you guys going to stay there?
Speaker 8:  Until we're done eating. But your bao is here, actually. I forgot to order it as a takeout, so you can come here and eat it.
Gaurav Shah:  Okay. Uh, I can be there in, like, 20 minutes. Let's see how far it is.
Speaker 8:  Yeah. We'll be here in 20, I think.
Gaurav Shah:  Okay. Fire. I'll be there.
Speaker 8:  Okay.
Gaurav Shah:  Bye. See ya.
Speaker 8:  See you soon. Bye-bye.
