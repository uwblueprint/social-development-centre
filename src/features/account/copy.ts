/**
 * Messages the account server actions return (shown under fields or as a toast). New, needs approval:
 * docs/ux/portal.md, "Account and sign-out". The dialog's own copy is `accountDialogCopy` in
 * src/components/patterns/AccountDialog.tsx.
 */
export const accountServerCopy = {
  saved: "Changes saved",
  signedOut: "You've been signed out. Sign in again to save your changes.",
  nameRequired: "Enter your name.",
  nameTooLong: (max: number) => `Use ${max} characters or fewer.`,
  avatarType: "Choose a JPG, PNG or WebP image.",
  avatarSize: "Choose a smaller image, up to 1 MB.",
};
