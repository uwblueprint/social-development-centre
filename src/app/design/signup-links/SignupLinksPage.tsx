"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Copy, Link2, Plus, QrCode } from "lucide-react";
import { ListPage, ListPageHeader } from "@/components/patterns/ListPage";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { List, ListRow } from "@/components/ui/ListRow";
import { Table, type TableColumn } from "@/components/ui/Table";
import { AppToastProvider } from "@/components/ui/Toast";
import { Tooltip } from "@/components/ui/Tooltip";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { CreateLinkDialog } from "./CreateLinkDialog";
import { LinkDetails, useCopyLink } from "./LinkDetails";
import { conversion, type SignupLink } from "./data";

const Number = styled.span`
  font-variant-numeric: tabular-nums;
`;

/* The last column's content sits on the table's right edge, under the header button. */
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

/* Phones (the repo's 767px breakpoint) get a list instead of the table; desktop keeps the table. */
const DesktopOnly = styled.div`
  @media (max-width: 767px) {
    display: none;
  }
`;

/* ListRow pads its text by --space-2; cancel it so the names line up with the heading, as the table does. */
const MobileOnly = styled.div`
  margin-inline: calc(var(--space-2) * -1);

  @media (min-width: 768px) {
    display: none;
  }
`;

const CardText = styled.span`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
`;

const CardStats = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

export function SignupLinksPage({ initialLinks }: { initialLinks: SignupLink[] }) {
  return (
    <AppToastProvider>
      <Links initialLinks={initialLinks} />
    </AppToastProvider>
  );
}

function Links({ initialLinks }: { initialLinks: SignupLink[] }) {
  const copyLink = useCopyLink();
  const [links, setLinks] = React.useState(initialLinks);
  const [createOpen, setCreateOpen] = React.useState(false);
  // A new key each time the dialog opens, so it starts empty.
  const [createKey, setCreateKey] = React.useState(0);
  const [qrLink, setQrLink] = React.useState<SignupLink | null>(null);

  function openCreate() {
    setCreateKey((key) => key + 1);
    setCreateOpen(true);
  }

  const columns: TableColumn<SignupLink>[] = [
    { key: "name", header: "Name", width: "400px", render: (l) => <TruncatedText tooltip>{l.name}</TruncatedText> },
    { key: "clicks", header: "Clicks", width: "120px", render: (l) => <Number>{l.clicks.toLocaleString("en-CA")}</Number> },
    { key: "joins", header: "Joins", width: "120px", render: (l) => <Number>{l.joins.toLocaleString("en-CA")}</Number> },
    { key: "conversion", header: "Conversion", width: "144px", render: (l) => <Number>{conversion(l)}</Number> },
    {
      key: "actions",
      header: <VisuallyHidden>Actions</VisuallyHidden>,
      width: "112px",
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

  const empty = (
    <EmptyState
      icon={Link2}
      title="No signup links yet"
      description="Create a link or QR code for each event to see how many people it brings in and how many join."
      action={
        <Button type="button" $variant="secondary" onClick={openCreate}>
          Create link
        </Button>
      }
    />
  );

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
      <DesktopOnly>
        <Table
          columns={columns}
          rows={links}
          getRowId={(l) => l.id}
          aria-label="Signup links"
          empty={empty}
          emptyBelowHeader
        />
      </DesktopOnly>
      <MobileOnly>
        {links.length === 0 ? (
          empty
        ) : (
          <List>
            {links.map((l) => (
              <ListRow key={l.id} onClick={() => setQrLink(l)}>
                <CardText>
                  <TruncatedText>{l.name}</TruncatedText>
                  <CardStats>
                    {l.clicks.toLocaleString("en-CA")} clicks · {l.joins.toLocaleString("en-CA")} joins · {conversion(l)}
                  </CardStats>
                </CardText>
              </ListRow>
            ))}
          </List>
        )}
      </MobileOnly>
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
              <LinkDetails link={qrLink} />
            </>
          )}
        </DialogContent>
      </Dialog>
    </ListPage>
  );
}
