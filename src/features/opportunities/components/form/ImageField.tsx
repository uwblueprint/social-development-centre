"use client";

import * as React from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { copy } from "../../copy";
import { ImageMatte } from "../ImageMatte";
import { fieldId } from "./formValues";

const t = copy.form.image;

/** Longest side the stored image gets; the browser scales larger pictures down before saving. */
const MAX_SIDE = 1600;
/** Owner: anything wider than 8:1 or taller than 1:8 can't be shown well, so it's refused. */
const MAX_RATIO = 8;
const ACCEPT = "image/jpeg,image/png,image/webp";

class RatioError extends Error {
  constructor(readonly tall: boolean) {
    super("ratio");
  }
}

/**
 * Reads a picked image, checks its shape, scales it so its longest side is at most MAX_SIDE and
 * returns a JPEG data URL. The original shape is kept: cards fit it into 16:9 with bars; emails show it as is.
 */
async function toScaledDataUrl(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const { naturalWidth: w, naturalHeight: h } = img;
    if (w / h > MAX_RATIO || h / w > MAX_RATIO) throw new RatioError(h > w);
    const scale = Math.min(1, MAX_SIDE / Math.max(w, h));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    // JPEG has no transparency: paint white first so transparent PNG areas don't turn black.
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const Frame = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;
`;

/* The preview shows the image exactly as it sits on a partner card (ImageMatte). */
const Preview = styled(ImageMatte)`
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
`;

const IconTile = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-7);
  height: var(--space-7);
  margin-bottom: var(--space-2);
  border-radius: var(--radius-full);
  background: var(--color-bg);
  color: var(--color-text);
`;

/* Sizes match the kit's fields: text-sm like input text, text-xs like hints. */
const EmptyTitle = styled.span`
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  line-height: var(--leading-body);
`;

const EmptyHint = styled.span`
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  line-height: var(--leading-body);
  color: var(--color-text-muted);
`;

const Actions = styled.div`
  display: flex;
  gap: var(--space-2);
`;

/**
 * The listing's image (owner: "very, very important"): shown on partner cards, in the side panel and in
 * members' emails. Optional. Stored as `imageUrl`; see docs/backend/opportunities.md, "Images".
 */
export function ImageField({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const [dragging, setDragging] = React.useState(false);
  const [readError, setReadError] = React.useState<string>();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!ACCEPT.split(",").includes(file.type)) {
      setReadError(t.wrongType);
      return;
    }
    try {
      setReadError(undefined);
      onChange(await toScaledDataUrl(file));
    } catch (e) {
      setReadError(e instanceof RatioError ? (e.tall ? t.tooTall : t.tooWide) : t.unreadable);
    }
  }

  function pick() {
    // Created on demand, never rendered: the visible control is the kit Button.
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPT;
    input.onchange = () => void handleFile(input.files?.[0]);
    input.click();
  }

  return (
    <Field label={t.label} id={fieldId("imageUrl")} error={readError ?? error}>
      {(p) =>
        value ? (
          <Frame>
            <Preview id={p.id} src={value} alt={t.previewAlt} />
            <Actions>
              <Button type="button" $variant="outline" $size="sm" onClick={pick}>
                <Icon icon={Upload} size={16} />
                {t.replace}
              </Button>
              <Button type="button" $variant="outline" $size="sm" onClick={() => onChange("")}>
                <Icon icon={Trash2} size={16} />
                {t.remove}
              </Button>
            </Actions>
          </Frame>
        ) : (
          <Button
            id={p.id}
            type="button"
            $variant="dropzone"
            $dragging={dragging}
            aria-describedby={p["aria-describedby"]}
            onClick={pick}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void handleFile(e.dataTransfer.files[0]);
            }}
          >
            <IconTile>
              <Icon icon={ImagePlus} size={20} />
            </IconTile>
            <EmptyTitle>{t.add}</EmptyTitle>
            <EmptyHint>{t.dropHint}</EmptyHint>
          </Button>
        )
      }
    </Field>
  );
}
