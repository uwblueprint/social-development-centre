"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { styled } from "next-yak";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import type { EditorView } from "@tiptap/pm/view";
import { EmailHighlight } from "../extensions/emailHighlight";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";
import { Paperclip } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { TooltipContent, TooltipRoot, TooltipTrigger } from "@/components/ui/Tooltip";
import { ATTACHMENT_EXTENSIONS, EMAIL_LIMITS, IMAGE_TYPES, emailEditorCopy as copy, formatSize } from "../copy";
import { EditorShortcuts, EmailBlockquote } from "../extensions/editorShortcuts";
import { EmailImage } from "../extensions/emailImage";
import { PersonalizedText } from "../extensions/personalizedText";
import type { PersonalizationVariable } from "../variables";
import { LinkEditor, LinkMenu, type LinkUi } from "./LinkPopovers";
import { pickFiles } from "./shortcuts";
import { Toolbar } from "./Toolbar";
import { BodyKeyboard, EscapeBlur, FOCUS_TOOLBAR, LEAVE_TO_SUBJECT } from "../extensions/keyboardNav";

export interface EmailFooter {
  /*
   * What CASL and CAN-SPAM expect at the bottom of every commercial email, in reading order:
   * why they got it, who sent it, where to reach them, then the way out.
   */
  reason: string;
  organization: string;
  address: string;
  contact: string;
}

