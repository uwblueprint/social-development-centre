"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import type { Editor, JSONContent } from "@tiptap/react";
import { Check, Eye } from "lucide-react";
import { ErrorIcon } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { Attachments, atLimit, attachmentKind, usedBytes, type AttachmentItem } from "./components/Attachments";
import { BrandButton } from "./components/BrandButton";
import { MessageField, type EmailFooter } from "./components/MessageField";
import { SubjectField } from "./components/SubjectField";
import { EMAIL_LIMITS, emailEditorCopy as copy, formatSize } from "./copy";
import { EmailEditorProvider } from "./EmailEditorContext";
import { variablesFor, type EmailMoment, type PersonalizationVariable } from "./variables";

export interface EmailDraft {
  subject: JSONContent;
  body: JSONContent;
  attachments: AttachmentItem[];
}

export interface EmailEditorProps {
  /** Which email this is; decides which personalized text is available. */
  moment: EmailMoment;
  initialSubject?: JSONContent;
  initialBody?: JSONContent;
  initialAttachments?: AttachmentItem[];
  footer: EmailFooter;
  /** Saved fallbacks, by variable id. Defaults come from variables.ts. */
  fallbacks?: Record<string, string>;
  onFallbackChange?: (id: string, value: string) => void;
  /** Called on every change. Save the draft from here (debounced); then pass saveState. */
  onChange?: (draft: EmailDraft) => void;
  saveState?: "idle" | "saving" | "saved";
  /** Opens the preview, designed separately. Only called when the subject and message aren't empty. */
  onPreview?: () => void;
  uploadImage?: (file: File) => Promise<string>;
  /** Uploads an attachment, reporting progress from 0 to 1. Without it, files are kept locally. */
  uploadAttachment?: (file: File, onProgress: (progress: number) => void) => Promise<void>;
}

let nextId = 0;
const newId = () => `attachment-${Date.now()}-${nextId++}`;

/**
 * The email editor: subject, message and attachments. Used wherever an email is written
 * (automatic emails, one-off emails, editing a send in the Outbox). See docs/decisions/email-editor.md.
 */
