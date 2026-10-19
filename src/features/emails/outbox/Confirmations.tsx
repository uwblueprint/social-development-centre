"use client";

import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogActions,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import { Button } from "@/components/ui/Button";
import { useEmails } from "../store";
import type { Send } from "../model";
import { approveWhen, fullName, plural } from "./helpers";

interface Base {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sends: Send[];
  name: string;
  onConfirm: () => Promise<boolean> | void;
}

function Confirm({
  open,
  onOpenChange,
  title,
  body,
  action,
  cancel = "Cancel",
  danger,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  body: ReactNode;
  action: string;
  cancel?: string;
  danger?: boolean;
  onConfirm: () => Promise<boolean> | void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{body}</AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button type="button" $variant="secondary">
              {cancel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              $variant={danger ? "danger" : "primary"}
              onClick={() => void onConfirm()}
            >
              {action}
            </Button>
          </AlertDialogAction>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function DontSendDialog({
  open,
  onOpenChange,
  sends,
  name,
  onConfirm,
}: Base) {
  const api = useEmails();
  const one = sends.length === 1;
  const who = one
    ? fullName(api.member(sends[0].memberId))
    : plural(sends.length, "member");
  return (
    <Confirm
      open={open}
      onOpenChange={onOpenChange}
      title={
        one
          ? `Don’t send this email to ${who}?`
          : `Don’t send ${plural(sends.length, "email")}?`
      }
      body={`${one ? who : `These ${who}`} won’t get “${name}”. ${one ? "It is" : "The emails are"} removed from the outbox, and you can undo for a few seconds.`}
      cancel="Keep in outbox"
      action={
        one ? "Don’t send" : `Don’t send ${plural(sends.length, "email")}`
      }
      danger
      onConfirm={onConfirm}
    />
  );
}

/** Approve all: the count, split by when each lot sends (a batch can mix due dates). */
export function ApproveAllDialog({
  open,
  onOpenChange,
  sends,
  name,
  onConfirm,
}: Base) {
  const api = useEmails();
  const lots = new Map<string, number>();
  for (const s of sends) {
    const w = approveWhen(s, api.now);
    lots.set(w.label, (lots.get(w.label) ?? 0) + 1);
  }
  const parts = [...lots.entries()].map(([label, n]) => `${n} ${label}`);
  return (
    <Confirm
      open={open}
      onOpenChange={onOpenChange}
      title={`Approve ${plural(sends.length, "email")}?`}
      body={`“${name}” will go to ${plural(sends.length, "member")}: ${parts.join(", ")}. You can undo for a few seconds.`}
      action={`Approve ${plural(sends.length, "email")}`}
      onConfirm={onConfirm}
    />
  );
}

export function SendNowDialog({
  open,
  onOpenChange,
  sends,
  name,
  onConfirm,
}: Base) {
  const api = useEmails();
  const who =
    sends.length === 1
      ? fullName(api.member(sends[0].memberId))
      : plural(sends.length, "member");
  return (
    <Confirm
      open={open}
      onOpenChange={onOpenChange}
      title={`Send “${name}” now?`}
      body={`It goes to ${who} right away, instead of at the scheduled time.`}
      action="Send now"
      onConfirm={onConfirm}
    />
  );
}
