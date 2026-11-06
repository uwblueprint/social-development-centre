"use client";

import * as React from "react";
import { css, styled } from "next-yak";
import { FileText, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorIcon } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { ATTACHMENT_EXTENSIONS, EMAIL_LIMITS, emailEditorCopy as copy, formatSize } from "../copy";

export type AttachmentKind = "pdf" | "image" | "text" | "doc" | "csv";

export interface AttachmentItem {
  id: string;
  name: string;
  size: number;
  kind: AttachmentKind;
  /** Images only: shown as the tile's preview. */
  previewUrl?: string;
  status: "uploading" | "done" | "failed";
  /** 0 to 1 while uploading. */
  progress: number;
}

const KIND_BY_EXTENSION: Record<(typeof ATTACHMENT_EXTENSIONS)[number], AttachmentKind> = {
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  txt: "text",
  docx: "doc",
  csv: "csv",
};

/** The kit's large glyph size (EmptyState), for the icons that fill a whole tile. */
const TILE_ICON = 22;

export function splitName(name: string): [string, string] {
  const i = name.lastIndexOf(".");
  return i > 0 ? [name.slice(0, i), name.slice(i)] : [name, ""];
}

export function attachmentKind(file: File): AttachmentKind | null {
  const ext = splitName(file.name)[1].slice(1).toLowerCase() as keyof typeof KIND_BY_EXTENSION;
  return KIND_BY_EXTENSION[ext] ?? null;
}

export const usedBytes = (items: AttachmentItem[]) => items.filter((a) => a.status !== "failed").reduce((sum, a) => sum + a.size, 0);
export const atLimit = (items: AttachmentItem[]) =>
  usedBytes(items) >= EMAIL_LIMITS.totalMax - 1024 || items.length >= EMAIL_LIMITS.fileCount;

