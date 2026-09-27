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
    importMembers: "Import members",
    addMember: "Add member",
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
    resubscribe: "Resubscribe",
  },

  empty: {
    searchTitle: (q: string) => `No matches for "${q}"`,
    searchDescription: "Try a different name or email.",
    payingTitle: "No paying members yet",
    payingDescription: "Convert a general member to paying from their record, or add a paying member here.",
    generalTitle: "No members yet",
    generalDescription: "People who join or subscribe appear here.",
  },

  addDialog: {
    titleSingle: "Add member",
    titleBulk: "Import members",
    nameLabel: "Name",
    emailLabel: "Email",
    emailsLabel: "Email addresses",
    emailsHint: "Separate with commas or new lines. Names are optional, e.g. Ada Lovelace <ada@example.org>.",
    emailsPlaceholder: "ada@example.org, grace@example.org",
    uploadCsv: "Upload CSV",
    csvLoaded: (n: number, file: string) => `Added ${n} ${n === 1 ? "row" : "rows"} from ${file}. Check them before you continue.`,
    csvEmpty: (file: string) => `${file} has no email addresses. Check the file and try again.`,
    csvUnreadable: (file: string) => `${file} couldn't be read. Upload a CSV file.`,
    payingSingle: "Make them a paying member",
    payingBulk: "Make them paying members",
    cancel: "Cancel",
    continue: "Continue",
    back: "Back",
    close: "Close",
    applying: "Saving…",
    confirm: (n: number) => `Confirm ${n} ${n === 1 ? "change" : "changes"}`,
    emailsLine: (n: number) => (n === 0 ? "No emails will be sent." : `${n} ${n === 1 ? "email" : "emails"} will be sent.`),
    nothingToChange: "Nothing will change. Go back to edit the list.",
    toggleAddresses: (label: string, open: boolean) => `${label}. ${open ? "Hide" : "Show"} addresses`,
    groups: {
      added: (n: number, paying: boolean) => `${n} new ${paying ? "paying" : "general"} ${n === 1 ? "member" : "members"}`,
      addedDetail: (paying: boolean) =>
        paying ? "They'll get the paying-member welcome email." : "They'll get the general welcome email.",
      converted: (n: number) => `${n} general ${n === 1 ? "member" : "members"} will become paying`,
      convertedDetail: "They'll get the Paying membership added email.",
      alreadyPaying: (n: number) => `${n} already paying, no change`,
      alreadyPayingDetail: "Paying members are never changed to general.",
      alreadyMembers: (n: number) => `${n} already general ${n === 1 ? "member" : "members"}, no change`,
      alreadyMembersDetail: (payingLabel: string) => `To make them paying, go back and check ${payingLabel}.`,
      duplicates: (n: number) => `${n} ${n === 1 ? "address" : "addresses"} entered more than once, merged`,
      invalid: (n: number) => `${n} invalid ${n === 1 ? "entry" : "entries"}, skipped`,
      invalidDetail: "Go back to fix them, or confirm without them.",
      unsubscribedSelf: (n: number) => `${n} unsubscribed themselves, not resubscribed`,
      unsubscribedSelfDetail: (converting: number) =>
        `Only they can resubscribe.${converting ? ` ${converting} will still become paying, without an email.` : ""}`,
      unsubscribedAdmin: (n: number) => `${n} unsubscribed by an admin`,
      unsubscribedAdminDetail: (converting: number) =>
        `They stay unsubscribed unless you resubscribe them.${converting ? ` ${converting} will become paying either way.` : ""}`,
      resubscribe: (n: number) => `Resubscribe ${n} ${n === 1 ? "person" : "people"} an admin unsubscribed`,
    },
    addedFallback: "Changes saved.",
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
    unsubscribedSelf: (date: string) => `Unsubscribed themselves on ${date}. Only they can resubscribe.`,
    unsubscribedAdmin: (date: string) => `Unsubscribed by an admin on ${date}.`,
    menuLabel: (name: string) => `Actions for ${name}`,
    menuEdit: "Edit details",
    menuCopyEmail: "Copy email",
    menuConvert: "Convert to paying member",
    menuRemove: "Remove paying access",
    menuUnsubscribe: "Unsubscribe",
    menuResubscribe: "Resubscribe",
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
    revokeBodyUnsubscribed: "Their paid benefits end now. They're unsubscribed, so we won't email them.",
    revokeCancel: "Keep paying access",
    revokeConfirm: "Remove paying access",
    unsubscribeTitle: (name: string) => `Unsubscribe ${name}?`,
    unsubscribeBodyPaying:
      "This stops all emails to them now. They stay a paying member. Their record is kept, marked Unsubscribed.",
    unsubscribeBodyGeneral: "This stops all emails to them now. Their record is kept, marked Unsubscribed.",
    unsubscribeCancel: "Keep subscribed",
    unsubscribeConfirm: "Yes, unsubscribe",
  },

  emails: {
    heading: "Emails",
    count: (n: number) => `(${n})`,
    notDeliveredBadge: "Not delivered",
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
