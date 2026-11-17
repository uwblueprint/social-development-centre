"use client";

import { useActionState, useRef, useState } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { styled } from "next-yak";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import {
  AlertDialog,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogActions, DialogClose, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Table, type TableColumn } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { FormError } from "@/features/auth/AuthScreen";
import { resendSignInLink } from "@/features/people/actions";
import { displayName, type PersonRow } from "@/features/people/person";
import { fieldError, idleState, type ActionState } from "@/lib/forms";
import { addAdmin, removeAdmin } from "./actions";

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/* Phones get a list instead of the table; desktop keeps the table. */
const DesktopOnly = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileOnly = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;

  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileRow = styled.li`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
`;

const MobileText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  overflow-wrap: anywhere;
`;

const Muted = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const FormStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;

type NewAdmin = { fullName: string; email: string };
const idleInvite: ActionState<NewAdmin> = { status: "idle" };

/** Text on both, so the state never rides on color alone. */
function Status({ person }: { person: PersonRow }) {
  return person.hasSignedIn ? <Badge $variant="success">Active</Badge> : <Badge $variant="warning">Invited</Badge>;
}

/** The email has its own column, so a missing name reads "No name" rather than repeating it. */
function nameOf(person: PersonRow, currentAdminId: string) {
  const name = person.name ?? "No name";
  return person.id === currentAdminId ? `${name} (you)` : name;
}

export function AdminsPage({ admins, currentAdminId }: { admins: PersonRow[]; currentAdminId: string }) {
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  // The person being removed stays set while the dialog fades out, so its text doesn't vanish mid-animation.
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState<PersonRow | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  // Set when a removal succeeds: that row's button is gone, so the dialog sends focus to the page heading instead.
  const [removed, setRemoved] = useState(false);
  // The dialogs open from plain buttons (no Radix Trigger), so Radix can't return focus on close. We do.
  const opener = useRef<HTMLElement | null>(null);

  // The last admin can't leave (the database refuses too), so SDC is never locked out.
  const canLeave = admins.length > 1;

  async function resend(person: PersonRow) {
    if (resendingId) return;
    setResendingId(person.id);
    let sent = false;
    try {
      sent = (await resendSignInLink("admin", person.email)).status === "success";
    } catch {
      // A network or server failure: report it like any other failed send.
    } finally {
      setResendingId(null);
    }
    toast({
      title: sent ? `Invite sent again to ${person.email}` : `We couldn’t resend the invite to ${person.email}. Try again.`,
    });
  }

  function rowActions(person: PersonRow) {
    const self = person.id === currentAdminId;
    return (
      <Actions>
        {!person.hasSignedIn && (
          <Button
            type="button"
            $variant="outline"
            $size="sm"
            aria-busy={resendingId === person.id}
            aria-label={`Resend invite to ${displayName(person)}`}
            onClick={() => void resend(person)}
          >
            Resend invite
          </Button>
        )}
        {(!self || canLeave) && (
          <Button
            type="button"
            $variant="outline"
            $size="sm"
            aria-label={self ? "Leave the admin portal" : `Remove ${displayName(person)}`}
            onClick={(event) => {
              opener.current = event.currentTarget;
              setRemoving(person);
              setRemoveOpen(true);
            }}
          >
            {self ? "Leave" : "Remove"}
          </Button>
        )}
      </Actions>
    );
  }

  const columns: TableColumn<PersonRow>[] = [
    {
      key: "name",
      header: "Name",
      width: "280px",
      render: (p) => <TruncatedText tooltip>{nameOf(p, currentAdminId)}</TruncatedText>,
    },
    { key: "email", header: "Email", render: (p) => <TruncatedText tooltip>{p.email}</TruncatedText> },
    { key: "status", header: "Status", width: "120px", render: (p) => <Status person={p} /> },
    { key: "actions", header: <VisuallyHidden>Actions</VisuallyHidden>, width: "240px", render: rowActions },
  ];

  const selfRemoval = removing?.id === currentAdminId;

  return (
    <ListPage>
      <ListPageHeader
        title="Admins"
        actions={
          <Button
            type="button"
            onClick={(event) => {
              opener.current = event.currentTarget;
              setInviteOpen(true);
            }}
          >
            <Icon icon={Plus} />
            Invite admin
          </Button>
        }
      />

      <DesktopOnly>
        <Table columns={columns} rows={admins} getRowId={(p) => p.id} aria-label="Admins" />
      </DesktopOnly>
      <MobileOnly>
        {admins.map((person) => (
          <MobileRow key={person.id}>
            <MobileText>
              <span>{nameOf(person, currentAdminId)}</span>
              <Muted>{person.email}</Muted>
              <span>
                <Status person={person} />
              </span>
            </MobileText>
            {rowActions(person)}
          </MobileRow>
        ))}
      </MobileOnly>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <InviteForm
            onDone={(message) => {
              setInviteOpen(false);
              toast({ title: message });
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <AlertDialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            if (removed) {
              setRemoved(false);
              document.querySelector<HTMLElement>("h1")?.focus();
            } else {
              opener.current?.focus();
            }
          }}
        >
          {removing && (
            <RemoveForm
              key={removing.id}
              person={removing}
              self={selfRemoval}
              onDone={() => {
                setRemoved(true);
                setRemoveOpen(false);
                toast({ title: `${displayName(removing)} is no longer an admin.` });
              }}
            />
          )}
        </AlertDialogContent>
      </AlertDialog>
    </ListPage>
  );
}

/** Mounted only while the dialog is open, so it starts empty each time. */
function InviteForm({ onDone }: { onDone: (message: string) => void }) {
  const [state, formAction] = useActionState(async (prev: ActionState<NewAdmin>, formData: FormData) => {
    const result = await addAdmin(prev, formData);
    if (result.status === "success") onDone(result.message ?? "Invite sent.");
    return result;
  }, idleInvite);

  return (
    <form action={formAction} noValidate>
      <DialogTitle>Invite admin</DialogTitle>
      <FormStack>
        <Field label="Full name" required error={fieldError(state, "fullName")}>
          {(props) => <Input {...props} name="fullName" autoComplete="off" defaultValue={state.data?.fullName} />}
        </Field>
        <Field label="Email address" required error={fieldError(state, "email")}>
          {(props) => (
            <Input {...props} type="email" name="email" autoComplete="off" defaultValue={state.data?.email} />
          )}
        </Field>
        {state.status === "error" && state.message && (
          <FormError role="alert">
            <Icon icon={CircleAlert} size={16} />
            {state.message}
          </FormError>
        )}
      </FormStack>
      <DialogActions>
        <DialogClose asChild>
          <Button type="button" $variant="secondary">
            Cancel
          </Button>
        </DialogClose>
        <SubmitButton>Send invite</SubmitButton>
      </DialogActions>
    </form>
  );
}

/** Mounted only while the dialog is open, so a failed attempt's error is gone when it reopens. */
function RemoveForm({ person, self, onDone }: { person: PersonRow; self: boolean; onDone: () => void }) {
  const [state, formAction] = useActionState(async () => {
    const result = await removeAdmin(person.id);
    // Removing yourself signs you out and redirects, so this only runs for someone else.
    if (result.status === "success") onDone();
    return result;
  }, idleState);

  return (
    <form action={formAction}>
      <AlertDialogTitle>
        {self ? "Leave the admin portal?" : `Remove ${displayName(person)} as an admin?`}
      </AlertDialogTitle>
      <AlertDialogDescription>
        {self
          ? "You’ll lose access right away. Another admin can add you back."
          : "They’ll lose access to the admin portal right away."}
      </AlertDialogDescription>
      {state.status === "error" && state.message && (
        <FormError role="alert">
          <Icon icon={CircleAlert} size={16} />
          {state.message}
        </FormError>
      )}
      <AlertDialogActions>
        <AlertDialogCancel asChild>
          <Button type="button" $variant="secondary">
            Cancel
          </Button>
        </AlertDialogCancel>
        <SubmitButton $variant="danger">{self ? "Leave" : "Remove admin"}</SubmitButton>
      </AlertDialogActions>
    </form>
  );
}
