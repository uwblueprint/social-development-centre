"use client";

import * as React from "react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { DialogActions, DialogContent } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import type { LinkActions } from "./useLinkActions";

/** What every layout gets: the shared data and actions, and `onDone` only for the create result. */
export interface VersionProps {
  actions: LinkActions;
  onDone?: () => void;
}

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
`;

/**
 * The dialog panel every layout uses. Focus lands on the panel itself, not on a button, so a mouse
 * user never sees a focus ring on open; keyboard users still start inside the dialog.
 */
export function LinkDialogContent({ children, ...props }: React.ComponentProps<typeof DialogContent>) {
  return (
    <DialogContent
      aria-describedby={undefined}
      {...props}
      onOpenAutoFocus={(event) => {
        event.preventDefault();
        (event.target as HTMLElement).focus();
      }}
    >
      {children}
    </DialogContent>
  );
}

/* Stacks a layout's parts on a --space-4 rhythm below the title. */
export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-4);
`;

/* The button takes the input's height instead of a height of its own, so the two always match. */
const UrlRowRoot = styled.div`
  display: flex;
  align-items: stretch;
  gap: var(--space-2);

  & > :first-child {
    flex: 1;
    min-width: 0;
  }
`;

const CopyButton = styled(Button)`
  height: auto;
`;

/** The "Link" field: a read-only input with an adjacent Copy button. */
export function LinkField({ actions }: { actions: LinkActions }) {
  return (
    <Field label="Link">
      {(props) => (
        <UrlRowRoot>
          <Input {...props} readOnly value={actions.url} />
          <CopyButton type="button" $variant="secondary" onClick={actions.copyLink}>
            Copy
          </CopyButton>
        </UrlRowRoot>
      )}
    </Field>
  );
}

/*
 * The code sits on its own light ground, so it scans in dark mode too. A layout sets --qr-size on a
 * parent to resize it; the box keeps its square while the image renders.
 */
const Frame = styled.div<{ $bare?: boolean }>`
  width: var(--qr-size, calc(var(--space-8) * 3));
  max-width: 100%;
  aspect-ratio: 1;
  flex-shrink: 0;
  background: var(--qr-ground);
  overflow: hidden;
  /* The code's quiet zone is white on white; the border shows the box. */
  border: ${({ $bare }) => ($bare ? "0" : "1px solid var(--color-border-strong)")};
  border-radius: ${({ $bare }) => ($bare ? "0" : "var(--radius-md)")};
`;

const Image = styled.img`
  display: block;
  width: 100%;
  height: 100%;
`;

export function QrCode({ actions, bare }: { actions: LinkActions; bare?: boolean }) {
  return (
    <Frame $bare={bare}>
      {actions.image && <Image src={actions.image} alt={`QR code for ${actions.link.name}`} />}
    </Frame>
  );
}

/* Right-aligned footer that wraps instead of overflowing at 360px. */
export const Footer = styled(DialogActions)`
  flex-wrap: wrap;
`;

export const Fill = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  & > button {
    width: 100%;
  }
`;

/** The "Link" field without its own Copy button, for layouts that put the action elsewhere. */
export function LinkFieldOnly({ actions }: { actions: LinkActions }) {
  return (
    <Field label="Link">
      {(props) => <Input {...props} readOnly value={actions.url} />}
    </Field>
  );
}
