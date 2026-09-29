/**
 * User-facing strings for the partner portal shell and organization pages. Opportunities copy
 * lives in src/features/opportunities/copy.ts. Server-returned messages (ActionState.message and field
 * errors) live with the shared rules: src/app/admin/partners/_data/profile.ts and _data/contacts.ts.
 * Invitation states are shared with the admin portal (`invitationCopy`).
 */
import { invitationCopy } from "@/app/admin/partners/_copy";

export const partnerCopy = {
  nav: {
    label: "Partner navigation",
    opportunities: "Opportunities",
    insights: "Insights",
    organization: "Organization",
    /** Shown as a delayed tooltip on the sidebar item; replaces the old page descriptions. */
    opportunitiesDescription: "What your organization shares with the SDC community.",
    organizationDescription: "How your organization appears to the SDC community.",
    /** The Insights tooltip. */
    insightsDescription: "How your opportunities perform.",
  },

  organization: {
    title: "Organization",
    profileHeading: "Profile",
    nameLabel: "Organization name",
    websiteLabel: "Website",
    descriptionLabel: "Short description",
    save: "Save changes",
    /** Persistent (not toasts): the person needs time to act on them. */
    blocked: {
      signedOut: "You've been signed out. Sign in again to save your changes.",
      signIn: "Sign in",
      accessEnded: "Your organization no longer has access. Contact SDC if you think this is a mistake.",
      contactLabel: "SDC contact:",
    },
    teamHeading: "Team",
    you: "(you)",
    invitation: invitationCopy,
    rowActions: (name: string) => `Actions for ${name}`,
    removeFromOrganization: "Remove from organization",
    inviteButton: "Invite colleague",
    invite: {
      title: "Invite colleague",
      description: "We'll email them a link to join your organization's portal. The link expires after 7 days.",
      nameLabel: "Name",
      emailLabel: "Email",
      cancel: "Cancel",
      submit: "Send invitation",
    },
    /** Cancelling an invitation that was never delivered. */
    cancelNotSentBody: (name: string) => `${name} will be removed from your team list.`,
    confirmRemove: {
      title: (name: string) => `Remove ${name} from your organization?`,
      body: (name: string) => `${name} will lose access to the partner portal. Your organization's opportunities won't change.`,
      keep: "Keep access",
      confirm: "Remove access",
    },
  },
} as const;