export interface MessageFieldProps {
  content?: JSONContent;
  getItems: (query: string) => PersonalizationVariable[];
  personalizeItems: PersonalizationVariable[];
  onPersonalize: (item: PersonalizationVariable) => void;
  onChange: (json: JSONContent, empty: boolean, characters: number) => void;
  onFocusEditor: (editor: Editor) => void;
  /** Files dropped on the message that aren't images go to Attachments. */
  onAttachFiles?: (files: File[]) => void;
  onImageErrors?: (errors: string[]) => void;
  /** Uploads an image and returns its URL. Defaults to a local preview URL. */
  uploadImage?: (file: File) => Promise<string>;
  footer: EmailFooter;
  invalid?: boolean;
  errorId?: string;
  onReady?: (editor: Editor) => void;
  /** Shows the message without the toolbar and blocks typing and dropping. */
  readOnly?: boolean;
  /** The card's top row, above the toolbar: the subject. */
  header?: ReactNode;
  /** Shift+Tab at the very start of the message: focus goes back to the subject. */
  onLeaveToSubject?: () => void;
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
  readOnly = false,
  header,
  onLeaveToSubject,
}: MessageFieldProps) {
  const areaRef = React.useRef<HTMLDivElement>(null);
  const editorRef = React.useRef<Editor | null>(null);
  const dropPos = React.useRef<number | null>(null);
  const [dropLineY, setDropLineY] = React.useState<number | null>(null);
  const [attachOverlay, setAttachOverlay] = React.useState(false);
  const [footerTipOpen, setFooterTipOpen] = React.useState(false);
  const footerTipId = React.useId();
  const footerTipTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeFooterTip = React.useCallback(() => {
    clearTimeout(footerTipTimer.current);
    setFooterTipOpen(false);
  }, []);
  // Once open it stays 3s, or until the pointer leaves, Escape or blur. Radix's own closing is ignored (see TooltipRoot).
  const openFooterTip = React.useCallback(() => {
    clearTimeout(footerTipTimer.current);
    setFooterTipOpen(true);
    footerTipTimer.current = setTimeout(() => setFooterTipOpen(false), 3000);
  }, []);
  React.useEffect(() => () => clearTimeout(footerTipTimer.current), []);
  React.useEffect(() => {
    if (!footerTipOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFooterTip();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [footerTipOpen, closeFooterTip]);
  const [linkUi, setLinkUi] = React.useState<LinkUi>(null);

  // Callbacks change between renders; the editor is created once, so it reads them through a ref.
  const latest = React.useRef({ onAttachFiles, onImageErrors, uploadImage, readOnly, onLeaveToSubject });
  React.useLayoutEffect(() => {
    latest.current = { onAttachFiles, onImageErrors, uploadImage, readOnly, onLeaveToSubject };
  }, [onAttachFiles, onImageErrors, uploadImage, readOnly, onLeaveToSubject]);

  const insertImages = React.useCallback(async (files: File[], at?: number | null) => {
    const editor = editorRef.current;
    if (!editor || latest.current.readOnly) return;
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
      let src: string;
      try {
        src = upload ? await upload(file) : URL.createObjectURL(file);
      } catch {
        errors.push(copy.image.uploadFailed(file.name));
        continue;
      }
      nodes.push({ type: "emailImage", attrs: { src, alt: file.name.replace(/\.[^.]+$/, "") } });
    }
    latest.current.onImageErrors?.(errors);
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

  // Images go into the message; any other file goes to Attachments.
  const routeFiles = React.useCallback(
    (files: File[], at: number | null) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      const rest = files.filter((f) => !f.type.startsWith("image/"));
      if (images.length) void insertImages(images, at);
      if (rest.length) latest.current.onAttachFiles?.(rest);
    },
    [insertImages],
  );

  const clearDropUi = () => {
    setDropLineY(null);
    setAttachOverlay(false);
  };

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    extensions: [
      // Pasted content from Word, Google Docs or Gmail keeps only what the toolbar can make:
      // one heading level, and no code, rules or images (see EmailImage).
      StarterKit.configure({
        heading: { levels: [1] },
        blockquote: false,
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
      EmailHighlight,
      Placeholder.configure({ placeholder: copy.bodyPlaceholder }),
      PersonalizedText.configure({ getItems }),
      EmailBlockquote,
      EmailImage,
      EditorShortcuts,
      BodyKeyboard,
      EscapeBlur,
    ],
    content,
    editorProps: {
      attributes: { "aria-label": copy.messageLabel, "aria-multiline": "true", role: "textbox" },
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
        // Dragging images shows a line between rows where they'll land; other files show "Drop to attach".
        dragover: (view, event) => {
          if (latest.current.readOnly || !hasFiles(event)) return false;
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
          if (!areaRef.current?.contains(event.relatedTarget as Node | null)) clearDropUi();
          return false;
        },
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (moved || latest.current.readOnly) return false;
        const files = Array.from(event.dataTransfer?.files ?? []);
        if (!files.length) return false;
        event.preventDefault();
        clearDropUi();
        routeFiles(files, dropPos.current);
        return true;
      },      // Pasted files (a copied image, a screenshot) go where the caret is, same as dropping them.
      handlePaste: (_view, event) => {
        if (latest.current.readOnly) return false;
        const files = Array.from(event.clipboardData?.files ?? []);
        if (!files.length) return false;
        event.preventDefault();
        routeFiles(files, null);
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

  // Published emails are read-only until they're unpublished, and that can change while the editor is open.
  React.useEffect(() => {
    editor?.setEditable(!readOnly);
  }, [editor, readOnly]);

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

  // Keyboard hops out of the message, announced by BodyKeyboard on the editor element.
  React.useEffect(() => {
    let dom: HTMLElement | null = null;
    try {
      dom = editor?.view.dom ?? null;
    } catch {
      return;
    }
    if (!dom) return;
    const toSubject = () => latest.current.onLeaveToSubject?.();
    const toToolbar = () => areaRef.current?.parentElement?.querySelector<HTMLElement>('[role="toolbar"] button')?.focus();
    dom.addEventListener(LEAVE_TO_SUBJECT, toSubject);
    dom.addEventListener(FOCUS_TOOLBAR, toToolbar);
    return () => {
      dom.removeEventListener(LEAVE_TO_SUBJECT, toSubject);
      dom.removeEventListener(FOCUS_TOOLBAR, toToolbar);
    };
  }, [editor]);

  return (
    <Wrapper>
      <Card
        data-invalid={invalid || undefined}
        // Drops on the toolbar or footer: images go to the end of the message, other files to Attachments.
        onDragOver={(e) => {
          if (!readOnly && Array.from(e.dataTransfer.types).includes("Files")) e.preventDefault();
        }}
        onDrop={(e) => {
          if (readOnly || e.defaultPrevented) return;
          const files = Array.from(e.dataTransfer.files);
          if (!files.length) return;
          e.preventDefault();
          clearDropUi();
          routeFiles(files, editorRef.current?.state.doc.content.size ?? null);
        }}
      >
        {header}
        {!readOnly && (
          <Toolbar
            editor={editor}
            personalizeItems={personalizeItems}
            onPersonalize={onPersonalize}
            onImage={() => pickFiles(IMAGE_TYPES.join(","), (files) => void insertImages(files))}
            onAttach={() => pickFiles(ATTACHMENT_EXTENSIONS.map((x) => `.${x}`).join(","), (files) => onAttachFiles?.(files))}
            onLink={(button) => setLinkUi({ kind: "edit", rect: button.getBoundingClientRect() })}
          />
        )}
        <Area ref={areaRef}>
          <EditorContent editor={editor} />
          {dropLineY !== null && <DropLine style={{ top: dropLineY }} aria-hidden="true" />}
          {attachOverlay && (
            <AttachOverlay aria-hidden="true">
              <Icon icon={Paperclip} />
              {copy.image.dropToAttach}
            </AttachOverlay>
          )}
        </Area>
        {/* Hover for 1s, focus, or double-click shows where to edit the footer. Controlled so double-click can open it. */}
        <TooltipRoot delayDuration={1000} open={footerTipOpen} onOpenChange={(next) => next && !footerTipOpen && openFooterTip()}>
          <TooltipTrigger asChild>
            <Footer
              aria-label="Email footer, added to every email"
              aria-describedby={footerTipId}
              tabIndex={0}
              onDoubleClick={openFooterTip}
              onPointerLeave={closeFooterTip}
              onBlur={closeFooterTip}
            >
              <div>
                {footer.organization}
                <br />
                {`${footer.address} · ${footer.contact}`}
              </div>
              <FooterSmall>
                {footer.reason} <u>Unsubscribe from emails</u> · <u>Cancel membership</u>
              </FooterSmall>
            </Footer>
          </TooltipTrigger>
          <TooltipContent>{copy.footerTip}</TooltipContent>
        </TooltipRoot>
        <span id={footerTipId} hidden>
          {copy.footerTip}
        </span>
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

/* TODO(token): d027d9b used a heavier 1.5px border (--border-message) that turned link blue (--color-link) while typing;
   both tokens were removed, so it's a 1px strong border that takes the focus color. */
const Card = styled.div`
  position: relative;
  min-width: 0;
  border: 1px solid var(--color-border-strong);
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

/* Message text is control text, --text-sm like the kit's Textarea.
   TODO(token): d027d9b set the message in the email font (--font-email: Arial) with 24px headings (--text-email-heading)
   and sky-blue links (--color-link); those tokens were removed, so it uses the app font, --text-lg headings and underlined links. */
const Area = styled.div`
  position: relative;
  padding: var(--space-4);

  .ProseMirror {
    min-height: 168px;
    outline: none;
    font-size: var(--text-sm);
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
    font-size: var(--text-lg);
    font-weight: var(--weight-bold); /* email headings follow the email client, not the app's 500 weight */
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
  /* The saved HTML carries the hex inline; the editor swaps in the token so dark mode stays readable. */
  .ProseMirror span[style*="background-color"] {
    background-color: var(--color-highlight) !important;
    color: inherit;
    border-radius: var(--radius-sm);
  }
  /* Selecting highlighted text: a deeper amber instead of the browser's blue, so you can still see it's highlighted. */
  .ProseMirror span[style*="background-color"]::selection,
  .ProseMirror span[style*="background-color"] *::selection {
    background-color: var(--color-highlight-selected);
    color: var(--color-text);
  }

  .ProseMirror a {
    color: var(--color-mention);
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

/* Where a dropped image will land: a line in the primary (SDC green) colour. */
const DropLine = styled.div`
  position: absolute;
  left: var(--space-4);
  right: var(--space-4);
  height: 2px;
  background: var(--color-primary);
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
    background: var(--color-focus);
  }
`;

/* Dropping a non-image file: the SDC green tint, as in Shallot's d027d9b. */
const AttachOverlay = styled.div`
  position: absolute;
  inset: 0 var(--space-2) var(--space-2);
  display: grid;
  place-content: center;
  grid-auto-flow: column;
  gap: var(--space-2);
  align-items: center;
  border-radius: var(--radius-md);
  background: var(--sdc-50);
  color: var(--sdc-900);
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
  pointer-events: none;
  z-index: var(--z-raised);
`;

/* Two levels: who sent it and how to reach them, then the small print with the way out. */
const Footer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0 var(--space-4);
  padding: var(--space-3) 0 var(--space-4);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-subtle);
  font-size: var(--text-sm);
  line-height: var(--leading-footer);
  user-select: none;
  cursor: default;
`;

const FooterSmall = styled.div`
  font-size: var(--text-xs);
  color: var(--color-text-subtle);
`;
