/** Limits agreed with design. The backend must enforce the same ones (see docs/backend/email-editor.md). */
export const EMAIL_LIMITS = {
  /** Phones cut subjects off around here: warn, don't block. */
  subjectWarn: 60,
  subjectMax: 150,
  /** Gmail clips messages past ~102 KB of HTML, which hides the footer and its unsubscribe link. */
  bodyWarn: 10_000,
  urlMax: 2048,
  linkTextMax: 100,
} as const;

export const emailEditorCopy = {
  subjectLabel: "Subject:",
  messageLabel: "Message",
  bodyPlaceholder: "Draft your email here",
  subjectRequired: "Please include a subject.",
  bodyRequired: "Please include a message.",
  subjectLong: `Phones may cut off subjects longer than ${EMAIL_LIMITS.subjectWarn} characters.`,
  subjectMax: `Subjects can be up to ${EMAIL_LIMITS.subjectMax} characters.`,
  bodyLong: (chars: number) =>
    `This email is ${chars.toLocaleString()} characters. Gmail cuts off long emails, which can hide the unsubscribe link. Try to stay under ${EMAIL_LIMITS.bodyWarn.toLocaleString()}.`,

  toolbar: {
    bold: "Bold",
    italic: "Italic",
    bulletList: "Bulleted list",
    orderedList: "Numbered list",
    link: "Link",
    personalize: "Personalize",
    personalizeTip: "Insert a member detail",
  },

  link: {
    textLabel: "Link text",
    urlLabel: "Link",
    textPlaceholder: "Text to show",
    urlPlaceholder: "Paste or type a link",
    add: "Add",
    save: "Save",
    invalid: "Please enter a valid link.",
    tooLong: `Links can be up to ${EMAIL_LIMITS.urlMax.toLocaleString()} characters.`,
    textTooLong: `Link text can be up to ${EMAIL_LIMITS.linkTextMax} characters.`,
    copy: "Copy link",
    copied: "Copied",
    edit: "Edit link",
    remove: "Remove link",
  },

  personalize: {
    braceHint: "Keep typing to filter · Enter to insert · Esc to cancel",
    menuHint: "Tip: type { in the subject or message",
    noMatch: (q: string) => `No member detail matches “${q}”.`,
    ifEmpty: (fallback: string) => (fallback ? `If empty: “${fallback}”` : "If empty: shows nothing"),
    notAvailable: (moment: string) => `Not available in “${moment}” emails. Remove it or change the email type.`,
    fallbackLabel: (who: string, detail: string) => `If ${who} has no ${detail}, show`,
    fallbackHint: "Changes this for every email not yet sent.",
    fallbackPlaceholder: "Nothing",
    cancel: "Cancel",
    save: "Save",
  },

  footerSettings: "Edit footer in Settings",
  preview: "Preview",
  previewDisabled: "Add a subject and message to preview",
  saving: "Saving…",
  saved: "Draft saved",
} as const;
