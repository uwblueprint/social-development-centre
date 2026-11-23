"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { FileUp, LoaderCircle, type LucideIcon } from "lucide-react";
import { Button } from "./Button";
import type { FieldControlProps } from "./Field";
import { Icon } from "./Icon";

/* Taken from the member directory's spreadsheet import (src/app/design/member-directory/ImportMembersDialog.tsx). */

/** Why a picked or dropped file was turned away before `onFile`. The caller words the error. */
export type FileRejection = "type" | "size";

interface PickerOptions {
  /** Accepted MIME types, e.g. `["image/jpeg", "image/png"]`. `"image/*"` accepts any image. Checked on pick and on drop. */
  accept: readonly string[];
  /** The largest file, in bytes. */
  maxBytes?: number;
  /** Called with a file that passed both checks. */
  onFile: (file: File) => void;
  /** Called instead of `onFile` when the file is the wrong type or too large. */
  onReject: (reason: FileRejection, file: File) => void;
}

function accepts(accept: readonly string[], type: string) {
  return accept.some((a) => (a.endsWith("/*") ? type.startsWith(a.slice(0, -1)) : a === type));
}

/** The hidden native file input and the checks every picked or dropped file goes through. */
function useFilePicker({ accept, maxBytes, onFile, onReject }: PickerOptions) {
  const ref = React.useRef<HTMLInputElement>(null);

  const take = (file: File | undefined) => {
    if (!file) return;
    if (!accepts(accept, file.type)) onReject("type", file);
    else if (maxBytes !== undefined && file.size > maxBytes) onReject("size", file);
    else onFile(file);
  };

  const input = (
    <input
      ref={ref}
      type="file"
      accept={accept.join(",")}
      hidden
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        take(e.target.files?.[0]);
        // Cleared so choosing the same file again still fires a change.
        e.target.value = "";
      }}
    />
  );

  return { input, take, open: () => ref.current?.click() };
}

/* ---------- drop zone ---------- */

/* Dashed 1px border with the field radius; while a file is dragged over it, it highlights and the copy changes. */
const Zone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) var(--space-4);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: var(--text-sm);
  line-height: var(--leading-body);
  color: var(--color-text);
  transition:
    background-color var(--duration-fast) var(--ease-out),
    border-color var(--duration-fast) var(--ease-out);

  & > svg {
    color: var(--color-text-muted);
  }

  &[data-over] {
    border-color: var(--color-focus);
    background: var(--color-bg-hover);
  }

  &[data-invalid] {
    border-color: var(--color-danger);
  }

  &[data-disabled] {
    background: var(--color-surface);
    color: var(--color-text-muted);
  }
`;

/* The action inside the zone's sentence: a ghost Button stripped to underlined text. Still a real button with the kit focus ring. */
const InlineAction = styled(Button)`
  && {
    display: inline;
    height: auto;
    padding: 0;
    border: 0;
    border-radius: var(--radius-sm);
    font-size: inherit;
    line-height: inherit;
    vertical-align: baseline;
    color: var(--color-text);
    text-decoration: underline;
    background: transparent;
  }
  &&:hover:not(:disabled) {
    background: transparent;
    text-decoration-thickness: 2px;
  }
`;

const Small = styled.span`
  font-size: var(--text-xs);
  color: var(--color-text-muted);
`;

export interface FileUploadProps extends PickerOptions, Partial<FieldControlProps> {
  /** The visible action, the underlined button: "Upload". */
  action: string;
  /** The rest of the sentence after the action: "or drag and drop a photo here". */
  prompt: string;
  /** Replaces the sentence while a file is dragged over: "Drop the photo to upload it". */
  dropPrompt: string;
  /** Accepted types and the size limit, in small text under the sentence: "JPG, PNG or WebP, up to 5 MB". */
  limits?: string;
  /** Icon above the sentence. Default `FileUp`. */
  icon?: LucideIcon;
}

/**
 * Pick or drop one file. Wrap it in a `Field` for the label and the error; the Field's id and description land on the
 * action button. Files of the wrong type or over `maxBytes` go to `onReject`, never `onFile`.
 */
export const FileUpload = React.forwardRef<HTMLButtonElement, FileUploadProps>(function FileUpload(
  { action, prompt, dropPrompt, limits, icon = FileUp, accept, maxBytes, onFile, onReject, disabled, ...control },
  ref,
) {
  const picker = useFilePicker({ accept, maxBytes, onFile, onReject });
  const [over, setOver] = React.useState(false);
  const limitsId = React.useId();
  const describedBy = [control["aria-describedby"], limits ? limitsId : null].filter(Boolean).join(" ") || undefined;

  return (
    <Zone
      data-over={over ? "" : undefined}
      data-invalid={control["aria-invalid"] ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(false);
        picker.take(e.dataTransfer.files[0]);
      }}
    >
      <Icon icon={icon} size={24} />
      {over ? (
        <span>{dropPrompt}</span>
      ) : (
        <span>
          <InlineAction
            ref={ref}
            type="button"
            $variant="ghost"
            id={control.id}
            // The whole sentence, so a screen reader hears what the button does; it starts with the visible word.
            aria-label={`${action} ${prompt}`}
            aria-describedby={describedBy}
            aria-invalid={control["aria-invalid"]}
            disabled={disabled}
            onClick={picker.open}
          >
            {action}
          </InlineAction>{" "}
          {prompt}
        </span>
      )}
      {limits && <Small id={limitsId}>{limits}</Small>}
      {picker.input}
    </Zone>
  );
});

/* ---------- button ---------- */

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Spinner = styled.span`
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    animation: ${spin} 0.8s linear infinite;
  }
`;

const BusyLabel = styled.span<{ $hidden: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  visibility: ${({ $hidden }) => ($hidden ? "hidden" : "visible")};
`;

const Relative = styled(Button)`
  position: relative;
`;

export interface FileUploadButtonProps
  extends PickerOptions,
    Omit<React.ComponentProps<typeof Button>, "onClick" | "type" | "accept" | "ref" | "onReject"> {
  /** While a file uploads: a spinner at the same width, `aria-busy`, and clicks are ignored. */
  busy?: boolean;
}

/** A Button that opens the file picker, e.g. "Replace photo" once a file is in place. Same checks as `FileUpload`. */
export const FileUploadButton = React.forwardRef<HTMLButtonElement, FileUploadButtonProps>(function FileUploadButton(
  { accept, maxBytes, onFile, onReject, busy = false, children, $variant = "secondary", ...props },
  ref,
) {
  const picker = useFilePicker({ accept, maxBytes, onFile, onReject });
  return (
    <>
      <Relative
        ref={ref}
        type="button"
        $variant={$variant}
        aria-disabled={busy || undefined}
        aria-busy={busy || undefined}
        onClick={() => {
          if (!busy) picker.open();
        }}
        {...props}
      >
        <BusyLabel $hidden={busy}>{children}</BusyLabel>
        {busy && (
          <Spinner aria-hidden="true">
            <Icon icon={LoaderCircle} size={16} />
          </Spinner>
        )}
      </Relative>
      {picker.input}
    </>
  );
});
