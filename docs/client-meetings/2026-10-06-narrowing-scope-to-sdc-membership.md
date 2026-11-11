# Narrowing Scope to SDC Membership

- **Date:** Tuesday, 6 October 2026, 12:01 to 1:01 PM (Eastern)
- **Who:** Suhanya Ketheeswaran and Rithika (SDC / Civic Hub), Gaurav Shah, Carolyn Zhang, Jesse (Blueprint)
- **Source:** [Wispr Flow notes](https://notes.wisprflow.ai/shared/4Ux3M7i1uMZ2nM2q3R0LIhFQ9c_C4GHNLec1ijoZAhY)

## Summary

Blueprint and SDC narrowed scope from a Civic Hub partner job board to an SDC member management tool, starting with a membership signup and questionnaire form for Ride for Refuge supporters next week.

### Ride for Refuge Results
- SDC passed its $20,000 goal; donations accepted until month end, with a few more expected
- Growth came peer-to-peer through networks, not an angel donor; two weeks out they were at about $3,000

### Validating the Reach Problem
- Civic Hub Partners send about five to six varied requests per month (amplification, volunteers, roles)
- Most partners fill events and volunteer roles through their own communities; SDC struggles more with reach
    - Some groups (Unsheltered Campaign, Fight Back) ask SDC to amplify; partners also want social media help
- SDC itself needs outreach about a dozen times a year, plus Ride for Refuge each October
- Gaurav Shah noted personalization lifts click-through only from about 3 or 4 percent to 10 percent, questioning software impact

### Shift to Membership and Stewardship
- SDC's goal is a reciprocal member base to reduce reliance on government funding over years
- Ideas: low-barrier event calendar (lunches, knowledge mobilization, tenant workshops) and a monthly stewardship-style newsletter
- SDC has about 12 members (5 are board); target is 100 in 12 months via engaged newsletter clickers, Civic Hub, Festival of Neighborhoods
    - Next 100 via referrals from the first cohort
- Civic Hub flagged an Ontario Trillium Foundation fund for sector-wide tools; a mutual aid matching idea could be separate

### Admin Pain Points and Tool Needs
- Donor interactions live in emails, spreadsheets and Word docs; Salesforce is too expensive
    - Prefer something within Google Workspace, integrated with free Mailchimp
- Other needs: public events calendar, member feedback survey, easier payments, tiered pricing and sponsorship top-ups
- Membership currently means picking $5 to $60 and sending an EMT; the old payment platform was cancelled
- Ride for Refuge donor emails sit with the fundraising platform (sounded like 'Blue Sea'), limiting conversion

### Prototype and Mailchimp
- Gaurav Shah demoed an initial community tab showing member status, emails sent and success rate
- Mailchimp fans out easily but limits individual personalization; other providers cap sends, so a middle ground is needed

### Next Steps
- (Gaurav Shah) Build the membership signup and questionnaire form for Ride for Refuge supporters
- (Gaurav Shah) Email meeting notes and suggested form questions to Suhanya Ketheeswaran
- (Gaurav Shah) Review Salesforce nonprofit donor management features and bring options next week
- (Gaurav Shah) Add Rithika's email to future meeting invites
- (Gaurav Shah) Investigate Mailchimp integration and email personalization options, report back next week
- (Civic Hub) Finalize the questionnaire questions together with Blueprint
- (Suhanya Ketheeswaran) Send the form link to Ride for Refuge supporters

### Decisions Made
- Project scope narrows to SDC membership; Civic Hub partner features are set aside for now
- Ride for Refuge supporters get complimentary membership with an unsubscribe option, no new payment ask
- Form collects interests, topics, location, time available and member hopes

## Transcript

Suhanya Ketheeswaran: Same day having met our goal, which was amazing, amazing.
Gaurav Shah:  $20,000, right?
Suhanya Ketheeswaran:  That's right, yeah. We're over $20,000, which is really nice, and we can continue to accept donations until the end of the month, and so we still have a few donations that we're expecting that are going to come through in the next little while, so that was very exciting.
Gaurav Shah:  Wow. That's— that's really amazing. Was it the case of an angel donor again, this— this time this year?
Suhanya Ketheeswaran:  No, it wasn't. It wasn't. It was like our network really went out and fundraised for us, like it happened the way that it should, in like a peer-to-peer model.
Gaurav Shah:  Oh my God.
Suhanya Ketheeswaran:  Where we reached out to our network, and then people in our network reached out to their networks, and, uh, yeah, I think in the last 24 hours before the event, we really, like, covered a lot of ground. A lot of the fundraising happened in the week and a half before the event.
Gaurav Shah:  Oh.
Suhanya Ketheeswaran:  I think that, like, going into it, I think two weeks out, we were still only at $3,000 maybe out of 20. Hi Jesse, very nice to meet you.
Civic Hub:  Hello, nice to meet you.
Gaurav Shah:  Uh, Jesse's our other technical lead. See, we met Carolyn last week, um, and Jesse's supporting her on the technical side.
Suhanya Ketheeswaran:  Amazing. Amazing. I tried, Gaurav, to forward your calendar invite to Rithika, but I couldn't because I wasn't an organizer, so I tried to copy the link over, and Google does this weird thing for us where it changes the link.
Gaurav Shah:  Oh.
Suhanya Ketheeswaran:  Like, it— it— it like flags it and then changes the link. So I just dropped it into an email for her, so she might be sitting in a different meet.
Gaurav Shah:  Oh. Oh gosh.
Suhanya Ketheeswaran:  That's Carolyn.
Gaurav Shah:  Okay.
Suhanya Ketheeswaran:  Yeah.
Gaurav Shah:  Hi Carolyn. Uh, might just be worth—
Suhanya Ketheeswaran:  If you can give me just one second, I'm going to give her a call.
Gaurav Shah:  Sounds good.
Suhanya Ketheeswaran:  Hi Carolyn.
Gaurav Shah:  Oh, I think she's here.
Gaurav Shah:  Hi Rithika.
Speaker 4:  Oh, I'm now back. I'm not— I have two other meetings, uh, so now I'm here. Okay.
Gaurav Shah:  Sorry about the confusion. Um.
Speaker 4:  Sorry. Yeah.
Gaurav Shah:  I'll make sure that this email is added for, um, for the next meetings.
Speaker 4:  Oh, no problem.
Gaurav Shah:  Yeah.
Speaker 4:  Thanks.
Gaurav Shah:  Um, okay, so a little bit of context setting from— from our previous meeting. So we took that back, we did a lot of thinking, and, um, we came up with a set of problem hypotheses. So essentially where we're at right now is we're trying to understand what are the— the true problems that SDC is struggling with, and I understand that reach is one of them.
Gaurav Shah:  We're trying to understand how, like, the— or what the sub-problems that are? How deeply do you, um, experience them?
Gaurav Shah:  How many people experience them? Are these valid things to solve for?
Gaurav Shah:  Because we realize that, yes, email personalization can help, um, but it— it doesn't, um, you know, unless you get more people at the top of the funnel, it's going to be like, you know, converting from like a 3%, uh, click-through to a 10% click-through might still not give you the numbers that you might be looking for, right? And so there's a bunch of additional problems that our platform could solve for, and so we've listed them, and I want to go through them with you today,
Gaurav Shah:  um, and understand if those are real problems that you're facing, the last time that you faced them, and if we could get some context on those. Um, if they're not real problems, that's also good to know, because then we don't bill for that and we— we focus our time on what's actually, um, relevant. So the way this will go is I will share my screen, um, and show you this document, and we'll just walk through this document together.
Gaurav Shah:  Um, we can take our time with it. There's a lot of text here.
Gaurav Shah:  No need to read all the text while I'm presenting. I'm just using this as a— as an aid for me, um, to go through it, and, uh, hopefully we'll understand a little bit better, um, what we're building by the end of this, right?
Gaurav Shah:  Um, yes, yes, please, uh, go ahead. I think most of us will be eating lunch throughout this— throughout the session.
Speaker 4:  Sorry, can you, um, increase the—
Gaurav Shah:  Hi.
Speaker 4:  Can you zoom— zoom in? Yeah?
Gaurav Shah:  Yeah, absolutely. Let's do that. Um, okay, so problem number one is partners struggle to— so we'll start with Civic Hub Partners, um, and I'm just sharing our understanding, right?
Gaurav Shah:  So please correct us if we're wrong. Um, one, partners struggle to reach enough people for their events, volunteer roles, or petitions, right?
Gaurav Shah:  So this is where Rithika, I want to understand from you how Civic Hub Partners, um, like, are they struggling with this? Do they have that network?
Gaurav Shah:  Um, yeah, let's maybe talk a little bit about that.
Speaker 4:  Um, um, I think, um, SDC is struggling with this for sure.
Gaurav Shah:  Okay.
Speaker 4:  Um, partners, uh, already, um, they— so they are— they are struggling with more participation, but what I've seen is that if the groups are organizing something on their own.
Gaurav Shah:  Yeah.
Speaker 4:  Um, and, uh, and it's— it's for their own small grassroots stuff, and they have an event or something, so then their events are well attended because they are doing it within their own— own community, own requirements. They've done their reccy of when who's available, what is not available. So, so, so in terms of attending of events, the groups might not have problems with that.
Speaker 4:  We definitely have problems with that.
Gaurav Shah:  Okay. Sounds good.
Speaker 4:  Um, and in terms of volunteer roles, um, yes, they sometimes ask for volunteers, and they reach out to us, but, um, um, but they also have within-community members who are also willing to do the volunteer work. So, uh, if they have some specialized need, uh, like they have to write reports or something, then they definitely reach out to us, and then we tap into a bigger pool of our resources.
Gaurav Shah:  Okay. Um, that makes sense. Swannia, do you want to add to that?
Suhanya Ketheeswaran:  Yeah. I mean, Rithika has definitely, like, the wider view of all of the partners. My— my interactions with them are very limited, and it's usually only when they reach out with a specific ask for social development center to amplify something that they're doing.
Suhanya Ketheeswaran:  So I know that a couple of the groups that work on the issue of homelessness have reached out to us for that kind of support. So one is the Unsheltered Campaign.
Suhanya Ketheeswaran:  When they have petitions that they're trying to get support for, they'll often ask us to help amplify.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  Because they don't feel like they're getting the reach or the response that they want. And Fight Back is another group that has often asked us to amplify things because they have a much bigger following than us, but they also struggle with conversion in the way that we do. So they feel like a lot of people are following along to see what they're doing, but they aren't necessarily supporting the actions that they're trying to organize the community around.
Suhanya Ketheeswaran:  Those are two. And then at some of the monthly lunches that you do, Rithika, oftentimes if I'm at that lunch and I introduce myself as the comms lead and I say, "I manage SDC's socials," I've had partners come out to me and say, "Is that something that you could do for us as well?"
Suhanya Ketheeswaran:  Or, "Do you know people who could do that?" Because I think a lot of them want to be more active on social media, and they just don't have the capacity, and they struggle to find volunteers to do that.
Suhanya Ketheeswaran:  So I know that that is an ask that I have definitely seen come up from the partners.
Gaurav Shah:  Awesome. The reason why this came up is in the original scoping, you know, we talked about this job board that connects people to, um, to roles, volunteer roles, or— or paid roles in the community. Um, and I would imagine that SDC alone isn't hiring enough to warrant making a whole piece of software for, um, for hiring people, right?
Gaurav Shah:  So it would be like a combination of Civic Hub Partners and, um, SDC would need certain people for volunteer roles, petitions, things like that. It's, um, so the big thing with this one is I'm trying to understand the volume now.
Gaurav Shah:  You mentioned those two groups. Um, how often are Civic Hub Partners reaching out to you for support, or SDC themselves as— as an organization?
Gaurav Shah:  You require support amplifying your, um, again, events, volunteer roles, petitions, jobs, things like that? Like, if you had to estimate frequency, especially for Civic Hub.
Speaker 4:  Yeah. Um, uh, the— the nature of ask varies, um, but let's say in a month we might get about, uh, five, six emails, uh, from partners to say, "Okay, this is what we're doing. Can we get some assistance on this?"
Speaker 4:  Or something like that.
Gaurav Shah:  Okay.
Speaker 4:  Yeah.
Gaurav Shah:  Okay. Sounds good. And most of those are, like, amplification requests, or?
Speaker 4:  No, like I said, it varies. So sometimes it's amplification, sometimes it's volunteers. Uh, it— I mean, I can't— I can't find a pattern to it.
Speaker 4:  It really depends on what the group is doing at that point in time.
Gaurav Shah:  That's fair.
Speaker 4:  Um, and, um, um, yeah, so, um, so it varies.
Gaurav Shah:  Sounds good. Are these asks usually for SDC, or are they for other Civic Hub Partners as well? Like, do you want to find other grassroots organizations?
Speaker 4:  Um, so, um, if they want us to, uh, spread the word, then that's a request out of SDC.
Gaurav Shah:  Mm-hmm.
Speaker 4:  Uh, if they want us to find volunteers, they don't care where the volunteers are coming from. So we could, uh, so a couple of times, uh, I've asked, like, there was one time when, um, they wanted a— a social media coordinator.
Gaurav Shah:  Mm-hmm.
Speaker 4:  Uh, and their need was, like, almost like a full-time job.
Gaurav Shah:  Right.
Speaker 4:  So we said, "Okay, let's create like a job opportunity," which of course is a volunteer position, so I would help in creating that kind of a profile, and then I would spread the word and, um, and then hope that someone is responding. Or they would directly get in touch with the person, main contact, and then they would conduct interviews and all those kind of things. So, so, um, it— it varies on what they're asking and how best we can find ways to support them.
Gaurav Shah:  Okay.
Speaker 4:  So there is no, like, one solution fits all kind of a thing.
Gaurav Shah:  That's fair. That's good context to have. So what I'm hearing is that partners are not often struggling with similar iss-issues, um, and, um, oftentimes their asks are varied, and it's about five to six per month.
Gaurav Shah:  With SDC, Swannia, I'm curious how often are you trying to reach out to people for events, volunteer roles, petitions, things like that? Or not how often you reach out currently, but how often is the need within SDC?
Suhanya Ketheeswaran:  Is the need, yeah. So I feel like we have a few, like, tentpole things that we definitely reach out for consistently. So Ride for Refuge would be the biggest one, where we're looking for people to fundraise on our behalf, we're looking for people to participate in the event, and we're looking for volunteers.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  And that, you know, the ask and the planning for that happens months in advance. It happens every October, so we start that early in the year, um, and start planning. And then a lot of the other things that we do are really dynamic because we're trying to respond to what's happening politically in the community.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  So if there's something happening at the regional level, the ask could be, like, "Come out to a council meeting and delegate." It could be, "We've started a petition. We want you to sign so we can bring it forward to council."
Suhanya Ketheeswaran:  It could be, "Submit a letter on our— on, you know, using this following theme." Uh, and it's when there were the provincial and federal snap elections that happened, we organized, like, community forums for people to participate in.
Suhanya Ketheeswaran:  There's an event that Rithika is working with some community partners on tomorrow because there's a municipal election happening. So some things we can't— a lot of the things we can't predict because we try to respond as things are happening in the community, so it's hard for me to estimate.
Suhanya Ketheeswaran:  But based on the last couple of years, I would say that maybe a dozen times over the course of the year, we're looking for people to do something in response specifically for SDC.
Gaurav Shah:  Okay. That makes sense. Um, so about once a month on average, and then five to six asks from Civic Hub Partners on average.
Gaurav Shah:  Um, and those vary. Okay.
Gaurav Shah:  Um, I think given that, like, the general sentiment, even from the team and this— the numbers are very helpful to validate, is that is, like, questioning if this is a big enough problem that can be solved through software, given that the impact that software is going to have here is also relatively small. So basically after— after what we discussed last week, um, Swannia, we took it back, we— we did some research, and it's, you know, the personalization can definitely support, but external research shows that it's somewhere
Gaurav Shah:  from, like, a, you know, if— if your conversion rate is, let's say, 3 or 4 percent, it's going to jump up to maybe 10 percent, or, like, your click-through, um, but not much past that. And so if the asks are not frequent enough and the, um, you know, personalization can only help so much, then maybe we're— maybe we could be building something that's even more helpful to SDC. Um, right?
Gaurav Shah:  Was kind of the thought process there. And so I'm wondering if, you know, how you feel about that, just, like, taking a second to process that as well.
Gaurav Shah:  And, like, maybe in the same communication space or working with volunteers, working with Civic Hub Partners, working with your subscribers, there's challenges around that that we maybe— maybe we can talk about that are places where we can better support. Um, I know this is a larger discussion to be had as well, and, like, it's a— a lot of thoughts here.
Gaurav Shah:  So I'm— I'm curious how you immediately, like, if there's any immediate reactions.
Suhanya Ketheeswaran:  Um, for me, I think I— I'm a big fan of this idea of not building something that nobody wants. Right? Or isn't going to meet the need.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  That really exists. So I really appreciate all of the thinking that you're doing and the questions that you're asking us to try and, like, narrow down the focus and really understand what is the thing that is going to be most helpful, or what is even the problem that— that we're all struggling with. Um, and so we've been having a lot of conversations around this as a team, uh, to even understand, like, how do we build, like, what we want to do at SDC, I think on a
Suhanya Ketheeswaran:  really fundamental level, is build a base of support.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And we want to build that base of support because then it allows us to shift from being almost entirely reliant on, uh, government funding.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  To being funded independently by this base of supporters who give us, like, a— a recurring monthly source of revenue.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  Right? We want to be able to shift from one to the other, and that's going to be a build over time. It's going to take years to do that.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  But we want to start doing that. That's the— so that's where the conversation, like, really came from. And so to build this base of supporters, we were, like, what is it that these people are going to look for from SDC so we can deliver value?
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And for us, it's not just about delivering value, which is often what you get in, like, philanthropic models.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  Is you want to demonstrate that you're doing good work, and then donors come in and they say, "Okay, we want to enable this work by giving you a donation."
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And we absolutely want that. If people want to support SDC simply through their donations, and they want to enable the work that they feel is important, we absolutely want that. Um, and we also want members.
Suhanya Ketheeswaran:  So for us, members are different from donors in the sense that there is a reciprocal relationship.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And something that makes SDC really unique and Civic Hub really unique is that that reciprocity is, like, at the heart of what we think social justice work is. It's not transactional. It's not about, like, we do work and then we demonstrate it, and then if you believe us or you think that it's important and you support it.
Suhanya Ketheeswaran:  It's also, like, how do we all come together and identify what each of us has to give and what each of us has to contribute, and then give in our own ways toward this, like, shared cause.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  Um, and so when we think about membership, we were, like, the person who wants to become a member is looking for something more than just demonstrated impact. They're looking to actually have skin in the game, and they want to feel like they're a part of creating the impact that SDC seeks to have in the world and in the community.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And they want to feel like they're part of the action and they have something to contribute versus, like, being on the sidelines and watching it happen, which is what we feel a lot of our subscription list is right now, is people like what we do.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Um, and they like the information that we're sharing, but they're kind of on the outside watching.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And we want to bring them in, and we think that for some people, the reason they're not coming in is because there's actually these barriers that we don't even realize are barriers for them. Like, perhaps even though we think we're inviting people into the work, they don't experience it as an invitation. Or, uh, perhaps they feel like they don't have the— the vocabulary or the skill set, um, or even, like, the full ideological alignment to feel like they can be a part of the work.
Suhanya Ketheeswaran:  Like, maybe those are barriers that we've kind of inadvertently created.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  Um, you know, when— when they see, like, who's a part of the work, and they're like, "Oh, this work is for activists, and I'm not an activist." Or, "This work is for people who are really politically plugged in, and I'm not politically plugged in enough." Um, and so they're just kind of on the outside.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And so we really want to create opportunities for people to, like, ease into the work of SDC and see themselves as being fully capable.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  Of— of participating in it. So we were, like, how if, like, signing a petition is too far out, or delegating at a council meeting is too far out, what are the things that we can invite people into? And we thought, like, we can invite people into things like the monthly lunches that get organized for Civic Hub Partners, because that's a way for them to not just read about the work that's happening on the grassroots level, but to actually be in a room with the people who are
Suhanya Ketheeswaran:  doing that work.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Right? Because there's different grassroots partners that attend those lunches every month, and this is a way for them to start interfacing with them and hearing directly from them about what they're doing in the community. And then maybe they'll join one of the groups, or they'll see a volunteer opportunity, or they'll come to a— a bunch of more lunches over the course of the year.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And see themselves as being a part of the community. We have a team that does a ton of research, like our Lived Expertise Engagement Program does a lot of community-led research, so does our eviction prevention team participates in that. Our grassroots resiliency project is, like, a partnership with Laurier.
Suhanya Ketheeswaran:  And we're, like, there's all this work that happens, and it doesn't really go anywhere. Like, we don't actually share that in any way.
Suhanya Ketheeswaran:  And so we thought maybe we could have a series of events that are around knowledge mobilization, because this knowledge that we gather through, like, this community-led research has a lot of, like, myth-busting value.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And maybe people just want to develop their understanding of the issues before they start to get involved in some way. So we're also trying to, like, figure out what is it that we need to start offering, and what are the kinds of events that we need to start delivering, um, in order to bring people into the fold, um, so that they're no longer on the sidelines. Does that help at all to kind of, like.
Gaurav Shah:  Uh-huh.
Suhanya Ketheeswaran:  Explain, like, the problems that we're trying to solve?
Gaurav Shah:  That is very helpful. I have some ideas already, but Rithika, I want— want to hear from you as well.
Civic Hub:  Yes. I think just, um, just to sort of, uh, feed off, uh, Swannia's point, I think, uh, at this point, the scope of the project seems too big. Um, and I think if we want to narrow it down, I would— my initial reaction would be that we stick to, uh, what Swannia is suggesting in terms of getting the outside people into SDC, which becomes an easier ask, which becomes easier to structure.
Civic Hub:  You can visualize that this is what we are doing, and we need your participation in terms of doing some petitions, attend this event, see what's happening. Sort of trying to work through this whole idea of, uh, what does, uh, an enhanced civic participation can look like in the region.
Gaurav Shah:  Hmm.
Civic Hub:  When we add in the requirements of the Civic Hub Partners, that's when it starts getting messy. That's when we start saying we want to also make it into a mutual aid project. We also want to make sure that others can also help.
Civic Hub:  I mean, it can potentially become something, but I think, I mean, I'm— I'm just having trouble visualizing how it would look. And when I put the inside requirements and the outsiders' requirements into this idea, it just feels, how would it actually look like?
Gaurav Shah:  That's a good.
Civic Hub:  So that's— that's initial reaction. The other— the other part, which, um, we're thinking of now, um, and we're going to have our first meeting later in the day, is, uh, we're— we— we're not sure if you'll apply for a grant yet or not on this, but there is this requirement, um, from one of the funders of Ontario Trillium Foundation, which is asking us to create some kind of tools which are not just relevant for your region or for your community, but which can be used across the
Civic Hub:  sector. So, so not-for-profit sector across Canada.
Gaurav Shah:  Mm-hmm.
Civic Hub:  And, uh, and so that's something that they are interested in funding. So since we've been having these conversations, and then this fund opened up, and so we were thinking about it, one of the ideas, and there are a couple of ideas that we are thinking about, is, like, let's say we're thinking of a mutual aid project, that we are— you need quote, I have quote, I will give you quote. You need volunteers, people are willing to do this, let's— let's do some kind of matching or something.
Civic Hub:  But that is something that can happen within KW, that can— it— it has a scalable potential. Um, and— and that is something that can become another project on its own as well.
Gaurav Shah:  Yeah.
Civic Hub:  So, um, so I don't know how your timeline runs, um, and what are your requirements, but, uh, and we don't even know if you're going to apply yet or not.
Gaurav Shah:  That's it.
Civic Hub:  But if— if depending on your availability and whatever else, uh, if you guys want to choose what project will work better for you, then I think just streamlining it would be easier at this point.
Gaurav Shah:  I agree. I agree. I think that's exactly what we're trying to do as well, is— is trying to cut scope.
Gaurav Shah:  Um, um, so a couple of thoughts there. Um, on Swannia's point, I— you know, the idea kind of forming in my head right now is this sort of member management tool, whatever that ends up being, right?
Gaurav Shah:  And, like, we can— we can walk through what that— what that does. But my understanding of the problem right now is that, okay, once a member is in, you need to know, uh, like, once you have a— a member, whether they're paying or not, you need to know what can they provide back to their community, right?
Gaurav Shah:  What— what do they have the capacity to give, and what are they looking for? What kinds of places do they want to participate?
Gaurav Shah:  Petitions, volunteer roles, um, things like that. And then from that, you having access to this list of, you know, um, people, your members in the community, and then whenever there's a relevant opportunity, you can go and invite them for that, right?
Gaurav Shah:  It seems like just that alone, that piece is— is, like, helping solve for that, um, understanding what members want, what can they provide, and then inviting them in, making that whole process easier. Um, I'm curious if there's a way that you already do that, um, Swannia, or, like, there's a way that you envisioned you would do that, uh, prior to Blueprint coming into the picture?
Suhanya Ketheeswaran:  No. That was, like, a big gap, like, because we don't have any dedicated resources around, uh, fundraising.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And we don't have any dedicated resources around stewardship, whether it's donor stewardship or member stewardship. We just identified that as a massive gap.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  And we're trying to figure out how to build some infrastructure around that.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Um, this year is my third year doing Ride for Refuge, which is our annual fundraiser.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And it's the first year that because we have been building little bits of infrastructure each of the last two years, that I actually have some capacity to do stewardship.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  You know, because there were things that were kind of, like, running in the background that we had learned from previous years, so we didn't have to spend as much time figuring out how to do those pieces.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And so there was some excess capacity on my end to start stewarding our teams and stewarding our donors. Um, and so I think moving forward, one of the things that we want to do is ensure that if we're going to push out this idea of membership to grow our base, that we have already thought through how we're going to steward them beforehand.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And so one of the pieces was, how do we create, like, a— a calendar of events throughout the year and really think about what we have capacity to do as a team so that once these members come in, we have something to invite them into that isn't just, like, those big asks, like, delegate, sign, show up, use your voice.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Um, and then, uh, another piece is, how do we ensure that the emails they receive are of, like, a— a more— they have more of, like, a stewardship quality to them.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  Where, you know, they're learning about an issue each month, and they're receiving, like, a sense of, like, an opportunity for them to get involved each month instead of what we have been doing for years, which is, like, a roundup newsletter, which just says, "Look at all of the things that SDC has done over the past month."
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And then a couple of these are things that you could also get involved in.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  So those are the two things we've thought of so far, is building a calendar of events, like, low-stakes events that feel low barrier for them to participate in. Um, and those could be, like I said, the networking lunches. They could be knowledge mobilization, uh, opportunities.
Suhanya Ketheeswaran:  And then the third one was, we have a tenant organizing lead in our eviction prevention team.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And she will often do workshops and political education type, uh, trainings for people, for tenants to understand how they can organize against evictions. Um, and she was saying that being able to offer those with a regular cadence might encourage more people to sign up. So that is a third thing that we would add to the calendar of events.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Um, and then the second piece is switching from our, like, roundup-style newsletter to a— a stewardship-style newsletter, uh, email that goes out once a month to our members.
Gaurav Shah:  Yes. I mean.
Suhanya Ketheeswaran:  Those are the two things we've thought of so far.
Gaurav Shah:  Yeah. And donor management platforms is, like, a common shape of what we build at Blueprint for a lot of nonprofits. So it seems like something that we could draw on our past learnings from.
Gaurav Shah:  And then also because you have some fundraising experience, Swannia, we can also look at, like, what's needed. But it seems like the— the core of what we need right now is, when a member comes in, let's understand what they can provide to the community and what— how are they looking to contribute, right?
Gaurav Shah:  And then we're still sending them emails. Those emails might take a different shape than what we originally imagined.
Gaurav Shah:  Um, and they might be going out to less people, like, instead of everyone in your— in your subscriber list, it's— it's your members, um, so that it has more of that stewardship quality. Um, and, like, it is a benefit that they're getting for being a member on— on SDC.
Gaurav Shah:  Um, this— this feels like a good direction to go in. And I— I feel like once we build this base, it's going to be very, like, you know, as you're visualizing it, we can think about, okay, well, what's next?
Gaurav Shah:  How does SDC want to conduct its stewardship? What are the tools that you would need to do that effectively?
Gaurav Shah:  And then we build those throughout this term. Um, does that almost sound, like, Jesse and Carolyn especially, as, like, our team, how does that sound compared to, like, our original products?
Speaker 4:  I think I feel more confident about this being, like, impactful, I guess. Just because, like, we were so, like, on the edge with, like, whether the newsletter would be, like, the right thing to optimize for. So I'm— I'm in favor of this.
Speaker 5:  I concur. I think this is a better, um, I guess, targeted direction.
Gaurav Shah:  Okay. Fantastic. Okay.
Gaurav Shah:  Um, I need to use the washroom really quickly, so I'll be right back. But in the meantime, uh, Swannia and Rithika, let you get to know Jesse and Carolyn, our team, and, like, they can also introduce some of the work that we've been doing so far.
Gaurav Shah:  Sorry for putting you on the spot. I'll be right back.
Speaker 5:  Well, that's a lot of pressure on us too, to convert.
Civic Hub:  Um, I know, um, Swannia had forwarded some questions from Olivia to me.
Gaurav Shah:  Yeah.
Civic Hub:  Um, so if you guys got a chance to go through them or if you need any more input. But yeah, I guess— I guess we are not doing the Civic Hub part right now, right? Going forward at this point?
Civic Hub:  You're doing that, um, yeah. So let's just keep Civic Hub stuff away from it and just focus on SDC membership and how we can, uh, bring them into the conversation, right?
Gaurav Shah:  Yeah.
Civic Hub:  That's good. Yeah.
Suhanya Ketheeswaran:  Rithika, it's been really helpful, actually, to have you in this conversation.
Civic Hub:  Yeah.
Suhanya Ketheeswaran:  Um, and to, like, talk about, yeah, what you see coming from the partners. Because my understanding of it is so limited from, like, the few things that I see on that listserv.
Civic Hub:  Yeah.
Suhanya Ketheeswaran:  And I think when I originally met with Rahul and kind of, like, pitched an idea, uh, I was really just thinking of this being, like, the equivalent of a volunteer center in a community. But volunteer centers will often only post opportunities within registered charities, which grassroots groups aren't.
Civic Hub:  Yeah.
Suhanya Ketheeswaran:  And so grassroots groups usually don't have a platform the way that a vol like, charities have volunteer action centers in their city or town.
Civic Hub:  Yeah.
Suhanya Ketheeswaran:  Um, so I was like, SDC could provide that platform for them to post opportunities, but it's really helpful to, like, hear your insight around how, A, a lot of them don't struggle with that problem.
Civic Hub:  Mm-hmm.
Suhanya Ketheeswaran:  They have their own networks, and they're able to tap into those networks when they need support for their events or opportunities, whatever it might be. Two, to know that, like, that scope actually feels really messy and too big.
Civic Hub:  Yeah.
Suhanya Ketheeswaran:  To kind of grapple with is also really helpful to know. Like, it just means that there was, like, an urgency maybe that I was seeing to it that doesn't exist.
Civic Hub:  Yeah.
Suhanya Ketheeswaran:  So it's great to have you here to share that perspective.
Civic Hub:  Yeah. No, I think it's also, um, some— sometimes, like, like I said, there— there is no pattern to it, right? Sometimes in one month, I might receive 10 requests, and at that time, I might be hyperventilating because I don't know what to do with it.
Civic Hub:  But then after that, it just slows down, and I forget about it. So.
Civic Hub:  So, so I'm quite sure that when you saw that there were things happening, maybe I really needed them at that point in time. But now that there is nothing happening, I'm— it's not even on my radar.
Civic Hub:  So, uh, so that— that— that pattern, the uneven pattern of how things are working out is a cause of stress, for sure. Um, uh, and also, like, we keep saying, like, there is never, like, a lull phase.
Civic Hub:  If this is happening, then something else is happening and those kind of things. But I think, um, the more we've been having these conversations across the programs, I'm seeing so many patterns in terms of what we need as a— as a, uh, infrastructure that we need to invest in that can support the entire organization.
Civic Hub:  And then Civic Hub can also benefit from it, and EP can also benefit from it rather than just focusing on one— on one program. So, so yeah, I think we just needed more— we need more conversations to figure out what everybody else is doing internally, I guess.
Civic Hub:  Yeah.
Gaurav Shah:  That's fair. Okay. Um, also, I'm glad that the— I'm glad that you talked a little bit while I was gone.
Gaurav Shah:  And I was also thinking of a couple of questions that I had. Um, primarily, Swannia, you worked in fundraising before, so I'm curious, what does stewardship typically look like, um, in a nonprofit setting, and how would maybe SDC imagine it to look like?
Gaurav Shah:  I know you still need to plan it out a little bit more, but any initial thoughts on it would be helpful.
Suhanya Ketheeswaran:  Um, I think, like, if you're thinking of, like, gold practices.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  It's, like, personalized stewardship is the way to go. It's, like, getting to know— it's doing what Rithika does with the 65 partners is what we would need to do with all our members. Um, you know, which is, like, literally getting to know each person individually, um, building a relationship of trust and of mutual trust, of mutual respect, and mutual giving over time.
Suhanya Ketheeswaran:  Um, and so when— when we were doing that at United Way, a lot of what we did, like, we— you could split it into two. You had individual giving, and then you had workplace giving.
Suhanya Ketheeswaran:  And on the workplace giving side, we didn't have the capacity to offer the kind of stewardship that was needed because you had workplaces with, like, sometimes hundreds of employees that were giving to the campaign.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  And then we had dozens of workplaces where that was happening.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  So the scale of, like, that required that level of personalization, you just couldn't do.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  Um, and on the individual giving side, you had far fewer donors, and so the team that was managing that could actually pick up the phone and call a donor, could send an email to say, "Hey, I know that this issue is really important to you, and here's an update of what's happening at one of our partners that we fund." You know, so there's, like, a high level of personalization. But then when you build that, those are the donors when you had an opportunity and you needed, you
Suhanya Ketheeswaran:  know, like, "We're— we're looking for someone to offer $10,000 in matching funds."
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  That's— that's the pool that it would come from. It wouldn't come from the pool where you had this kind of mass giving at workplaces.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  And so I think that is the kind of stewardship that we would want to aspire to for our members. It's always, like, the thing— the rub is always, like, capacity, right? How much capacity do we have to build that kind of in-depth relationship?
Suhanya Ketheeswaran:  Um, I think from a values place for SDC, that kind of in-depth relationship is what we want. It's, um, so I think at least in the beginning, as we're building up this membership program, we've talked about, like, where are those in— where are our first 100 members going to come from?
Suhanya Ketheeswaran:  Because right now, we have probably 12 members at SDC. Out of those 12, 5 of them are our board members.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And then the other 7 are probably 4 board members. Who signed up as members and have just been auto-renewing year after year. I don't think that there are many community members who just saw the membership opportunity and then came because we don't do a ton around promoting it.
Suhanya Ketheeswaran:  Our website is an absolute mess. And so even if you came, there's no way you're going to find the membership page and be like, "Oh, that sounds like something I'd like to do."
Suhanya Ketheeswaran:  So we have a very small group of members, and we've talked about, like, okay, if our goal is to get 100 members over a 12-month period from whenever we start this, where do we think they're going to come from? And we've talked about, like, finding them from within our existing networks.
Suhanya Ketheeswaran:  So, uh, within the 1,000-person newsletter list that we have right now, we know that there's probably, like, 20 or 30 people who click on things consistently and MailChimp will identify them for us. So we're like, those 20 or 30 people, let's send personal emails inviting them to become a member versus just, like, the e-blast that's going to go to the full 1,000-person list.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  And then within the Civic Hub members, for sure, there will be people who are part of it as a— as a group.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  But will also want as individuals to become SDC members. So we will reach out to those 65 members. There is a program that we have at SDC called Festival of Neighborhoods, and those are connections that we have with neighborhoods across the city of Kitchener within those groups.
Suhanya Ketheeswaran:  We know there are people who are— who may feel a connection to SDC specifically and want to become members.
Gaurav Shah:  So it's generally networks, people who are attending events before. That makes sense.
Suhanya Ketheeswaran:  That's right. The people who've shown that they have, like, a connection are where we want to start.
Gaurav Shah:  Okay.
Suhanya Ketheeswaran:  And then for the next tier, like, the next 100, we were like, we'll use, like, a referral model. We'll ask those 100, once they're in, if they would consider inviting people or identifying people that they think the SDC membership would be valuable to.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  And then we could either reach out to those individuals or they could do a warm introduction, and we would go from there. That's, like, often what we do in fundraising for, like, when you're trying to get those, like, leadership-level donors.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  Like, $1,000-plus donors, is you're looking for referrals for people who are already.
Gaurav Shah:  Okay. That makes a lot of sense. Um, also, one small thing, by the way, with United, I'm sure, um, I think WSIB was one of the contributors, like, workplace contributors.
Gaurav Shah:  And, and Jesse, when we were there, actually, we had, like, a United Way campaign that I'm— I'm pretty sure Swannia might have been on the other side of, um, which is really funny.
Civic Hub:  It was awesome.
Gaurav Shah:  Um, but, uh, the other thing is, I'm curious, what are the, the typical admin tasks you see as you're— as you're trying to go about fundraising or stewardship, um, and maintaining that donor relationship, right? Because software is not going to automate the picking up the phone and calling someone aspect, but what are all the other steps, the repeatable steps, the messy spreadsheets, the, you know, the all of those things? What are the things that are a pain there that we can maybe look to solve?
Suhanya Ketheeswaran:  Okay. And Rithika, you can speak to those because you have to, to work with a bunch of messy spreadsheets for your Civic Hub stewardship, right, and that relationship management.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  But definitely, I this is, like, very top of mind for me as I have to do stewardship now for the Ride for Refuge donors.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And all of it is going to live in a spreadsheet.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  I think about I— I sent probably 12 or 15 emails a day or two before the event to all of the teams to thank them for the fundraising that they had done to get us within $2,000 of our goal. And all of that is just living in my emails. And in order for it to go somewhere where other people have access to it, I'm going to copy those emails and put them into, like, tabs in a Word document.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  So if we had some kind of software where that could live so that, you know, people could look up, like, who are our donors and what kind of interactions have we had with them over the past year or two, that would be really helpful. That kind of software obviously exists. I think the one that's most commonly used by larger organizations is Salesforce, but it is so expensive.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Like, it is priced at, like, enterprise level.
Gaurav Shah:  Yeah, I can imagine.
Suhanya Ketheeswaran:  That is not at all affordable to most nonprofits and definitely not to us at SDC. So if there was a way to create something, and if it could be created within Google Workspace, because that's something that we pay for already out of our admin budget, that would be ideal. Um, and then, uh, we use the free version of MailChimp to send emails out, and that seems to be working okay.
Suhanya Ketheeswaran:  Um, but if it could somehow integrate with this, like, donor management or member management software, that would also be great because it would remove the need to, like, copy things over from one to the other. Those are the things that I can think of off the top of my head.
Suhanya Ketheeswaran:  A third one might be, like, a way to display a calendar of events.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  So that we don't have to just include them as bullet points in emails. Um, and people can actually just go somewhere on our website or somewhere online and see what the upcoming events and opportunities are.
Gaurav Shah:  Rithika?
Civic Hub:  Okay. So, uh, now this seems like another project to me completely, uh, in terms of what we can do. So, like, just, like, yesterday, I was just thinking about because we pay about 20% of what we donate to, uh, Blue Sea, who's, uh, helping who helped us organize the fundraiser.
Civic Hub:  Um, and what they offer, apart from other things that, of course, Swannia would also say, is this really beautiful interface. When you click on it, you know how much money has been collected, uh, who all have donated.
Civic Hub:  People are sending these messages and all those kind of things. And I, I knowing a little bit about dashboards and, um, um, technology for non— non-tech people kind of a thing, um, having a, a simple, clean, uh, user interface, uh, is not something very challenging to create.
Gaurav Shah:  Yeah.
Civic Hub:  Is what I understand about things. So I was just thinking, if we can create, like, a that kind of a don— donor management thing where we have our emails, which are just personalized to the staff, so that, yes, like, half of the time is spent in just searching for emails. Even though Google is amazing, but I think the pace at which we communicate through emails is like, okay, I don't know which email did Gaurav send two days back because it's perhaps now in the third sheet of,
Civic Hub:  of my email list, and I can't get to it at all.
Gaurav Shah:  Right.
Civic Hub:  Um, but, uh, but those kind of, uh, conversations, if they can be tagged in, let's say, funder-specific kind of emails or, or that kind of an interface, that could be interesting. Having that because we already have a charitable status, people can donate to us directly. If it looks pretty to donate, uh, and we can say, okay, over the year, and we want to continue doing fundraising for the entire year, if we have an interface which also shows visually how much money is getting, um, uh, collected
Civic Hub:  throughout the year, that can be an interesting way to keep the fundraising process going on because we keep, like, during this last one month, I think every all of us were just constantly refreshing the Ride for Refuge page just to see how much have we have we got.
Gaurav Shah:  Mm-hmm.
Civic Hub:  And, uh, it was just so, so, so simple and clean, and, uh, we enjoyed I think everybody enjoyed working towards that fundraiser as well. So, so that would be interesting as well, having, um, a platform where the emails could be a set of resource emails because Swannia created a whole lot of templates, and searching for those templates became a challenge after a point because there were just so many of them. Um, but if it is in one place and, uh, most of it is in her head,
Civic Hub:  she's also saved it, uh, somewhere on the on the Google Drive. But, um, but a separate interface of all this would be really amazing as well. And then that could also target the, um, like, how, how do we like, one of the conversations I was having with Swannia was that if people are donating to us during this fundraiser, we need to have their email IDs so that we can say that you become our members.
Civic Hub:  Um, and to which she said that because the email is with the Blue Sea, we will not have access to the Blue Sea database. We might have.
Civic Hub:  Anyhow, yeah. So, so things like that, that things that we are we are so close, yet we are not able to convert that into our membership, or, or we'll have to do extra work to convert them into membership.
Gaurav Shah:  Mm-hmm.
Civic Hub:  Um, and, um, yeah.
Gaurav Shah:  Okay. So what I'm hearing is that the vision is Salesforce, but for SDC, right? And what that looks like.
Gaurav Shah:  Um, but what that looks like in a smaller scale, or at least what we want to start with building, is just can we get our members through the door? Like, our, our paying members.
Gaurav Shah:  Or whatever they look like. Can we understand what they where they want to contribute?
Gaurav Shah:  And can we kind of just have that list somewhere, right? And then we go on to understanding, okay, how do we want to interact with them?
Gaurav Shah:  How do we want to send them emails? When they're going to receive emails, can we make sure that we're being alerted to them, um, separately and we're able to, like, maintain that relationship with them?
Gaurav Shah:  Um, and we can kind of branch off into what's next. It is an important discussion to have, uh, but I want to make sure that I'm understanding the base or at least, like, what is our first piece of the build correctly.
Gaurav Shah:  Swannia, I see your hand. You have your hand raised.
Suhanya Ketheeswaran:  Yeah. I just wanted to say that the, the admin task that we didn't talk about was the feedback loop.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  And, like, the, the trying the, the, the survey or questionnaire or whatever step happens in order to understand what it is members, um, feel they can contribute, what they're looking for from SDC so that we're not making assumptions or creating this sort of, like, what we're not continuing this one-size-fits-all kind of approach of sharing opportunities with people. Um, I think that would be really helpful to have, uh, some support around from you and the team. Um, and then the other piece I wanted to
Suhanya Ketheeswaran:  share is that to Rithika's point around, like, these donors being like the donors and particularly the people who signed up, right? Because their email addresses we do have. Because they not only when they sign up, they're offering to not only make a personal donation, but they're offering to then go and ask people in their lives to support them.
Gaurav Shah:  Right.
Suhanya Ketheeswaran:  And their support for SDC. So we were like, this is, like, a great group of people to approach with, uh, a membership ask. And we talked about, wouldn't it be great if we could actually launch the membership program around the time of Ride because we'll have all these people who are, like, on this high of having supported us, and maybe they're looking for the next thing that they can do with us.
Suhanya Ketheeswaran:  And then we had to shelve it because we don't have the infrastructure to make sure these people are going to be stewarded well, right? Like, right now, if you want to sign up for membership, the way you do it is by self-selecting a, a dollar amount between $5 and $60 and then sending an EMT.
Suhanya Ketheeswaran:  That in itself is, like, to me, not a low barrier way because then you now have to figure out, like, am I a $5 member? Am I a $20?
Suhanya Ketheeswaran:  Like, you know what I mean? There's just, like, an entire range.
Suhanya Ketheeswaran:  It isn't easy and clickable, and you've got to send the EMT, you've got to set up a password. There's all these steps that are involved in that.
Gaurav Shah:  Mm-hmm.
Suhanya Ketheeswaran:  Um, and we were like, if we can make the payment processing easier, that would be the first step. The second thing is, as a team, we don't feel like $5 to $60 is actually the appropriate amount that we should be asking for. We feel like there are people in our network who absolutely have the capacity to give much more than that.
Suhanya Ketheeswaran:  And there are others in our network who don't have the capacity to give at all. And we've talked about ways to have, like, a top-up mechanism or, like, a sponsorship mechanism.
Suhanya Ketheeswaran:  So you sign up for membership, and if you have the ability to sponsor someone else's membership, then you can do that as well in order to, like, remove the cost barrier for other people in the community who very much want to be a part of it. So to build all of that, like, we need time and we need support, and we didn't have that, so we decided not to move forward with it.
Suhanya Ketheeswaran:  But those are other things, like the payment processing and the ability to have tiered pricing and the ability to kind of encourage and then accept sponsorships or top-ups, um, to people's payments or, or other administrative forms.
Gaurav Shah:  Okay. That's, that's good to know. I'm, I'm curious what payment processor you currently use.
Gaurav Shah:  I think we don't.
Suhanya Ketheeswaran:  We don't. We used to. At one point, there was a time when I joined the SDC where if I clicked on the membership page and I said I wanted to sign up, it would take me to a separate page, and then I could choose the level of, like, payment that I wanted to make.
Gaurav Shah:  I see.
Suhanya Ketheeswaran:  Um, but we don't have that anymore. Now we've switched to, like, just accepting EMTs. So it could be that there was a monthly cost associated with that platform, and we just weren't receiving enough memberships to justify whatever that fee was, and so we canceled it.
Suhanya Ketheeswaran:  I can check in with our finance.
Gaurav Shah:  That's okay. Yeah. So even EMTs for now I mean, it seems like because we were going to build this I think internally we called it onboarding or, or, you know, whatever that meant, like, collecting member information, giving them that, you know, welcome, we're so glad you're here.
Gaurav Shah:  Um, and then asking them a few questions. I think we can build that still.
Gaurav Shah:  Like, if you want to if you want to use it for the Ride for Refuge people, that could be a good first set of people to test this with even, um, right? So if we're I know we're, we're slowly getting off that high, um, now, but, um, I'm curious if, if you would be able to provide requirements requirements in the sense that, um, what do we want Ride for Refuge members to see, right?
Gaurav Shah:  What kinds of questions do we want to ask them, um, to get them in the door? Um, and if we have that, honestly, it's not a hard build, and we could send send out this link by next week and get people using this and see what we get the data.
Gaurav Shah:  The data will, will end up in a spreadsheet. We don't have the rest of the admin part built out, but, you know, we can transfer it to this admin platform later on.
Gaurav Shah:  Um, but again, I would love to, like, get this in front of people and see how people are feeling about this as soon as possible.
Suhanya Ketheeswaran:  Yeah. I mean, I like that. I like the idea of testing with a small group of people and then seeing, okay, like, what, what are the, the gaps or what is the response like, and what do we need to do to steward them?
Suhanya Ketheeswaran:  But I'm also a little overwhelmed, Gaurav.
Gaurav Shah:  That's completely fair. Um.
Suhanya Ketheeswaran:  So when you say requirements, like, or when you think of testing, tell me your vision. Like, what do you see happening?
Gaurav Shah:  Yeah. Talk about it. So what I see is either in this call or after this call, you tell me, here's what we want to ask from our Ride for Refuge members that we're going to email, right?
Gaurav Shah:  Um, whether that is, like, what do you want to do, volunteer petitions, things like that. We can ask them those questions.
Gaurav Shah:  Where do you uh, location. We can ask them about, um, you know, like, level of monetary contribution, things like that.
Gaurav Shah:  We can build a payment like, not a payments page per se, but we can build a page for, you know, you can send an e-transfer here. Um, like, you can select the amount.
Gaurav Shah:  We get your email, we get your amount. Um, they can e-transfer it to you and collect what information that they need.
Gaurav Shah:  Um, and all you would do from your side, once we know kind of what we're asking our people, is you would send them this link and then see how many people are responding, and we can collect the data on our end. Um, maybe that wasn't the best way to explain it.
Gaurav Shah:  Just to summarize, it's essentially just, like, can you tell us what we want to ask the people? We'll build the form, and we'll send out the form.
Suhanya Ketheeswaran:  Okay. So first thing that goes out is the form to get their information. And it's only after we get their information that they would be sent a link to actually sign up as a member.
Suhanya Ketheeswaran:  Is that right?
Gaurav Shah:  Um, I think step one would be signing up as a member. And then if you've signed up as a member, then we want to know how you want to contribute. Or it's part of the same it's part of the one.
Suhanya Ketheeswaran:  Uh-huh. Okay. So the ask for membership is, is going out in the email.
Gaurav Shah:  Exactly. It is just one email that you would send with one link, and then they can fill it out, and you have more members now, hopefully.
Suhanya Ketheeswaran:  Okay. And as part of that link, there would also be a questionnaire. The questionnaire will ask you to sign up.
Gaurav Shah:  Exactly. The link is.
Suhanya Ketheeswaran:  Yeah.
Gaurav Shah:  Yeah. The link is the, the question the membership ask, the, the page with your e-transfer email, and then your, um, the questionnaire.
Suhanya Ketheeswaran:  Okay. Got it. Got it.
Suhanya Ketheeswaran:  Thank you. That, that, that I can, like, wrap my mind.
Gaurav Shah:  Yeah. And a little less overwhelming too.
Suhanya Ketheeswaran:  Yeah.
Gaurav Shah:  I hope.
Suhanya Ketheeswaran:  Go ahead, Rithika.
Gaurav Shah:  Yeah. Oh, Rithika, do you want to?
Civic Hub:  Yeah. So I think my initial reaction is, uh, people have generously donated.
Gaurav Shah:  Oh, that's true.
Civic Hub:  Not even a month back. Uh, and I feel it's really unfair to say, "Hey, now become a member and pay more." Uh, I think I would say if I was contributing anything above $200 or whatever, just to say that you have now become a member by contributing it.
Gaurav Shah:  Right.
Civic Hub:  Uh, and, and that's and, you know, uh, we are so glad and this and so again, another question that might come up is that if we ask those people who've been paying to become members, does it mean that if they're if they're going to be paying every month, whenever there is a fundraiser, they would be expected to pay again or not? Uh, and that's a question that we have to think internally how we want to plan the next year's fundraiser as well. Uh, but yeah, I think
Civic Hub:  just in the first instance, I would not want them to pay again at this point in time. But yes, just to say that, you know, you have or you have become a member, and this is all what you get, and now do some kind of survey for the next round to plan better, whatever stuff you want to do. But that becomes a big membership fee to sponsor.
Gaurav Shah:  Yeah. I agree. And, and honestly, easier for us.
Gaurav Shah:  And, and I agree. We wouldn't want to ask them to pay again.
Gaurav Shah:  So we send them this link. We say, "Hey, you're officially a member of SDC.
Gaurav Shah:  Um, and, you know, would you want to fill this out?" And then eventually, we can reach back out to them and say, like, "Hey, okay, to continue the membership, we've introduced this membership fee or however you kind of want to structure it internally."
Gaurav Shah:  Um, but it's still worth getting this questionnaire in front of them or getting them in the door and collecting this information to see even if, if people would want to fill out this information, would they want to get more involved with the community? Um, are they are they dropping off through this form, right?
Gaurav Shah:  Um, do they have questions or concerns with filling this out? Because that, that tells us, okay, if we do this as part of a final product, what are we going to expect to hear back from people?
Gaurav Shah:  Um, does that still even if we're not collecting payments, does sending out this form still feel like a feasible option?
Suhanya Ketheeswaran:  I think so. And I like the idea of, like, this group of people who've already supported us through this fundraiser being like a group that receives maybe, like, complimentary membership and that they become part of this group that's going to help us absolutely like, being honest with them and saying we're building this membership program, and, you know, we want to offer you complimentary membership. Um, you can choose to unsubscribe because some of them might be like, "Whoa, I did not want this at all.
Suhanya Ketheeswaran:  Like, I just wanted to donate to help you with your campaign. You have a very tangible ask, an urgent ask, and I wanted to do that.
Suhanya Ketheeswaran:  I'm not looking for anything more." But if we can give them the opportunity to unsubscribe from that.
Suhanya Ketheeswaran:  Um, and then for those who choose to stay involved, sending out the form to start collecting some information to try and understand this group of people, I think would be yeah. I think.
Gaurav Shah:  Okay. Fantastic. I think we know where next week's build is going to go.
Gaurav Shah:  Um, and then I also have a high-level op like, understanding of what we're building next, which is, you know, now that we have this information, can we get it to you in an admin side? Can you look at what they what they filled out and, and your email communication with them?
Gaurav Shah:  In this week, as we're developing this, I'll also go look at what Salesforce does, um, for nonprofits and donor management and see what are those big things that we can port over here, uh, like, what actually makes sense and come to you with a few more options next week. Um, in the meantime, one thing that I did actually want to show you, um, is while we're in the last four minutes, I thought it might be helpful to, to share.
Gaurav Shah:  I'm going to share my screen. So this is our initial build, given the initial idea of the platform for SDC, right?
Gaurav Shah:  Things will change, of course. Um, but I just wanted to give you a little bit of an insight look into, um, so now you would get members filling out the form.
Gaurav Shah:  You get them in the community, uh, in the community tab. Um, you can see exactly, okay, here's their name, here's their email.
Gaurav Shah:  Um, what is their status? Are they inactive?
Gaurav Shah:  As we have not emails lately, or they have not been opening emails lately? Uh, when were they added?
Gaurav Shah:  We just unsubscribed and we removed the old email. And then what are the emails that they've been sending?
Gaurav Shah:  So what trace back the communication, um, and what is their, uh, success rate? So what we built, given the old idea, I think some of this ports over, and we add to this, um, for your understanding of, of structure.
Gaurav Shah:  Yeah. Just, you know.
Suhanya Ketheeswaran:  So, so where you see this sort of like what the emails are that they got and whether it's like active, inactive, unsubscribe, di will this eventually integrate with Mailchimp? Because Mailchimp also.
Gaurav Shah:  Yeah. So.
Suhanya Ketheeswaran:  Individually.
Gaurav Shah:  That's a that's a good point. So now we got I think we'll take this back and try to figure out how we want to integrate with Mailchimp. Also, having information about your, um, subscription tier would be very helpful because according to the free tier, I think you're only sending out like 900 emails a or like 1,000 emails a month, I think is the limit.
Gaurav Shah:  Um, and, and you are staying within that limit, right? So you still have the free plan, I mean.
Suhanya Ketheeswaran:  Yeah.
Gaurav Shah:  Okay. And Jesse, I know you did some research into Mailchimp integration. Is there anything you can speak to that, or maybe we want to take this back and look at it next week?
Speaker 4:  I think we should take it back. I think specifically, not necessarily Mailchimp, but just integrating the personalization of emails. I think a lot of, um or I guess the thing with Mailchimp is that it's, uh, you can, like, fan it out very easily, but for individual personalization, I think there's not as much you can do as some other providers.
Speaker 4:  And the other providers also are much more limited in the emails you can send. So we'll need to find that middle ground, um, to pick our next.
Gaurav Shah:  Yeah. Yeah. I mean, the, the trade-off is essentially like Mailchimp is harder for us to build and, like, does not support as much personalization, but it gives you really good insights on your end.
Gaurav Shah:  And so we'll try our best to look at how we can do it with Mailchimp, but then if we genuinely cannot, then we'll come back and we can discuss other options. Um, but yeah, that's, that's a good point where, like, we don't want to rebuild Mailchimp here, right?
Gaurav Shah:  Um, okay. I know we're nearing the end of our time.
Gaurav Shah:  Is there anything else to share about this idea? Um, any concerns, comments, questions?
Suhanya Ketheeswaran:  Uh, for me, it's just you, Gaurav, you were mentioning some things that we could include in the form that we want to send out to our.
Gaurav Shah:  Yes.
Suhanya Ketheeswaran:  Ride for Refuge, uh, audience. And I was just wondering if you could drop that in an email for me or if you're capturing notes from today.
Gaurav Shah:  Absolutely. Happy to share notes. And, and I'll drop that as an action item for, for you later.
Gaurav Shah:  Um.
Civic Hub:  So, uh, sorry. In the form, this is the form where we are talking about how much time do you have to that you can spend. So if you have three minutes, you'll do a petition.
Civic Hub:  If you have more time, or what else are we what kind of information are you looking for?
Gaurav Shah:  That's, that's kind of a combination for both of us to decide, but I would imagine things like, what are you interested in? What kinds of topics? So housing, climate, um, you know, what opportunities are you excited about?
Gaurav Shah:  Uh, location, right? Are most of these folks in Kitchener, Waterloo?
Gaurav Shah:  Like, do we need to ask that question?
Suhanya Ketheeswaran:  Yeah. I think it would be good to ask because some of them may have been like, there are probably people on our mailing list who have been historically connected but don't even live in the region anymore.
Gaurav Shah:  Sure. Um, and so, yeah, ask some of those, um, generally topics and then just how much time do you have? And, like, what are the qualitatively, like, what would you want to do or what would you, uh, like, you know, with this membership, what are you hoping for?
Gaurav Shah:  Again, we can figure out how to phrase that question a little bit better, but, um, what are you hoping to support or, you know, what's one way that we can help you, things like that? And just asking that question and seeing what people say.
Civic Hub:  Sure. I think, yeah, I think, uh, we can talk about it, like, go back and forth on the set of questions for sure, um, so that, uh, uh yeah, so that there is no repetition. So yeah, because obviously, if we are supporting SDC, we might have a sense of what they want to support.
Civic Hub:  So yeah, we can work through those things. Those are minor issues.
Gaurav Shah:  Fantastic. And then we'll send this out to the people who just did Ride for Refuge. Okay.
Gaurav Shah:  Fantastic. Okay.
Gaurav Shah:  I'm looking forward to this. Um, I'll send you an email, hopefully by end of day, although I'm in classes all of today, so you might see it from me come through tomorrow.
Gaurav Shah:  Uh, see it come through from me tomorrow. Um, and yeah, this was great.
Gaurav Shah:  Thank you so much for your time. I really appreciate it.
Gaurav Shah:  And we'll talk soon.
Gaurav Shah:  Bye.
Civic Hub:  Bye.
Suhanya Ketheeswaran:  Yeah. Thank you for your time. Bye, everyone.
