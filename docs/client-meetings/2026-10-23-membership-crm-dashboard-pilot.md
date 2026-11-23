# Membership CRM Dashboard Pilot

- **Date:** Friday, 23 October 2026, 12:04 to 1:45 PM (Eastern)
- **Who:** Suhanya Ketheeswaran (SDC), Gaurav Shah (Blueprint)
- **Source:** [Wispr Flow notes](https://notes.wisprflow.ai/shared/OxfIhj2T9W1Fe4kffuVyRAztb1azQbH9jOoNCHYYRB8)

## Summary

Gaurav Shah walked Suhanya Ketheeswaran through the SDC membership CRM prototype, gathered feedback on emails, payments and member pages, and ranked features to prioritize the build ahead of next Friday's check-in.

### Board Approval and Project Load
- SDC board approved non-voting membership for Ride for Refuge participants and was excited by a CRM sneak peek.
- Members currently receive no emails; no staff has ever managed membership, board is governance-only volunteers.
- Suhanya Ketheeswaran flagged the time commitment is far above the estimated couple hours a week, since SDC lacks prior answers.
- Gaurav Shah noted this is unusual for Blueprint, which usually digitizes existing workflows; ambiguity should shrink as building progresses.

### Ride for Refuge Form Feedback
- Form link works; SDC wants wording tweaks to avoid implicitly overpromising to members.
- Example: change issues question to which topics members want in SDC's monthly member emails, since no capacity for segmented lists.

### Prototype: Emails and Member Pages
- Top priorities: track join date for 3, 6, 9, 12 month milestones, and which emails each member received.
    - Planned emails: welcome with questionnaire, intro to SDC, monthly member email, anniversary check-ins
- Automatic emails trigger on conditions/tags and can auto-send or wait in an outbox for personal review.
- Sending: Mailchimp free plan near its limit with ~900 subscribers; team prefers a separate members@ inbox over logging into personal email.
    - Block layouts out of scope; plan to export filtered lists (CSV) for Mailchimp newsletters
    - Inline images in email body are finalized, demo next time
- Member page requests: filters, newest-first timeline, specific dates, single notes section on top, months in scheduling.

### Payments, Cancellation and Gifting
- PayPal embedded button is the leading option; nonprofit fees about 1.9% and 49 cents per transaction.
- Suhanya Ketheeswaran prefers monthly-only payments (e.g. $10 a month on a $120 rate) for retention and cash flow; team to confirm.
- Open question: how members cancel payments, since email unsubscribe differs from stopping membership.
- Gifted memberships could feed a pool matched to people unable to pay, with pool growth shown to givers.

### Feature Ranking and Workflows
- Member list, member page and automatic emails top the list; join page also high since current website is fragile.
- Member page order: payment history, email history, tags, notes; call log dropped as SDC doesn't call members.
- Join page would redirect from waterloo-region.org/memberships to a Vercel-hosted page; running costs about 10 to 30 dollars a month.
- Suhanya Ketheeswaran will check the platform about weekly; urgent items like thank-you emails trigger email reminders to a configurable address.

### Next Steps
- (Suhanya Ketheeswaran) Finish the Google Doc with form wording feedback and send it
- (Suhanya Ketheeswaran) Send the list of minimum templated member emails
- (Suhanya Ketheeswaran) Confirm SDC's Mailchimp plan limits and team comfort sharing the Mailchimp login
- (Suhanya Ketheeswaran) Share the website back-end login so the team can assess hosting the join page
- (Suhanya Ketheeswaran) Ask the team whether to offer only monthly payments
- (Suhanya Ketheeswaran) Write up the membership value proposition and how SDC will market the program

### Decisions Made
- Charitable tax receipts will not be built
- Referrals, member self-serve page and events are ranked low; events stay in Mailchimp newsletters
- No AI or MCP integration for now
- Stewardship emails will not track open rates; click-throughs tracked for unsubscribes, intake form and referrals
- Tagging will use a hybrid of automatic tags (e.g. campaign links, QR codes) and manual tags

## Transcript

Suhanya Ketheeswaran: Of their board meeting, but ahead of that I had already reached out to them last week because it suddenly dawned on me that we had this excellent idea of offering membership to the ride participants, but technically we need the board's approval to be able to do that, because membership actually means something, like kind of legislation and nonprofit legislation. And so I wasn't even sure if the idea of non-voting membership is allowed for nonprofits, and if there are processes, if there are bylaws that need to be
Suhanya Ketheeswaran:  reviewed and whatnot. So the board approved it, which was fantastic, and they were really quick about it. And so yesterday I had an opportunity to actually speak to them and give them an opportunity to ask questions and to show them I gave them a little sneak peek at the CRM that you've already started building, so they were blown away by that.
Suhanya Ketheeswaran:  They're so excited that we're going to be able to move away from having spreadsheets to actually having a dashboard that could do things like trigger reminders for us. The board member that I think has been tasked with keeping tabs on when people's renewals come up was so excited to know that she no longer has to rummage through multiple spreadsheets to figure out who needs to pay, who has paid, and all of that stuff.
Suhanya Ketheeswaran:  And when I asked the question about what kind of emails are our members receiving right now, there was just like there was nothing. And so it makes sense to me.
Suhanya Ketheeswaran:  We don't have a dedicated staff person who's ever managed that in the past. Our board members are all volunteers who are really responsible for governance of the organization, not really anything operationally.
Suhanya Ketheeswaran:  So yeah, I would say the overall mood is one of excitement, that we're actually going to do things differently, and that we're going to have some tools to help us actually implement those things.
Gaurav Shah:  I'm so glad.
Suhanya Ketheeswaran:  For me personally, I think there's two things that I've realized. One is that when we kind of came on to do this project and we were estimating how much time would be required from the SDC team, I think when we thought that it would be like a couple hours a week, I think the assumption there is that we already had answers to a lot of the questions that you would have for us. And we don't, because we haven't actually had a successful membership program or a real
Suhanya Ketheeswaran:  membership program that we've implemented. So so many of the questions that you're asking us, what it's doing is it's prompting us to really think through what this could look like. But those become huge generative conversations, which are really fun to have, but they are time-consuming.
Suhanya Ketheeswaran:  So partly I think there's been a huge demand on my time, and then I'm then extending that demand to the board and to the staff team so that we could really think through this in a way that is helpful to you and ensures that the tool that you're building is actually going to be one that's useful to us. So it's a positive thing, but it has meant a lot more time from us.
Suhanya Ketheeswaran:  And maybe something for you to consider at the UW blueprint end as well is that, yeah, if the nonprofit that you're working with doesn't already have answers to the tool to help build the tool that you're working on, then the time commitment that's required from us is quite massive.
Gaurav Shah:  Yeah, I know. I understand that. And truly, I appreciate you having those conversations, first of all.
Gaurav Shah:  And I apologize that it's like it takes up a while, for sure. It's an interesting situation with blueprint too, because typically when we take on projects, it's taking an existing workflow that the nonprofit has, but it's cumbersome, and then bringing it to software.
Gaurav Shah:  This is one of the first times we're like, "Oh, we're both figuring this out together." And typically it's very like client has done this for years in the past and just does not have the resources to continue to do this.
Gaurav Shah:  Or maybe they've suddenly scaled up and now they cannot do this anymore. Those are typically the problems that we take on.
Gaurav Shah:  So it's an exciting problem. It helps that we have more senior members on the team who are willing and able to deal with the ambiguity of it all.
Gaurav Shah:  But yeah, I do apologize that the conversations are time-consuming. And hopefully as we start building more and more, there's less and less ambiguity and hopefully more time that's spent we'll just review stuff rather than having to yeah, I think there's going to be light at the end of the tunnel is what I'm trying to say.
Suhanya Ketheeswaran:  100%. And I feel like for us, I mean, this has been hugely beneficial for us because when you ask these questions, A, it's forcing us to grapple with questions that we need to grapple with anyway, but because it sort of has always existed on the side of nobody's desk, we've never gotten around to it. So working with you is actually sort of like creating this tunnel and this crunch period where we have to figure these things out.
Suhanya Ketheeswaran:  Hi, Olivia. And I so appreciate you sharing that if we were working with a less junior, like a more junior team at UW blueprint, they would probably be losing our minds with the amount of ambiguity that's present.
Suhanya Ketheeswaran:  So thank you. I'm so grateful that it's your crew that's working with us and that you can handle us being like, "Oh, we never thought about that.
Suhanya Ketheeswaran:  Give us some time to figure it out."
Gaurav Shah:  No, it's all good. But yes, okay, with that, I have an agenda for today's meeting. So I'm just going to share my screen.
Gaurav Shah:  Let's talk through some things together. So we'll start with the ride for our future form.
Gaurav Shah:  You might have seen the link. I just wanted to check, does the link work for you?
Gaurav Shah:  Does everything look okay? And if there's any wording changes to be made.
Suhanya Ketheeswaran:  Yes, the link worked for me. Everything looks great. There are some questions that we absolutely love.
Suhanya Ketheeswaran:  And then there were a couple of questions where we really need to think we needed to think through when we ask this question, what kind of expectations could it implicitly or inadvertently create for our members that we then would not be able to meet? So we're trying to do this in a way where we're breaking old patterns and not overpromising or overcommitting to anything, even implicitly.
Suhanya Ketheeswaran:  There were some questions that we wanted to change just a little bit.
Gaurav Shah:  Of course.
Suhanya Ketheeswaran:  And then there were other questions that we loved. So I can maybe to save time and to ensure that we don't go down a rabbit hole, I won't share those questions, all of the feedback with you now verbally here. I started a Google Doc actually this morning, and I just didn't get a chance to finish it before this call, but I'll finish up right after this call and send it to you.
Suhanya Ketheeswaran:  But I wanted to give you one example. So question number one was worded in your form as which issues would you like to hear about or get involved in?
Suhanya Ketheeswaran:  And when we took that back and I really thought about, okay, once we get a combination of responses from this group of members, what kind of tangible steps can we actually take on our end? And for us, we don't have the capacity right now to create segmented lists that receive tailored emails in response.
Suhanya Ketheeswaran:  And so knowing that that is a capacity limitation that we have, we were like, maybe a question that we could ask instead is which topics would you most like to see featured in SDC's monthly member emails? And so instead of using the question or the data that we collect as a way to then match people to emails or match people to engagement opportunities, we thought we would instead use the question as a way to help us determine what topics we choose to write about in our monthly
Suhanya Ketheeswaran:  emails and use that to hopefully see better open rates, better maybe click-through rates, and better retention in terms of members choosing to stay on with us.
Gaurav Shah:  Absolutely.
Suhanya Ketheeswaran:  So that is an example of how we thought we could tweak it to make the question and the data that we collect more usable for us without overcommitting to anything.
Gaurav Shah:  Yeah, that makes a lot of sense to me. And I guess happy to make wording changes there. And I appreciate how thoughtfully you're thinking through all of the implications that this form creates.
Gaurav Shah:  It's also just going to be very helpful to get that data in the door and start seeing people try to respond and see if people are dropping off at certain places, things like that. That's also one of the big things that we'll be keeping an eye on our end.
Gaurav Shah:  But that's good to know. I look forward to the Google Doc.
Gaurav Shah:  Moving on to the next thing, there's the prototype walkthrough and feature rankings. I'll start with the prototype walkthrough.
Gaurav Shah:  So you've seen this before. The idea with this is I wanted to show you what the full capability set could look like.
Gaurav Shah:  And then maybe we can together figure out how do we want to prioritize what we're building here. And so I've put together a list of features and flows here, and we can rank them together.
Gaurav Shah:  But before I do, I just wanted to quickly gauge how did you have the opportunity to explore this platform and if there's any immediate thoughts or questions.
Suhanya Ketheeswaran:  Yeah, I poked around. And like I said, I think I was just really excited to be able to see that there is a dashboard now and that we no longer have to search through multiple spreadsheets or multiple tabs on spreadsheets and search through old emails to try and figure out what's happening with different members. So I love this dashboard right off the top.
Suhanya Ketheeswaran:  And then I like along the left-hand side, the sort of the options that I can click through is also really helpful. I think that for us, as we're thinking through what can we do with this initial group of members that we're using as a test group, I think for us being able to know when do they come on board so that we can calculate when does their 12-month period end and we can know when they hit those different milestones, like whether it's three months, six
Suhanya Ketheeswaran:  months, nine months, whatever, that's really important. And it feels like this is going to allow us to do that. You've already captured that piece here.
Suhanya Ketheeswaran:  So knowing that timeline, priority number one. The second priority is being able to track which emails they've already received.
Suhanya Ketheeswaran:  So we started thinking through what are some of the templated emails we have the capacity to create at minimum and make sure that people are receiving. And so I have a sense of what those are.
Suhanya Ketheeswaran:  And if you would like me to send that to you in a list, I can do that if that would be helpful for you to know.
Gaurav Shah:  Yeah, absolutely. No rush on that. It would be good to know later.
Suhanya Ketheeswaran:  Okay, absolutely. Because we're thinking through that anyway and trying to be really realistic with our capacity and also what would be a minimum standard that we want to create for members in their experience. So we know for sure that we want to be able to send them a welcome email with the link to this questionnaire.
Suhanya Ketheeswaran:  We know that we want to be able to send them like a here's your introduction to SDC with an attachment in there that tells them a little bit about who we are, introduces them to the staff and board and our programs and whatnot. And then we want to be able to send monthly emails to people that are going to replace the roundup emails we currently send to all 1,000 subscribers.
Suhanya Ketheeswaran:  It's only going to go to members and it's going to have a stewardship flavor to it. And then we want to be able to send those you had talked about anniversary emails and we were like, okay, at the three-month mark, the six-month mark, what are the things that we actually want to be able to say beyond just congratulations on being a member for this long?
Suhanya Ketheeswaran:  And we thought we would use them as a check-in to say, how has your experience been? You've now received three emails from us.
Suhanya Ketheeswaran:  Is it content that you actually find useful? Or is this the kind of content that you want to continue to receive?
Suhanya Ketheeswaran:  And if we've shared engagement opportunities, we want to be able to track if there was a call to action, which members actually took us up on those and be able to reflect that back. And if there are members who don't take us up on any of those and don't do anything more than just read our emails, we want to be able to check in on that as well.
Suhanya Ketheeswaran:  So it is pretty personalized, the kind of check-ins that we want to do, but with a group of just about 60 people at the upper end, it feels like a manageable group to do that with so that we could really test. And then when we start actually recruiting more paying members, we hopefully can use these insights to automate some of that so that we don't have to have personalized conversations with everybody.
Suhanya Ketheeswaran:  So as we're thinking through the emails that we want to send and what's in the content of those emails, we would like the CRM to be able to tell us who is due for each of those emails.
Gaurav Shah:  Who is due in the sense of?
Suhanya Ketheeswaran:  Okay, so who needs to be sent that three-month email?
Gaurav Shah:  Yes. Okay, so this is where I think it might be helpful if I give you a very quick walkthrough of the platform. There's a few small bits and pieces that I think maybe the prototype didn't capture as well.
Gaurav Shah:  And then because I think we can take that idea one step further, instead of just warning you, you write the template and automatically just sends the three-month email when it's time. Or it waits for you to customize it before it sends it, but it puts it in your outbox ready to send whenever you're ready.
Gaurav Shah:  But if it's helpful, I just want to take a quick two, three minutes and walk you through kind of what we're thinking through here. Sorry to interrupt, by the way.
Suhanya Ketheeswaran:  No, no, I have so many questions about what you said. So walk me through it. I'm going to hold my questions until I can see it.
Gaurav Shah:  Fantastic. Okay, so I'll start with step one is we got to get members into the platform, right? And so that means we talked about a little bit about e-transfers, Stripe, PayPal.
Gaurav Shah:  We're still exploring options there. I think in my mind, the best option to explore that we want to continue exploring further is PayPal, where you're able to embed a pay with PayPal button on a website.
Gaurav Shah:  People click that. We know that it's them who clicked it, and then we enter them into the CRM and we know the amount that they've donated, right?
Gaurav Shah:  And so we're still trying to figure out how does that exactly work, making sure that it's secure, making sure that we are not handling any sensitive information from SDC. And it seems like a part that we should explore.
Gaurav Shah:  That's what I'll say for now. And so we get the members into the CRM and we know that they are paying and you are able to see them.
Gaurav Shah:  You're also, as an admin, able to just add members in this. This is a very cumbersome process here, but we'll make it easier for you to add them in.
Gaurav Shah:  So maybe just uploading an Excel sheet of yes.
Suhanya Ketheeswaran:  Why would we ever manually add a member?
Gaurav Shah:  That's a great question. Like right for our future, for example, right now, you gave a bunch of folks non-voting membership and they haven't paid, so they would enter the CRM through this.
Suhanya Ketheeswaran:  Got it. Okay.
Gaurav Shah:  And so it's a rare functionality that I don't expect you to be using very often, but if you do, it's easy to add people in the door. But those are kind of the two main ways. So we're hoping to set up a quick landing page isn't the right word, but if you open up the link, it walks you through the benefits of the membership.
Gaurav Shah:  Here's the link to donate. Here's the information.
Gaurav Shah:  And can you your name, your email, stuff like that, and then you pay. That way, we're able to add you into the CRM automatically.
Gaurav Shah:  Sorry, words. Member goes there, member puts in their information, member pays, they enter the CRM, or admin adds them as a new add them.
Gaurav Shah:  And that's how they enter the CRM. So that's step one.
Gaurav Shah:  Step two is now that they're in the CRM, what do we do, right? And that's where you are able to set up work closer automatic emails, essentially, right?
Gaurav Shah:  So you create one and you say, I'm going to say thank you email for high-value donors, just for the sake of this demo. Let's say when someone joins, only if their donation payment amount is at least $1,000, let's say.
Gaurav Shah:  And so maybe they should be receiving a different kind of email. Then flag for me or send an email and then it can wait for your review, essentially.
Gaurav Shah:  So it's going to use you write out your template, high-value donor, thank you email here.
Gaurav Shah:  You add your subject, etc. You can preview the email before it sends or you can save it.
Gaurav Shah:  And when you save it, essentially, one of the emails that you could send whenever you're ready, this looks good. This has been approved by everyone.
Gaurav Shah:  The email copy looks good. You turn it on.
Gaurav Shah:  And so everyone from now on who joins as a donor who's paying more than $1,000 or a member who's paying more than $1,000 will now start receiving these thank you emails. And so it'll automatically send the email out for you if you'd like.
Gaurav Shah:  If you want, it can pause for your review as well. And so it'll go into the outbox.
Gaurav Shah:  It doesn't exist on this prototype. I have a different prototype, I believe.
Gaurav Shah:  Sorry, there's been a few different prototypes. But essentially, you can imagine a page where you see all the emails that are about to go out.
Gaurav Shah:  You're able to go in and edit them or stop them from going out. Or if you flag them as wait for my review before you send this, for example, a high-value donor probably deserves a more personalized thank you.
Gaurav Shah:  Then the email waits for you. You can go and you can edit it and then you can send it out, essentially.
Gaurav Shah:  And that way, the core of your emails that you would like for you to send automatically get sent out. If you'd like it to wait for you, then it'll wait for you and you can select that.
Gaurav Shah:  And so that's part number two is stewardship or sending out emails. The email is part of stewardship, at least, is handled by the platform.
Gaurav Shah:  Okay, I'll pause here.
Suhanya Ketheeswaran:  I love this. I love this. I can't believe that you built this.
Suhanya Ketheeswaran:  Thank you so much. This is incredible.
Suhanya Ketheeswaran:  Just to even be able to see this is the set of emails that we can send. And I'm always thinking of it from a perspective of what if I'm not at SDC and somebody else needs to pick this up and run with it.
Suhanya Ketheeswaran:  For someone to be able to come in and see that this is sort of the minimum list of emails that a member should get and then to be able to tweak it or add to it is beautiful.
Gaurav Shah:  I'm very glad.
Suhanya Ketheeswaran:  I have a concrete, more of a logistical question. When you say that these emails are written in here, are they going to send from this platform? Or are they going to send from my Gmail?
Suhanya Ketheeswaran:  Are they going to send from Mailchimp? Where does it actually go out from?
Gaurav Shah:  That's a very good question. And so there's a couple of options here. I think overall, the team is a little hesitant to do the Mailchimp integration just because on the free plan, there's a certain limit on the number of emails that you can send out.
Gaurav Shah:  And let's say that you get 100 members and you're trying to send out emails.
Gaurav Shah:  If you hit your it prevents you from sending out your regular newsletters, essentially, right? I believe with 900 people on your email, say, on your mailing list, you're very close to the edge of the plan, the free plan already.
Gaurav Shah:  And so if we start sending more emails from here, then it might just cause you to go over and then some emails don't send from Mailchimp. So logistically, we're thinking it'll send either from a separate inbox that we set up for membership work, if you'd like, or we can send it out from your email, whatever works for you.
Gaurav Shah:  With the caveat that if we're sending it from your email, then essentially, we're going to have to log into your email as you, right, which is a security risk. And so our preference would be to set up a separate email for memberships.
Gaurav Shah:  So like a members@waterlooregion.ca, if you'd like to set it up or if you'd like to set it up separately. And then that would send out the emails.
Suhanya Ketheeswaran:  So I like the thinking around making sure that we don't cap out our ability to send emails. I'm going to go back and look at what we have access to in Mailchimp because I think that at one point we were grandfathered in based on a pre-existing plan that we the free plan and whatever benefits were available to people on that free plan. I feel like that carried over when they switched to a more narrower set of features.
Suhanya Ketheeswaran:  But I will confirm that.
Gaurav Shah:  Yeah, that's helpful. The one other thing I want to flag with the Mailchimp then is the security as well, right?
Gaurav Shah:  Either if we're sending an email from Mailchimp, that means that we log into your Mailchimp as SDC and then we send the emails out, right? So again, I just want to make sure that I'll talk to my technical team on how they are making sure it's secure.
Gaurav Shah:  And of course, it will be. We're not trying to provide your passwords to the public.
Gaurav Shah:  But I also want to make sure that as SDC, you are comfortable sharing that login with us as well for us to send this out. We'll do testing.
Gaurav Shah:  As we're building this platform, we'll run it from a test environment. And then when we're deploying it with you, then we'll kind of ask for your password then.
Gaurav Shah:  But I just want to gauge comfortability there as well.
Suhanya Ketheeswaran:  Sure. So that's something for me to take back to my team as well. So thank you for that.
Suhanya Ketheeswaran:  The limitation that I see immediately with sending emails from if we create a members@waterlooregion email address and sending it just through Gmail, is that it doesn't allow for the kind of layout features that you get from a platform like Mailchimp. How do we where do we put images?
Suhanya Ketheeswaran:  How do we create blocks? I really like the interface of that.
Suhanya Ketheeswaran:  And so the simplicity of sending it through Gmail is beautiful on the one hand, but then losing the layout features is a drawback.
Gaurav Shah:  And I'm glad you bring that up.
Suhanya Ketheeswaran:  Any thoughts on that or workarounds?
Gaurav Shah:  I do. So first, actually, because we were thinking about this when we were building our email editor, do we want plain text? Do we want HTML or block layouts?
Gaurav Shah:  And apparently, research shows that plain text emails have a significantly better open and click-through rate when coming from a nonprofit because it feels more human and genuine, right? And so I'm wondering if there's a mix of regular text emails for those thank you emails, for those check-ins that you might want to use.
Gaurav Shah:  And then for your newsletters, you're using the more branded Mailchimp style emails with the blocks and the layouts because those do require layouts, I believe. And in which case, what we could allow for is on the people one of the workarounds that we're thinking of, depending on your comfortability, which you're in Mailchimp login, is just from the people tab, you're able to copy the emails of the people that match certain requirements.
Gaurav Shah:  You're able to filter for, let's say, I want to send an email to right for refuge folks or members not renewed, let's say. And you're able to just copy the emails of these folks and then send them an email from Mailchimp directly.
Suhanya Ketheeswaran:  Will it generate a spreadsheet for me or a CSV file? Assuming that this list gets longer, could the platform do that?
Gaurav Shah:  Yeah, it could. Yeah. So maybe it's a combination of the two.
Gaurav Shah:  I think on our platform, building an email editor that's able to support block layouts is going to be a significant scope creep. But we can figure out a way for you to work with this platform and Mailchimp together.
Gaurav Shah:  Or if you'd like to use everything from Mailchimp, then are you okay with sharing your password there? Awesome.
Gaurav Shah:  Okay. So that was part number two, is sending the emails.
Gaurav Shah:  Part number three is once they have the emails, how do we actually check up on them and what does that CRM piece look like? So for each member, you're able to again, this is a very standard prototype.
Gaurav Shah:  You'll be able to see more information for each person. But for each person, what is their name?
Gaurav Shah:  What is their email? And what are their tags?
Gaurav Shah:  So as an admin, you can go ahead and start tagging people with certain things. So in this case, for example, all the folks joining from Red Refuge, you tag them with Red Refuge.
Gaurav Shah:  And so next year, when you're doing the program again, you can filter for folks with the right for refuge tag and then send them the email separately for them. You're able to see what emails they've received up to this point.
Gaurav Shah:  So you have a good understanding of their experience so far. You're able to see a note that you might have added for them.
Gaurav Shah:  When did they join? What did they get tagged as?
Gaurav Shah:  Things like that. And so essentially, a timeline view is what we were thinking of, but I want to get your thoughts on that too.
Suhanya Ketheeswaran:  I love that. Being able to look at it. I wonder with once they receive a bunch of emails, as they get further and further into their one-year membership or into multi-year memberships, what happens to this area at the bottom where you can see every single email that they've received?
Gaurav Shah:  Oh, yes. It's a lazy load. So as you scroll, it loads more and more of the emails as you go down.
Gaurav Shah:  And I wonder if it's easier if you just are able to filter by notes and filter by emails. So if you're looking for a very specific thing, you can go find that quickly.
Suhanya Ketheeswaran:  Yeah. Maybe being able to filter on this page would be helpful. And would it load chronologically starting with maybe if we could start with the most recent and go backwards?
Gaurav Shah:  Yeah. That's exactly what we were thinking too.
Suhanya Ketheeswaran:  Perfect. And then along the right-hand side, if instead of today, yesterday, if we could have the specific dates.
Gaurav Shah:  Yes. Yeah.
Suhanya Ketheeswaran:  I think that would be helpful. I love that you thought about tagging people as right for refuge because that came up in the board meeting yesterday where one of the board members was like, "We understand that you're offering complimentary membership, but the whole goal of our membership program, or one of the goals of the membership program, is to create this alternative revenue stream." And so they were like, "In 12 months, are you going to go back to these people and invite them to become paying members?"
Suhanya Ketheeswaran:  And we were like, "Yes. Yes.
Suhanya Ketheeswaran:  We will not keep them as non-paying members forever." So having that tag so that we could say, "This particular group, let's make sure that we send that email at their 12-month mark or at the 11th month mark to say, 'Your membership is about to expire.
Suhanya Ketheeswaran:  We would love for you to come back on, but your complimentary membership will be ending on this date. And here's how you can stay on as a member by paying.'."
Gaurav Shah:  Exactly. And so the way that you do that is you just tag them with right for refuge. You go into emails, you write up the email, you select send it to folks automatic email, send it to folks with the right for refuge tag, and then set it up to send at a certain point and schedule it, basically.
Suhanya Ketheeswaran:  Amazing.
Gaurav Shah:  So days after joining. Okay. We might add months just to make it a little bit easier, but you can imagine in 330 days of them joining, you send them an email saying that their thing is expiring, and it'll send it automatically when the time arrives.
Suhanya Ketheeswaran:  Yeah. So maybe having months would be helpful as we're getting further along. And then do you see oh, you already have it.
Suhanya Ketheeswaran:  I was just going to say, is there a way to have multiple conditions? And you do have that already there.
Gaurav Shah:  Yeah, absolutely. And so I'm hoping that we can kind of give you that.
Gaurav Shah:  So these two would kind of be our core set of things that we're building, right? And then we started thinking about the other things that you might need to make this platform the most useful for you.
Gaurav Shah:  And that's where I think I want to start discussing some of the other tabs here and get some opinions. And then we can move over and start ranking them.
Gaurav Shah:  The next thing is charitable tax receipts. This is.
Suhanya Ketheeswaran:  Can I ask you before you move on, can I just ask you one more question about emails?
Gaurav Shah:  Yes. Oh, please.
Suhanya Ketheeswaran:  When we write emails through this platform, is there a way to include even one image and not have it be an attachment, but actually have it show up in the body of an email, for example?
Gaurav Shah:  Yes. It isn't in this prototype, unfortunately, but yeah, it's what we finalized yesterday, in fact, so.
Suhanya Ketheeswaran:  Okay. Perfect. Perfect.
Suhanya Ketheeswaran:  Thank you.
Gaurav Shah:  Awesome. I'll have that to demo next time. Awesome.
Gaurav Shah:  Okay. The next thing is charitable tax receipts.
Gaurav Shah:  We hear this from other nonprofits that Blue Print has worked with in the past, not necessarily SDC. But I'm curious, with members, do you foresee giving them those receipts?
Gaurav Shah:  What might they look like?
Suhanya Ketheeswaran:  No. I think the legislation actually precludes us from being able to do that because if you're a donor, then you're entitled to a charitable tax receipt. But if you're a member, the idea is that you're receiving tangible benefits in exchange.
Suhanya Ketheeswaran:  So you're paying for a set of benefits or services, and that therefore precludes you from counting that as a charitable donation.
Gaurav Shah:  That's great. One last thing for us to build. Awesome.
Gaurav Shah:  The next thing was kind of payment tracking. Again, this tab looks or has a feature set that might not exist in the end product in this exact way.
Gaurav Shah:  But we imagine that you want to track if people are paying their monthly subscriptions or their general yearly membership dues. And if they haven't, then send them a renewal reminder.
Gaurav Shah:  Or if they've lapsed and they haven't paid, then following up with them on that. And we imagine that those would be things that you want to track.
Gaurav Shah:  I'm curious if you see yourself tracking payments on this platform. Generally, what payments for memberships could look like.
Gaurav Shah:  Is it monthly, yearly, things like that?
Suhanya Ketheeswaran:  Yeah. So that's a good question. That's what we're trying to find out with finance because we've had some turnover and there's been some changes.
Suhanya Ketheeswaran:  So before, when we were using Square as a way for people to pay, I still don't think that there was an option for monthly payments. I think that you signed up for the year, you made a flat payment, and then at the end of that, it was somebody's responsibility to reach out to that person and encourage them to renew in year two.
Suhanya Ketheeswaran:  I know from my fundraising background that you want to always try and encourage people to give monthly because A, it feels like a smaller commitment financially when people need to just see that coming off of their credit card on a monthly basis instead of paying upfront annually. And it also increases the likelihood of people staying on beyond the one year when they know that it's not the case that they have to keep renewing so much as choosing to unsubscribe or end their payments.
Suhanya Ketheeswaran:  And so I wanted to ask you, since you're doing all this research into PayPal, whether we can offer people the option to give if we know that the annual membership rate is going to be, let's say, $120 for 12 months, that we can offer them the option to pay on a monthly basis so that we would be deducting $10 each month from their credit card instead of taking all $120 upfront.
Gaurav Shah:  Yeah. That's where I need to again, I need to do some research, but it's helpful to know that we want to do a monthly system. Do you foresee different pay periods for different people?
Gaurav Shah:  So some people are paying monthly, some people are paying annually for something like this?
Suhanya Ketheeswaran:  That's a good question. I'll have to ask the team. My preference is to not offer the option of annual and to instead just do monthly because it also creates a more predictable cash flow for us.
Suhanya Ketheeswaran:  And I think it'll what's that?
Gaurav Shah:  It's also less scope for us. It's helpful to have monthly.
Suhanya Ketheeswaran:  It's less scope for you? Just monthly? Yeah.
Suhanya Ketheeswaran:  And then the other thing is then we have to know how can somebody go in and cancel, right? If somebody wants the option to be monthly, it gives them the option to be able to say, "I want to cancel in month six or month seven."
Suhanya Ketheeswaran:  But I don't know what that looks like on PayPal because I don't know if we've offered that option in the past. And offering that option, A, it creates flexibility for people so that they know that they're not committing to a year's worth of deductions.
Suhanya Ketheeswaran:  They know that at any point, they can cancel. And it kind of keeps with this idea that membership is completely voluntary.
Suhanya Ketheeswaran:  And B, I feel like it would give us some important data in the background. It would be really nice to be able to see if people are choosing to cancel.
Suhanya Ketheeswaran:  And then we can always send them an email, right, to check in and say, "Why did you choose to cancel?" And that would give us helpful information.
Gaurav Shah:  Absolutely. And one of the things we're considering if we're able to incorporate payments here is in the CRM, in this timeline, you're able to see when did they cancel and probably even what email did they come from when they canceled. So let's say, for example, they click on the way that they'd access the cancel link right now is our theory of how we're thinking of building this is there's an unsubscribe button that's required by law at the bottom of every email, right?
Gaurav Shah:  And so you click on the unsubscribe button. You're unsubscribing to the email.
Gaurav Shah:  You're probably also unsubscribed from your membership. Or you might assume that that's kind of where that lives.
Gaurav Shah:  And so that's where we put it. We give you the option to cancel your membership from that at the bottom of the email, essentially.
Gaurav Shah:  And so when they do, we're able to attribute it to which email did they come from and at what point in their timeline did they unsubscribe. And that's helpful data, hopefully, for you as well.
Gaurav Shah:  I think we should think about that further, though, if there's a better place to put a cancel button. It's unlike a lot of places, right?
Gaurav Shah:  Because members don't have a platform of their own, where do you there's nothing to sign into. There's no one place where you can go and cancel your subscription.
Gaurav Shah:  So we're trying to think through what does that actually look like.
Suhanya Ketheeswaran:  That's right. And also, when they unsubscribe from an email, it's not the same thing as unsubscribing from the monthly deductions.
Gaurav Shah:  Exactly.
Suhanya Ketheeswaran:  Right? And so I wonder if yeah, where do we put that? When they choose to unsubscribe from the email, does the automated email that they get or the pop-up that comes up, does that ask them, "Are you only unsubscribing from our emails, or are you also looking to unsubscribe from your membership?"
Suhanya Ketheeswaran:  And if yes, then is there a link for them to then go back into PayPal somehow and unsubscribe? I'm not sure.
Suhanya Ketheeswaran:  We've never had that option before, so I'm not even sure how that would work.
Gaurav Shah:  Yeah. Maybe we'll take this back and do some research and then get back to you maybe next week on some options there and what that could look like.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  Fantastic. Okay. So that was the platform.
Gaurav Shah:  I'm going to share my tab to this page now. And now that we've gone through the prototype, I just want to spend some time ranking these features based on what's the most important to least important for us.
Gaurav Shah:  And that way, as a team, when we're trying to prioritize the work that we do, it's helpful for us to know where we spend most amount of time, right? So there's the oh, there's a few things I'm realizing that I haven't covered.
Gaurav Shah:  So as I do that, we might just go back and forth a little bit from the prototype. The home to-do list is the first thing here.
Gaurav Shah:  So if I can share my screen. The homepage is meant for you to know what we need from you or what this platform needs from you, essentially, right?
Gaurav Shah:  So if you need to review a payment, if you need to send someone a personalized thank-you email, or you need to approve that email that's been waiting for you in the outbox, it's all in one place so you know all the items that you kind of have to work on as an admin instead of going and hunting for them across the platform and accidentally maybe forgetting something. So that's the home to-do list.
Gaurav Shah:  We talked about the member list. So I'm just looking through all the specific things.
Gaurav Shah:  Member page, automatic emails, one-off emails, invites, and referrals. Oh, invites and referrals.
Gaurav Shah:  Any member is able to refer someone from the email. So beside the unsubscribe button, there's a tell a friend about us link.
Gaurav Shah:  You click on it. You're able to put in the name and email of someone else, and you're able to refer them.
Gaurav Shah:  And so we'll give them a special link that they can send to their friends. And if the friend joins from that link, then we know we can attribute it back to this person, essentially.
Suhanya Ketheeswaran:  Oh, I see. So it's not a forwarding of the email. It's like actually encouraging someone in their life to sign up as a member.
Gaurav Shah:  Yes, exactly. So what I do is I click on this link. Sorry.
Gaurav Shah:  On an email, I click tell a friend. I add in Olivia's name.
Gaurav Shah:  I add in Olivia's email, and I copy the special link that it gives me. And I send that to Olivia via maybe text message.
Gaurav Shah:  Olivia clicks on the link, subscribes to the membership, and then now you're able to attribute so you know Olivia joined because of referral from Gaurav. And then in my member page, you're able to see Gaurav referred Olivia, and then Olivia joined.
Suhanya Ketheeswaran:  Okay. Got it.
Gaurav Shah:  So you have the full timeline of events. So that's how we're thinking referrals will work. We talked about payments.
Gaurav Shah:  We talked about tax receipts, and we're not doing that. We talked about gifting a membership.
Gaurav Shah:  We did not talk about gifting a membership.
Suhanya Ketheeswaran:  No, I had a question about that from the dashboard, but yeah, continue.
Gaurav Shah:  Yes. We're also still trying to scope out what gifting a membership looks like. But TLDR, the way I imagine it, is I can choose to as I'm paying, I'm asked to do you want to also pay for someone else, or do you want to gift a membership to someone else?
Gaurav Shah:  And then if someone needs someone is signing up to be a member, maybe then we figure out if they have an option there to say, "I don't have the capacity to pay, but I'd still like to be a member." And we could figure out the exact wording there and be very careful about it.
Gaurav Shah:  So we'll work closely with you on that. But yeah, they're able to sign up.
Gaurav Shah:  And then if someone has gifted a membership, then they're able to accept that gift. Or if you're gifting it to someone.
Suhanya Ketheeswaran:  Perfect.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  We're also thinking through this because this is new for us. And a lot of organizations, as I've been doing some research into different membership programs that exist in the real world, they will have a sliding scale or they'll have tick boxes to say, "If you're a student or low income, you can tick this box, and this is the amount you'll need to pay. If you're able to pay the full amount, here's the amount.
Suhanya Ketheeswaran:  And if you meet the criteria A, B, and C, and you're not able to pay, you can click here." And that's also available to some people.
Suhanya Ketheeswaran:  Or there's membership amounts that are as low as $5, for example, so that people still feel like they're paying something. When we talked about gifting a membership, we wanted to create the opportunity for people to not have to pay anything at all.
Suhanya Ketheeswaran:  But we want to still ensure that those who have the capacity are considering that they can gift the membership because people do, and people like to show their generosity in all kinds of ways. And so what we could do maybe, and this is what I'm thinking about it, is the person who's gifting, the wording can say something like, "Your gift will be added into a pool of money that's available.
Suhanya Ketheeswaran:  And then when others indicate that they would like to become a member but don't have the financial capacity, then they will be matched with the amount or the membership that you've gifted."
Gaurav Shah:  Yes. Okay. That makes a lot of sense.
Gaurav Shah:  We can even show them how that pool grew because of their membership or because of their contribution. Yeah.
Suhanya Ketheeswaran:  That's right. That's right. That's right.
Suhanya Ketheeswaran:  So we can always we can track how much money is sitting in this pot that's available for people who don't have the capacity to purchase a membership.
Gaurav Shah:  That makes sense. Okay. Fantastic.
Gaurav Shah:  And as we do more and more work, we'll try to figure out what gifting a membership looks like. Events.
Gaurav Shah:  I know this was part of the original plan, and so I still wanted to include it as part of this list that we're ranking. We're able to post events members can see and sign up for it.
Gaurav Shah:  My ideal is that you're doing this via Mailchimp, and you're sending this out in your newsletters. And that maybe lives outside of the platform, but again, we can talk about that if you'd like.
Gaurav Shah:  And then lastly, there's a second last membership sorry, member self-serve page. So a member can go in and update their details, change their monthly amount, unsubscribe, get a receipt, all of those things.
Gaurav Shah:  The benefit of that is a member now has one place that they can go to handle their membership. The con of that is are people going to access that?
Gaurav Shah:  I think is our question or how the reach essentially is the problem there. Are people going to log into the separate system even if we make it super simple?
Gaurav Shah:  And so something that we can consider as part of our solutioning. And then lastly, there's the join page.
Gaurav Shah:  So as we talked about, a page where you're able to enter your details, you're able to pay, and it's a separate page from the existing page that you have on your website, essentially. The join page would be something else.
Gaurav Shah:  And do we want to focus on that or not? So that's the full set of here's everything laid out on the table that we could build, right?
Gaurav Shah:  And now I want to spend some time quickly ranking them and seeing what actually matters the most to someone and if you have thoughts there.
Suhanya Ketheeswaran:  Okay.
Suhanya Ketheeswaran:  So tax receipts, you can remove, right? We know for sure that we don't need that.
Gaurav Shah:  Yeah. Move that all the way to the bottom.
Suhanya Ketheeswaran:  Payments. I wanted to ask you, is there a way it sounds like our finance team needs to receive notifications so that they can track the stuff that they're doing for cash flow and whatnot. Do you envision them logging into the system as well?
Suhanya Ketheeswaran:  Or will whatever we use for payments moving forward, will two notifications be sent, one into this CRM and one to the finance team?
Gaurav Shah:  We can do both. But I would almost just send an email to the finance department. The platform can send an email to the finance department every time a payment is received automatically.
Suhanya Ketheeswaran:  Okay. Okay. Got it.
Gaurav Shah:  So notifications would be a concern for them, I think.
Suhanya Ketheeswaran:  Okay. And the member list and the member page, I see those as two separate features. Can you remind me what the difference is between the two?
Gaurav Shah:  They're very similar. The member list is the list of all of the people, and you're able to kind of filter through each person sorry, filter for specific tags and people in that list. A member page is when you click into a specific person, the timeline of that specific person, what emails, notes, payments have they received, things like that.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  I assume they'll be close to each other in the ranking list.
Suhanya Ketheeswaran:  Yeah. Yeah. And they both feel vital.
Suhanya Ketheeswaran:  I think we need to be able to have both. So I like that they're so close to the top.
Suhanya Ketheeswaran:  So I think one, two, and three, you've got those correct. The join page is the other thing that I think that our team would really prioritize.
Suhanya Ketheeswaran:  The page that we have right now is built within our existing website, which feels like it's on its last legs. And we're always worried about when that website is going to potentially crash.
Suhanya Ketheeswaran:  And every time I go in in the background to make edits, there's always these sort of bugs that I discover.
Gaurav Shah:  Oh, no.
Suhanya Ketheeswaran:  So if there was a separate joint page, I think we would feel a lot better about it. As we're bringing members into the fold, that the first experience they have with us isn't that they're being sent to our existing website that is so precarious at the moment. But when you talk about a joint page, are you thinking that it would be a separate page that's hosted on our existing website, or would it live somewhere else?
Gaurav Shah:  We could host it on a page on your website. We could also put it somewhere else. It would look different from your website.
Gaurav Shah:  It probably wouldn't be built on the same I believe you're using WordPress or something like that?
Suhanya Ketheeswaran:  No, we're not using WordPress. And I actually couldn't tell you what we're using.
Gaurav Shah:  Okay. I'm sure that we could just kind of we have a link. What's your website?
Gaurav Shah:  I think SDC Waterloo, something like that?
Suhanya Ketheeswaran:  No, waterloo-region.org.
Gaurav Shah:  Oh, yeah. Waterloo-region.org. And so if you have what we could do is let's say you have waterloo-region.org/memberships, and it would just redirect to our page, essentially.
Gaurav Shah:  So that's how that could work.
Suhanya Ketheeswaran:  And then where would it be hosted?
Gaurav Shah:  It would be.
Suhanya Ketheeswaran:  Would it have a different URL? Do we need to purchase a different domain?
Gaurav Shah:  Oh, that's a good question. I don't think you need to purchase a new domain. Internally, I would still want to use Vercel, so the same link that we've been using for the Right to Refuge form, for example, similar to that.
Gaurav Shah:  So it's sdc sorry, dot vercel dot com.
Gaurav Shah:  For the specific thing, I'll have to ask my technical leads. My understanding is that the URL would be the same, right?
Gaurav Shah:  Waterloo-region.org/memberships, but then the page that would show is coming from our website. So we would essentially point our website to say, "If someone goes to that link, show this page, not the website."
Gaurav Shah:  But we'd have to understand what your website is built on, I think.
Suhanya Ketheeswaran:  Okay. All right. And I mean, I'm happy to give you the login to that if that's helpful to you, and you can go look in the back end and see the mess that is there.
Gaurav Shah:  That would be helpful, yes. I'll make sure to keep it very secure.
Suhanya Ketheeswaran:  Okay. Sounds good. Because it would be my login.
Suhanya Ketheeswaran:  I don't know that anybody else on the team currently has a login, so I would just give you my login, and I feel comfortable doing that, knowing that you're just going in there to look and not to actually try to change anything.
Gaurav Shah:  Yes. I agree.
Suhanya Ketheeswaran:  And then when you say that you would have your website and it would point to this, are there any ongoing costs for us that we need to be factoring in?
Gaurav Shah:  Yeah, that's a good question. So hosting is a cost, as in making sure that the back end runs. And so we estimate around $10 a month.
Gaurav Shah:  And then for emails, there's no current cost associated with it. If you go above we're still exploring email solutions.
Gaurav Shah:  So if we send it via your Gmail directly or the memberships@waterloo-region.org email, then there's no cost associated with it. If we want insights, that is where there's a cost that starts to get associated with it, unless we use Mailchimp.
Gaurav Shah:  We will get to that in a second. But you can estimate the costs are somewhere between 10 to 30 dollars a month.
Gaurav Shah:  And we are doing our best to minimize costs.
Suhanya Ketheeswaran:  Okay. I appreciate that.
Gaurav Shah:  Oh, and then if we do PayPal, there will also be transaction fees associated with it. I believe if you have the nonprofit plan, then it's like 1.9% and 49 cents on every transaction.
Suhanya Ketheeswaran:  Yes. And it sounds like the finance team was aware of that. And it sounds like cost wasn't the reason why they moved to e-transfer, which is what I had assumed.
Suhanya Ketheeswaran:  It sounds like they switched to e-transfer because it somehow simplified the process for our former ED to not have it go through Square. Okay.
Suhanya Ketheeswaran:  So I'm really not sure, Gaurav. I'm not sure how to answer your question of how to rank these.
Gaurav Shah:  I know it's a hard question. And just because something is ranked lower, it doesn't mean that we're not going to do it. It just means how much time do we spend on it?
Gaurav Shah:  Or if we have to cut, we start cutting from the bottom up.
Speaker 3:  If you aren't sure or you're really only sure about the top three, that's totally fine. And Gaurav and I can go in and do our own ranking.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Okay.
Gaurav Shah:  I just want to make sure nothing here is severely out of place.
Speaker 3:  Yeah, exactly.
Suhanya Ketheeswaran:  Sure. I think that the invites and referrals part is really I really like it, but that feels like something that could be ranked lower when I think of all of the other features that you've created, particularly because referring somebody doesn't carry any promise of a benefit for the member, right? When I think of other things that I may be a member of, and they're like, "If you refer somebody, we're going to enter you into a draw," or, "If you refer somebody, we're going to give you this
Suhanya Ketheeswaran:  perk." And that's not something that we've thought about or built out at SDC. So if someone was to do that kind of referral, it would be like a completely altruistic act because they think it's going to benefit SDC in terms of expanding our base of supporters, or they think it's going to benefit someone in their life because they're now going to become a member of something that they previously didn't know about.
Suhanya Ketheeswaran:  So I feel like maybe that could be something that's a little bit lower.
Gaurav Shah:  I agree. And I'll totally move events lower. We're basically not doing events anymore on our platform.
Suhanya Ketheeswaran:  That's right.
Suhanya Ketheeswaran:  The member self-serve page is interesting, but also I think it could be low because I feel like it requires people to now create a username and a password, and how often are they going to go into it? If there is a different way for people to be able to unsubscribe from their or to stop payments.
Suhanya Ketheeswaran:  When I say unsubscribe, I mean really just stopping payments. That's the part that we need to figure out.
Suhanya Ketheeswaran:  If there's a way for them to do that without having to log into a member page, I think that would be ideal.
Gaurav Shah:  Yep. That makes sense.
Suhanya Ketheeswaran:  Even if that means sending us an email.
Suhanya Ketheeswaran:  Yeah. I would leave I think I would leave everything else the way that it is.
Gaurav Shah:  Okay. Fantastic. I'm just going to take a quick screenshot of this so it does not get lost.
Gaurav Shah:  And then okay.
Gaurav Shah:  Member page. One other ranking question.
Gaurav Shah:  But on the member page, I'm curious what you need to be able to see for each member, what matters the most in the CRM, right? Hopefully, this is an easier ranking question to answer.
Suhanya Ketheeswaran:  Sure.
Gaurav Shah:  We talked about.
Suhanya Ketheeswaran:  Payments and payment history. Absolutely. I would bump email history up to second place.
Gaurav Shah:  Perfect.
Suhanya Ketheeswaran:  What is subscribed or unsubscribed? Is that from emails?
Gaurav Shah:  From emails. Yeah. Either way, if they're unsubscribed, we will basically no longer be able to send them emails.
Gaurav Shah:  But we'll let you essentially, automatic emails will no longer go out to unsubscribed folks. We will respect the unsubscribes above everything else.
Suhanya Ketheeswaran:  And would I be able to see that anyway on a member's page?
Gaurav Shah:  Yeah. We kind of have to do it anyways.
Suhanya Ketheeswaran:  Right? It feels like something that I'm going to be notified of anyway, right?
Gaurav Shah:  Yes. It seems like tags need to be higher anyways as well.
Suhanya Ketheeswaran:  Yes, I would agree. And when you think of how notes would be used, I see things like a birthday, a kid starting school.
Suhanya Ketheeswaran:  How are notes being captured in the platform? Are they being entered somewhere as each note gets its own tag?
Gaurav Shah:  Entry, yeah. And it's on the member page. So on the member page, you can go in let's see.
Gaurav Shah:  You're able to go in and you're able to share this sorry, not share. You're able to add a note for someone.
Gaurav Shah:  I imagine that this is helpful when we talked about the relationship-building aspect, right? If you're personalizing someone's email, knowing the notes that you've added about them, that way you're not remembering something about 100 people.
Gaurav Shah:  Or if you leave the org, the information about them that you've gathered through that relationship-building is not lost.
Suhanya Ketheeswaran:  Can you add something here for me and then show me each I'm just trying to get let's say we add three notes about Jordan.
Gaurav Shah:  Of course.
Suhanya Ketheeswaran:  I'm curious to see how they show up.
Gaurav Shah:  That would be one. This would be another. And so they would show up in the timeline.
Gaurav Shah:  If you would like, we can also just have a single note section on top for a member.
Suhanya Ketheeswaran:  Yeah. I think that would be helpful because I can see otherwise this timeline gets really arduous to keep track of and to take in.
Gaurav Shah:  Yeah. I agree.
Suhanya Ketheeswaran:  Yeah. So then I would say notes is also it should rank up in the top five or top four. Yeah.
Suhanya Ketheeswaran:  Perfect.
Gaurav Shah:  Okay. Almost ranked tags above notes, though.
Suhanya Ketheeswaran:  Yeah.
Gaurav Shah:  Spend more time on, yeah.
Suhanya Ketheeswaran:  Yeah. Yeah. That looks good.
Gaurav Shah:  Okay. So call log is some.
Suhanya Ketheeswaran:  Maybe call log.
Gaurav Shah:  Yeah. So this is, again, thinking around the relationship-building. I noticed that some nonprofits typically call donors to continue sort of talking to them, mentioning what SDC is working on.
Gaurav Shah:  I'm curious if you plan to do something like that as part of your donor stewardship process. If not, then do you need to log those calls on that timeline so you know that this person was last contacted on a certain date?
Gaurav Shah:  Because emails is half the picture. If you're calling them, you also need to know that you called them at a certain time.
Suhanya Ketheeswaran:  Yeah. So right now, I don't think that we ever call. And also, when I think about the questionnaire that you'd created, we're only asking for name and email address, so we're not even collecting phone numbers.
Suhanya Ketheeswaran:  And I don't know if historically we've ever collected phone numbers for members. But I would drop that down because it's not something that we do as a practice right now.
Suhanya Ketheeswaran:  We don't have a ton of capacity to be able to do it. I think it's a nice-to-have in the future, for sure, but not right now.
Gaurav Shah:  Perfect. That's amazing to hear.
Suhanya Ketheeswaran:  This looks good.
Gaurav Shah:  Okay. Fantastic. We'll also take a screenshot of this again so I don't lose this ranking.
Gaurav Shah:  Send. Okay.
Gaurav Shah:  Awesome. Sorry, last few questions.
Gaurav Shah:  Sorry, I know that we're a little bit at time. Do you have like 10 more minutes to chat?
Suhanya Ketheeswaran:  Sure.
Gaurav Shah:  Okay. Thank you. So quick checks on how you work.
Gaurav Shah:  Typically, when you are sending out emails to members, donors, things like that, to what level are you personalizing them? Or what is your workflow to personalize them?
Suhanya Ketheeswaran:  Yeah. So the first time that I actually got a chance to try doing that was ahead of the Ride for Refuge. And I would say that what you have there is exactly what I did, number one.
Suhanya Ketheeswaran:  So I wrote a draft email to one person first, and then I just copied it into every subsequent email and then personalized parts of it, like either the opening of it or the, "This is the specific action that you took, and that's what I want to thank you for."
Gaurav Shah:  Fantastic. Okay. That's exactly what we're imagining, too.
Gaurav Shah:  Would you check emails before they send once a week? So the reason is, let's say for Ride for Refuge, you wanted to personalize the emails, right?
Gaurav Shah:  So maybe you set them up to send as an automatic email, and they're waiting for you. Or a high-value donor thank you is waiting for you to add a personal line before it actually gets sent out.
Gaurav Shah:  Is it reasonable to assume that you would check the platform about once a week? Or I don't know what you're.
Suhanya Ketheeswaran:  Yeah, I think so. That feels like a good cadence.
Gaurav Shah:  Okay. Awesome. And if there are very important emails, like a specific thank-you email, for example, we could also just email you and remind you that, "Hey, someone's thank-you email is waiting on your personalization or your approval to send out."
Gaurav Shah:  That way, they're not waiting past the 48-hour window.
Suhanya Ketheeswaran:  Okay. And when you say email me, do you mean suhanya@waterloo-region.org specifically?
Gaurav Shah:  Yes.
Suhanya Ketheeswaran:  And whoever is taking on this member stewardship role?
Gaurav Shah:  Exactly. Yeah.
Suhanya Ketheeswaran:  Okay. So we would be able to change who is receiving those notifications if need be.
Gaurav Shah:  Yeah. Absolutely. It'll be part of the settings that you can change.
Suhanya Ketheeswaran:  Okay. Got it. Got it.
Gaurav Shah:  Yeah. That way, again, we're just making sure that I know the research shows that the thank-you email should be sent out in a specific time window, right? So I don't want you to rely on, "Oh, no, I forgot to check the platform, and now this person did not get a thank-you email."
Gaurav Shah:  We would hate for that to happen. So just notifying you that way in case you're not opening.
Gaurav Shah:  Or is there a way that you would maybe have this platform open and you're looking at it every other morning? Again, I don't know what the right cadence is.
Gaurav Shah:  If we do once a week, then we can also just email you for important stuff to remind you that, "Hey, something on the platform is urgent and is waiting for you," and everything else can wait for the one-week mark when you open this.
Suhanya Ketheeswaran:  Yeah. That feels reasonable.
Gaurav Shah:  Okay. Let's do that. Would you tag members and keep short notes on them by hand?
Gaurav Shah:  So again, yeah, you're doing this on the platform. Is this something that you see yourself doing with members?
Gaurav Shah:  So tagging them with, for example, Refuge or their high-value donors, and maybe they should receive different emails. The reason you do this is because automatic emails get sent out based on certain conditions that they meet, certain tags that they have.
Gaurav Shah:  And so you'd need to add those tags. There's no way for us to automatically know if they came from Ride for Refuge or not, for example.
Suhanya Ketheeswaran:  How do we create the list of tags?
Gaurav Shah:  Good question. Not too hard, honestly. As you are tagging someone, share this tab instead.
Gaurav Shah:  Tag. And you can always just add a new tag right here.
Suhanya Ketheeswaran:  Okay. Got it. And so let's say we have an event like Ride for Refuge.
Suhanya Ketheeswaran:  And instead of doing this thing where we're offering complimentary membership, let's say that we had done what we'd originally planned, which was to give promotional materials around membership. And let's say we give out the promotional materials, we talk about it at the event, and of the 50 people that are there, 15 of them actually decide to sign up for membership.
Suhanya Ketheeswaran:  So now there's 15 members that all kind of sign on within a period of a few days following an event. Would I then have to go in and manually choose for each of those 15 people what tags to add?
Suhanya Ketheeswaran:  Is that the question you're asking me?
Gaurav Shah:  Yes. And how does that feel for you?
Suhanya Ketheeswaran:  I'm not sure how that feels. I feel like there's pros and cons to both. I like the idea of having control over the tags that are added, but it also feels like it could become cumbersome.
Gaurav Shah:  Fair. And that's where one of the features that we did not stack rank - I don't know why this was not included in my just an oversight in the ranking list - was this. I don't know if I showed you this before.
Gaurav Shah:  But essentially, we're able to generate links that would help kind of attribute where the member came from. So let's say that you this is not the ideal UX, but you can imagine that you type in sort of, "What am I doing?"
Gaurav Shah:  So let's say it's Ride for Refuge. It'll generate a custom link.
Gaurav Shah:  Or let's say this QR code if you want folks to scan it at a specific event. If they scan it and they come in, then we can automatically tag them with certain tags that you've preselected.
Gaurav Shah:  So you say, "Anyone who scans this specific QR code or comes with this specific link, tag them as Ride for Refuge. Everyone else who comes from the generic link, we won't have any tags for."
Suhanya Ketheeswaran:  Okay. Got it. Got it.
Suhanya Ketheeswaran:  So it's just a way for us to start understanding which events or promotions are leading to sign-ups.
Gaurav Shah:  Exactly. So in this case, you'd see something like this, where Ride for Refuge led to 12, In Person led to 10, and Ride for Club led to 2, things like that.
Suhanya Ketheeswaran:  Right. Okay. So I like the idea of being able to write notes by hand.
Suhanya Ketheeswaran:  That makes a lot of sense. I'm wondering if with tags, is there an option for a hybrid model where certain tags are added automatically, and then we still have the option to be able to also add tags manually?
Gaurav Shah:  Yeah. I think we can do that. But the only thing to flag there is a lot of the automatic tags that would get added.
Gaurav Shah:  For example, subscribed or unsubscribed from an email would be a tag that's automatically added to a person because an attribute of a person that we'll automatically add. Something like this where you're getting someone in through a specific event or a specific campaign, we're able to oh, sorry, I'm just getting a call.
Gaurav Shah:  That's fine. I'll go back to that later.
Suhanya Ketheeswaran:  Are you sure?
Gaurav Shah:  Yeah, yeah, yeah. We attribute it to them, and then we add that one tag. But all the other tags that you might want to add to someone have to come later.
Suhanya Ketheeswaran:  Okay. Is there an option to add a tag around gifting memberships?
Suhanya Ketheeswaran:  Would that happen automatically?
Gaurav Shah:  Yeah. Yeah. I think a lot of these sound like if-else conditions, right?
Gaurav Shah:  If the gift did a membership, then add this specific tag. And maybe as we build out the platform, we can talk about in future client meetings what those specific automatic tags you'd like to have are.
Suhanya Ketheeswaran:  Sure. Another one that I'm thinking of is they're within 30 days of the end of their one-year membership or something.
Gaurav Shah:  Yeah, yeah, yeah. I agree. Okay.
Gaurav Shah:  We'll talk about these automatic tags and what those look like as we start getting closer to the more built-out version of this.
Gaurav Shah:  Okay. But I like the hybrid approach.
Gaurav Shah:  And I think we talked about automatic emails already, so I think that answers this question.
Suhanya Ketheeswaran:  Would you mind going back to that screen? Because I'm still seeing the invite page on your.
Gaurav Shah:  Sorry about that. Yes.
Suhanya Ketheeswaran:  Perfect.
Gaurav Shah:  We already talked about emails, so that's fine. And we already talked about we don't reach out to members by phone, but in person. I assume that's probably why you're maintaining notes, is the emails that you're going to send out to people or personalizing their emails.
Gaurav Shah:  And then maybe in-person interactions, you might want to refer to your notes.
Suhanya Ketheeswaran:  That's right. Yeah.
Gaurav Shah:  If you have it somewhere. Fantastic. Okay.
Gaurav Shah:  These are super quick questions. The answer to this one, I assume, is no.
Gaurav Shah:  Membership cycle is monthly. What do members get for their membership?
Gaurav Shah:  Actually, this is not a short question. But I would love to if you could put this in a Google Doc for me on what is the value proposition of memberships that we're trying to offer.
Gaurav Shah:  And I know this is a longer conversation, and this is open to change, but just at the very beginning, that way we can, as we're building the entry point for membership, what do we actually write on that page is very helpful for us to have. What does SDC's plan to tell people about the membership program?
Gaurav Shah:  Also a discussion that maybe you want to have internally on how would you market this program. Essentially, what we're building is a link, right, that you'd send to people if they're interested in the membership.
Gaurav Shah:  But how do we get people interested in the membership is now another question to start maybe you want to think through. There's no rush on this one.
Gaurav Shah:  The reason I ask this is if there's anything that we can help build that would make that process easier. For example, the invite option where they joined from a specific campaign that I just showed you, it's helpful for us to know.
Gaurav Shah:  Insights. Oh, yes.
Gaurav Shah:  Sorry. Okay.
Gaurav Shah:  Not a quick question, but we should talk about this really quickly. Insights on emails.
Gaurav Shah:  A lot of the emails that this platform is sending out are thank-you emails and things like that. So it's hard for us to turns out insights is not an insignificant amount of work.
Gaurav Shah:  It's a pretty big chunk of work that we would have to do to build out open rate and click-through rate numbers for the emails that you're sending out. And I'm curious because these are not newsletters, right?
Gaurav Shah:  These are thank-you emails, or these are check-in emails. I'm curious if you still care about the open rate numbers and the click-through for these emails.
Gaurav Shah:  And if you had to maybe even just in this ranked list, if you had to put them somewhere, where would you put them? Because that tells us how much effort we do put into them.
Suhanya Ketheeswaran:  That's a good question. I think that the overarching measures that we want to track are retention of the person, right? That is the most important thing.
Suhanya Ketheeswaran:  But if we're seeing that people are falling off, that's when I think the question comes up of, "Is it because they didn't like our email? Is it because " but you're already going to tell us if people are unsubscribing from the emails, which I think immediately tells us, "Okay, something about the emails is not meeting a need or an expectation that they had when they agreed to sign up for it."
Suhanya Ketheeswaran:  And we could always send a follow-up email with a quick dropdown, right, that says, "What was the reason that you chose to unsubscribe?" so that we get that insight.
Suhanya Ketheeswaran:  So for these stewardship emails, I don't know if we need to know open rates and close rates. If that's a ton of work for you, I don't.
Gaurav Shah:  Okay. Fantastic. That's awesome.
Gaurav Shah:  And then, yes, we can.
Suhanya Ketheeswaran:  Actually, sorry, can I take that back?
Gaurav Shah:  Of course.
Suhanya Ketheeswaran:  Can I take it back and say maybe click rates we don't need because I don't know how many links we're going to include in these stewardship emails, but maybe open would be helpful to know?
Gaurav Shah:  I think the concern is that open is a lot more work than click-through.
Suhanya Ketheeswaran:  Is that right?
Gaurav Shah:  Yeah. And so the reason I bring this up is thinking about this, the merit of a thank-you email isn't even in just the fact that it's in the fact that someone got the thank-you email, not in the fact that they.
Suhanya Ketheeswaran:  That's right. Yeah. And I'm trying to see because we have the open and click-through rates for our newsletter through Mailchimp, and it hasn't done a lot in terms of helping us, right, with our overarching goals.
Suhanya Ketheeswaran:  If the bigger goal is retention, then we just need to know whether or not we're able to hold on to people. And knowing how often they're opening their emails or clicking through doesn't necessarily help with that.
Suhanya Ketheeswaran:  So I think if you can't give us that information, that's okay. When you created the questionnaire, you had said that one of the things that you were going to be tracking were the things where people are falling off on that survey questionnaire.
Suhanya Ketheeswaran:  Is that also something that's right now not going to be available because of the constraints that you've discovered?
Gaurav Shah:  No. We are tracking where people are dropping off, but we're tracking it in aggregate. So we don't know who the person is who's dropping off at a certain point.
Gaurav Shah:  We're logging it based on the primary key of the database is the time that they did the survey rather than any details about them specifically. And then once they start filling out the Ride for Refuge form, then we know, "Okay, it's from their specific name or email."
Gaurav Shah:  In general, once we actually launch, click-through we will have for the intake form. We will know who clicked through to the intake form, and we will show that on the member list.
Gaurav Shah:  The open rate was kind of the big question there. So I think we already have built Dev is finalizing the last few details, but essentially, you'd be able to get click-through on unsubscribes, so which person unsubscribed and from which email.
Gaurav Shah:  We have click-through on Ride for Refuge not, sorry, on the intake form. So who clicked through, where did they drop off over the analytics there, and we can quickly share those.
Gaurav Shah:  And then we have click-through on one more thing, one more thing somewhere. Sorry, I just need to oh, the referral link, who referred someone.
Gaurav Shah:  That's where we have click-through. So we know which emails are triggering those.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Yeah. I think that's okay. I think that's perfectly fine.
Gaurav Shah:  And fantastic. And then lastly, does SDC use Gemini? And I'm just generally curious about the level of AI use in your organization or your specific AI use.
Gaurav Shah:  Yeah.
Suhanya Ketheeswaran:  Yeah. I think that varies. And we do have it on the agenda at some point once we deal with all of the immediate operational questions that the organization needs to address in each of our weekly meetings to have a conversation about our AI use and what our philosophy and our guiding principles are going to be as an organization.
Suhanya Ketheeswaran:  Because we don't have that right now, and there is a real diversity of feelings and opinions about the use of AI. And so there are definitely some of us who are using it, and there are others who are not using it at all based on very ideological sort of.
Gaurav Shah:  Completely. So the reason why I asked this question is we don't want to of course, we don't want to use AI to write these emails. They need to have that human touch.
Gaurav Shah:  But there's certain actions that I imagine can get very cumbersome to do. For example, you have a list of people, and you want to tag 30 people with Ride for Refuge things.
Gaurav Shah:  Or you need to set up a few different automatic emails really quickly, right? Let's say you have an email template that you've made, and there's slight differences for five different people.
Gaurav Shah:  That could maybe take 10, 20 minutes to set up. And so we were thinking about - and this is very early stages - what if we built an MCP?
Gaurav Shah:  That way, through Gemini, you could just tell Gemini, "Hey, I want to set up these five automatic emails. Here's the draft template.
Gaurav Shah:  Here's who I want to send it to in your natural language." And it would just set it up for you, and then you can go on the platform and check.
Gaurav Shah:  That's.
Suhanya Ketheeswaran:  So sorry. What is an MCP, and what is the function that it's fulfilling? Is it doing the personalizing for me, and I'm writing the templated email?
Gaurav Shah:  No, no, no. So let me show you this tab here really quickly. So an MCP is essentially the ability for an LLM like Gemini, for example, like a chatbot, to do things, right?
Gaurav Shah:  So it's able to now come onto this platform. And what it's able to do is let's say now you see how we have what's a good example here?
Gaurav Shah:  Let's say thanking someone who maybe this isn't the right example, but maybe something like on people, you want to add a note to 30 different people, right, or certain repetitive actions that you might want to take, or you want to tag list of people with certain things.
Gaurav Shah:  It's hard to add notes for 30. You go and you click a note for 30 people, and you add that note.
Gaurav Shah:  You tell Gemini, "Hey, I want to add a note for this is the list of the people, and I want to add this note. Can you just quickly add it for me?"
Gaurav Shah:  But to be honest, as I'm talking through this, maybe it's not the biggest priority.
Suhanya Ketheeswaran:  So if I want to do I can see situations where I want to be able to do the thing that you just said. I want to be able to identify let's say there's 60 members, and 30 of them need to have a new tag added to them. Could I not just filter for the 30 people that I'm looking for and then add the tag, or no, because the filter is based on the tags already being there.
Gaurav Shah:  The filter is based on the tags already being there. So you'd have to search or select 30 people in this list and then add it to them. Or a really good example that I can come up with right now is analyzing member journeys and seeing if there's a gap.
Gaurav Shah:  So this is where, for example, it can look at all the automatic emails that you've set up and all the tags and all the members that you have with certain tags and say, "Hey, let's say you set up a thank-you email for folks with under $1,000, and you set up a thank-you email for everyone who's a high-value donor of $2,000 plus." AI can flag for you, "Hey, there's no thank-you email going out to someone between $1,000 and $2,000."
Gaurav Shah:  It's able to flag gaps. Or it's able to say, "Hey, this one specific person has multiple tags on them, and so they might receive repeating emails," right?
Gaurav Shah:  And so your member journey might be flawed because this person is receiving multiple thank-you emails, for example. And so maybe you should fix that.
Gaurav Shah:  And it can go fix that for you by excluding the tag or excluding this person from a certain email. There's those kinds of use cases where I see it's hard to keep track of multiple different tags and different users and all of what stewardship emails they're receiving.
Gaurav Shah:  So yeah. Or if maybe you have multiple thank-you emails, and there's a certain line in them that you'd like to change, or you want to add a specific line to them, going in and clicking through 20 different thank-you 20 different versions of a thank-you email for different occasions might be hard.
Gaurav Shah:  And so it's able to go make those mass bulk edits for you.
Suhanya Ketheeswaran:  Got it. Okay. So that's very helpful for actually painting a picture of the different use cases.
Suhanya Ketheeswaran:  And I think that because we're trying to start so small and build the simplest stewardship plan possible, I think that being able to do everything manually at this point would actually be preferable because it allows us to just learn and be really intentional about what we're creating and then tracking it. And as we grow our membership program, then I could see a situation where it becomes a little too overwhelming to do that manually.
Suhanya Ketheeswaran:  But right now, it doesn't feel like a problem. And because as an organization and as a staff team, we are so not on the same page in terms of how we want to start using or potentially integrating AI, I would say let's just avoid it for now.
Gaurav Shah:  Perfect. Okay. That's very helpful.
Gaurav Shah:  But overall, I'm feeling great about this. And now, especially that we have a very concrete direction and ranked features that we're building, there's going to be so much that we can show you next week on what we already have, so.
Suhanya Ketheeswaran:  Oh my goodness. Oh my gosh. Thank you, Gaurav.
Suhanya Ketheeswaran:  I also want to really thank you. And I can't say this enough because I feel like there's so many blanks that you are filling in for us because we don't have the clarity or the experience to know what needs to be built.
Suhanya Ketheeswaran:  And so I really want to thank you for that. And thank you for the experience and expertise that you're bringing to this project.
Gaurav Shah:  No, of course. And I really appreciate how much you're willing to have those conversations and actually move the needle for us. I really appreciate how quickly you're getting those conversations to the board members or to the folks at SDC and getting those through for us.
Gaurav Shah:  Typically, stuff like this would take weeks. And so I really, really appreciate the work that you're doing there to get those answers fast.
Suhanya Ketheeswaran:  Yeah, of course. It really feels like a sprint. It felt like it was going to be a marathon, and now it feels like a sprint.
Gaurav Shah:  It's a sprint. But at the end of the sprint, hopefully, you're going to have this amazing piece of software that you can start using and building out your membership program from. Hopefully, this infrastructure gives you the ability to now visualize more parts of the membership program that it becomes more and more concrete, hopefully.
Suhanya Ketheeswaran:  Yes, it is.
Gaurav Shah:  But yes. Thank you so much again for your time, and we'll speak next Friday. I'll send you an email.
Suhanya Ketheeswaran:  Okay. Talk to you soon. Yes.
Suhanya Ketheeswaran:  Absolutely. Take care.
