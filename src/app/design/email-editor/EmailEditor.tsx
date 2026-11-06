"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import type { Editor, JSONContent } from "@tiptap/react";
import { Check, Eye, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorIcon } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { Attachments, atLimit, attachmentKind, usedBytes, type AttachmentItem } from "./components/Attachments";
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
  /** Files already on the email. */
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
  /** Uploads an image placed in the message and returns its public URL. Without it, images use a local preview URL. */
  uploadImage?: (file: File) => Promise<string>;
  /** Uploads an attachment, reporting progress from 0 to 1. Without it, files are kept locally. */
  uploadAttachment?: (file: File, onProgress: (progress: number) => void) => Promise<void>;
  /** Shows the email without editing controls, e.g. a published automatic email. */
  readOnly?: boolean;
  /** Puts the subject in its own box above the message instead of as the message card's top row. */
  subjectApart?: boolean;
  /** Leaves out the Preview button, for pages that place their own. */
  hidePreview?: boolean;
}

let nextId = 0;
const newId = () => `attachment-${Date.now()}-${nextId++}`;

/** True for a missing doc or one with only empty paragraphs. A chip or an image counts as content. */
function isEmptyDoc(doc?: JSONContent): boolean {
  if (!doc?.content?.length) return true;
  return doc.content.every((node) => node.type === "paragraph" && !node.content?.length);
}

