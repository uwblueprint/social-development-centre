"use client";

import * as React from "react";
import { Check, Copy, ShieldCheck, UserPlus } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Table } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { celebrate } from "@/lib/celebrate";
import { adminsCopy as copy, RESEND_COOLDOWN_SECONDS } from "../_copy";
import type { AdminRecord } from "../_data/types";
import { demoSendInvite } from "../_lib/demoData";
import { HeaderAction } from "../../community/_components/HeaderAction";
import { adminColumns } from "./AdminRows";
import { CheckEmailDialog } from "./CheckEmailDialog";
import { InviteAdminDialog } from "./InviteAdminDialog";
import { RemoveAdminDialog } from "./RemoveAdminDialog";

/** Re-renders every second while any resend cooldown is running, so a blocked Resend invite unblocks itself. */
function useNow(active: boolean) {
  const [now, setNow] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

/**
 * Admins: the people who can manage members and other admins. Frontend only for now: the list lives in this
 * component's state and sends are simulated (`demoSendInvite`); docs/backend/admins.md lists what replaces them.
 */
export function AdminsView({ initialAdmins, currentEmail }: { initialAdmins: AdminRecord[]; currentEmail: string }) {
  const { toast } = useToast();
  const [admins, setAdmins] = React.useState(initialAdmins);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [checking, setChecking] = React.useState<AdminRecord | null>(null);
  const [removing, setRemoving] = React.useState<AdminRecord | null>(null);
  /** Admin id → when Resend invite works again (ms since epoch). */
  const [cooldowns, setCooldowns] = React.useState<Record<string, number>>({});
  const [copied, setCopied] = React.useState(false);
  const inviteButtonRef = React.useRef<HTMLButtonElement>(null);
  const now = useNow(Object.keys(cooldowns).length > 0);

  const startCooldown = (id: string) => setCooldowns((c) => ({ ...c, [id]: Date.now() + RESEND_COOLDOWN_SECONDS * 1000 }));
  const resendBlocked = (admin: AdminRecord) => (cooldowns[admin.id] ?? 0) > now;
  const patch = (id: string, changes: Partial<AdminRecord>) =>
    setAdmins((list) => list.map((a) => (a.id === id ? { ...a, ...changes } : a)));

  function invite(name: string, email: string) {
    const id = `adm_${Date.now()}`;
    const sent = demoSendInvite(email) === "sent";
    setAdmins((list) => [...list, { id, name, email, status: sent ? "invited" : "not_sent" }]);
    if (sent) {
      startCooldown(id);
      celebrate();
      toast({ title: copy.invite.sent(name) });
    } else {
      toast({ title: copy.invite.failed(email) });
    }
  }

  function resend(admin: AdminRecord) {
    if (resendBlocked(admin)) return;
    startCooldown(admin.id);
    toast({ title: copy.resend.sent(admin.name) });
  }

  /** From the Check the email address dialog. Returns whether the invite went out. */
  function resendChecked(admin: AdminRecord, email: string) {
    if (demoSendInvite(email) === "failed") {
      patch(admin.id, { email });
      return false;
    }
    patch(admin.id, { email, status: "invited" });
    startCooldown(admin.id);
    celebrate();
    toast({ title: copy.invite.sent(admin.name) });
    return true;
  }

  /** Every address, comma-separated, ready to paste into an email's To field. The icon shows a check for a moment. */
  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(admins.map((a) => a.email).join(", "));
    } catch {
      toast({ title: copy.copyEmails.failed });
      return;
    }
    toast({ title: copy.copyEmails.copied(admins.length) });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function remove(admin: AdminRecord) {
    setAdmins((list) => list.filter((a) => a.id !== admin.id));
    setRemoving(null);
    toast({ title: copy.remove.removed(admin.name) });
  }

  const columns = adminColumns({
    currentEmail,
    onlyOneAdmin: admins.length <= 1,
    resendBlocked,
    onResend: resend,
    onCheckEmail: setChecking,
    onRemove: setRemoving,
  });
  const existingEmails = admins.map((a) => a.email);

  return (
    <ListPage>
      <ListPageHeader
        title={copy.page.title}
        actions={
          <>
            <HeaderAction
              type="button"
              $variant="secondary"
              icon={copied ? Check : Copy}
              label={copy.copyEmails.label}
              disabled={admins.length === 0}
              onClick={() => void copyEmails()}
            />
            <HeaderAction ref={inviteButtonRef} type="button" icon={UserPlus} label={copy.page.invite} onClick={() => setInviteOpen(true)} />
          </>
        }
      />
      <Table
        aria-label={copy.table.ariaLabel}
        columns={columns}
        rows={admins}
        stickyColumns={1}
        rowHover={false}
        getRowId={(a) => a.id}
        empty={
          <EmptyState
            icon={ShieldCheck}
            title={copy.empty.title}
            description={copy.empty.description}
            action={
              <Button type="button" onClick={() => setInviteOpen(true)}>
                <Icon icon={UserPlus} size={16} />
                {copy.page.invite}
              </Button>
            }
          />
        }
      />
      <InviteAdminDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        existingEmails={existingEmails}
        onInvite={invite}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          inviteButtonRef.current?.focus();
        }}
      />
      <CheckEmailDialog
        admin={checking}
        onOpenChange={(open) => !open && setChecking(null)}
        existingEmails={existingEmails}
        onResend={resendChecked}
      />
      <RemoveAdminDialog
        admin={removing}
        isYou={removing?.email === currentEmail}
        onOpenChange={(open) => !open && setRemoving(null)}
        onRemove={remove}
      />
    </ListPage>
  );
}
