"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { DialogTitle } from "@/components/ui/Dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/ToggleGroup";
import { Fill, Footer, LinkDialogContent, LinkFieldOnly, QrCode, Stack, type VersionProps } from "./shared";

/* Both panes are the same height, so switching never moves the dialog. */
const Pane = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-4);
  min-height: calc(var(--space-8) * 4);
`;

const Center = styled.div`
  display: flex;
  justify-content: center;
`;

/** 7. Segmented: a Link / QR code toggle at the top; each pane has its own single action. */
export function Version07({ actions, onDone }: VersionProps) {
  const [pane, setPane] = React.useState("link");
  return (
    <LinkDialogContent>
      <DialogTitle>{actions.link.name}</DialogTitle>
      <Stack>
        <ToggleGroup type="single" value={pane} onValueChange={(value) => value && setPane(value)} aria-label="Show">
          <ToggleGroupItem value="link">Link</ToggleGroupItem>
          <ToggleGroupItem value="qr">QR code</ToggleGroupItem>
        </ToggleGroup>
        {pane === "link" ? (
          <Pane>
            <LinkFieldOnly actions={actions} />
            <Fill>
              <Button type="button" $variant="secondary" onClick={actions.copyLink}>
                Copy link
              </Button>
            </Fill>
          </Pane>
        ) : (
          <Pane>
            <Center>
              <QrCode actions={actions} />
            </Center>
            <Fill>
              <Button type="button" $variant="secondary" onClick={actions.download}>
                Download
              </Button>
            </Fill>
          </Pane>
        )}
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
