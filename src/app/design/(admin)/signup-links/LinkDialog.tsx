"use client";

import { styled } from "next-yak";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DialogActions, DialogContent, DialogTitle } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import type { SignupLink } from "./data";
import { useLinkActions } from "./useLinkActions";

/* A narrow column; the code fills its width. */
const Panel = styled(DialogContent)`
  && {
    max-width: var(--dialog-width-narrow);
  }
`;

/* The full link under the title, on one line. It opens the join page, so people can check where it goes. */
const Url = styled.a`
  display: block;
  margin-top: var(--space-1);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 2px;
  border-radius: var(--radius-sm);

  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
`;

/* The code sits on its own light ground, so it scans in dark mode too; the border shows the box's white edge. */
const Qr = styled.div`
  aspect-ratio: 1;
  margin-top: var(--space-4);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--qr-ground);
`;

const QrImage = styled.img`
  display: block;
  width: 100%;
  height: 100%;
`;

/**
 * A signup link's dialog: its name, the full link, the QR code, then Download QR code and Copy link.
 * Render it inside a `Dialog`. Focus lands on the panel, not a button, so a mouse user never sees a
 * focus ring on open; keyboard users still start inside the dialog.
 */
export function LinkDialogContent({ link }: { link: SignupLink }) {
  const actions = useLinkActions(link);
  return (
    <Panel
      aria-describedby={undefined}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        (event.target as HTMLElement).focus();
      }}
    >
      <DialogTitle>{link.name}</DialogTitle>
      <Url href={actions.url} target="_blank" rel="noreferrer">
        {actions.url}
      </Url>
      <Qr>{actions.image && <QrImage src={actions.image} alt={`QR code for ${link.name}`} />}</Qr>
      <DialogActions>
        <Button type="button" $variant="secondary" onClick={actions.download}>
          <Icon icon={Download} />
          Download QR code
        </Button>
        <Button type="button" onClick={actions.copyLink}>
          <Icon icon={Copy} />
          Copy link
        </Button>
      </DialogActions>
    </Panel>
  );
}
