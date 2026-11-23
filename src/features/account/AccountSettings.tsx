"use client";

import { useActionState, useState } from "react";
import { CircleAlert } from "lucide-react";
import { styled } from "next-yak";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { ThemeChoice } from "@/components/patterns/ThemeSwitcher";
import type { FooterDoc } from "@/features/email-footer/doc";
import { FooterSettings } from "@/features/email-footer/FooterSettings";
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { DisabledReason } from "@/components/ui/DisabledReason";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import { FormError } from "@/features/auth/AuthScreen";
import { fieldError, idleState, type ActionState } from "@/lib/forms";
import { deleteAccount, updateName, type NameValues } from "./actions";
import { initialCommunityPhoto, saveCommunityPhoto, type CommunityPhoto } from "./communityPhoto";
import { CommunityPhotos, type PhotoDraft } from "./CommunityPhotos";
import { Cell, Column, FormColumn, Row, RowLabel, Section, SectionTitle, Sections } from "./layout";
import { settingTargetId } from "@/features/search/targets";
import type { Account } from "./queries";

const idleName: ActionState<NameValues> = { status: "idle" };

/* Delete account sits a full section away from the name form. */
const PageColumn = styled(Column)`
  gap: var(--space-7);
`;

export function AccountSettings({ account, footer }: { account: Account; footer: FooterDoc }) {
  return (
    <ListPage>
      <PageColumn>
        <SettingsForm initial={{ firstName: account.firstName, lastName: account.lastName }} />
        <Sections>
          <Section aria-labelledby="sending">
            <SectionTitle id="sending">Email sending</SectionTitle>
            <Row id={settingTargetId("footer")}>
              <RowLabel>Email footer</RowLabel>
              <Cell>
                <FooterSettings initial={footer} />
              </Cell>
            </Row>
          </Section>
          <Section aria-labelledby="appearance">
            <SectionTitle id="appearance">Appearance</SectionTitle>
            <Row id={settingTargetId("theme")}>
              <RowLabel id="theme-label">Theme</RowLabel>
              <div>
                <ThemeChoice aria-labelledby="theme-label" />
              </div>
            </Row>
          </Section>
          <DeleteAccount onlyAdmin={account.onlyAdmin} />
        </Sections>
      </PageColumn>
    </ListPage>
  );
}

const toDraft = (photo: CommunityPhoto | null): PhotoDraft => ({
  url: photo?.url ?? null,
  fileName: photo?.fileName ?? null,
  alt: photo?.alt ?? "",
  uploading: false,
});

/**
 * Your name and Community Photos. Always editable. Nothing is saved until Save, and the Save button only appears once
 * something has changed. Leaving the page with unsaved edits discards them.
 * Community Photos is on demo data (./communityPhoto.ts); your name saves for real.
 */
