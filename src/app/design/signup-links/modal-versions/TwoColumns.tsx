"use client";

import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { DialogTitle } from "@/components/ui/Dialog";
import { Fill, LinkDialogContent, LinkField, QrCode, type VersionProps } from "./shared";

export const Wide = styled(LinkDialogContent)`
  && {
    max-width: calc(var(--space-8) * 10);
  }
`;

/* Actions and code side by side; below 600px they stack, actions first. */
const Columns = styled.div<{ $codeFirst?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $codeFirst }) => ($codeFirst ? "auto minmax(0, 1fr)" : "minmax(0, 1fr) auto")};
  align-items: start;
  gap: var(--space-5);
  margin-top: var(--space-4);

  @media (max-width: 599px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const Code = styled.div<{ $codeFirst?: boolean }>`
  @media (max-width: 599px) {
    order: ${({ $codeFirst }) => ($codeFirst ? "0" : "1")};
  }
`;

/** Shared by versions 3 and 4, which are mirrors of each other. */
export function TwoColumns({ actions, onDone, codeFirst }: VersionProps & { codeFirst?: boolean }) {
  const buttons = (
    <Fill>
      <LinkField actions={actions} />
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
    </Fill>
  );
  const code = (
    <Code $codeFirst={codeFirst}>
      <QrCode actions={actions} />
    </Code>
  );
  return (
    <Wide>
      <DialogTitle>{actions.link.name}</DialogTitle>
      <Columns $codeFirst={codeFirst}>
        {codeFirst ? code : buttons}
        {codeFirst ? buttons : code}
      </Columns>
    </Wide>
  );
}

/** 3. Two columns, link left: link input with Copy, Copy image and Download stacked; QR on the right. */
export function Version03(props: VersionProps) {
  return <TwoColumns {...props} />;
}

/** 4. Two columns, QR left: the mirror of 3. */
export function Version04(props: VersionProps) {
  return <TwoColumns {...props} codeFirst />;
}
