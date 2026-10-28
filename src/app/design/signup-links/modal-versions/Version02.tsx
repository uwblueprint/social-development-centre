"use client";

import { styled } from "next-yak";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DialogTitle } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { Fill, LinkDialogContent, QrCode, Stack, VisuallyHidden, type VersionProps } from "./shared";

/* The panel is exactly the code's width plus the dialog's own padding. */
const Skinny = styled(LinkDialogContent)`
  && {
    box-sizing: content-box;
    width: calc(var(--space-8) * 3);
    max-width: calc(100vw - 2 * var(--space-5) - 2 * var(--space-4));
  }
`;

/* Plain text, not a box: icon and link on one line, the link truncating. */
const LinkButton = styled(Button)`
  width: 100%;
  height: auto;
  justify-content: flex-start;
  gap: var(--space-2);
  padding: var(--space-2) 0;
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-muted);

  & > span:last-child {
    min-width: 0;
    flex: 1;
    text-align: left;
  }
`;

/** 2. Skinny: QR on top, the link as plain truncated text that copies on click, full-width stacked buttons. */
export function Version02({ actions, onDone }: VersionProps) {
  return (
    <Skinny>
      <DialogTitle>{actions.link.name}</DialogTitle>
      <Stack>
        <QrCode actions={actions} />
        <LinkButton type="button" $variant="ghost" onClick={actions.copyLink}>
          <Icon icon={actions.linkCopied ? Check : Copy} />
          {actions.linkCopied ? (
            <span>Copied</span>
          ) : (
            <span>
              <VisuallyHidden>Copy link: </VisuallyHidden>
              <TruncatedText>{actions.url}</TruncatedText>
            </span>
          )}
        </LinkButton>
        <Fill>
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
      </Stack>
    </Skinny>
  );
}