function SettingsForm({ initial }: { initial: NameValues }) {
  const { toast } = useToast();
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [savedPhoto, setSavedPhoto] = useState(initialCommunityPhoto);
  const [photo, setPhoto] = useState(() => toDraft(initialCommunityPhoto));

  const nameDirty = draft.firstName.trim() !== saved.firstName || draft.lastName.trim() !== saved.lastName;
  const photoDirty = photo.url !== (savedPhoto?.url ?? null) || photo.alt !== (savedPhoto?.alt ?? "");

  const [state, formAction] = useActionState(async (prev: ActionState<NameValues>, formData: FormData) => {
    if (!nameDirty && !photoDirty) return prev;
    let nameMessage: string | undefined;
    if (nameDirty) {
      const result = await updateName(prev, formData);
      if (result.status !== "success" || !result.data) return result;
      setSaved(result.data);
      setDraft(result.data);
      nameMessage = result.message;
    }
    if (photoDirty) {
      // No photo means it was removed.
      const result = await saveCommunityPhoto(
        photo.url && photo.fileName ? { url: photo.url, fileName: photo.fileName, alt: photo.alt } : null,
      );
      setSavedPhoto(result.photo);
    }
    toast({ title: photoDirty ? (nameDirty ? "Changes saved." : "Community Photos saved.") : (nameMessage ?? "Your name is saved.") });
    return { status: "success" } satisfies ActionState<NameValues>;
  }, idleName);

  const formLevelError = state.status === "error" && !state.fieldErrors ? state.message : undefined;
  const canSave = (nameDirty || photoDirty) && !photo.uploading;

  return (
    <FormColumn action={formAction} noValidate>
      <ListPageHeader
        title="Settings"
        actions={canSave ? <SubmitButton>{photoDirty ? "Save for all admins" : "Save"}</SubmitButton> : undefined}
      />
      {formLevelError && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {formLevelError}
        </FormError>
      )}
      <Sections>
        <CommunityPhotos draft={photo} onChange={(next) => setPhoto((p) => ({ ...p, ...next }))} />
        <Section aria-labelledby="name">
          <SectionTitle id="name">Your name</SectionTitle>
          <Row id={settingTargetId("first-name")}>
            <RowLabel>First name</RowLabel>
            <Cell>
              <Field label="First name" error={fieldError(state, "firstName")}>
                {(props) => (
                  <Input
                    {...props}
                    name="firstName"
                    autoComplete="given-name"
                    value={draft.firstName}
                    onChange={(e) => setDraft((d) => ({ ...d, firstName: e.target.value }))}
                  />
                )}
              </Field>
            </Cell>
          </Row>
          <Row id={settingTargetId("last-name")}>
            <RowLabel>Last name</RowLabel>
            <Cell>
              <Field label="Last name" error={fieldError(state, "lastName")}>
                {(props) => (
                  <Input
                    {...props}
                    name="lastName"
                    autoComplete="family-name"
                    value={draft.lastName}
                    onChange={(e) => setDraft((d) => ({ ...d, lastName: e.target.value }))}
                  />
                )}
              </Field>
            </Cell>
          </Row>
        </Section>
      </Sections>
    </FormColumn>
  );
}

/** Last on the page, apart from everything else. */
function DeleteAccount({ onlyAdmin }: { onlyAdmin: boolean }) {
  return (
    <Section aria-labelledby="delete">
      <SectionTitle id="delete">Delete account</SectionTitle>
      <Row id={settingTargetId("delete-account")}>
        <RowLabel>You’ll lose access to the admin portal.</RowLabel>
        <div>
          {onlyAdmin ? (
            // The rule from docs/decisions/admins.md (decision 2); the database refuses the last admin too.
            <DisabledReason reason="You’re the only admin. Add another admin before you leave.">
              <Button type="button" $variant="danger" disabled>
                Delete account
              </Button>
            </DisabledReason>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" $variant="danger">
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <DeleteForm />
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </Row>
    </Section>
  );
}

/** Mounted only while the dialog is open, so a failed attempt's error is gone when it reopens. */
/** Typed to confirm deleting your account (owner's words). Case and surrounding spaces don't matter. */
const CONFIRM_PHRASE = "I acknowledge";

function DeleteForm() {
  const [state, formAction] = useActionState(() => deleteAccount(), idleState);
  // Typed first, so leaving can't happen by a stray click. The dialog unmounts on close, which clears it.
  const [confirmText, setConfirmText] = useState("");
  const confirmed = confirmText.trim().toLowerCase() === CONFIRM_PHRASE.toLowerCase();

  return (
    <form action={formAction}>
      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
      <AlertDialogDescription>
        You’ll lose access to the admin portal right away. Another admin can add you back.
      </AlertDialogDescription>
      {state.status === "error" && state.message && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {state.message}
        </FormError>
      )}
      <Field label={`Type “${CONFIRM_PHRASE}” to confirm`}>
        {(props) => <Input {...props} autoComplete="off" placeholder={CONFIRM_PHRASE} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />}
      </Field>
      <AlertDialogActions>
        <AlertDialogCancel asChild>
          <Button type="button" $variant="secondary">
            Cancel
          </Button>
        </AlertDialogCancel>
        {confirmed ? (
          <SubmitButton $variant="danger">Delete account</SubmitButton>
        ) : (
          <DisabledReason reason={`Type “${CONFIRM_PHRASE}” to confirm.`}>
            <Button type="button" $variant="danger" disabled>
              Delete account
            </Button>
          </DisabledReason>
        )}
      </AlertDialogActions>
    </form>
  );
}
