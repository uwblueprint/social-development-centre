"use client";

import * as React from "react";
import { styled } from "next-yak";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { Lock } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Label";
import { emailEditorCopy as copy } from "../copy";
import { EditorShortcuts } from "../extensions/editorShortcuts";
import { PersonalizedText } from "../extensions/personalizedText";
import type { PersonalizationVariable } from "../variables";
import { LinkEditor, LinkMenu, type LinkUi } from "./LinkPopovers";
import { Toolbar } from "./Toolbar";

export interface EmailFooter {
  /** e.g. "Suhanya at SDC". Unsubscribe is always added after it. */
  sender: string;
  address: string;
}

export interface MessageFieldProps {
  content?: JSONContent;
  getItems: (query: string) => PersonalizationVariable[];
  personalizeItems: PersonalizationVariable[];
  onPersonalize: (item: PersonalizationVariable) => void;
  onChange: (json: JSONContent, empty: boolean, characters: number) => void;
  onFocusEditor: (editor: Editor) => void;
  footer: EmailFooter;
  invalid?: boolean;
  errorId?: string;
  onReady?: (editor: Editor) => void;
}

export function MessageField({
  content,
  getItems,
  personalizeItems,
  onPersonalize,
  onChange,
  onFocusEditor,
  footer,
  invalid,
  errorId,
  onReady,
}: MessageFieldProps) {
  const labelId = React.useId();
  const areaRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<Editor | null>(null);
  const [linkUi, setLinkUi] = React.useState<LinkUi>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      // The PRD allows paragraphs, bold, italic, links and lists only. Turning the rest off also strips
      // them from text pasted from Word, Google Docs or Gmail.
      StarterKit.configure({
        heading: false,
        blockquote: false,
        underline: false,
        strike: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer", target: null },
        },
      }),
      Placeholder.configure({ placeholder: copy.bodyPlaceholder }),
      PersonalizedText.configure({ getItems }),
      EditorShortcuts,
    ],
    content,
    editorProps: {
      attributes: { "aria-labelledby": labelId, "aria-multiline": "true", role: "textbox" },
      handleKeyDown: (_view, event) => {
        const mod = event.metaKey || event.ctrlKey;
        if (mod && !event.shiftKey && event.key.toLowerCase() === "k") {
          event.preventDefault();
          const button = areaRef.current?.parentElement?.querySelector<HTMLElement>("[data-link-button]");
          if (button) setLinkUi({ kind: "edit", rect: button.getBoundingClientRect() });
          return true;
        }
        return false;
      },
      // Clicking a link never opens it here: it selects the whole link and shows copy, edit and remove.
      handleClick: (_view, pos, event) => {
        const link = (event.target as HTMLElement | null)?.closest("a");
        if (!link) return false;
        event.preventDefault();
        editorRef.current?.chain().setTextSelection(pos).extendMarkRange("link").run();
        setLinkUi({ kind: "menu", rect: link.getBoundingClientRect(), href: link.getAttribute("href") ?? "" });
        return true;
      },
    },
    onCreate: ({ editor: e }) => {
      editorRef.current = e;
      onReady?.(e);
    },
    onFocus: ({ editor: e }) => onFocusEditor(e),
    onUpdate: ({ editor: e }) => onChange(e.getJSON(), e.isEmpty, e.getText().length),
  });

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

  return (
    <Wrapper>
      {/* The message is a contenteditable, which a <label for> can't target: clicking the label focuses it instead. */}
      <Label id={labelId} onClick={() => editor?.commands.focus()}>
        {copy.messageLabel}
      </Label>
      <Card data-invalid={invalid || undefined}>
        <Toolbar
          editor={editor}
          personalizeItems={personalizeItems}
          onPersonalize={onPersonalize}
          onLink={(button) => setLinkUi({ kind: "edit", rect: button.getBoundingClientRect() })}
        />
        <Area ref={areaRef}>
          <EditorContent editor={editor} />
        </Area>
        <Footer aria-label="Email footer, added to every email">
          <div>
            {footer.sender} | <u>Unsubscribe</u>
            <br />
            {footer.address}
          </div>
          <SettingsNote>
            <Icon icon={Lock} size={16} />
            {copy.footerSettings}
          </SettingsNote>
        </Footer>
        {editor && linkUi?.kind === "edit" && <LinkEditor editor={editor} rect={linkUi.rect} onClose={() => setLinkUi(null)} />}
        {editor && linkUi?.kind === "menu" && (
          <LinkMenu
            editor={editor}
            rect={linkUi.rect}
            href={linkUi.href}
            onEdit={() => setLinkUi({ kind: "edit", rect: linkUi.rect })}
            onClose={() => setLinkUi(null)}
          />
        )}
      </Card>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Card = styled.div`
  position: relative;
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  transition: border-color var(--duration) var(--ease);

  &:focus-within {
    border-color: var(--color-focus);
  }
  &[data-invalid],
  &[data-invalid]:focus-within {
    border-color: var(--color-danger);
  }
`;

const Area = styled.div`
  position: relative;
  padding: var(--space-2) var(--space-4) var(--space-4);

  .ProseMirror {
    min-height: 168px;
    outline: none;
    font-size: var(--text-md);
    line-height: var(--leading-body);
    overflow-wrap: anywhere;
  }
  .ProseMirror > :first-child {
    margin-top: 0;
  }
  .ProseMirror p {
    margin: 0 0 var(--space-4);
  }
  .ProseMirror ul,
  .ProseMirror ol {
    margin: 0 0 var(--space-4);
    padding-left: var(--space-5);
  }
  .ProseMirror li > p {
    margin: 0 0 var(--space-1);
  }
  .ProseMirror a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 2px;
    cursor: pointer;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    content: attr(data-placeholder);
    float: left;
    height: 0;
    color: var(--color-text-subtle);
    pointer-events: none;
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: 0 var(--space-4);
  padding: var(--space-3) 0 var(--space-4);
  border-top: 1px dashed var(--color-border);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  user-select: none;
`;

const SettingsNote = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
`;
