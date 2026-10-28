"use client";

import { Button } from "@/components/ui/Button";
import { DialogTitle } from "@/components/ui/Dialog";
import { Footer, LinkDialogContent, LinkField, QrCode, Stack, type VersionProps } from "./shared";

/** 1. Current: link input with Copy, QR below on the left, one footer row of actions. */
export function Version01({ actions, onDone }: VersionProps) {
  return (
    <LinkDialogContent>
      <DialogTitle>{actions.link.name}</DialogTitle>
      <Stack>
        <LinkField actions={actions} />
        <QrCode actions={actions} />
      </Stack>
      <Footer>
        <Button type="button" $variant="secondary" onClick={actions.copyImage}>
          Copy image
        </Button>
        <Button type="button" $variant="secondary" onClick={actions.download}>
          Download
        </Button>
        {onDone && (
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        )}
      </Footer>
    </LinkDialogContent>
  );
}
