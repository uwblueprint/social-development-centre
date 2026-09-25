"use client";

import { styled } from "next-yak";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/Dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogActions,
} from "@/components/ui/AlertDialog";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/Popover";
import { Tooltip, TooltipProvider } from "@/components/ui/Tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
} from "@/components/ui/DropdownMenu";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/HoverCard";
import { AppToastProvider, useToast } from "@/components/ui/Toast";

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
`;

const Field = styled.div`
  margin-bottom: var(--space-4);
`;

const HoverCardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const HoverCardName = styled.p`
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
`;

const HoverCardMeta = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7.2V11.4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function DialogDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button $variant="primary">Edit profile</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Edit profile</DialogTitle>
        <DialogDescription>Update your display name and bio. Changes save automatically.</DialogDescription>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <Field>
            <Label htmlFor="demo-name">Name</Label>
            <Input id="demo-name" name="name" placeholder="Jane Doe" defaultValue="Jane Doe" />
          </Field>
          <Field>
            <Label htmlFor="demo-bio">Bio</Label>
            <Input id="demo-bio" name="bio" placeholder="Tell us about yourself" />
          </Field>
          <Row style={{ justifyContent: "flex-end" }}>
            <DialogClose asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </Row>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AlertDialogDemo() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button $variant="danger">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>Delete project?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete the project and all of its data. This action cannot be undone.
        </AlertDialogDescription>
        <AlertDialogActions>
          <AlertDialogCancel asChild>
            <Button $variant="secondary">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button $variant="danger">Yes, delete</Button>
          </AlertDialogAction>
        </AlertDialogActions>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button $variant="secondary">Share</Button>
      </PopoverTrigger>
      <PopoverContent>
        <Field style={{ marginBottom: "var(--space-2)" }}>
          <Label htmlFor="demo-link">Link</Label>
          <Input id="demo-link" readOnly defaultValue="https://example.com/s/abc123" />
        </Field>
        <Button $size="sm" style={{ width: "100%" }}>
          Copy link
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function TooltipDemo() {
  return (
    <Tooltip content="Settings">
      <Button $variant="ghost" $size="sm" aria-label="Settings">
        <InfoIcon />
      </Button>
    </Tooltip>
  );
}

function DropdownMenuDemo() {
  const [showActivity, setShowActivity] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button $variant="secondary">Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>
          New file
          <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem>
          Rename
          <DropdownMenuShortcut>⌘R</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          Duplicate
          <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>View</DropdownMenuLabel>
        <DropdownMenuCheckboxItem checked={showActivity} onCheckedChange={setShowActivity}>
          Show activity
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={showPanel} onCheckedChange={setShowPanel}>
          Show side panel
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HoverCardDemo() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button $variant="ghost">@janedoe</Button>
      </HoverCardTrigger>
      <HoverCardContent>
        <HoverCardBody>
          <HoverCardName>Jane Doe</HoverCardName>
          <HoverCardMeta>Product designer at Acme Co.</HoverCardMeta>
          <HoverCardMeta>Joined March 2021</HoverCardMeta>
        </HoverCardBody>
      </HoverCardContent>
    </HoverCard>
  );
}

function ToastDemo() {
  const { toast } = useToast();
  return (
    <Button
      $variant="secondary"
      onClick={() =>
        toast({
          title: "Changes saved",
          description: "Your profile has been updated successfully.",
          actionLabel: "Undo",
          onAction: () => {},
        })
      }
    >
      Show toast
    </Button>
  );
}

export function OverlayDemos() {
  return (
    <TooltipProvider>
      <AppToastProvider>
        <Row>
          <DialogDemo />
          <AlertDialogDemo />
          <PopoverDemo />
          <TooltipDemo />
          <DropdownMenuDemo />
          <HoverCardDemo />
          <ToastDemo />
        </Row>
      </AppToastProvider>
    </TooltipProvider>
  );
}
