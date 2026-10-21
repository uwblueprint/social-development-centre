"use client";

import * as React from "react";
import { styled } from "next-yak";
import { EditorContent, Extension, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { CharacterCount } from "@tiptap/extensions";
import { ErrorIcon } from "@/components/ui/Field";
import { EMAIL_LIMITS, emailEditorCopy as copy } from "../copy";
import { PersonalizedText } from "../extensions/personalizedText";
import type { PersonalizationVariable } from "../variables";

/** One line only, but it can hold personalized text, so it's an editor rather than an Input. */
const SubjectDocument = Document.extend({ content: "paragraph" });

/** Enter moves to the message. Runs after the "{" list, which uses Enter to pick an item. */
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
      "Shift-Enter": () => true,
    };
  },
});

export interface SubjectFieldProps {
  content?: JSONContent;
  getItems: (query: string) => PersonalizationVariable[];
  onChange: (json: JSONContent, empty: boolean) => void;
  onFocusEditor: (editor: Editor) => void;
  onEnter: () => void;
  invalid?: boolean;
  errorId?: string;
  onReady?: (editor: Editor) => void;
}

export function SubjectField({ content, getItems, onChange, onFocusEditor, onEnter, invalid, errorId, onReady }: SubjectFieldProps) {
  const [count, setCount] = React.useState(0);
  const onEnterRef = React.useRef(onEnter);
  onEnterRef.current = onEnter;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      SubjectDocument,
      Paragraph,
      Text,
      PersonalizedText.configure({ getItems }),
      CharacterCount.configure({ limit: EMAIL_LIMITS.subjectMax }),
      SingleLine.configure({ onEnter: () => onEnterRef.current() }),
    ],
    content,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-labelledby": "email-subject-label",
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
    onCreate: ({ editor: e }) => onReady?.(e),
    onFocus: ({ editor: e }) => onFocusEditor(e),
    onUpdate: ({ editor: e }) => {
      setCount(e.storage.characterCount.characters());
      onChange(e.getJSON(), e.isEmpty);
    },
  });

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
      <Row data-invalid={invalid || undefined}>
        <Label id="email-subject-label">{copy.subjectLabel}</Label>
        <Line>
          <EditorContent editor={editor} />
        </Line>
      </Row>
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

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const Label = styled.span`
  flex: none;
  color: var(--color-text-subtle);
  font-size: var(--text-md);
  line-height: var(--leading-body);
`;

/** The underline is always there: grey, darker on hover, green while typing, red with an error. */
const Line = styled.div`
  flex: 1;
  min-width: 0;
  border-bottom: 1px solid var(--color-border);
  transition: border-color var(--duration) var(--ease);

  &:hover {
    border-bottom-color: var(--color-border-strong);
  }
  &:focus-within {
    border-bottom-color: var(--color-brand);
  }
  [data-invalid] & {
    border-bottom-color: var(--color-danger);
  }

  .ProseMirror {
    min-height: 32px;
    padding: var(--space-2) 0 var(--space-1);
    outline: none;
    font-family: var(--font-email);
    font-size: var(--text-md);
    line-height: var(--leading-body);
    white-space: pre;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .ProseMirror p {
    margin: 0;
  }
`;

const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-2);
  font-size: var(--text-sm);
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
