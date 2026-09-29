"use client";

import { styled } from "next-yak";
import { useState } from "react";
import { Copy, ExternalLink, Info, MoreHorizontal, Trash2 } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
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
  DialogActions,
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
import { Popover, PopoverTrigger, PopoverContent, PopoverActions } from "@/components/ui/Popover";
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
import { HoverCard, HoverCardTrigger, HoverCardContent, HoverCardTriggerLink } from "@/components/ui/HoverCard";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from "@/components/ui/Sheet";
import { Badge } from "@/components/ui/Badge";

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
  font-weight: var(--weight-medium);
  line-height: var(--leading-ui);
  color: var(--color-text);
`;

const HoverCardMeta = styled.p`
  margin: 0;
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);
`;

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
          <DialogActions>
            <DialogClose asChild>
              <Button type="button" $variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IllustrationDialogDemo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button $variant="secondary">Illustration dialog</Button>
      </DialogTrigger>
      <DialogContent $variant="illustration" aria-describedby={undefined}>
        <DialogTitle $flush>Goose stole your wifi.</DialogTitle>
        <DialogDescription>Please reconnect to the internet and try again.</DialogDescription>
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
        <Field style={{ marginBottom: 0 }}>
          <Label htmlFor="demo-link">Link</Label>
          <Input id="demo-link" readOnly defaultValue="https://example.com/s/abc123" />
        </Field>
        <PopoverActions>
          <Button $size="sm" style={{ width: "100%" }}>
            Copy link
          </Button>
        </PopoverActions>
      </PopoverContent>
    </Popover>
  );
}

function TooltipDemo() {
  return (
    <Tooltip content="Cohorts run every quarter and are free to join.">
      <Button $variant="ghost" $size="sm" aria-label="More info">
        <Icon icon={Info} size={16} />
      </Button>
    </Tooltip>
  );
}

function DelayedTooltipDemo() {
  return (
    <Tooltip content="Everyone on SDC's email list, and who has paid access." side="right" delayDuration={600} pinOnClick={false}>
      <Button $variant="ghost">Community</Button>
    </Tooltip>
  );
}

/** When one item has an icon, every item in that menu has one. */
function IconMenuDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button $variant="ghost" aria-label="More actions">
          <Icon icon={MoreHorizontal} size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <Icon icon={ExternalLink} size={16} />
          Open link
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Icon icon={Copy} size={16} />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Icon icon={Trash2} size={16} />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        <HoverCardTriggerLink type="button">@janedoe</HoverCardTriggerLink>
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

function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button $variant="secondary">View partner</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Northside Food Bank</SheetTitle>
          <SheetDescription>Partner since January 2026</SheetDescription>
          <Row style={{ marginTop: "var(--space-1)" }}>
            <Badge $variant="success">Active</Badge>
          </Row>
        </SheetHeader>
        <SheetBody>
          <Field style={{ marginBottom: "var(--space-4)" }}>
            <Label>Contacts</Label>
          </Field>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Amara Okafor · amara@northsidefood.org
          </p>
        </SheetBody>
        <SheetFooter>
          <Button $variant="danger">Remove access</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** `size="wide"` and a header with `actions`: the title, the ⋯ menu and the close button share one row. */
function WideSheetDemo() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button $variant="secondary">View member</Button>
      </SheetTrigger>
      <SheetContent size="wide">
        <SheetHeader
          actions={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button $variant="ghost" $size="sm" aria-label="Actions for Amara Okafor" style={{ aspectRatio: 1, padding: 0 }}>
                  <Icon icon={MoreHorizontal} size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Icon icon={Copy} size={16} />
                  Copy email
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        >
          <SheetTitle>Amara Okafor</SheetTitle>
          <SheetDescription>amara@example.org</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
            Wide sheets fit content with its own width, such as a 600px email.
          </p>
        </SheetBody>
      </SheetContent>
    </Sheet>
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
          <IllustrationDialogDemo />
          <AlertDialogDemo />
          <PopoverDemo />
          <TooltipDemo />
          <DelayedTooltipDemo />
          <DropdownMenuDemo />
          <IconMenuDemo />
          <HoverCardDemo />
          <ToastDemo />
          <SheetDemo />
          <WideSheetDemo />
        </Row>
      </AppToastProvider>
    </TooltipProvider>
  );
}
