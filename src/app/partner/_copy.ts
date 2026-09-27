/**
 * User-facing strings for the partner portal shell, account and organization pages. Opportunities copy
 * lives in src/features/opportunities/copy.ts. Server-returned messages (ActionState.message and field
 * errors) live with the actions: src/app/admin/partners/_data/profile.ts and ../organization/_data/actions.ts.
 */
export const partnerCopy = {
  nav: {
    label: "Partner navigation",
    opportunities: "Opportunities",
    organization: "Organization",
    /** Shown as a delayed tooltip on the sidebar item; replaces the old page descriptions. */
    opportunitiesDescription: "What your organization shares with the SDC community.",
    organizationDescription: "Your organization's profile and team.",
  },

  account: {
    title: "My account",
    description: "Your personal details and sign-in settings.",
  },

  organization: {
    title: "Organization",
    profileHeading: "Profile",
    nameLabel: "Organization name",
    websiteLabel: "Website",
    websiteHint: "Starts with https://",
    websitePlaceholder: "https://example.org",
    descriptionLabel: "Short description",
    descriptionHint: "One or two sentences about what your organization does. Up to 280 characters.",
    save: "Save changes",
    teamHeading: "Team",
    pending: "Invitation pending",
    you: "(you)",
    invitationExpires: (date: string) => `Expires ${date}`,
    retry: "Retry",
    rowActions: (name: string) => `Actions for ${name}`,
    resendInvitation: "Resend invitation",
    cancelInvitation: "Cancel invitation",
    removeFromOrganization: "Remove from organization",
    inviteButton: "Invite colleague",
    invite: {
      title: "Invite colleague",
      description: "We'll email them a link to join your organization's portal. The link works for 7 days.",
      nameLabel: "Name",
      emailLabel: "Email",
      cancel: "Cancel",
      submit: "Send invitation",
    },
    confirmCancel: {
      title: "Cancel this invitation?",
      body: (name: string) => `${name} won't be able to use the invitation link already sent.`,
      keep: "Keep invitation",
      confirm: "Yes, cancel invitation",
    },
    confirmRemove: {
      title: (name: string) => `Remove ${name} from your organization?`,
      body: (name: string) => `${name} loses access to the partner portal now. Your organization's opportunities stay as they are.`,
      keep: "Keep access",
      confirm: "Yes, remove",
    },
  },
} as const;