/**
 * The email editor: subject, message and attachments. Used wherever an email is written
 * (automatic emails, one-off emails, editing a send in the Outbox). Scope and decisions: the Email Editor PRD in Notion.
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
  readOnly = false,
  subjectApart = false,
  hidePreview = false,
}: EmailEditorProps) {
  const subjectErrorId = React.useId();
  const bodyErrorId = React.useId();

  // The editors are created once; they read the moment through this so the "@" list stays current.
  const momentRef = React.useRef(moment);
  React.useLayoutEffect(() => {
    momentRef.current = moment;
  }, [moment]);
  const fallbacksRef = React.useRef(fallbacks);
  React.useLayoutEffect(() => {
    fallbacksRef.current = fallbacks;
  }, [fallbacks]);
  const withFallbacks = (items: PersonalizationVariable[], saved: Record<string, string>) =>
    items.map((v) => ({ ...v, fallback: saved[v.id] ?? v.fallback }));
  const getItems = React.useCallback(
    (query: string) => withFallbacks(variablesFor(momentRef.current, query), fallbacksRef.current),
    [],
  );

  const bodyEditor = React.useRef<Editor | null>(null);
  const lastFocused = React.useRef<Editor | null>(null);
  const subjectEditor = React.useRef<Editor | null>(null);
  const focusBody = React.useCallback(() => bodyEditor.current?.commands.focus("start"), []);
  const focusSubject = React.useCallback(() => subjectEditor.current?.commands.focus("end"), []);

  const draft = React.useRef<EmailDraft>({
    subject: initialSubject ?? { type: "doc" },
    body: initialBody ?? { type: "doc" },
    attachments: initialAttachments,
  });
  const [subjectEmpty, setSubjectEmpty] = React.useState(() => isEmptyDoc(initialSubject));
  const [bodyEmpty, setBodyEmpty] = React.useState(() => isEmptyDoc(initialBody));
  const [bodyChars, setBodyChars] = React.useState(0);
  const [showRequired, setShowRequired] = React.useState(false);
  const [imageErrors, setImageErrors] = React.useState<string[]>([]);
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>(initialAttachments);
  const [attachErrors, setAttachErrors] = React.useState<string[]>([]);
  const filesById = React.useRef(new Map<string, File>());

  const emit = () => onChange?.({ ...draft.current });

  // Attachment changes reach the draft (and onChange) once they render; the first render is the initial list.
  const emittedAttachments = React.useRef(attachments);
  React.useEffect(() => {
    if (emittedAttachments.current === attachments) return;
    emittedAttachments.current = attachments;
    draft.current.attachments = attachments;
    onChange?.({ ...draft.current });
  }, [attachments, onChange]);

  const patchAttachment = (id: string, patch: Partial<AttachmentItem>) =>
    setAttachments((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const upload = (item: AttachmentItem, file: File) => {
    if (!uploadAttachment) {
      patchAttachment(item.id, { status: "done", progress: 1 });
      return;
    }
    uploadAttachment(file, (progress) => patchAttachment(item.id, { progress })).then(
      () => patchAttachment(item.id, { status: "done", progress: 1 }),
      () => patchAttachment(item.id, { status: "failed" }),
    );
  };

  /** Checks run in this order, so each file gets the first problem that applies. */
  const addAttachments = (files: File[]) => {
    if (readOnly) return;
    const errors: string[] = [];
    const added: { item: AttachmentItem; file: File }[] = [];
    for (const file of files) {
      const all = [...attachments, ...added.map((a) => a.item)];
      const kind = attachmentKind(file);
      if (!kind) {
        errors.push(copy.attachments.wrongType(file.name));
        continue;
      }
      if (all.length >= EMAIL_LIMITS.fileCount) {
        errors.push(copy.attachments.tooMany);
        break;
      }
      if (atLimit(all)) {
        errors.push(copy.attachments.atLimit);
        break;
      }
      if (file.size > EMAIL_LIMITS.fileMax) {
        errors.push(copy.attachments.tooBig(file.name, formatSize(file.size)));
        continue;
      }
      if (usedBytes(all) + file.size > EMAIL_LIMITS.totalMax) {
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
      added.push({ item, file });
    }
    setAttachErrors(errors);
    if (!added.length) return;
    setAttachments((list) => [...list, ...added.map((a) => a.item)]);
    added.forEach(({ item, file }) => upload(item, file));
  };

  const removeAttachment = (id: string) => {
    const item = attachments.find((a) => a.id === id);
    if (item?.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(item.previewUrl);
    filesById.current.delete(id);
    setAttachErrors([]);
    setAttachments((list) => list.filter((a) => a.id !== id));
  };

  const retryAttachment = (id: string) => {
    const item = attachments.find((a) => a.id === id);
    const file = filesById.current.get(id);
    if (!item || !file) return;
    patchAttachment(id, { status: "uploading", progress: 0 });
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
  // The "required" errors show after a blocked Preview click, until both fields have content again.
  const updateEmpty = (subject: boolean, body: boolean) => {
    setSubjectEmpty(subject);
    setBodyEmpty(body);
    if (!subject && !body) setShowRequired(false);
  };
  const subjectError = showRequired && subjectEmpty ? copy.subjectRequired : null;
  const bodyError = showRequired && bodyEmpty ? copy.bodyRequired : null;

  const subjectField = (
    <SubjectField
      readOnly={readOnly}
      label={subjectApart ? copy.subjectLabel : undefined}
      labelIcon={subjectApart ? Mail : undefined}
      content={initialSubject}
      getItems={getItems}
      invalid={!!subjectError}
      errorId={subjectError ? subjectErrorId : undefined}
      onFocusEditor={(e) => {
        lastFocused.current = e;
      }}
      onEnter={focusBody}
      onReady={(e) => {
        subjectEditor.current = e;
      }}
      onChange={(json, empty) => {
        draft.current.subject = json;
        updateEmpty(empty, bodyEmpty);
        emit();
      }}
    />
  );

  return (
    <EmailEditorProvider value={{ moment, fallbacks, onFallbackChange }}>
      <Root $tight={subjectApart}>
        {subjectApart && <SubjectBox>{subjectField}</SubjectBox>}
        <Block>
          {/* One email, one card: the subject is its top row, then the toolbar, body and footer. */}
          <MessageField
            header={subjectApart ? undefined : subjectField}
            onLeaveToSubject={focusSubject}
            readOnly={readOnly}
            content={initialBody}
            getItems={getItems}
            personalizeItems={withFallbacks(variablesFor(moment), fallbacks)}
            onPersonalize={insertPersonalized}
            footer={footer}
            invalid={!!(subjectError || bodyError)}
            errorId={bodyError ? bodyErrorId : undefined}
            uploadImage={uploadImage}
            onAttachFiles={addAttachments}
            onImageErrors={setImageErrors}
            onReady={(e) => {
              bodyEditor.current = e;
            }}
            onFocusEditor={(e) => {
              lastFocused.current = e;
            }}
            onChange={(json, empty, chars) => {
              draft.current.body = json;
              updateEmpty(subjectEmpty, empty);
              setBodyChars(chars);
              emit();
            }}
          />
          {subjectError && (
            <ErrorLine id={subjectErrorId}>
              <ErrorIcon />
              {subjectError}
            </ErrorLine>
          )}
          {bodyError && (
            <ErrorLine id={bodyErrorId}>
              <ErrorIcon />
              {bodyError}
            </ErrorLine>
          )}
          {imageErrors.length > 0 && (
            <ErrorList aria-live="polite">
              {imageErrors.map((m, i) => (
                <ErrorLine key={i}>
                  <ErrorIcon />
                  {m}
                </ErrorLine>
              ))}
            </ErrorList>
          )}
          {bodyChars > EMAIL_LIMITS.bodyWarn && (
            <WarningLine>
              <ErrorIcon />
              {copy.bodyLong(bodyChars)}
            </WarningLine>
          )}
        </Block>

        <Attachments
          items={attachments}
          errors={attachErrors}
          onAdd={addAttachments}
          onRemove={removeAttachment}
          onRetry={retryAttachment}
          readOnly={readOnly}
        />

        {!hidePreview && (
          <Actions>
            {saveState !== "idle" && (
              <SaveStatus aria-live="polite">
                {saveState === "saved" && <Icon icon={Check} />}
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
                <Icon icon={Eye} />
                {copy.preview}
              </PreviewButton>
            </Tooltip>
          </Actions>
        )}
      </Root>
    </EmailEditorProvider>
  );
}

const Root = styled.div<{ $tight?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${({ $tight }) => ($tight ? "var(--space-4)" : "var(--space-6)")};
`;

/* The subject on its own, boxed like the message card below it. */
const SubjectBox = styled.div`
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg);

  &:focus-within {
    border-color: var(--color-focus);
  }
`;

const Block = styled.div`
  display: grid;
  gap: var(--space-2);
  min-width: 0;
`;

const ErrorList = styled.div`
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

/* Preview is the kit's primary Button, which is SDC green now. */
const PreviewButton = styled(Button)`
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
