# Sign-in emails

Drafts from the Figma working file ("Email / …" frames). Layout: SDC logo, brand-green heading, body, one dark button, small print, a divider, then a reassurance line; footer with SDC's mailing address and why the person got it. `{…}` marks merge fields.

## Member · Sign-in link
Sent when a paying member enters their email on `/login`.
- **Subject:** Your SDC sign-in link
- **Preheader:** Open it on this device to see the members feed. Expires in 15 minutes.
- **Overline:** MEMBERS FEED
- **Heading:** Sign in to SDC
- **Body:** Hi {first name}, / Click the button below to sign in to the SDC members feed. Open it on the same device and browser where you asked for it.
- **Button:** Sign in to SDC
- **Small print:** This link works once and expires in 15 minutes. If it expires, you can request a new one from the sign-in page.
- **Reassurance:** **Didn't ask to sign in?** You can ignore this email. No one can sign in without access to your inbox.
- **Footer:** Social Development Centre Waterloo Region · {mailing address} / You're getting this because someone asked to sign in to SDC with {email}.

## Partner · CivicHub invitation
Sent when an SDC admin invites a partner organization.
- **Subject:** CivicHub invitation: post for {organization}
- **Preheader:** SDC set up a partner account for your organization. No password needed.
- **Heading:** You're invited to post for {organization}
- **Body:** Hi there, / SDC has set up a CivicHub partner account for **{organization}**. CivicHub is where SDC's partner organizations share opportunities and events, and SDC sends them to community members across Waterloo Region.
- **List ("With your account, you can:"):** Post volunteer roles, events and other opportunities · Edit or close your organization's posts · Keep your organization's profile up to date
- **Button:** Accept invitation
- **Callout:** This invitation expires in 7 days. After that, you can still sign in at {partner sign-in URL} with your email address.
- **Small print:** **Is this a shared inbox?** That's fine. Anyone who can read it can sign in for {organization}. To add or change an email, contact {SDC contact email}. / **Not expecting this?** Let us know at {SDC contact email}.
- **Footer:** Social Development Centre Waterloo Region · {mailing address} / You're getting this because SDC invited {email} to CivicHub.

## Partner · Sign-in link
Sent when a partner enters their organization email on `/login/partner`.
- **Subject:** Your CivicHub sign-in link
- **Preheader:** Sign in to manage {organization}'s posts. Expires in 15 minutes.
- **Heading:** Your SDC sign-in link
- **Body:** Click on the link to sign-in to SDC! You'll stay signed in on this device until you sign out.
- **Button:** Sign in to CivicHub
- **Small print:** This link works once and expires in **15 minutes.**
- **Reassurance:** **Didn't ask to sign in?** You can ignore this email. If others share this inbox, one of them may have asked for it.
- **Footer:** Social Development Centre Waterloo Region · {mailing address} / You're getting this because someone asked to sign in to CivicHub with {email}.

## Open questions
- The partner sign-in email's heading says "SDC" but its button says "CivicHub"; the body's "sign-in to SDC!" uses a hyphenated verb and an exclamation mark. Worth aligning before it ships.
