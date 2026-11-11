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

  emailedTitle: (friend: string) => `We emailed ${friend}`,
  emailedDescription: "We’ll let you know if they join.",

  messageTitle: (friend: string) => `Send ${friend} this message`,
  messageDescription: "Change it if you like, then copy it into a text, email or chat.",
  alreadyReferred: (friend: string, on: string) =>
    `You referred ${friend} on ${on}. We only email each person once, so here’s a message to send yourself.`,
  messageLabel: "Message",
  linkHint: (friend: string) => `The link is just for ${friend}, so we know you invited them.`,
  copyMessage: "Copy message",
  copied: "Message copied",
  copyFailed: "We couldn’t copy it. Select the message and copy it yourself.",
  message: (friend: string, link: string, referrer: string) =>
    `Hi ${friend},\n\nI’m a member of the Social Development Centre Waterloo Region and thought you’d like it too. You can find out more and join here:\n${link}\n\n${referrer}`,

  again: "Refer someone else",

  unknownTitle: "This link doesn’t work",
  unknownDescription: "It might be incomplete. Use the Refer a friend button in your latest email from SDC.",
};
