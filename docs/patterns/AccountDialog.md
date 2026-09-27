# AccountDialog

My account, as a `Dialog` opened from the sidebar profile menu in both portals. Scope: profile picture, name, and deleting the account. Nothing else (see `docs/decisions/platform.md`).

## API
```tsx
import { AccountDialog, accountDialogCopy } from "@/components/patterns/AccountDialog";
```
- `open`, `onOpenChange`: controlled by the shell (`SidebarConfig.onOpenAccount` sets it open).
- `user`: `{ name, email, initials, avatarSrc? }`.
- `updateAction(prev, formData)`: a server action returning `ActionState`. Receives `name`, and `avatar` (an image file) or `removeAvatar=1`. Field errors come back under `name` and `avatar`.
- `deleteAction()`: a server action that deletes the account, signs out and redirects to `/login?accountDeleted=1`.
- `deleteDescription`: what deleting means for this person (`accountDialogCopy.deleteAdmin` or `deletePartner(org)`).

The shells (`AdminShell`, `PartnerShell`) render it inside the portal's `AppToastProvider` and bind `updateAccount` / `deleteAccount` from `src/features/account/actions.ts` to their portal.

## Behavior
- **Profile picture:** "Upload photo" (or "Change photo") opens the file picker. JPG, PNG or WebP. The photo is scaled down in the browser (shorter side 512px) and previewed in the avatar, which crops it to a square with `object-fit: cover`. "Remove photo" falls back to initials. Nothing is saved until "Save changes".
- **Name:** required, up to 80 characters.
- **Save changes** closes the dialog and shows a "Changes saved" toast. Errors stay in the dialog under the field.
- **Danger zone:** "Delete account" opens an `AlertDialog` ("Delete your account?") with "Keep account" and a danger "Delete account". Deleting signs the person out and lands on the sign-in page with "Your account is deleted and you're signed out."
- Closing the dialog discards unsaved changes; it opens fresh each time.

## Accessibility
The photo controls are a `group` labelled "Profile picture"; the upload button is described by the hint and any error. The file input itself is hidden from the tab order and screen readers; the button is the control. Errors pair an icon with text.
