/**
 * User-facing strings for the admin Partners page (docs/ux/portal.md → Partners). Invitation-state
 * strings are shared with the partner portal's Team list through `invitationCopy`.
 *
 * Server-returned strings (`ActionState.message` and field errors) live with the rules that produce
 * them: `_data/contacts.ts` (people and invitations) and `_data/profile.ts` (organizations).
 */

/** Invitation states and their actions, the same in both portals. Never show a past expiry as pending. */
export const invitationCopy = {
  pending: "Invitation pending",
  notSent: "Invitation not sent",
  expired: "Invitation expired",
  expires: (date: string) => `Expires ${date}`,
  expiredOn: (date: string) => `Expired ${date}`,
  resend: "Resend invitation",
  retry: "Retry",
  sendNew: "Send new invitation",
  cancel: "Cancel invitation",
  cancelConfirm: {
    title: "Cancel this invitation?",
    body: (name: string) => `${name} won't be able to use the invitation link already sent.`,
    keep: "Keep invitation",
    confirm: "Cancel invitation",
  },
} as const;

export const partnersCopy = {
  title: "Partners",

  search: {
    /** Also the field's aria-label (owner decision 1: the placeholder is the only text). */
    placeholder: "Search by name or email",
    noMatchesTitle: "No matches found.",
    noMatchesDescription: "Try another name or email.",
  },

  views: {
    ariaLabel: "Partner views",
    organizations: "Organizations",
    people: "People",
    count: (n: number) => `(${n})`,
  },

  status: {
    label: "Status",
    active: "Active",
    removed: "Removed",
  },

  badges: {
    /** An organization nobody has accepted an invitation to yet (not "Invitation pending": that's a person). */
    awaitingResponse: "Awaiting response",
    removed: "Removed",
  },

  table: {
    headerOrganization: "Organization",
    headerPeople: "People",
    headerEmail: "Email",
    headerOpportunities: "Opportunities",
    headerName: "Name",
    headerRemoved: "Removed",
    opportunities: (n: number) => (n === 1 ? "1 opportunity" : `${n} opportunities`),
  },

  empty: {
    organizationsTitle: "No partners yet",
    organizationsDescription: "Invite an organization to give them access to their opportunities.",
    peopleTitle: "No people yet",
    peopleDescription: "Invite a partner to add the first person.",
    removedOrganizationsTitle: "No removed organizations",
    removedOrganizationsDescription: "Organizations whose access you remove appear here.",
    removedPeopleTitle: "No removed people",
    removedPeopleDescription: "People removed from an organization appear here.",
  },

  invite: {
    button: "Invite partner",
    title: "Invite partner",
    description: "We'll email them a link to join their organization's portal. The link expires after 7 days.",
    nameLabel: "Contact name",
    emailLabel: "Email",
    organizationLabel: "Organization",
    organizationHint: "Search existing organizations, or add a new one.",
    organizationPlaceholder: "Search or add an organization…",
    organizationSearchPlaceholder: "Search organizations…",
    newOrganization: (name: string) => `Add “${name}” as a new organization`,
    cancel: "Cancel",
    submit: "Send invitation",
  },

  organizationPanel: {
    profileHeading: "Profile",
    nameLabel: "Organization name",
    websiteLabel: "Website",
    websiteHint: "Example: sdckw.ca",
    descriptionLabel: "Short description",
    descriptionHint: "One or two sentences about what your organization does. Up to 280 characters.",
    save: "Save changes",
    peopleHeading: "People",
    addPerson: "Add person",
    removedOn: (date: string) => `Removed ${date}`,
    viewOpportunities: (n: number) => `View opportunities (${n} published)`,
    reinvite: "Reinvite",
  },

  personPanel: {
    organizationHeading: "Organization",
    detailsHeading: "Details",
    nameLabel: "Name",
    emailLabel: "Email",
    save: "Save changes",
    removedOn: (date: string) => `Removed ${date}`,
    organizationRemoved: (organization: string) => `${organization}'s access was removed.`,
    inviteAgain: "Invite again",
  },

  person: {
    rowActions: (name: string) => `Actions for ${name}`,
    edit: "Edit",
    cancelEdit: "Cancel",
    saveEdit: "Save changes",
    remove: "Remove from organization",
    lastPersonReason: "This is the only person with access to this organization. Remove the organization's access instead.",
    removeConfirm: {
      title: (name: string, organization: string) => `Remove ${name} from ${organization}?`,
      body: (name: string, organization: string) =>
        `${name} will lose access to the partner portal. ${organization}'s opportunities won't change.`,
      keep: "Keep access",
      confirm: "Remove access",
    },
    /** Cancelling an invitation that was never delivered: there's no link to invalidate. */
    cancelNotSentBody: (name: string) => `${name} will be removed from the People list.`,
  },

  removeAccess: {
    action: "Remove access",
    title: (organization: string) => `Remove ${organization}'s access?`,
    body: (organization: string) =>
      `People at ${organization} will lose access to the partner portal. Their opportunities will be closed and won't be recommended or emailed.`,
    keep: "Keep access",
    confirm: "Remove access",
  },
} as const;