export interface AttachmentsProps {
  items: AttachmentItem[];
  errors: string[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  /** Shows the files without add, remove, retry or drop. */
  readOnly?: boolean;
}

/**
 * States: empty (a small dashed "Add attachment"; hover leaves just the +), dragging a file anywhere
 * over the section (the whole section becomes one drop target), populated (tiles plus a dashed + tile),
 * and full (the + tile becomes "Max file limit reached", with no hover).
 */
export function Attachments({ items, errors, onAdd, onRemove, onRetry, readOnly = false }: AttachmentsProps) {
  const [dragging, setDragging] = React.useState(false);
  const depth = React.useRef(0);
  const full = atLimit(items);
  const hasFiles = (e: React.DragEvent) => !readOnly && Array.from(e.dataTransfer.types).includes("Files");

  if (readOnly && items.length === 0) return null;

  return (
    <Section
      aria-label={copy.attachments.label}
      onDragEnter={(e) => {
        if (!hasFiles(e) || full) return;
        depth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = full ? "none" : "copy";
      }}
      onDragLeave={() => {
        depth.current = Math.max(0, depth.current - 1);
        if (depth.current === 0) setDragging(false);
      }}
      onDrop={(e) => {
        if (!hasFiles(e)) return;
        e.preventDefault();
        depth.current = 0;
        setDragging(false);
        onAdd(Array.from(e.dataTransfer.files));
      }}
    >
      {errors.length > 0 && (
        <Errors aria-live="polite">
          {errors.map((m, i) => (
            <ErrorLine key={i}>
              <ErrorIcon />
              {m}
            </ErrorLine>
          ))}
        </Errors>
      )}

      {dragging ? (
        <DropZone aria-hidden="true">
          <Icon icon={Plus} size={TILE_ICON} />
        </DropZone>
      ) : (
        <>
          <Tiles>
            {items.map((item) => (
              <Tile
                key={item.id}
                item={item}
                readOnly={readOnly}
                onRemove={() => onRemove(item.id)}
                onRetry={() => onRetry(item.id)}
              />
            ))}
            {/* Adding happens from the toolbar's paperclip or by dropping files; this only shows what's attached. */}
            {!readOnly && full && <LimitTile>{copy.attachments.limitReached}</LimitTile>}
          </Tiles>
          {items.length > 0 && <Usage>{copy.attachments.used((usedBytes(items) / (1024 * 1024)).toFixed(1))}</Usage>}
        </>
      )}
    </Section>
  );
}

function Tile({
  item,
  readOnly,
  onRemove,
  onRetry,
}: {
  item: AttachmentItem;
  readOnly: boolean;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const [base, ext] = splitName(item.name);
  return (
    <TileBox data-failed={item.status === "failed" || undefined} title={`${item.name} · ${formatSize(item.size)}`}>
      <Preview>
        {item.status === "failed" ? (
          <Failed>
            <span>
              <ErrorIcon />
              {copy.attachments.uploadFailed}
            </span>
            {!readOnly && (
              <RetryButton type="button" $variant="ghost" $size="sm" onClick={onRetry}>
                {copy.attachments.retry}
              </RetryButton>
            )}
          </Failed>
        ) : item.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- a local preview of the file being attached
          <img src={item.previewUrl} alt="" />
        ) : (
          <Badge>
            <Icon icon={FileText} size={TILE_ICON} />
            {ext.slice(1)}
          </Badge>
        )}
        {item.status === "uploading" && (
          <Progress
            aria-label={`Uploading ${item.name}`}
            role="progressbar"
            aria-valuenow={Math.round(item.progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${item.progress * 100}%` }} />
          </Progress>
        )}
      </Preview>
      {/* The name may be shortened, but the whole extension always shows. */}
      <Name>
        <span data-base="">{base}</span>
        <span>{ext}</span>
      </Name>
      {!readOnly && (
        <RemoveButton type="button" $variant="outline" aria-label={copy.attachments.remove(item.name)} onClick={onRemove}>
          <Icon icon={X} size={14} />
        </RemoveButton>
      )}
    </TileBox>
  );
}

/* The repo's dashed border: 4px dashes drawn inside the box (--dashed-border tokens). */
const dashed = css`
  border: 1px solid transparent;
  background-image: var(--dashed-border);
  background-size: var(--dashed-border-size);
  background-position: var(--dashed-border-position);
  background-repeat: var(--dashed-border-repeat);
  background-origin: border-box;
`;

const Section = styled.section`
  display: grid;
  gap: var(--space-2);
`;

const Errors = styled.div`
  display: grid;
  gap: var(--space-1);
`;

/* Matches the kit's field error: --text-xs beside the error icon. */
const ErrorLine = styled.span`
  display: flex;
  gap: var(--space-1);
  align-items: flex-start;
  color: var(--color-danger);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
`;

const Tiles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
`;

const tileSize = css`
  width: 144px;
  height: 128px;
  flex: none;
  border-radius: var(--radius-md);
`;



const LimitTile = styled.div`
  ${tileSize}
  display: grid;
  place-items: center;
  padding: var(--space-3);
  border: 1px solid var(--color-border-strong);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  text-align: center;
`;

/* The drop zone in the SDC green tint, as in Shallot's d027d9b. */
const DropZone = styled.div`
  ${dashed}
  display: grid;
  place-items: center;
  min-height: 128px;
  border-radius: var(--radius-md);
  background-color: var(--sdc-50);
  color: var(--sdc-900);
`;

const TileBox = styled.div`
  ${tileSize}
  position: relative;
  display: grid;
  grid-template-rows: 1fr auto;
  overflow: hidden;
  border: 1px solid var(--color-border);
  background: var(--color-bg);

  &[data-failed] {
    border-color: var(--color-danger);
  }
  &:hover button[aria-label^="Remove"],
  button[aria-label^="Remove"]:focus-visible {
    opacity: 1;
  }
`;

const Preview = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--color-secondary);
  color: var(--color-text-muted);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const Badge = styled.span`
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
`;

const Failed = styled.span`
  display: grid;
  justify-items: center;
  gap: var(--space-1);
  color: var(--color-danger);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);

  > span {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
  }
`;

const RetryButton = styled(Button)`
  color: var(--color-danger);
  text-decoration: underline;
`;

/* Upload progress in the primary (SDC green) colour. */
const Progress = styled.span`
  position: absolute;
  left: var(--space-2);
  right: var(--space-2);
  bottom: var(--space-2);
  height: var(--space-1);
  border-radius: var(--radius-full);
  background: var(--color-border);
  overflow: hidden;

  span {
    display: block;
    height: 100%;
    background: var(--color-primary);
  }
`;

const Name = styled.span`
  display: flex;
  min-width: 0;
  padding: var(--space-2);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);

  [data-base] {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  > span:last-child {
    flex: none;
  }
`;

const Usage = styled.span`
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
`;

/* 24px: the smallest target WCAG 2.2 allows (2.5.8). */
const RemoveButton = styled(Button)`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: var(--space-5);
  height: var(--space-5);
  padding: 0;
  border-radius: var(--radius-full);
  opacity: 0;
  transition: opacity var(--duration) var(--ease);

  /* Touch screens have no hover to reveal it. */
  @media (hover: none) {
    opacity: 1;
  }
`;
