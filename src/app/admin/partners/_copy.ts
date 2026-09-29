import { EMAIL_WITHIN_DAYS, NO_RECENT_POSTS_DAYS, type PartnerHealth, type PersonTagFilter } from "./_data/types";

/**
 * User-facing strings for the admin Partners page. Invitation-state
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
    /** Also the field's aria-label (the placeholder is the only text). */
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

  /** Organization column → Status header filter (replaces the toolbar Status select). */
  status: {
    label: "Status",
    active: "Active",
    removed: "Removed",
  },

  badges: {
    removed: "Removed",
  },

  /** Partner health tags, their reasons and next steps. */
  health: {
    label: "Health",
    tags: {
      notOnboarded: "Not onboarded",
      noRecentPosts: "No recent posts",
      notEmailed: "Not emailed",
      noClicks: "No clicks",
    } satisfies Record<PartnerHealth, string>,
    reasons: {
      notOnboarded: (org: string) => `Nobody at ${org} has accepted an invitation yet.`,
      noRecentPostsJoined: (org: string) => `${org} hasn't posted an opportunity in the ${NO_RECENT_POSTS_DAYS} days since joining.`,
      noRecentPostsLastPost: (org: string) => `${org} hasn't posted an opportunity in the ${NO_RECENT_POSTS_DAYS} days since their last post.`,
      notEmailed: (org: string) => `A published opportunity from ${org} wasn't in any email within ${EMAIL_WITHIN_DAYS} days of posting.`,
      noClicks: (org: string) => `Nobody has clicked an opportunity from ${org} in SDC's emails yet.`,
    },
    nextSteps: {
      notOnboarded: "Check their invitation under People, then resend it or reach out to confirm the email address.",
      noRecentPosts: "Reach out to see if they need help posting.",
      notEmailed: "Check the listing's topics and dates so it can go out in the next email.",
      noClicks: "Reach out to help them write a clearer title and summary.",
    } satisfies Record<PartnerHealth, string>,
    nextStepLabel: "Suggested next step",
    callout: (n: number) => (n === 1 ? "1 partner might need support" : `${n} partners might need support`),
    showThem: "Show them",
    /** Hides a health tag (panel) or the support banner (list). */
    dismiss: "Dismiss",
  },

  /** People → Tags. `access` is the filter option for people with no tag. */
  tags: {
    label: "Tags",
    options: {
      access: "Has access",
      pending: invitationCopy.pending,
      notSent: invitationCopy.notSent,
      expired: invitationCopy.expired,
      removed: "Removed",
    } satisfies Record<PersonTagFilter, string>,
  },

  emails: {
    copyAll: "Copy all emails",
    copyOrganization: "Copy emails",
    /** "Copied 64 email addresses from every active partner". */
    everyPartner: "every active partner",
    copied: (n: number, from: string) => (n === 1 ? `Copied 1 email address from ${from}` : `Copied ${n} email addresses from ${from}`),
    copyFailed: "Couldn't copy the email addresses. Try again.",
    /** A table email is a button: its name is "Copy {email}"; the tooltip confirms. */
    copyOne: (email: string) => `Copy ${email}`,
    copiedOne: "Copied",
    copyOneFailed: "Couldn't copy",
  },

  table: {
    headerOrganization: "Organization",
    headerHealth: "Health",
    headerPeople: "People",
    headerPublished: "Published",
    headerLastPosted: "Last posted",
    headerName: "Name",
    headerEmail: "Email",
    headerTags: "Tags",
    never: "Never",
  },

  empty: {
    organizationsTitle: "No partners yet",
    organizationsDescription: "Invite an organization to give them access to their opportunities.",
    peopleTitle: "No people yet",
    peopleDescription: "Invite a partner to add the first person.",
    organizationItems: "organizations",
    peopleItems: "people",
    filteredOrganizations: "organizations match these filters",
    filteredPeople: "people match these filters",
    searchedOrganizations: "organization names and their people's names and emails",
    searchedPeople: "names, emails and organization names",
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
    /** Visible actions under the title. Edit details. */
    actionsLabel: "Organization actions",
    editDetails: "Edit details",
    addPerson: "Add person",
    reinvite: "Reinvite",
    profileHeading: "Profile",
    nameLabel: "Organization name",
    websiteLabel: "Website",
    websiteHint: "Example: sdckw.ca",
    descriptionLabel: "Short description",
    descriptionHint: "One or two sentences about what your organization does. Up to 280 characters.",
    save: "Save changes",
    cancel: "Cancel",
    peopleHeading: "People",
    removedOn: (date: string) => `Removed ${date}`,
    viewOpportunities: (n: number) => `View opportunities (${n})`,
    healthHeading: "Health",
    /** Panel section heading, ⋯ menu label and the Profile section's edit button. */
    summaryHeading: "Opportunities",
    moreActions: "More actions",
    edit: "Edit",
    editProfile: "Edit profile",
    published: "Published",
    totalClicks: "Total clicks",
    lastPosted: "Last posted",
    /** Shorter, as a button beside the Opportunities heading. */
    postForThem: "Post for them",
    /** Notes save automatically. */
    notesLabel: "SDC notes",
    notesSaving: "Saving…",
    notesSaved: "Saved",
  },

  /** A person's fields and actions (the People view has no panel; these show in its row menu and edit dialog). */
  personPanel: {
    nameLabel: "Name",
    emailLabel: "Email",
    inviteAgain: "Invite again",
  },

  person: {
    rowActions: (name: string) => `Actions for ${name}`,
    edit: "Edit",
    /** The People row menu's edit item and its dialog title. */
    editDetails: "Edit details",
    /** The Organization cell's accessible name (it opens that organization's panel). */
    openOrganization: (organization: string) => `Open ${organization}`,
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
