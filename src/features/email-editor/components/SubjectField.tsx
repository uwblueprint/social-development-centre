"use client";

import * as React from "react";
import { styled } from "next-yak";
import { EditorContent, Extension, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { ErrorIcon } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import type { LucideIcon } from "lucide-react";
import { EMAIL_LIMITS, emailEditorCopy as copy } from "../copy";
import { PersonalizedText } from "../extensions/personalizedText";
import type { PersonalizationVariable } from "../variables";

/** One line only, but it can hold personalized text, so it's an editor rather than an Input. */
const SubjectDocument = Document.extend({ content: "paragraph" });

/** Enter or Tab moves to the message. Runs after the "@" list, which uses Enter to pick an item. */
const SingleLine = Extension.create<{ onEnter?: () => void }>({
  name: "subjectSingleLine",
  priority: 50,
  addOptions() {
    return { onEnter: undefined };
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => {
        this.options.onEnter?.();
        return true;
      },
      Tab: () => {
        this.options.onEnter?.();
        return true;
      },
      "Shift-Enter": () => true,
    };
  },
});

export interface SubjectFieldProps {
  content?: JSONContent;
  getItems: (query: string) => PersonalizationVariable[];
  onChange: (json: JSONContent, empty: boolean) => void;
  onFocusEditor: (editor: Editor) => void;
  /** Enter or Tab in the subject. Read once when the editor is created, so pass a stable callback. */
  onEnter: () => void;
  invalid?: boolean;
  errorId?: string;
  onReady?: (editor: Editor) => void;
  readOnly?: boolean;
  /** A muted leading label with a divider, for when the subject sits in its own box. It replaces the placeholder. */
  label?: string;
  /** A small muted icon before the label. */
  labelIcon?: LucideIcon;
}

export function SubjectField({
  content,
  getItems,
  onChange,
  onFocusEditor,
  onEnter,
  invalid,
  errorId,
  onReady,
  readOnly = false,
  label,
  labelIcon,
}: SubjectFieldProps) {
  const [count, setCount] = React.useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      SubjectDocument,
      Paragraph,
      Text,
      PersonalizedText.configure({ getItems }),
      CharacterCount.configure({ limit: EMAIL_LIMITS.subjectMax }),
      Placeholder.configure({ placeholder: label ? "" : copy.subjectLabel }),
      SingleLine.configure({ onEnter }),
    ],
    content,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": copy.subjectLabel,
        "aria-multiline": "false",
      },
      // Pasted subjects keep only their text, on one line.
      handlePaste: (view, event) => {
        const text = event.clipboardData?.getData("text/plain");
        if (text == null) return false;
        view.dispatch(view.state.tr.insertText(text.replace(/\s+/g, " ")));
        return true;
      },
    },
    onCreate: ({ editor: e }) => {
      setCount(e.storage.characterCount.characters());
      onReady?.(e);
    },
    onFocus: ({ editor: e }) => onFocusEditor(e),
    onUpdate: ({ editor: e }) => {
      setCount(e.storage.characterCount.characters());
      onChange(e.getJSON(), e.isEmpty);
    },
  });

  React.useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

  // aria-invalid and the error link live on the editable element itself.
  React.useEffect(() => {
    let dom: HTMLElement | null = null;
    try {
      dom = editor?.view.dom ?? null;
    } catch {
      return;
    }
    if (!dom) return;
    if (invalid) dom.setAttribute("aria-invalid", "true");
    else dom.removeAttribute("aria-invalid");
    if (errorId) dom.setAttribute("aria-describedby", errorId);
    else dom.removeAttribute("aria-describedby");
  }, [editor, invalid, errorId]);

  const atMax = count >= EMAIL_LIMITS.subjectMax;
  const long = count > EMAIL_LIMITS.subjectWarn;

  return (
    <div>
      <Line data-labeled={label ? "" : undefined}>
        {label && (
          <>
            <LeadLabel>
              {labelIcon && <Icon icon={labelIcon} size={14} />}
              {label}
            </LeadLabel>
            <LeadDivider aria-hidden />
          </>
        )}
        <Editable>
          <EditorContent editor={editor} />
        </Editable>
      </Line>
      {(long || atMax) && (
        <Meta>
          <Tone data-tone={atMax ? "danger" : "warning"}>
            <ErrorIcon />
            {atMax ? copy.subjectMax : copy.subjectLong}
          </Tone>
          <Count>
            {count} / {EMAIL_LIMITS.subjectMax}
          </Count>
        </Meta>
      )}
    </div>
  );
}

/** The subject is the top row of the email card, like a compose window: the field's place says what it is. */
const LeadLabel = styled.span`
  flex: none;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  /* One pill row tall, and the same label column as the Send to and Exclude boxes. */
  height: 28px;
  gap: var(--space-2);
  width: 15ch;
  margin: var(--space-2) var(--space-3) 0 var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const LeadDivider = styled.span`
  flex: none;
  /* Stretches with the row; the line itself stops --space-2 short of the box's top and bottom edges. */
  position: relative;
  align-self: stretch;
  width: 1px;

  &::before {
    content: "";
    position: absolute;
    inset: var(--space-2) 0;
    background: var(--color-border);
  }
`;

const Editable = styled.div`
  flex: 1 1 auto;
  min-width: 0;
`;

const Line = styled.div`
  &[data-labeled] {
    display: flex;
  }
  &[data-labeled] .ProseMirror {
    line-height: 28px;
    padding-left: var(--space-3);
  }

  .ProseMirror {
    padding: var(--space-2) var(--space-4);
    outline: none;
    font-size: var(--text-sm);
    /* One 32px line (--space-6), so the Subject box is as tall as the Send to box. */
    line-height: var(--space-6);
    white-space: pre;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .ProseMirror p {
    margin: 0;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    height: 0;
    color: var(--color-text-subtle);
    pointer-events: none;
  }
`;

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0 var(--space-4) var(--space-2);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);

  [data-tone="warning"] {
    color: var(--color-warning);
  }
  [data-tone="danger"] {
    color: var(--color-danger);
  }
`;

const Tone = styled.span`
  display: inline-flex;
  align-items: flex-start;
  gap: var(--space-1);
`;

const Count = styled.span`
  margin-left: auto;
  color: var(--color-text-subtle);
  font-variant-numeric: tabular-nums;
`;
