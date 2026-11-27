/*
 * PLACEHOLDER COPY, drafted for Gaurav to edit. Every word a member or their friend reads is here, so
 * changing the wording never means touching the page.
 */
export const copy = {
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
