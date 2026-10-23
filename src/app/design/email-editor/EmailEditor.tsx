"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import type { Editor, JSONContent } from "@tiptap/react";
import { Check, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorIcon } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { MessageField, type EmailFooter } from "./components/MessageField";
import { SubjectField } from "./components/SubjectField";
import { EMAIL_LIMITS, emailEditorCopy as copy } from "./copy";
import { EmailEditorProvider } from "./EmailEditorContext";
import { variablesFor, type EmailMoment, type PersonalizationVariable } from "./variables";

export interface EmailDraft {
  subject: JSONContent;
  body: JSONContent;
}

export interface EmailEditorProps {
  /** Which email this is; decides which personalized text is available. */
  moment: EmailMoment;
  initialSubject?: JSONContent;
  initialBody?: JSONContent;
  footer: EmailFooter;
  /** Saved fallbacks, by variable id. Defaults come from variables.ts. */
  fallbacks?: Record<string, string>;
  onFallbackChange?: (id: string, value: string) => void;
  /** Called on every change. Save the draft from here (debounced); then pass saveState. */
  onChange?: (draft: EmailDraft) => void;
  saveState?: "idle" | "saving" | "saved";
  /** Opens the preview, designed separately. Only called when the subject and message aren't empty. */
  onPreview?: () => void;
}

/**
 * The email editor: subject and message. Used wherever an email is written
 * (automatic emails, one-off emails, editing a send in the Outbox). Scope and decisions: the Email Editor PRD in Notion.
 */
export function EmailEditor({
  moment,
  initialSubject,
  initialBody,
  footer,
  fallbacks = {},
  onFallbackChange,
  onChange,
  saveState = "idle",
  onPreview,
}: EmailEditorProps) {
  const subjectErrorId = React.useId();
  const bodyErrorId = React.useId();

  // The editors are created once; they read the moment through this so the "{" list stays current.
  const momentRef = React.useRef(moment);
  React.useLayoutEffect(() => {
    momentRef.current = moment;
  }, [moment]);
  const getItems = React.useCallback((query: string) => variablesFor(momentRef.current, query), []);

  const bodyEditor = React.useRef<Editor | null>(null);
  const lastFocused = React.useRef<Editor | null>(null);
  const focusBody = React.useCallback(() => bodyEditor.current?.commands.focus(), []);

  const draft = React.useRef<EmailDraft>({ subject: initialSubject ?? { type: "doc" }, body: initialBody ?? { type: "doc" } });
  const [subjectEmpty, setSubjectEmpty] = React.useState(!initialSubject);
  const [bodyEmpty, setBodyEmpty] = React.useState(!initialBody);
  const [bodyChars, setBodyChars] = React.useState(0);
  const [showRequired, setShowRequired] = React.useState(false);

  const emit = () => onChange?.({ ...draft.current });

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

  return (
    <EmailEditorProvider value={{ moment, fallbacks, onFallbackChange }}>
      <Root>
        <Block>
          <SubjectField
            content={initialSubject}
            getItems={getItems}
            invalid={!!subjectError}
            errorId={subjectError ? subjectErrorId : undefined}
            onFocusEditor={(e) => {
              lastFocused.current = e;
            }}
            onEnter={focusBody}
            onChange={(json, empty) => {
              draft.current.subject = json;
              updateEmpty(empty, bodyEmpty);
              emit();
            }}
          />
          {subjectError && (
            <ErrorLine id={subjectErrorId}>
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
            errorId={bodyError ? bodyErrorId : undefined}
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
          {bodyError && (
            <ErrorLine id={bodyErrorId}>
              <ErrorIcon />
              {bodyError}
            </ErrorLine>
          )}
          {bodyChars > EMAIL_LIMITS.bodyWarn && (
            <WarningLine>
              <ErrorIcon />
              {copy.bodyLong(bodyChars)}
            </WarningLine>
          )}
        </Block>

        <Actions>
          {saveState !== "idle" && (
            <SaveStatus aria-live="polite">
              {saveState === "saved" && <Icon icon={Check} size={16} />}
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
              <Icon icon={Eye} size={16} />
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
