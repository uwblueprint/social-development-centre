"use client";

import * as React from "react";
import { styled } from "next-yak";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import type { EditorView } from "@tiptap/pm/view";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { Lock, Paperclip } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { EMAIL_LIMITS, IMAGE_TYPES, emailEditorCopy as copy, formatSize } from "../copy";
import { EditorShortcuts } from "../extensions/editorShortcuts";
import { EmailImage } from "../extensions/emailImage";
import { PersonalizedText } from "../extensions/personalizedText";
import type { PersonalizationVariable } from "../variables";
import { LinkEditor, LinkMenu, type LinkUi } from "./LinkPopovers";
import { pickFiles } from "./shortcuts";
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
  /** Files dropped on the message that aren't images go to Attachments. */
  onAttachFiles: (files: File[]) => void;
  onImageErrors: (errors: string[]) => void;
  /** Uploads an image and returns its URL. Defaults to a local preview URL. */
  uploadImage?: (file: File) => Promise<string>;
  footer: EmailFooter;
  invalid?: boolean;
  errorId?: string;
  onReady?: (editor: Editor) => void;
}

const hasFiles = (e: DragEvent) => !!e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files");
const hasImageItems = (e: DragEvent) =>
  Array.from(e.dataTransfer?.items ?? []).some((i) => i.kind === "file" && i.type.startsWith("image/"));

/** The gap between top-level rows nearest the pointer: where a dropped image lands. */
function rowBoundaryAt(view: EditorView, clientY: number) {
  const doc = view.state.doc;
  let offset = 0;
  let lastBottom: number | null = null;
  for (let i = 0; i < doc.childCount; i++) {
    const dom = view.nodeDOM(offset) as HTMLElement | null;
    if (dom?.getBoundingClientRect) {
      const r = dom.getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return { pos: offset, y: r.top - 8 };
      lastBottom = r.bottom;
    }
    offset += doc.child(i).nodeSize;
  }
  return { pos: doc.content.size, y: (lastBottom ?? view.dom.getBoundingClientRect().top) + 8 };
}

