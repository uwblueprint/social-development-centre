"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { DialogTitle } from "@/components/ui/Dialog";
import { Fill, LinkDialogContent, QrCode, Stack, VisuallyHidden, type VersionProps } from "./shared";

const Large = styled.div`
  --qr-size: calc(var(--space-8) * 4);
  display: flex;
  justify-content: center;
`;

const Three = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);

  & > button {
    padding-inline: var(--space-2);
  }
`;

/** 9. Three equal actions: title, QR, one full-width row of Copy link, Copy image, Download. The URL is only in the Copy link description. */
export function Version09({ actions, onDone }: VersionProps) {
  const descriptionId = React.useId();
  return (
    <LinkDialogContent>
      <DialogTitle>{actions.link.name}</DialogTitle>
      <Stack>
        <Large>
          <QrCode actions={actions} />
        </Large>
        <VisuallyHidden id={descriptionId}>{actions.url}</VisuallyHidden>
        <Three>
          <Button type="button" $variant="secondary" $size="sm" aria-describedby={descriptionId} onClick={actions.copyLink}>
            Copy link
          </Button>
          <Button type="button" $variant="secondary" $size="sm" onClick={actions.copyImage}>
            Copy image
          </Button>
          <Button type="button" $variant="secondary" $size="sm" onClick={actions.download}>
            Download
          </Button>
        </Three>
        {onDone && (
          <Fill>
            <Button type="button" onClick={onDone}>
              Done
            </Button>
          </Fill>
        )}
      </Stack>
    </LinkDialogContent>
  );
}
