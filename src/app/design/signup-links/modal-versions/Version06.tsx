"use client";

import { styled } from "next-yak";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DialogTitle } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { TruncatedText } from "@/components/ui/TruncatedText";
import { Footer, LinkDialogContent, QrCode, Stack, type VersionProps } from "./shared";

/* The code fills the dialog's content width. */
const Hero = styled.div`
  --qr-size: 100%;
`;

/* One bordered row like an input with an end button; the button sits inside the border. */
const Joined = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: 40px;
  padding: 0 var(--space-1) 0 var(--space-3);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  font-size: var(--text-sm);

  & > span {
    flex: 1;
    min-width: 0;
  }
`;

/** 6. QR hero: a full-width QR, then the link and a copy icon button in one bordered row. */
export function Version06({ actions, onDone }: VersionProps) {
  return (
    <LinkDialogContent>
      <DialogTitle>{actions.link.name}</DialogTitle>
      <Stack>
        <Hero>
          <QrCode actions={actions} />
        </Hero>
        <Joined>
          <TruncatedText>{actions.url}</TruncatedText>
          <Button type="button" $variant="ghost" $size="sm" aria-label={actions.linkCopied ? "Link copied" : "Copy link"} onClick={actions.copyLink}>
            <Icon icon={actions.linkCopied ? Check : Copy} />
          </Button>
        </Joined>
      </Stack>
      <Footer>
        <Button type="button" $variant="secondary" onClick={actions.download}>
          Download
        </Button>
        <Button type="button" $variant="secondary" onClick={actions.copyImage}>
          Copy image
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