export function MessageField({
  content,
  getItems,
  personalizeItems,
  onPersonalize,
  onChange,
  onFocusEditor,
  onAttachFiles,
  onImageErrors,
  uploadImage,
  footer,
  invalid,
  errorId,
  onReady,
}: MessageFieldProps) {
  const areaRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<Editor | null>(null);
  const dropPos = React.useRef<number | null>(null);
  const [dropLineY, setDropLineY] = React.useState<number | null>(null);
  const [attachOverlay, setAttachOverlay] = React.useState(false);
  const [linkUi, setLinkUi] = React.useState<LinkUi>(null);

  // Callbacks change between renders; the editor is created once, so it reads them through refs.
  const latest = React.useRef({ onAttachFiles, onImageErrors, uploadImage });
  latest.current = { onAttachFiles, onImageErrors, uploadImage };

  const insertImages = React.useCallback(async (files: File[], at?: number | null) => {
    const editor = editorRef.current;
    if (!editor) return;
    const errors: string[] = [];
    const nodes: JSONContent[] = [];
    for (const file of files) {
      if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
        errors.push(copy.image.notImage(file.name));
        continue;
      }
      if (file.size > EMAIL_LIMITS.imageMax) {
        errors.push(copy.image.tooBig(file.name, formatSize(file.size)));
        continue;
      }
      const upload = latest.current.uploadImage;
      const src = upload ? await upload(file) : URL.createObjectURL(file);
      nodes.push({ type: "emailImage", attrs: { src, alt: file.name.replace(/\.[^.]+$/, "") } });
    }
    latest.current.onImageErrors(errors);
    if (!nodes.length) return;

    const { state } = editor;
    let range: number | { from: number; to: number };
    if (at != null) {
      range = at;
    } else {
      // On the row below the caret; an empty line becomes the image's row.
      const { $from } = state.selection;
      if ($from.depth === 0) range = state.doc.content.size;
      else if ($from.node(1).type.name === "paragraph" && $from.node(1).content.size === 0)
        range = { from: $from.before(1), to: $from.after(1) };
      else range = $from.after(1);
    }
    editor.chain().focus().insertContentAt(range, nodes).run();
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1] },
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
      EmailImage,
      EditorShortcuts,
    ],
    content,
    editorProps: {
      attributes: { "aria-label": "Message", "aria-multiline": "true", role: "textbox" },
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
      handleDOMEvents: {
        dragover: (view, event) => {
          if (!hasFiles(event)) return false;
          event.preventDefault();
          if (hasImageItems(event)) {
            const { pos, y } = rowBoundaryAt(view, event.clientY);
            dropPos.current = pos;
            const top = areaRef.current?.getBoundingClientRect().top ?? 0;
            setDropLineY(y - top);
            setAttachOverlay(false);
          } else {
            setAttachOverlay(true);
            setDropLineY(null);
          }
          return true;
        },
        dragleave: (_view, event) => {
          if (!areaRef.current?.contains(event.relatedTarget as Node | null)) {
            setDropLineY(null);
            setAttachOverlay(false);
          }
          return false;
        },
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!files.length) return false;
        event.preventDefault();
        setDropLineY(null);
        setAttachOverlay(false);
        const images = files.filter((f) => f.type.startsWith("image/"));
        const rest = files.filter((f) => !f.type.startsWith("image/"));
        if (images.length) void insertImages(images, dropPos.current);
        if (rest.length) latest.current.onAttachFiles(rest);
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
    <Card
      data-invalid={invalid || undefined}
      // Drops on the toolbar or footer: images go to the end of the message, other files to Attachments.
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes("Files")) e.preventDefault();
      }}
      onDrop={(e) => {
        if (e.defaultPrevented) return;
        const files = Array.from(e.dataTransfer.files);
        if (!files.length) return;
        e.preventDefault();
        setDropLineY(null);
        setAttachOverlay(false);
        const images = files.filter((f) => f.type.startsWith("image/"));
        const rest = files.filter((f) => !f.type.startsWith("image/"));
        if (images.length) void insertImages(images, editorRef.current?.state.doc.content.size ?? null);
        if (rest.length) onAttachFiles(rest);
      }}
    >
      <Toolbar
        editor={editor}
        personalizeItems={personalizeItems}
        onPersonalize={onPersonalize}
        onImage={() => pickFiles(IMAGE_TYPES.join(","), (files) => void insertImages(files))}
        onLink={(button) => setLinkUi({ kind: "edit", rect: button.getBoundingClientRect() })}
      />
      <Area ref={areaRef}>
        <EditorContent editor={editor} />
        {dropLineY !== null && <DropLine style={{ top: dropLineY }} aria-hidden="true" />}
        {attachOverlay && (
          <AttachOverlay aria-hidden="true">
            <Icon icon={Paperclip} size={16} strokeWidth={2} />
            {copy.image.dropToAttach}
          </AttachOverlay>
        )}
      </Area>
      <Footer aria-label="Email footer, added to every email">
        <div>
          {footer.sender} | <u>Unsubscribe</u>
          <br />
          {footer.address}
        </div>
        <SettingsNote>
          <Icon icon={Lock} size={16} strokeWidth={2} />
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
  );
}

const Card = styled.div`
  position: relative;
  border: var(--border-message) solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  transition: border-color var(--duration) var(--ease);

  &:focus-within {
    border-color: var(--color-link); /* owner: the message border matches link blue while typing */
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
    font-family: var(--font-email);
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
  .ProseMirror h1 {
    font-size: var(--text-email-heading);
    font-weight: bold; /* email headings follow the email client, not the app's 500 weight */
    line-height: var(--leading-heading);
    margin: var(--space-5) 0 var(--space-2);
  }
  .ProseMirror ul,
  .ProseMirror ol {
    margin: 0 0 var(--space-4);
    padding-left: var(--space-5);
  }
  .ProseMirror li > p {
    margin: 0 0 var(--space-1);
  }
  .ProseMirror blockquote {
    margin: 0 0 var(--space-4);
    padding-left: var(--space-3);
    border-left: 2px solid var(--color-border-strong);
    color: var(--color-text-muted);
  }
  .ProseMirror a {
    color: var(--color-link);
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

const DropLine = styled.div`
  position: absolute;
  left: var(--space-4);
  right: var(--space-4);
  height: 2px;
  background: var(--color-brand);
  border-radius: var(--radius-sm);
  pointer-events: none;
  z-index: var(--z-raised);

  &::before {
    content: "";
    position: absolute;
    left: calc(var(--space-1) * -1);
    top: -3px;
    width: var(--space-2);
    height: var(--space-2);
    border-radius: var(--radius-full);
    background: var(--color-brand);
  }
`;

const AttachOverlay = styled.div`
  position: absolute;
  inset: 0 var(--space-2) var(--space-2);
  display: grid;
  place-content: center;
  grid-auto-flow: column;
  gap: var(--space-2);
  align-items: center;
  border-radius: var(--radius-md);
  background: var(--color-brand-subtle);
  color: var(--color-brand);
  font-size: var(--text-sm);
  pointer-events: none;
  z-index: var(--z-raised);
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
