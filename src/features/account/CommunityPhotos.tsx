"use client";

import * as React from "react";
import { ImageUp, RefreshCw, Trash2 } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { FileUpload, FileUploadButton, type FileRejection } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { ALT_MAX_LENGTH, PHOTO_MAX_BYTES, PHOTO_TYPES, uploadCommunityPhoto } from "./communityPhoto";
import { Cell, Row, RowLabel, Section, SectionTitle } from "./layout";

/** What's on screen before Save. `uploading` while the picked file goes up; the preview shows it already. */
export interface PhotoDraft {
  url: string | null;
  fileName: string | null;
  alt: string;
  uploading: boolean;
  error?: string;
}

const REJECTED: Record<FileRejection, string> = {
  type: "Choose a JPG, PNG or WebP image.",
  size: "Choose an image under 5 MB.",
};
const UPLOAD_FAILED = "The photo didn’t upload. Try again.";

/* The photo, then its alt text right under it. Each Field's own label is hidden by Cell; "Photo" is the row label. */
const PhotoCell = styled(Cell)`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

/*
 * The photo at the field column's full width. Replace and Remove sit on it, on a scrim, shown on hover, when a
 * button inside has keyboard focus, or after a click or tap on the photo (for anyone who can't hover).
 * Hidden actions take no clicks, so the first tap on a phone opens them rather than pressing one.
 */
const Frame = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  /* Room for both buttons stacked, so a wide, short photo never clips them. */
  min-height: calc(2 * var(--control-height) + var(--space-2) + 2 * var(--space-3));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-surface);
  cursor: pointer;
`;

const Preview = styled.img`
  display: block;
  width: 100%;
  height: auto;
  max-height: 400px;
  object-fit: contain;
  transition: opacity var(--duration) var(--ease-out);

  &[data-uploading] {
    opacity: 0.6;
  }
`;

const Actions = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-overlay);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--duration) var(--ease-out);

  ${Frame}:hover > &,
  ${Frame}[data-open] > &,
  &:focus-within {
    opacity: 1;
    pointer-events: auto;
  }
`;

export function CommunityPhotos({ draft, onChange }: { draft: PhotoDraft; onChange: (next: Partial<PhotoDraft>) => void }) {
  const [open, setOpen] = React.useState(false);
  const uploadButton = React.useRef<HTMLButtonElement>(null);
  // After Remove the photo and its buttons are gone, so focus moves to Upload rather than falling to the page.
  const focusUpload = React.useRef(false);

  React.useEffect(() => {
    if (focusUpload.current && !draft.url) uploadButton.current?.focus();
    focusUpload.current = false;
  }, [draft.url]);

  async function upload(file: File) {
    const previous = { url: draft.url, fileName: draft.fileName };
    const url = URL.createObjectURL(file);
    onChange({ url, fileName: file.name, uploading: true, error: undefined });
    const result = await uploadCommunityPhoto(file, url);
    if (result.ok) {
      onChange({ uploading: false });
    } else {
      URL.revokeObjectURL(url);
      onChange({ ...previous, uploading: false, error: UPLOAD_FAILED });
    }
  }

  function remove() {
    focusUpload.current = true;
    setOpen(false);
    onChange({ url: null, fileName: null, alt: "", error: undefined });
  }

  const picker = {
    accept: PHOTO_TYPES,
    maxBytes: PHOTO_MAX_BYTES,
    onFile: (file: File) => {
      setOpen(false);
      void upload(file);
    },
    onReject: (reason: FileRejection) => onChange({ error: REJECTED[reason] }),
  };

  return (
    <Section aria-labelledby="community-photos">
      <SectionTitle id="community-photos">Community Photos</SectionTitle>
      <Row>
        <RowLabel>Photo</RowLabel>
        <PhotoCell>
          <Field label="Photo" error={draft.error}>
            {(props) =>
              draft.url ? (
                // A pointer path only: keyboard users reach the same buttons by Tab, which reveals them.
                <Frame
                  data-open={open || draft.uploading ? "" : undefined}
                  onClick={(e) => {
                    if (e.target === e.currentTarget || e.target instanceof HTMLImageElement) setOpen((o) => !o);
                  }}
                  onMouseLeave={() => setOpen(false)}
                >
                  {/* An object URL or a storage URL of any size, so a plain img rather than next/image. */}
                  <Preview src={draft.url} alt={draft.alt} data-uploading={draft.uploading ? "" : undefined} />
                  <Actions>
                    <FileUploadButton {...props} {...picker} busy={draft.uploading}>
                      <Icon icon={RefreshCw} size={16} />
                      Replace photo
                    </FileUploadButton>
                    <Button type="button" $variant="danger" disabled={draft.uploading} onClick={remove}>
                      <Icon icon={Trash2} size={16} />
                      Remove photo
                    </Button>
                  </Actions>
                </Frame>
              ) : (
                <FileUpload
                  ref={uploadButton}
                  {...props}
                  {...picker}
                  icon={ImageUp}
                  action="Upload"
                  prompt="or drag and drop a photo here"
                  dropPrompt="Drop the photo to upload it"
                  limits="JPG, PNG or WebP, up to 5 MB"
                />
              )
            }
          </Field>
          {draft.url && (
            <Field label="Alt text">
              {(props) => (
                <Input
                  {...props}
                  placeholder="Alt text"
                  maxLength={ALT_MAX_LENGTH}
                  value={draft.alt}
                  onChange={(e) => onChange({ alt: e.target.value })}
                />
              )}
            </Field>
          )}
        </PhotoCell>
      </Row>
    </Section>
  );
}
