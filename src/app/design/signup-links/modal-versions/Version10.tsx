"use client";

import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { SheetBody, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/Sheet";
import { LinkField, QrCode, type VersionProps } from "./shared";

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
`;

const Pair = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
`;

/** 10. Side sheet: a panel from the right with one vertical stack: title, QR, link with Copy, then Copy image and Download. */
export function Version10({ actions, onDone }: VersionProps) {
  return (
    <SheetContent aria-describedby={undefined}>
      <SheetHeader>
        <SheetTitle>{actions.link.name}</SheetTitle>
      </SheetHeader>
      <SheetBody>
        <Column>
          <QrCode actions={actions} />
          <LinkField actions={actions} />
          <Pair>
            <Button type="button" $variant="secondary" onClick={actions.copyImage}>
              Copy image
            </Button>
            <Button type="button" $variant="secondary" onClick={actions.download}>
              Download
            </Button>
          </Pair>
        </Column>
      </SheetBody>
      {onDone && (
        <SheetFooter>
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        </SheetFooter>
      )}
    </SheetContent>
  );
}
