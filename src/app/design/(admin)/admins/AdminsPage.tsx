"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Plus } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import {
  AlertDialog,
  AlertDialogAction,
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
import { Table, type TableColumn } from "@/components/ui/Table";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { isEmail, ME, SEED_ADMINS, type Admin } from "./data";

const Right = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const DesktopOnly = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

const MobileOnly = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  @media (min-width: 768px) {
    display: none;
  }
`;

const MobileRow = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
`;

const MobileText = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const Muted = styled.span`
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
`;

const FormStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;

/* Text on both, so the state never rides on color alone. */
function Status({ admin }: { admin: Admin }) {
  return admin.signedIn ? <Badge $variant="success">Active</Badge> : <Badge $variant="warning">Invited</Badge>;
}

function AdminsScreen() {
  const { toast } = useToast();
  const [admins, setAdmins] = React.useState(SEED_ADMINS);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [removing, setRemoving] = React.useState<Admin | null>(null);

  // The last admin can't leave, so SDC is never locked out.
  const canLeave = admins.length > 1;
  const self = removing?.id === ME;

  const confirmRemove = () => {
    if (!removing) return;
    setAdmins((list) => list.filter((a) => a.id !== removing.id));
    toast({ title: self ? "You left the admin portal" : `${removing.name} is no longer an admin` });
    setRemoving(null);
  };

  const removeButton = (a: Admin) => {
    const mine = a.id === ME;
    if (mine && !canLeave) return null;
    return (
      <Button
        type="button"
        $variant="outline"
        $size="sm"
        aria-label={mine ? "Leave the admin portal" : `Remove ${a.name}`}
        onClick={() => setRemoving(a)}
      >
        {mine ? "Leave" : "Remove"}
      </Button>
    );
  };

  const columns: TableColumn<Admin>[] = [
    {
      key: "name",
      header: "Name",
      width: "280px",
      render: (a) => <TruncatedText tooltip>{a.id === ME ? `${a.name} (you)` : a.name}</TruncatedText>,
    },
    { key: "email", header: "Email", render: (a) => <TruncatedText tooltip>{a.email}</TruncatedText> },
    { key: "status", header: "Status", width: "120px", render: (a) => <Status admin={a} /> },
    {
      key: "actions",
      header: <VisuallyHidden>Actions</VisuallyHidden>,
      width: "112px",
      render: (a) => <Right>{removeButton(a)}</Right>,
    },
  ];

  return (
    <ListPage>
      <ListPageHeader
        title="Admins"
        actions={
          <Button type="button" onClick={() => setInviteOpen(true)}>
            <Icon icon={Plus} />
            Invite admin
          </Button>
        }
      />
      <DesktopOnly>
        <Table columns={columns} rows={admins} getRowId={(a) => a.id} aria-label="Admins" />
      </DesktopOnly>
      <MobileOnly>
        {admins.map((a) => (
          <MobileRow key={a.id}>
            <MobileText>
              <span>{a.id === ME ? `${a.name} (you)` : a.name}</span>
              <Muted>{a.email}</Muted>
              <span>
                <Status admin={a} />
              </span>
            </MobileText>
            {removeButton(a)}
          </MobileRow>
        ))}
      </MobileOnly>

      {inviteOpen && (
        <InviteDialog
          existing={admins.map((a) => a.email.toLowerCase())}
          onClose={() => setInviteOpen(false)}
          onInvite={(name, email) => {
            setAdmins((list) => [...list, { id: `a${list.length + 1}-${email}`, name, email, signedIn: false }]);
            toast({ title: `Invite sent to ${email}` });
            setInviteOpen(false);
          }}
        />
      )}

      <AlertDialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {self ? "Leave the admin portal?" : `Remove ${removing?.name} as an admin?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {self ? "You lose access right away." : "They lose access right away."}
          </AlertDialogDescription>
          <AlertDialogActions>
            <AlertDialogCancel asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="button" $variant="danger" onClick={confirmRemove}>
                {self ? "Leave" : "Remove admin"}
              </Button>
            </AlertDialogAction>
          </AlertDialogActions>
        </AlertDialogContent>
      </AlertDialog>
    </ListPage>
  );
}

function InviteDialog({
  existing,
  onClose,
  onInvite,
}: {
  existing: string[];
  onClose: () => void;
  onInvite: (name: string, email: string) => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string }>({});

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "Enter their name.";
    if (!isEmail(email)) next.email = "Enter an email address like name@example.org.";
    else if (existing.includes(email.trim().toLowerCase())) next.email = "This person is already an admin.";
    setErrors(next);
    if (next.name || next.email) return;
    onInvite(name.trim(), email.trim());
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Invite admin</DialogTitle>
        <form onSubmit={submit} noValidate>
          <FormStack>
            <Field label="Full name" error={errors.name}>
              {(props) => (
                <Input {...props} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
              )}
            </Field>
            <Field label="Email address" error={errors.email}>
              {(props) => (
                <Input
                  {...props}
                  type="email"
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              )}
            </Field>
          </FormStack>
          <DialogActions>
            <DialogClose asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Send invite</Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdminsPage() {
  return (
    <AppToastProvider>
      <AdminsScreen />
    </AppToastProvider>
  );
}
