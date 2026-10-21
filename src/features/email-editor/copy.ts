const MB = 1024 * 1024;

/** Limits agreed with design. The backend must enforce the same ones (see docs/backend/email-editor.md). */
export const EMAIL_LIMITS = {
  /** Phones cut subjects off around here: warn, don't block. */
  subjectWarn: 60,
  subjectMax: 150,
  /** Gmail clips messages past ~102 KB of HTML, which hides the footer and its unsubscribe link. */
  bodyWarn: 10_000,
  urlMax: 2048,
  linkTextMax: 100,
  /** Per attachment. */
  fileMax: 10 * MB,
  /** All attachments together. Encoding adds about a third, and Gmail refuses mail over 25 MB. */
  totalMax: 20 * MB,
  fileCount: 10,
  /** Per image in the message. */
  imageMax: 5 * MB,
} as const;

export const ATTACHMENT_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "gif", "webp", "txt", "docx", "csv"] as const;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;

export function formatSize(bytes: number) {
  return bytes < MB ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / MB).toFixed(1)} MB`;
}

export const emailEditorCopy = {
  subjectLabel: "Subject:",
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
    underline: "Underline",
    strike: "Strikethrough",
    heading: "Heading",
    bulletList: "Bulleted list",
    orderedList: "Numbered list",
    quote: "Quote",
    image: "Image",
    link: "Link",
    personalize: "Personalize",
    personalizeTip: "Insert a member detail",
  },

  link: {
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

  image: {
    notImage: (name: string) => `“${name}” isn’t an image. Use a PNG, JPG, GIF or WebP file.`,
    tooBig: (name: string, size: string) => `“${name}” is ${size}. Images can be up to 5 MB.`,
    dropToAttach: "Drop to attach",
  },

  attachments: {
    label: "Attachments",
    add: "Add attachment",
    remove: (name: string) => `Remove ${name}`,
    limitReached: "Max file limit reached",
    used: (mb: string) => `${mb}/20 MB used`,
    uploadFailed: "Upload failed",
    retry: "Retry",
    wrongType: (name: string) => `“${name}” can’t be attached. Use a PDF, image, text, Word or CSV file.`,
    tooBig: (name: string, size: string) => `“${name}” is ${size}. Each file can be up to 10 MB.`,
    overTotal: (name: string) => `“${name}” would take this email over 20 MB. Remove a file or attach a smaller one.`,
    atLimit: "This email has reached the 20 MB attachment limit. Remove a file to add another.",
    tooMany: `Emails can have up to ${EMAIL_LIMITS.fileCount} attachments. Remove one to add another.`,
  },

  footerSettings: "Edit footer in Settings",
  preview: "Preview",
  previewDisabled: "Add a subject and message to preview",
  saving: "Saving…",
  saved: "Draft saved",
} as const;
