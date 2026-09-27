"use client";

import * as React from "react";
import { useActionState } from "react";
import { styled } from "next-yak";
import { ImageUp, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogActions, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/AlertDialog";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/Dialog";
import { ErrorIcon, Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Separator } from "@/components/ui/Separator";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { idleState, type ActionState } from "@/lib/forms";

/** Copy for the My account dialog. New, needs approval: docs/ux/portal.md, "Account and sign-out". */
export const accountDialogCopy = {
  title: "My account",
  signedInAs: (email: string) => `Signed in as ${email}`,
  photoLabel: "Profile picture",
  photoHint: "JPG, PNG or WebP. We crop it to a square.",
  upload: "Upload photo",
  change: "Change photo",
  remove: "Remove photo",
  photoUnreadable: "We couldn't read that image. Choose a JPG, PNG or WebP file.",
  photoType: "Choose a JPG, PNG or WebP image.",
  nameLabel: "Name",
  cancel: "Cancel",
  save: "Save changes",
  saved: "Changes saved",
  dangerTitle: "Danger zone",
  dangerBody: "Delete your account and sign out.",
  delete: "Delete account",
  confirmTitle: "Delete your account?",
  confirmDelete: "Delete account",
  keepAccount: "Keep account",
  deleteAdmin:
    "You'll be signed out and lose access to SDC Admin. What you did here stays in SDC's records, shown as \"Former admin\". This can't be undone.",
  deletePartner: (organization: string) =>
    `You'll be signed out and lose access to ${organization} in the SDC partner portal. This can't be undone.`,
} as const;

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Photos are resized in the browser so the shorter side is at most this, before upload. */
const PHOTO_MAX_SIDE = 512;

/**
 * Scales a photo down so its shorter side is PHOTO_MAX_SIDE. It stays uncropped: the avatar crops it to
 * a square with object-fit, so the stored file works if the crop ever changes.
 */
async function resizePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.min(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), type, 0.9),
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

const PhotoGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const GroupLabel = styled.span`
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const PhotoRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
`;

const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  opacity: 0;
`;

const Hint = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

const ErrorText = styled.p`
  display: flex;
  align-items: center;
  gap: var(--space-1);
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-danger);
`;

const Danger = styled.section`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-5);
`;

const DangerText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const DangerTitle = styled.h3`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const DeleteForm = styled.form`
  display: contents;
`;

const SectionSeparator = styled(Separator)`
  margin-top: var(--space-5);
`;

export interface AccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { name: string; email: string; initials: string; avatarSrc?: string };
  /** Saves `name`, and `avatar` (a resized image) or `removeAvatar=1`. Returns `ActionState`. */
  updateAction: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  /** Deletes the account, signs out and redirects. */
  deleteAction: () => Promise<void>;
  /** What deleting means for this person, shown in the confirmation. Differs by portal. */
  deleteDescription: string;
}

/**
 * My account, opened from the sidebar's profile menu in both portals: profile picture, name, and
 * deleting the account. Nothing else: sign-in is by email link, so there's no password, and email
 * changes wait for the backend (docs/decisions/platform.md).
 */
