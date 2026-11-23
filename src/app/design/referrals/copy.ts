/*
 * Proposed copy for the member's page, from a UX copy review (Nov 2026). It starts from the product's
 * placeholder copy (src/features/referrals/copy.ts, PR #65) and changes only what's listed below, so
 * Gaurav can review it in place before it replaces the product copy.
 *
 * - One word for the action: members "invite" (not "refer"); "referral" stays admin language.
 * - Say what the friend gets (one short note, once), which is the member's real worry.
 * - Every promise stays true even when no email goes out (friend already a member or unsubscribed).
 * - Say what failed and how to fix it.
 */
import { copy as productCopy } from "@/features/referrals/copy";

export const copy = {
  ...productCopy,
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
  linkPlaceholder: "Enter their email to get their link",
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
  // Kinder versions of the server's messages. The limit isn't their mistake: thank them.
  limit: "You've invited 10 friends today, thank you! You can invite more tomorrow.",
  /** Tooltip on the locked email field and buttons while the limit shows (PM, Nov 23). */
  limitReason: "You can invite more tomorrow",
  ownEmail: "That's your own email. Enter your friend's to invite them.",
  // Offline (docs/design/state-lab.md, rule 19: the same words on every screen).
  offline: "You're offline. You can still look around, but you'll need to reconnect to make changes",
  offlineSend: "You're offline. Reconnect to send the invite",
  offlineCopy: "You're offline. Reconnect to copy their link",
  offlineShare: "You're offline. Reconnect to share their link",
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