export function EmailEditor({
  moment,
  initialSubject,
  initialBody,
  initialAttachments = [],
  footer,
  fallbacks = {},
  onFallbackChange,
  onChange,
  saveState = "idle",
  onPreview,
  uploadImage,
  uploadAttachment,
}: EmailEditorProps) {
  const momentRef = React.useRef(moment);
  momentRef.current = moment;
  // The editors are created once; they read the moment through this so the "{" list stays current.
  const getItems = React.useCallback((query: string) => variablesFor(momentRef.current, query), []);

  const bodyEditor = React.useRef<Editor | null>(null);
  const lastFocused = React.useRef<Editor | null>(null);

  const draft = React.useRef<EmailDraft>({ subject: initialSubject ?? { type: "doc" }, body: initialBody ?? { type: "doc" }, attachments: initialAttachments });
  const [subjectEmpty, setSubjectEmpty] = React.useState(!initialSubject);
  const [bodyEmpty, setBodyEmpty] = React.useState(!initialBody);
  const [bodyChars, setBodyChars] = React.useState(0);
  const [showRequired, setShowRequired] = React.useState(false);
  const [imageErrors, setImageErrors] = React.useState<string[]>([]);
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>(initialAttachments);
  const [attachErrors, setAttachErrors] = React.useState<string[]>([]);

  const emit = React.useCallback(() => onChange?.({ ...draft.current }), [onChange]);

  const updateAttachments = (next: (prev: AttachmentItem[]) => AttachmentItem[]) => {
    setAttachments((prev) => {
      const value = next(prev);
      draft.current.attachments = value;
      queueMicrotask(emit);
      return value;
    });
  };

  const upload = (item: AttachmentItem, file: File) => {
    if (!uploadAttachment) {
      updateAttachments((list) => list.map((a) => (a.id === item.id ? { ...a, status: "done" as const, progress: 1 } : a)));
      return;
    }
    uploadAttachment(file, (progress) =>
      updateAttachments((list) => list.map((a) => (a.id === item.id ? { ...a, progress } : a))),
    ).then(
      () => updateAttachments((list) => list.map((a) => (a.id === item.id ? { ...a, status: "done" as const, progress: 1 } : a))),
      () => updateAttachments((list) => list.map((a) => (a.id === item.id ? { ...a, status: "failed" as const } : a))),
    );
  };
  const filesById = React.useRef(new Map<string, File>());

  const addAttachments = (files: File[]) => {
    const errors: string[] = [];
    const added: AttachmentItem[] = [];
    const toUpload: [AttachmentItem, File][] = [];
    let list = attachments;
    for (const file of files) {
      const kind = attachmentKind(file);
      if (!kind) {
        errors.push(copy.attachments.wrongType(file.name));
        continue;
      }
      if (list.length + added.length >= EMAIL_LIMITS.fileCount) {
        errors.push(copy.attachments.tooMany);
        break;
      }
      if (atLimit([...list, ...added])) {
        errors.push(copy.attachments.atLimit);
        break;
      }
      if (file.size > EMAIL_LIMITS.fileMax) {
        errors.push(copy.attachments.tooBig(file.name, formatSize(file.size)));
        continue;
      }
      if (usedBytes([...list, ...added]) + file.size > EMAIL_LIMITS.totalMax) {
        errors.push(copy.attachments.overTotal(file.name));
        continue;
      }
      const item: AttachmentItem = {
        id: newId(),
        name: file.name,
        size: file.size,
        kind,
        previewUrl: kind === "image" ? URL.createObjectURL(file) : undefined,
        status: "uploading",
        progress: 0,
      };
      filesById.current.set(item.id, file);
      added.push(item);
      toUpload.push([item, file]);
    }
    list = [...list, ...added];
    setAttachErrors(errors);
    updateAttachments(() => list);
    toUpload.forEach(([item, file]) => upload(item, file));
  };

  const removeAttachment = (id: string) => {
    const item = attachments.find((a) => a.id === id);
    if (item?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
    filesById.current.delete(id);
    setAttachErrors([]);
    updateAttachments((list) => list.filter((a) => a.id !== id));
  };

  const retryAttachment = (id: string) => {
    const item = attachments.find((a) => a.id === id);
    const file = filesById.current.get(id);
    if (!item || !file) return;
    updateAttachments((list) => list.map((a) => (a.id === id ? { ...a, status: "uploading" as const, progress: 0 } : a)));
    upload(item, file);
  };

  const insertPersonalized = (item: PersonalizationVariable) => {
    const target = lastFocused.current ?? bodyEditor.current;
    if (!target) return;
    // With no caret yet, it goes at the end of the message.
    const chain = lastFocused.current ? target.chain().focus() : target.chain().focus("end");
    chain
      .insertContent([
        { type: "personalizedText", attrs: { id: item.id } },
        { type: "text", text: " " },
      ])
      .run();
  };

  const previewBlocked = subjectEmpty || bodyEmpty;
  const subjectError = showRequired && subjectEmpty ? copy.subjectRequired : null;
  const bodyError = showRequired && bodyEmpty ? copy.bodyRequired : null;
  React.useEffect(() => {
    if (!previewBlocked) setShowRequired(false);
  }, [previewBlocked]);

  return (
    <EmailEditorProvider value={{ moment, fallbacks, onFallbackChange }}>
      <Root>
        <Block>
          <SubjectField
            content={initialSubject}
            getItems={getItems}
            invalid={!!subjectError}
            errorId={subjectError ? "email-subject-error" : undefined}
            onFocusEditor={(e) => {
              lastFocused.current = e;
            }}
            onEnter={() => bodyEditor.current?.commands.focus()}
            onChange={(json, empty) => {
              draft.current.subject = json;
              setSubjectEmpty(empty);
              emit();
            }}
          />
          {subjectError && (
            <ErrorLine id="email-subject-error">
              <ErrorIcon />
              {subjectError}
            </ErrorLine>
          )}
        </Block>

        <Block>
          <MessageField
            content={initialBody}
            getItems={getItems}
            personalizeItems={variablesFor(moment)}
            onPersonalize={insertPersonalized}
            footer={footer}
            invalid={!!bodyError}
            errorId={bodyError ? "email-body-error" : undefined}
            uploadImage={uploadImage}
            onReady={(e) => {
              bodyEditor.current = e;
            }}
            onFocusEditor={(e) => {
              lastFocused.current = e;
            }}
            onAttachFiles={addAttachments}
            onImageErrors={setImageErrors}
            onChange={(json, empty, chars) => {
              draft.current.body = json;
              setBodyEmpty(empty);
              setBodyChars(chars);
              emit();
            }}
          />
          {bodyError && (
            <ErrorLine id="email-body-error">
              <ErrorIcon />
              {bodyError}
            </ErrorLine>
          )}
          {imageErrors.map((m) => (
            <ErrorLine key={m}>
              <ErrorIcon />
              {m}
            </ErrorLine>
          ))}
          {bodyChars > EMAIL_LIMITS.bodyWarn && (
            <WarningLine>
              <ErrorIcon />
              {copy.bodyLong(bodyChars)}
            </WarningLine>
          )}
        </Block>

        <Attachments items={attachments} errors={attachErrors} onAdd={addAttachments} onRemove={removeAttachment} onRetry={retryAttachment} />

        <Actions>
          {saveState !== "idle" && (
            <SaveStatus aria-live="polite">
              {saveState === "saved" && <Icon icon={Check} size={16} strokeWidth={2} />}
              {saveState === "saving" ? copy.saving : copy.saved}
            </SaveStatus>
          )}
          <Tooltip content={previewBlocked ? copy.previewDisabled : copy.preview} pinOnClick={false}>
            <PreviewButton
              type="button"
              aria-disabled={previewBlocked}
              onClick={() => {
                // Still clickable when blocked, so the errors can say what's missing.
                if (previewBlocked) setShowRequired(true);
                else onPreview?.();
              }}
            >
              <Icon icon={Eye} size={16} strokeWidth={2} />
              {copy.preview}
            </PreviewButton>
          </Tooltip>
        </Actions>
      </Root>
    </EmailEditorProvider>
  );
}

const Root = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--space-6);
`;

const Block = styled.div`
  display: grid;
  gap: var(--space-2);
  min-width: 0;
`;

const ErrorLine = styled.span`
  display: flex;
  gap: var(--space-1);
  align-items: flex-start;
  color: var(--color-danger);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
`;

const WarningLine = styled(ErrorLine)`
  color: var(--color-warning);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--space-3);
`;

/* The eye blinks once on hover (owner). Not while Preview is blocked; reduced motion is handled globally. */
const blink = keyframes`
  0%, 100% { transform: scaleY(1); }
  45%, 55% { transform: scaleY(0.1); }
`;

const PreviewButton = styled(BrandButton)`
  svg {
    transform-origin: center;
  }
  &:hover:not([aria-disabled="true"]) svg {
    animation: ${blink} var(--duration-slow) var(--ease);
  }
`;

const SaveStatus = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
`;
