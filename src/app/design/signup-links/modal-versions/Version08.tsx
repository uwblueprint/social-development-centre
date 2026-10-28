"use client";

import { styled } from "next-yak";
import { Download, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DialogTitle } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { Footer, LinkDialogContent, LinkField, QrCode, Stack, type VersionProps } from "./shared";

/* The code and its toolbar share one border, so the toolbar reads as the frame's bottom edge. */
const Frame = styled.div`
  --qr-size: calc(var(--space-8) * 3);
  width: var(--qr-size);
  max-width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
`;

const Toolbar = styled.div`
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  border-top: 1px solid var(--color-border-strong);
  background: var(--color-surface);
`;

/** 8. QR with toolbar: the link row above; the code in a frame with Copy image and Download attached to its bottom edge. */
export function Version08({ actions, onDone }: VersionProps) {
  return (
    <LinkDialogContent>
      <DialogTitle>{actions.link.name}</DialogTitle>
      <Stack>
        <LinkField actions={actions} />
        <Frame>
          <QrCode actions={actions} bare />
          <Toolbar role="toolbar" aria-label="QR code actions">
            <Tooltip content="Copy image" pinOnClick={false}>
              <Button type="button" $variant="ghost" $size="sm" aria-label="Copy image" onClick={actions.copyImage}>
                <Icon icon={ImageUp} />
              </Button>
            </Tooltip>
            <Tooltip content="Download" pinOnClick={false}>
              <Button type="button" $variant="ghost" $size="sm" aria-label="Download" onClick={actions.download}>
                <Icon icon={Download} />
              </Button>
            </Tooltip>
          </Toolbar>
        </Frame>
      </Stack>
      {onDone && (
        <Footer>
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        </Footer>
      )}
    </LinkDialogContent>
  );
}
