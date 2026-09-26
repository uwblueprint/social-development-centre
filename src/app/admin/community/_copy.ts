/**
 * Every user-facing string for the Community admin page. Components import
 * from here instead of writing copy inline. The owner edits copy here; it's
 * applied back to the product from this file. IDs in docs/ux/portal.md's
 * Community copy table match this object's key paths.
 *
 * Server-returned strings (`ActionState.message`, from `_data/actions.ts`)
 * are backend copy, not covered here — that contract is fixed.
 */
export const communityCopy = {
  page: {
    title: "Community",
  },

  tabs: {
    ariaLabel: "Community views",
    general: "General members",
    paying: "Paying members",
    /** Counts cover subscribed people only; unsubscribed people are never counted. */
    generalCount: (general: number) => `(${general})`,
    generalTabTooltip: "Includes paying members. Doesn't include people who unsubscribed.",
    payingCount: (paying: number) => `(${paying})`,
  },

  toolbar: {
    searchPlaceholder: "Search by name or email",
    export: "Export members",
    addMembers: "Add members",
  },

  table: {
    headerName: "Name",
    headerEmail: "Email",
    headerLastEmail: "Last email",
    headerAdded: "Added",
    headerActions: "Actions",
    noName: "No name",
    noLastEmail: "—",
    copyEmailLabel: "Copy email",
    unsubscribedLabel: "Unsubscribed",
    rowActionsLabel: (name: string) => `Actions for ${name}`,
  },

  rowMenu: {
    copyEmail: "Copy email",
    convert: "Convert to paying member",
    remove: "Remove paying access",
    unsubscribe: "Unsubscribe",
  },

  empty: {
    searchTitle: (q: string) => `No matches for "${q}"`,
    searchDescription: "Try a different name or email.",
    payingTitle: "No paying members yet",
    payingDescription: "Convert a general member to paying from their record, or add paying members here.",
    generalTitle: "No members yet",
    generalDescription: "People who join or subscribe appear here.",
  },

  addDialog: {
    titlePaying: "Add paying members",
    titleGeneral: "Add general members",
    emailsLabel: "Email addresses",
    emailsHint: "Separate with commas or new lines",
    emailsPlaceholder: "ada@example.org, grace@example.org",
    cancel: "Cancel",
    continue: "Continue",
    back: "Back",
    adding: "Adding…",
    addCount: (n: number) => `Add ${n} ${n === 1 ? "member" : "members"}`,
    summary: (n: number) => `${n} new ${n === 1 ? "member" : "members"} will be added and get a welcome email.`,
    skipped: (n: number) => `${n} already ${n === 1 ? "member" : "members"}, skipped`,
    unsubscribedIssue: (n: number) => `${n} unsubscribed, not added`,
    invalid: (n: number) => `${n} invalid`,
    duplicates: (n: number) => `${n} duplicates removed`,
    toggleAddresses: (label: string, open: boolean) => `${label}. ${open ? "Hide" : "Show"} addresses`,
    addedFallback: "Members added.",
    notAddedFallback: "The members weren't added.",
  },

  exportDialog: {
    title: "Export members",
    description: "Download a CSV of member names and emails.",
    whoLabel: "Who to export",
    scopeGeneral: "General members",
    scopePaying: "Paying members",
    includeUnsubscribed: "Include unsubscribed members",
    counting: "Counting…",
    countLine: (n: number) => `${n} ${n === 1 ? "person" : "people"} will be exported`,
    cancel: "Cancel",
    download: "Download CSV",
    preparing: "Preparing…",
    downloadedToast: (filename: string) => `Downloaded ${filename}.`,
    errorToast: "The export couldn't be created. Try again.",
  },

  panel: {
    statusGeneral: "General member",
    statusPaying: "Paying member",
    statusUnsubscribed: "Unsubscribed",
    added: (date: string) => `Added ${date}`,
    menuLabel: (name: string) => `Actions for ${name}`,
    menuEdit: "Edit details",
    menuCopyEmail: "Copy email",
    menuConvert: "Convert to paying member",
    menuRemove: "Remove paying access",
    menuUnsubscribe: "Unsubscribe",
    menuRestore: "Resubscribe",
    restoreReason: "Turned off until SDC confirms its consent rules for resubscribing people.",
  },

  copyButton: {
    label: "Copy email",
    copied: "Copied",
    failed: "Couldn't copy. Select the email to copy it.",
  },

  editForm: {
    ariaLabel: "Edit member",
    nameLabel: "Name",
    emailLabel: "Email",
    cancel: "Cancel",
    save: "Save",
  },

  confirm: {
    revokeTitle: (name: string) => `Remove paying access for ${name}?`,
    revokeBody: "Their paid benefits end now. They'll keep getting general emails, and we'll send them a notice.",
    revokeCancel: "Keep paying access",
    revokeConfirm: "Yes, remove paying access",
    unsubscribeTitle: (name: string) => `Unsubscribe ${name}?`,
    unsubscribeBodyPaying:
      "This stops all emails to them and removes their paying access, now. Their record is kept, marked Unsubscribed.",
    unsubscribeBodyGeneral: "This stops all emails to them now. Their record is kept, marked Unsubscribed.",
    unsubscribeCancel: "Keep subscribed",
    unsubscribeConfirm: "Yes, unsubscribe",
  },

  emails: {
    heading: "Emails",
    count: (n: number) => `(${n})`,
    bouncedBadge: "Bounced",
    empty: "No emails sent yet.",
    loading: "Loading emails…",
    loadError: "Couldn't load this person's emails.",
    bodyLoading: "Loading email…",
    bodyError: "Couldn't load this email.",
    retry: "Try again",
    previewTitle: (subject: string) => `Email preview: ${subject}`,
  },

  toast: {
    emailCopied: "Email copied",
    done: "Done.",
  },
} as const;
