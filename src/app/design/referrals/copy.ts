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
  pageTitle: "Share SDC referral",
  title: "Invite a friend to SDC",
  description: "We'll send them one short note from SDC saying you thought they'd like to get involved.",

  formTitle: "Who are you inviting?",
  nameLabel: "Recipient's full name",
  emailLabel: "Recipient's email address",
  nameRequired: "Enter the recipient's full name.",

  noteLabel: "Referral message",
  noteReset: "Reset to original",
  linkLabel: "Share invite link",
  // Step 2: the email the invite goes to, beside Send email invite.
  emailInviteLabel: "Email invite",
  linkPlaceholder: "Enter their email to get their link",
  /** The credit window: a link keeps working, but only counts as a referral if they join within 30 days. */
  creditWindow: "If they join within 30 days, it counts as your referral.",
  sendAnother: "Send another referral",
  next: "Next",
  invitingLabel: "Inviting",
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
  submitEmail: "Send email invite",
  sending: "Sending…",
  gettingLink: "Getting link…",
  share: "Share",
  // What the phone's share sheet pre-fills (the link is added after it).
  shareTitle: "Join me at SDC",
  shareText: "I've been getting involved with the Social Development Centre in Waterloo Region. Join me here:",
  // Tooltip on Send invite and Copy link while they're unavailable: what to fill in first.
  needBoth: "Fill in their full name and email address first.",
  needName: "Fill in their full name first.",
  needEmail: "Fill in their email address first.",
  friendLinkLabel: (friend: string) => `${friend}'s invite link`,
  didYouMean: "Did you mean",
  copyFailedLink: "We couldn't copy it. The link is selected: copy it yourself (Ctrl+C or ⌘C).",

  // The share panel beside the message: copy the link to share it yourself, or SDC emails the message.
  sendTitle: "Share SDC referral",
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

  // Must stay true whether or not an email goes out, so "we'll let you know if they join" is left out
  // until the "Member joins via referral" email is confirmed as set up.
  sentNote: (email: string) => `Invitation sent to ${email}`,
  // After Send invite: the form switches to this (wording from Gaurav's page, PR #90).
  thanksTitle: (friend: string) => `Thank you! We've emailed ${friend} an invite.`,
  again: "Invite someone else",
  // Under the link once it's copied or shared (wording from Gaurav's page, PR #90).
  linkThanks: (friend: string) => `Thanks for sharing SDC with ${friend}.`,

  alreadyInvited: (friend: string, on: string) =>
    `You invited ${friend} on ${on}, so we won't email them again. Send them their link yourself.`,

  unknownDescription: 'This link might be incomplete. Open "Invite a friend" from your latest SDC email.',
  unknownHelp: "Still stuck? Email sdcwr@waterlooregion.org and we'll help.",
};
