/** Every user-facing string for the Admins page. Components import from here instead of writing copy inline. */
import { adminEscalation } from "@/lib/errorCopy";
import type { AdminStatus } from "./_data/types";

export const RESEND_COOLDOWN_SECONDS = 60;

const statusLabels: Record<AdminStatus, string> = {
  active: "Active",
  invited: "Invited",
  not_sent: "Not sent",
};

export const adminsCopy = {
  page: { title: "Admins", invite: "Invite admin" },

  copyEmails: {
    label: "Copy all emails",
    copied: (count: number) => `Copied ${count} ${count === 1 ? "email" : "emails"}.`,
    failed: "We couldn't copy the emails. Select them in the table and copy them yourself.",
  },

  status: statusLabels,

  table: {
    ariaLabel: "Admins",
    headerName: "Name",
    headerEmail: "Email",
    headerAdded: "Added on",
    noDate: "—",
    notAccepted: "Hasn't accepted the invite yet",
    headerStatus: "Status",
    headerActions: "Actions",
    you: "(You)",
    removeLabel: (name: string) => `Remove ${name}`,
    resend: "Resend invite",
  },

  empty: {
    title: "No admins",
    description: "Invite someone to manage members and other admins.",
  },

  invite: {
    title: "Invite an admin",
    description: "They'll get an email with a link to sign in. The link expires after 7 days.",
    nameLabel: "Name",
    emailLabel: "Email",
    nameRequired: "Enter their name.",
    emailRequired: "Enter their email address.",
    emailInvalid: "Enter an email address like name@example.org.",
    emailTaken: "This email already has admin access or a pending invite.",
    cancel: "Cancel",
    submit: "Send invite",
    sent: (name: string) => `Invite sent to ${name}.`,
    failed: (email: string) =>
      `We couldn't send the invite to ${email}. We've emailed you the details. Check the address, then resend it from the table.`,
  },

  /** Opens from Resend invite on a "Not sent" row: the address must be checked again before it's sent. */
  checkEmail: {
    title: "Check the email address",
    description: (name: string) => `We couldn't send the invite to ${name}. Make sure the address is right, then send it again.`,
    emailLabel: "Email",
    confirmLabel: "I've checked that this email address is correct",
    confirmRequired: "Check the box to confirm the address is right.",
    stillFailing: "We still couldn't send an invite to this address. Check it for typos, or try a different address.",
    cancel: "Cancel",
    submit: "Resend invite",
  },

  resend: {
    sent: (name: string) => `Invite resent to ${name}.`,
    cooldownReason: "You can resend an invite once a minute.",
  },

  remove: {
    menu: "Remove admin",
    lastAdminReason: "You can't remove the last admin. Invite another admin first.",
    title: (name: string) => `Remove ${name}?`,
    body: "They'll lose access to the admin portal on their next click. You can invite them again later.",
    bodySelf: "You'll lose access to the admin portal right away. Another admin would need to invite you again.",
    confirmLabel: (name: string) => `Type ${name} to confirm`,
    confirmReason: (name: string) => `Type ${name} in the box to remove them.`,
    cancel: "Cancel",
    submit: "Remove admin",
    removed: (name: string) => `${name} was removed.`,
  },

  loadError: {
    title: "We couldn't load Admins.",
    body: "Your data is safe; this is a loading problem.",
    retry: "Try again",
    escalation: adminEscalation,
  },
} as const;
