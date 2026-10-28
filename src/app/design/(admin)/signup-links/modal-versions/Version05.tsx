"use client";

import { styled } from "next-yak";
import { Check, Copy, Download, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DialogTitle } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { Footer, LinkDialogContent, QrCode, Stack, VisuallyHidden, type VersionProps } from "./shared";

/* The whole row is the button: link on the left, the copy icon at the end. */
export const ClickRow = styled.button`
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  color: var(--color-text);
  font-size: var(--text-sm);
  cursor: pointer;

  &:hover {
    background: var(--color-bg-hover);
  }

  &:focus-visible {
    box-shadow: var(--focus-ring);
  }

  & > span:first-child {
    flex: 1;
    min-width: 0;
  }
`;

const Large = styled.div`
  --qr-size: calc(var(--space-8) * 4);
  display: flex;
  justify-content: center;
`;

/** 5. Click-to-copy link: a full-width link row with a copy icon, a large QR, icon-only footer buttons. */
export function Version05({ actions, onDone }: VersionProps) {
  return (
    <LinkDialogContent>
      <DialogTitle>{actions.link.name}</DialogTitle>
      <Stack>
        <ClickRow type="button" onClick={actions.copyLink}>
          <span>
            <VisuallyHidden>Copy link: </VisuallyHidden>
            <TruncatedText>{actions.url}</TruncatedText>
          </span>
          <Icon icon={actions.linkCopied ? Check : Copy} />
          {actions.linkCopied && <VisuallyHidden role="status">Copied</VisuallyHidden>}
        </ClickRow>
        <Large>
          <QrCode actions={actions} />
        </Large>
      </Stack>
      <Footer>
        <Tooltip content="Copy image" pinOnClick={false}>
          <Button type="button" $variant="secondary" aria-label="Copy image" onClick={actions.copyImage}>
            <Icon icon={ImageUp} />
          </Button>
        </Tooltip>
        <Tooltip content="Download" pinOnClick={false}>
          <Button type="button" $variant="secondary" aria-label="Download" onClick={actions.download}>
            <Icon icon={Download} />
          </Button>
        </Tooltip>
        {onDone && (
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        )}
      </Footer>
    </LinkDialogContent>
  );
}
