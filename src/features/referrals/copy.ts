/*
 * PLACEHOLDER COPY, drafted for Gaurav to edit. Every word a member or their friend reads is here, so
 * changing the wording never means touching the page.
 */
const base = {
  pageTitle: "Refer a friend",
  title: "Refer a friend to SDC",
  description: "Tell us who they are, and we’ll help you invite them.",
  nameLabel: "Their name",
  emailLabel: "Their email address",
  deliveryLabel: "How should we invite them?",
  deliveryEmail: "Email them for me",
  deliverySelf: "I’ll send it myself",
  submitEmail: "Send invite",
  submitSelf: "Get the message",
  failed: "Something went wrong. Try again.",
  limit: "You’ve referred 10 people today. Try again tomorrow.",
  nameRequired: "Enter their name.",
  nameInvalid: "Enter just their name, without links or symbols like @ or /.",
  emailInvalid: "Enter an email address like name@example.org.",
  ownEmail: "That’s your email address. Enter your friend’s.",

  // Must stay true whether or not an email actually goes out (they may already be a member, or have
  // unsubscribed), so the page never reveals anything about the friend.
  emailedTitle: (friend: string) => `Thanks for inviting ${friend}`,
  emailedDescription: "We’ll take it from here. If they join SDC, we’ll let you know.",

  messageTitle: (friend: string) => `Send ${friend} this message`,
  messageDescription: "Change it if you like, then copy it into a text, email or chat.",
  alreadyReferred: (friend: string, on: string) =>
    `You already referred ${friend} on ${on}, so we won’t email them. Here’s a message to send yourself.`,
  messageLabel: "Message",
  linkHint: (friend: string) => `The link is just for ${friend}, so we know you invited them.`,
  copyMessage: "Copy message",
  copied: "Message copied",
  copyFailed: "We couldn’t copy it. Select the message and copy it yourself.",
  message: (friend: string, link: string, referrer: string) =>
    `Hi ${friend},\n\nI’m a member of the Social Development Centre Waterloo Region and thought you’d like it too. You can find out more and join here:\n${link}${referrer ? `\n\n${referrer}` : ""}`,

  again: "Refer someone else",

  unknownTitle: "This link doesn’t work",
  unknownDescription: "It might be incomplete. Use the Refer a friend button in your latest email from SDC.",
};

/*
 * The redesigned page's wording (from the referrals design, Nov 2026), on top of the placeholders above.
 */
export const copy = {
  ...base,
  pageTitle: "Invite a friend to SDC",
  title: "Invite a friend to SDC",
  description: "We'll send them one short note from SDC saying you thought they'd like to get involved.",

  formTitle: "Who are you inviting?",
  nameLabel: "Recipient's name",
  namePlaceholder: "John Doe",
  emailLabel: "Recipient's email address",
  emailPlaceholder: "johndoe@example.com",
  nameRequired: "Enter the recipient's name.",

  noteLabel: "Referral message",
  noteReset: "Reset to original",
  linkLabel: "Their invite link",
  // Until Copy link records the referral, the server has no link to show (see docs/backend/referrals.md).
  linkPlaceholder: "Their link appears here when you copy it",
  next: "Next",
  change: "Change",
  // Change after their link was copied or their invite emailed: they may already have it.
  changeTitle: "Create new referral?",
  changeDescriptionEmailed: (friend: string, email: string) =>
    `The email has already been sent to ${friend} (${email}). Changing the recipient cannot undo that action.`,
  changeDescription: (friend: string) =>
    `Your current link still works for ${friend} and still counts as your referral. Changing the recipient will create a new link and referral.`,
  changeConfirm: "New referral",
  copyLink: "Copy link",
  linkCopied: "Link copied",
  /** Copy link, for a few seconds after copying. */
  copiedShort: "Copied",
  deliveryLabel: "How should we invite them?",
  deliveryEmail: "Email them for me",
  deliverySelf: "I'll send it myself",
  submitEmail: "Send invite",
  sending: "Sending…",
  gettingLink: "Getting link…",
  share: "Share",
  // What the phone's share sheet pre-fills (the link is added after it).
  shareTitle: "Join me at SDC",
  shareText: "I've been getting involved with the Social Development Centre in Waterloo Region. Join me here:",
  friendLinkLabel: (friend: string) => `${friend}'s invite link`,
  didYouMean: "Did you mean",
  copyFailedLink: "We couldn't copy it. The link is selected: copy it yourself (Ctrl+C or ⌘C).",

  // The banner, one line per step, asked as a question (an invitation, not an order). Step 1 uses the
  // member's name (they arrive from their own SDC email); step 2 the friend's first name.
  headingWho: (member: string) => `Thank you for inviting a friend to the SDC community, ${member}`,
  headingHow: (friend: string) => `How would you like to invite ${friend}?`,
  sendTitle: "Invite a friend to SDC",
  or: "or",
  shareInvite: "Share invite",
  cancel: "Cancel",
  /**
   * The note the editor starts with: a general greeting (the recipient's name is only asked for if the
   * member has SDC email it), what SDC does, and why they might want in. No link: it's added when sent.
   */
  noteDefault: (firstName: string) =>
    `Hi ${firstName.trim() || "there"},\n\nI've been getting involved with the Social Development Centre. They bring people together on housing, poverty and climate here in Waterloo Region, and I think you'd be great at it. Have a look and see what you think!`,

  failed: "We couldn't send that. Check your connection and try again.",

  // The thank-you screen after Send invite, Copy link or Share. Gratitude first, then one plain line on
  // what happened. Must stay true whether or not an email goes out (already a member, unsubscribed).
  /** The key hint beside an offered email ending. */
  completeKey: "Tab",
  // One line: the thanks and what happened together.
  thanksTitle: (friend: string) => `Thank you! We've emailed ${friend} an invite.`,
  // Step 2's two rows. The first says SDC sends the email, so Send invite can't read as "you send it".
  emailRowLabel: (friend: string) => `We'll email ${friend} for you`,
  linkRowLabel: (friend: string) => `Or send ${friend}'s link yourself`,
  // Under the link once it's copied or shared.
  linkThanks: (friend: string) => `Thanks for sharing SDC with ${friend}.`,

  // Warm first (they already helped), then why no second email, then what they can do instead.
  alreadyInvited: (friend: string, on: string) =>
    `You invited ${friend} on ${on}, thank you! We only email once, so share their link below to remind them.`,

  again: "Invite someone else",

  unknownDescription: 'This link might be incomplete. Open "Invite a friend" from your latest SDC email.',
  unknownHelp: "Still stuck? Email sdcwr@waterlooregion.org and we'll help.",
};
