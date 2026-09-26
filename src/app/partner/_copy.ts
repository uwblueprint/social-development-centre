/**
 * User-facing strings for the partner portal shell, account and organization pages. Opportunities copy
 * lives in src/features/opportunities/copy.ts. Server-returned messages (ActionState.message and field
 * errors) live with the actions: src/app/admin/partners/_data/profile.ts and ../organization/_data/actions.ts.
 */
export const partnerCopy = {
  nav: {
    label: "Partner",
    opportunities: "Opportunities",
    organization: "Organization",
  },

  account: {
    title: "My account",
    description: "Your personal details and sign-in settings.",
  },

  organization: {
    title: "Organization",
    description: "How your organization appears to the SDC community.",
    profileHeading: "Profile",
    nameLabel: "Organization name",
    websiteLabel: "Website",
    websiteHint: "Starts with https://",
    websitePlaceholder: "https://example.org",
    descriptionLabel: "Short description",
    descriptionHint: "One or two sentences about what your organization does. Up to 280 characters.",
    save: "Save changes",
    teamHeading: "Team",
    teamNote: "SDC manages who has access. To add or remove someone, contact your SDC coordinator.",
    pending: "Invitation pending",
  },
} as const;
