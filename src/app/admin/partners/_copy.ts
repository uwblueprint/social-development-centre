/**
 * User-facing strings for the admin Partners page that have moved out of the components so far
 * (the toolbar, tabs, tables, badges and invitation actions). Other Partners strings are still
 * inline in `_components/`.
 *
 * Server-returned strings (`ActionState.message`, from `_data/actions.ts` and `_data/contacts.ts`)
 * are backend copy, not covered here: that contract is fixed.
 */
export const partnersCopy = {
  search: {
    /** Also the field's aria-label: there's no visible label. */
    placeholder: "Search by name or email",
    noMatchesTitle: (q: string) => `No matches for "${q}"`,
    noMatchesDescription: "Try a different organization name, contact name or email.",
  },

  tabs: {
    ariaLabel: "Partner views",
    organizations: "Organizations",
    people: "People",
    invitations: "Invitations",
    removed: "Removed",
    count: (n: number) => `(${n})`,
  },

  badges: {
    invitationPending: "Invitation pending",
    expired: "Expired",
    notDelivered: "Not delivered",
  },

  table: {
    headerOrganization: "Organization",
    headerContacts: "Contacts",
    headerEmail: "Email",
    headerOpportunities: "Opportunities",
    headerName: "Name",
    headerSent: "Sent",
    headerExpires: "Expires",
    headerRemoved: "Removed",
    headerActions: "Actions",
    opportunities: (n: number) => (n === 1 ? "1 opportunity" : `${n} opportunities`),
    rowActionsLabel: (name: string) => `Actions for ${name}`,
  },

  invitationMenu: {
    resend: "Resend invitation",
    cancel: "Cancel invitation",
    resentFallback: "Invitation resent.",
  },

  cancelInvitationConfirm: {
    title: "Cancel this invitation?",
    body: (name: string) => `${name} won't be able to use the invitation link already sent.`,
    keep: "Keep invitation",
    confirm: "Yes, cancel invitation",
  },

  empty: {
    invitationsTitle: "No pending invitations",
    invitationsDescription: "People you invite appear here until they accept.",
  },
} as const;
