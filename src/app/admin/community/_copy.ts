/**
 * Every user-facing string for the Community admin page. Components import
 * from here instead of writing copy inline. The owner edits copy here; it's
 * applied back to the product from this file. IDs in the retired UX spec's
 * Community copy table match this object's key paths.
 *
 * Server-returned strings (`ActionState.message`, from `_data/actions.ts`)
 * are backend copy, not covered here — that contract is fixed.
 */
import { adminEscalation } from "@/lib/errorCopy";
import type { MemberStatus } from "./_data/types";

/**
 * The paid benefit beyond the members-only feed, until SDC decides it (docs/users.md, Paying member).
 * TODO: replace once SDC confirms. Import this constant; never hard-code the benefit elsewhere.
 */
export const PAID_BENEFIT = "{paid benefit}";

/** One label per status, used by the Status column, its filter, the panel and the export. */
const statusLabels: Record<MemberStatus, string> = {
  unsubscribed: "Unsubscribed",
  invited: "Invited",
  onboarding_incomplete: "Onboarding incomplete",
  active: "Active",
  inactive: "Inactive",
};

export const communityCopy = {
  page: {
    title: "Community",
  },

  tabs: {
    ariaLabel: "Community views",
    general: "General members",
    paying: "Paying members",
    /** Counts follow the search and the Status filter; the tabs are exclusive, so nobody is counted twice. */
    generalCount: (general: number) => `(${general})`,
    generalTabTooltip: "People who aren't paying members.",
    payingCount: (paying: number) => `(${paying})`,
  },

  toolbar: {
    searchPlaceholder: "Search by name or email",
    export: "Export members",
    /** One button for one person or many; the dialog also imports a file. */
    addMembers: "Add members",
    openKiosk: "Open sign-up kiosk",
  },

  /** The dialog behind Open sign-up kiosk. The optional location is saved with each sign-up (export only). */
  kiosk: {
    title: "Open sign-up kiosk",
    locationLabel: "Location",
    cancel: "Cancel",
    open: "Open kiosk",
  },

  status: statusLabels,

  table: {
    headerName: "Name",
    headerEmail: "Email",
    headerStatus: "Status",
    headerClicks: "Clicks",
    headerLastEmail: "Last email",
    headerSent: "Sent",
    headerActions: "Actions",
    noName: "No name",
    noLastEmail: "—",
    /** The whole email is the copy control; its name starts with the visible text's purpose. */
    copyEmailLabel: (email: string) => `Copy ${email}`,
    rowActionsLabel: (name: string) => `Actions for ${name}`,
  },

  rowMenu: {
    convert: "Convert to paying member",
    remove: "Remove paying access",
    unsubscribe: "Unsubscribe",
    resubscribe: "Resubscribe",
  },

  /** No-results wording comes from ListEmptyState (listEmptyCopy); these are the Community nouns it uses. */
  empty: {
    /** What each tab lists, as it reads mid-sentence: "No paying members match “ada”". */
    generalItems: "members",
    payingItems: "paying members",
    searchedFields: "names and emails",
    /** The Status filter hides everything: "No paying members with these statuses". */
    filtered: (items: string) => `${items} with these statuses`,
    /** A search whose only matches in this tab have a status the filter hides. */
    hiddenByFilter: (n: number) => `${n} ${n === 1 ? "match has" : "matches have"} a status the Status filter hides.`,
    /** A search whose only matches are in the other tab, with a status the filter hides. */
    hiddenElsewhere: (n: number, scope: string) =>
      `${n} ${n === 1 ? "match" : "matches"} in ${scope}, with a status the Status filter hides.`,
    showAllStatuses: "Show all statuses",
    payingTitle: "No paying members yet",
    payingDescription: "Convert a general member to paying from their record, or add a paying member here.",
    generalTitle: "No members yet",
    generalDescription: "People who join or subscribe appear here.",
  },

  addDialog: {
    title: "Add members",
    /** Single-person view. */
    nameLabel: "Name",
    emailLabel: "Email",
    paying: "Make them a paying member",
    add: "Add member",
    importFromFile: "Import from a file",
    /** File view (CSV upload, then the rows to check). */
    fileHint: "One person per line: name, email. Fix anything here before you continue.",
    downloadTemplate: "Download template",
    templateFilename: "sdc-members-template.csv",
    backToAdd: "Back",
    emailsLabel: "People to add",
    uploadCsv: "Upload CSV",
    /** NEW, NEEDS APPROVAL: the simplified file step. */
    /** NEW, NEEDS APPROVAL: the numbered file steps. */
    stepTemplateTitle: "Download the template",
    stepTemplateHint: "A CSV with name and email columns.",
    stepUploadTitle: "Upload your file",
    stepReviewTitle: "Review",
    chooseFile: "Choose a CSV file",
    dropHint: "or drag it here",
    addAnotherFile: "Add another file",
    csvLoaded: (n: number, file: string) => `Added ${n} ${n === 1 ? "row" : "rows"} from ${file}. Check them before you continue.`,
    csvEmpty: (file: string) => `${file} has no email addresses. Check the file and try again.`,
    csvUnreadable: (file: string) => `${file} couldn't be read. Upload a CSV file.`,
    payingBulk: "Make them paying members",
    cancel: "Cancel",
    continue: "Continue",
    back: "Back",
    close: "Close",
    applying: "Saving…",
    /** The preview's main button names what it does: adds, converts or resubscribes, or a mix. */
    confirmAdd: (n: number) => `Add ${n} ${n === 1 ? "person" : "people"}`,
    confirmConvert: (n: number) => `Make ${n} ${n === 1 ? "person" : "people"} paying`,
    confirmResubscribe: (n: number) => `Resubscribe ${n} ${n === 1 ? "person" : "people"}`,
    confirm: (n: number) => `Confirm ${n} ${n === 1 ? "change" : "changes"}`,
    emailsLine: (n: number) => (n === 0 ? "No emails will be sent." : `${n} ${n === 1 ? "email" : "emails"} will be sent.`),
    nothingToChange: "Nothing will change. Go back to edit the list.",
    /** Import members: nothing pasted was an email address. */
    noValidAddresses: "None of these are email addresses, so nothing will change. Edit the list so each entry looks like name@example.org.",
    /** Every address is already a subscribed member and nothing else would change. */
    allAlreadyMembers: (n: number) =>
      n === 1 ? "They're already a member, so nothing will change." : `All ${n} are already members, so nothing will change.`,
    /** Nothing will change: the main button goes back to the list. */
    editList: "Edit list",
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
      invalidDetail: "They won't be imported. Fix them in your file and upload it again, or continue without them.",
      unsubscribedSelf: (n: number) => `${n} unsubscribed themselves, not resubscribed`,
      unsubscribedSelfDetail: (converting: number) =>
        `Only they can resubscribe.${converting ? ` ${converting} will still become paying, without an email.` : ""}`,
      unsubscribedAdmin: (n: number) => `${n} unsubscribed by an admin`,
      unsubscribedAdminDetail: (converting: number) =>
        `They stay unsubscribed unless you resubscribe them.${converting ? ` ${converting} will become paying either way.` : ""}`,
      resubscribe: (n: number) => `Resubscribe ${n} ${n === 1 ? "person" : "people"} an admin unsubscribed`,
      deleted: (n: number) => `${n} deleted earlier, skipped`,
      deletedDetail: "They were deleted from Community. Only they can sign up again.",
    },
    addedFallback: "Members added.",
  },

  exportDialog: {
    title: "Export members",
    description: "Download a CSV to analyse in a spreadsheet.",
    kindLabel: "What to export",
    kindMembers: "Members (one row per person)",
    kindActivity: "Activity (one row per click)",
    whoLabel: "Who to export",
    scopeGeneral: "General members",
    scopePaying: "Paying members",
    scopeBoth: "Both",
    /** Applies to whichever scope is chosen. */
    includeUnsubscribed: "Include unsubscribed members",
    counting: "Counting…",
    countLine: (kind: "members" | "activity", n: number) =>
      kind === "members"
        ? `${n} ${n === 1 ? "person" : "people"} will be exported`
        : `${n} ${n === 1 ? "click" : "clicks"} will be exported`,
    cancel: "Cancel",
    download: "Download CSV",
    preparing: "Preparing…",
    downloadedToast: (filename: string) => `Downloaded ${filename}.`,
    errorToast: "The export couldn't be created. Try again.",
  },

  panel: {
    statusGeneral: "General member",
    statusPaying: "Paying member",
    added: (date: string) => `Added ${date}`,
    /** "Active · General member · Added Apr 11, 2026". */
    metaSeparator: " · ",
    unsubscribedSelf: (date: string) => `Unsubscribed themselves on ${date}. Only they can resubscribe.`,
    unsubscribedAdmin: (date: string) => `Unsubscribed by an admin on ${date}.`,
    actionsLabel: (name: string) => `Actions for ${name}`,
    edit: "Edit details",
    unsubscribe: "Unsubscribe",
    resubscribe: "Resubscribe",
    convert: "Convert to paying member",
    remove: "Remove paying access",
    delete: "Delete member",
  },

  copyButton: {
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
    convertTitle: (name: string) => `Make ${name} a paying member?`,
    convertBody: (subscribed: boolean) =>
      `They'll get the members-only feed and ${PAID_BENEFIT}. ${subscribed ? "We'll email them to let them know." : "They're unsubscribed, so we won't email them."}`,
    convertCancel: "Cancel",
    convertConfirm: "Make paying member",
    deleteTitle: (name: string) => `Delete ${name} permanently?`,
    deleteBody:
      "They'll be removed from Community and every export, and this can't be undone. To only stop emails, unsubscribe them instead.",
    deleteCancel: "Cancel",
    deleteConfirm: "Delete member",
  },

  emails: {
    heading: "Emails",
    count: (n: number) => `(${n})`,
    notDeliveredBadge: "Not delivered",
    empty: "No emails sent to them yet.",
    /** Unsubscribed and never emailed: nothing will be sent, so "yet" would be wrong. */
    emptyUnsubscribed: "No emails sent. They're unsubscribed, so none will be sent.",
    loading: "Loading emails…",
    loadError: "We couldn't load their emails. Nothing was changed; this is a loading problem.",
    bodyLoading: "Loading email…",
    bodyError: "Couldn't load this email.",
    retry: "Try again",
    previewTitle: (subject: string) => `Email preview: ${subject}`,
    /** What they did with an opportunities email: "Signed up: Film night · Shared: Tenant workshop". */
    signedUp: "Signed up",
    tookAction: "Took action",
    shared: "Shared",
    actionItem: (action: string, title: string) => `${action}: ${title}`,
    actionSeparator: " · ",
    noClicks: "No clicks",
  },

  /** The page's error boundary (error.tsx), shown when the page fails to load. */
  loadError: {
    title: "We couldn't load Community.",
    body: "Your data is safe; this is a loading problem.",
    retry: "Try again",
    escalation: adminEscalation,
  },

  toast: {
    /** Only where the copy has no in-place confirmation. */
    emailCopied: (name: string | undefined, email: string) => (name ? `Copied ${name}'s email` : `Copied ${email}`),
    done: "Done.",
  },
} as const;

/** Values in the exported CSVs. Plain words, so the file reads well in a spreadsheet. */
export const exportCopy = {
  status: statusLabels,
  tier: { general: "General member", paying: "Paying member" },
  yes: "Yes",
  no: "No",
  unsubscribedBy: { self: "Themselves", admin: "An admin" },
  onboarding: { not_started: "Not started", in_progress: "In progress", completed: "Completed" },
  source: {
    legacy_import: "Legacy import",
    booth: "Booth",
    website: "Website",
    partner_event: "Partner event",
    referral: "Referral",
    admin_added: "Added by an admin",
    file_import: "File import",
  },
  action: { sign_up: "Signed up", take_action: "Took action", shared: "Shared" },
} as const;
