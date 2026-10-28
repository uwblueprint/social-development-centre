"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Link2, Plus, QrCode, Copy } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Table, type TableColumn } from "@/components/ui/Table";
import { AppToastProvider, useToast } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { CreateLinkDialog } from "./CreateLinkDialog";
import { QrPanel } from "./QrPanel";
import { conversion, signupLinkUrl, type SignupLink } from "./data";

const Number = styled.span`
  font-variant-numeric: tabular-nums;
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-1);
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

const QrBody = styled.div`
  margin-top: var(--space-4);
`;

export function SignupLinksPage({ initialLinks }: { initialLinks: SignupLink[] }) {
  return (
    <AppToastProvider>
      <Links initialLinks={initialLinks} />
    </AppToastProvider>
  );
}

function Links({ initialLinks }: { initialLinks: SignupLink[] }) {
  const { toast } = useToast();
  const [links, setLinks] = React.useState(initialLinks);
  const [createOpen, setCreateOpen] = React.useState(false);
  // A new key each time the dialog opens, so it starts empty.
  const [createKey, setCreateKey] = React.useState(0);
  const [qrLink, setQrLink] = React.useState<SignupLink | null>(null);

  function openCreate() {
    setCreateKey((key) => key + 1);
    setCreateOpen(true);
  }

  async function copyLink(link: SignupLink) {
    try {
      await navigator.clipboard.writeText(signupLinkUrl(link.slug));
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Couldn’t copy the link", description: "Your browser blocked it. Try again." });
    }
  }

  const columns: TableColumn<SignupLink>[] = [
    { key: "name", header: "Name", width: "320px", render: (l) => <TruncatedText tooltip>{l.name}</TruncatedText> },
    { key: "clicks", header: "Clicks", align: "right", width: "112px", render: (l) => <Number>{l.clicks.toLocaleString("en-CA")}</Number> },
    { key: "joins", header: "Joins", align: "right", width: "112px", render: (l) => <Number>{l.joins.toLocaleString("en-CA")}</Number> },
    { key: "conversion", header: "Conversion", align: "right", width: "128px", render: (l) => <Number>{conversion(l)}</Number> },
    {
      key: "actions",
      header: <VisuallyHidden>Actions</VisuallyHidden>,
      align: "right",
      width: "104px",
      render: (l) => (
        <Actions>
          <Tooltip content="Copy link" pinOnClick={false}>
            <Button type="button" $variant="ghost" $size="sm" aria-label="Copy link" onClick={() => copyLink(l)}>
              <Icon icon={Copy} />
            </Button>
          </Tooltip>
          <Tooltip content="QR code" pinOnClick={false}>
            <Button type="button" $variant="ghost" $size="sm" aria-label="QR code" onClick={() => setQrLink(l)}>
              <Icon icon={QrCode} />
            </Button>
          </Tooltip>
        </Actions>
      ),
    },
  ];

  return (
    <ListPage>
      <ListPageHeader
        title="Signup links"
        actions={
          <Button type="button" onClick={openCreate}>
            <Icon icon={Plus} />
            Create link
          </Button>
        }
      />
      <Table
        columns={columns}
        rows={links}
        getRowId={(l) => l.id}
        aria-label="Signup links"
        empty={
          <EmptyState
            icon={Link2}
            title="No signup links yet"
            action={
              <Button type="button" $variant="secondary" onClick={openCreate}>
                Create link
              </Button>
            }
          />
        }
      />
      <CreateLinkDialog
        key={createKey}
        open={createOpen}
        onOpenChange={setCreateOpen}
        existing={links}
        onCreate={(link) => setLinks((current) => [link, ...current])}
      />
      <Dialog open={qrLink !== null} onOpenChange={(open) => !open && setQrLink(null)}>
        <DialogContent aria-describedby={undefined}>
          {qrLink && (
            <>
              <DialogTitle>{qrLink.name}</DialogTitle>
              <QrBody>
                <QrPanel link={qrLink} />
              </QrBody>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ListPage>
  );
}