export function AccountDialog({ open, onOpenChange, ...props }: AccountDialogProps) {
  // A fresh form each time it opens, so a closed dialog never keeps unsaved edits.
  const [session, setSession] = React.useState(0);
  // Opened from a menu, not a Dialog trigger: remember what had focus (the profile button) and return there.
  const returnFocus = React.useRef<HTMLElement | null>(null);
  React.useLayoutEffect(() => {
    if (open) returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }, [open]);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setSession((s) => s + 1);
      }}
    >
      <DialogContent
        onCloseAutoFocus={(event) => {
          if (!returnFocus.current?.isConnected) return;
          event.preventDefault();
          returnFocus.current.focus();
        }}
      >
        <AccountForm key={session} {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AccountForm({
  user,
  updateAction,
  deleteAction,
  deleteDescription,
  onDone,
}: Omit<AccountDialogProps, "open" | "onOpenChange"> & { onDone: () => void }) {
  const copy = accountDialogCopy;
  const { toast } = useToast();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = React.useState<{ blob: Blob; url: string } | null>(null);
  const [removed, setRemoved] = React.useState(false);
  const [photoError, setPhotoError] = React.useState<string | null>(null);
  const hintId = React.useId();
  const errorId = React.useId();
  const labelId = React.useId();

  const [state, formAction] = useActionState(updateAction, idleState);

  React.useEffect(() => {
    if (state.status !== "success") return;
    toast({ title: state.message ?? copy.saved });
    onDone();
    // Runs once per successful save.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  React.useEffect(() => () => {
    if (photo) URL.revokeObjectURL(photo.url);
  }, [photo]);

  const shownSrc = photo?.url ?? (removed ? undefined : user.avatarSrc);
  const serverPhotoError = state.fieldErrors?.avatar;
  const shownPhotoError = photoError ?? serverPhotoError;

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError(copy.photoType);
      return;
    }
    try {
      const blob = await resizePhoto(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      setRemoved(false);
      setPhotoError(null);
    } catch {
      setPhotoError(copy.photoUnreadable);
    }
  }

  function removePhoto() {
    setPhoto(null);
    setRemoved(true);
    setPhotoError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <DialogTitle>{copy.title}</DialogTitle>
      <DialogDescription>{copy.signedInAs(user.email)}</DialogDescription>

      <Form
        action={(formData) => {
          if (photo) formData.set("avatar", photo.blob, photo.blob.type === "image/png" ? "avatar.png" : "avatar.jpg");
          if (removed) formData.set("removeAvatar", "1");
          formAction(formData);
        }}
        noValidate
      >
        <PhotoGroup role="group" aria-labelledby={labelId}>
          <GroupLabel id={labelId}>{copy.photoLabel}</GroupLabel>
          <PhotoRow>
            <Avatar src={shownSrc} initials={user.initials} size="lg" alt="" />
            <HiddenFileInput
              ref={fileRef}
              type="file"
              accept={PHOTO_TYPES.join(",")}
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => void choosePhoto(e.target.files?.[0])}
            />
            <Button
              type="button"
              $variant="outline"
              $size="sm"
              aria-describedby={[hintId, shownPhotoError ? errorId : null].filter(Boolean).join(" ")}
              onClick={() => fileRef.current?.click()}
            >
              <Icon icon={ImageUp} size={16} />
              {shownSrc ? copy.change : copy.upload}
            </Button>
            {shownSrc && (
              <Button type="button" $variant="ghost" $size="sm" onClick={removePhoto}>
                {copy.remove}
              </Button>
            )}
          </PhotoRow>
          <Hint id={hintId}>{copy.photoHint}</Hint>
          {shownPhotoError && (
            <ErrorText id={errorId} role="alert">
              <ErrorIcon />
              <span>{shownPhotoError}</span>
            </ErrorText>
          )}
        </PhotoGroup>

        <Field label={copy.nameLabel} required error={state.fieldErrors?.name}>
          {(fieldProps) => <Input {...fieldProps} name="name" defaultValue={user.name} autoComplete="name" />}
        </Field>

        {state.status === "error" && state.message && (
          <ErrorText role="alert">
            <ErrorIcon />
            <span>{state.message}</span>
          </ErrorText>
        )}

        <DialogActions style={{ marginTop: 0 }}>
          <DialogClose asChild>
            <Button type="button" $variant="ghost">
              {copy.cancel}
            </Button>
          </DialogClose>
          <SubmitButton>{copy.save}</SubmitButton>
        </DialogActions>
      </Form>

      <SectionSeparator />

      <Danger aria-labelledby={`${labelId}-danger`}>
        <DangerText>
          <DangerTitle id={`${labelId}-danger`}>{copy.dangerTitle}</DangerTitle>
          <Hint>{copy.dangerBody}</Hint>
        </DangerText>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" $variant="outline" $size="sm">
              <Icon icon={Trash2} size={16} />
              {copy.delete}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogTitle>{copy.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{deleteDescription}</AlertDialogDescription>
            <DeleteForm action={deleteAction}>
              <AlertDialogActions>
                <AlertDialogCancel asChild>
                  <Button type="button" $variant="ghost">
                    {copy.keepAccount}
                  </Button>
                </AlertDialogCancel>
                <SubmitButton $variant="danger">{copy.confirmDelete}</SubmitButton>
              </AlertDialogActions>
            </DeleteForm>
          </AlertDialogContent>
        </AlertDialog>
      </Danger>
    </>
  );
}
