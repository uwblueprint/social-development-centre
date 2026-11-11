"use client";

import * as React from "react";
import { styled } from "next-yak";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  AtSign,
  Bold,
  Heading1,
  Highlighter,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  Paperclip,
  List,
  ListOrdered,
  Strikethrough,
  TextQuote,
  Underline,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { emailEditorCopy as copy } from "../copy";
import { toggleHeading } from "../extensions/editorShortcuts";
import { GROUP_LABELS, type PersonalizationVariable } from "../variables";
import { useShortcutLabel } from "./shortcuts";

/** Tooltips wait a moment on first hover, then show instantly while moving along the toolbar. */
const TOOLTIP_DELAY = 450;

type Mark = "bold" | "italic" | "underline" | "strike" | "highlight";
type Block = "heading" | "bulletList" | "orderedList" | "blockquote";

export interface ToolbarProps {
  editor: Editor | null;
  personalizeItems: PersonalizationVariable[];
  onPersonalize: (item: PersonalizationVariable) => void;
  /** Left out when the email can't take files yet: the Image button doesn't show. */
  onImage?: () => void;
  /** Opens the file picker for attachments. Attaching is part of writing, so it lives here with images. */
  onAttach?: () => void;
  onLink: (button: HTMLElement) => void;
}

export function Toolbar({ editor, personalizeItems, onPersonalize, onImage, onAttach, onLink }: ToolbarProps) {
  const shortcut = useShortcutLabel();
  // Roving tabindex: one toolbar button is in the tab order; arrows move between them.
  const barRef = React.useRef<HTMLDivElement>(null);
  const active = React.useRef(0);
  const getItems = () => Array.from(barRef.current?.querySelectorAll<HTMLElement>("button") ?? []);
  const syncTabIndex = () => {
    getItems().forEach((el, i) => el.setAttribute("tabindex", i === active.current ? "0" : "-1"));
  };
  React.useEffect(syncTabIndex);
  // The highlighted personalize row, for the menu's footer line.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
            highlight: e.isActive("highlight"),
            heading: e.isActive("heading", { level: 1 }),
            bulletList: e.isActive("bulletList"),
            orderedList: e.isActive("orderedList"),
            blockquote: e.isActive("blockquote"),
            link: e.isActive("link"),
          }
        : null,
  });

  const marks: { key: Mark; icon: LucideIcon; label: string; kbd: string; run: (e: Editor) => void }[] = [
    { key: "bold", icon: Bold, label: copy.toolbar.bold, kbd: "mod+B", run: (e) => e.chain().focus().toggleBold().run() },
    { key: "italic", icon: Italic, label: copy.toolbar.italic, kbd: "mod+I", run: (e) => e.chain().focus().toggleItalic().run() },
    { key: "underline", icon: Underline, label: copy.toolbar.underline, kbd: "mod+U", run: (e) => e.chain().focus().toggleUnderline().run() },
    { key: "strike", icon: Strikethrough, label: copy.toolbar.strike, kbd: "mod+shift+X", run: (e) => e.chain().focus().toggleStrike().run() },
    { key: "highlight", icon: Highlighter, label: copy.toolbar.highlight, kbd: "mod+shift+H", run: (e) => e.chain().focus().toggleHighlight().run() },
  ];
  // Lists have no shortcut in the tooltip (owner): they start from typing "- ", "* " or "1. ".
  const blocks: { key: Block; icon: LucideIcon; label: string; kbd?: string; run: (e: Editor) => void }[] = [
    { key: "heading", icon: Heading1, label: copy.toolbar.heading, kbd: "mod+alt+1", run: (e) => void toggleHeading(e) },
    { key: "bulletList", icon: List, label: copy.toolbar.bulletList, run: (e) => e.chain().focus().toggleBulletList().run() },
    { key: "orderedList", icon: ListOrdered, label: copy.toolbar.orderedList, run: (e) => e.chain().focus().toggleOrderedList().run() },
    { key: "blockquote", icon: TextQuote, label: copy.toolbar.quote, kbd: "mod+>", run: (e) => e.chain().focus().toggleBlockquote().run() },
  ];

  const tip = (label: string, kbd?: string) => (
    <TipRow>
      <span>{label}</span>
      {kbd && <kbd>{shortcut(kbd)}</kbd>}
    </TipRow>
  );

  const button = (key: string, icon: LucideIcon, label: string, pressed: boolean | undefined, onClick: () => void, kbd?: string) => (
    <Tooltip key={key} content={tip(label, kbd)} delayDuration={TOOLTIP_DELAY} pinOnClick={false}>
      <ToolButton
        type="button"
        $variant="ghost"
        aria-label={label}
        aria-pressed={pressed === undefined ? undefined : pressed}
        onMouseDown={(e) => e.preventDefault() /* keep the selection in the message */}
        onClick={onClick}
      >
        <Icon icon={icon} />
      </ToolButton>
    </Tooltip>
  );

  return (
    <Bar
      role="toolbar"
      aria-label="Formatting"
      aria-orientation="horizontal"
      ref={barRef}
      onFocus={(e) => {
        const items = getItems();
        const i = items.indexOf(e.target as HTMLElement);
        if (i >= 0) active.current = i;
        syncTabIndex();
      }}
      onKeyDown={(e) => {
        if (e.defaultPrevented || !editor) return;
        if (!(e.target instanceof Node) || !e.currentTarget.contains(e.target)) return;
        const items = getItems();
        const i = items.indexOf(e.target as HTMLElement);
        if (e.key === "Escape" || (e.key === "Tab" && e.shiftKey)) {
          // Back to the message with the caret where it was. Menus close themselves first.
          e.preventDefault();
          editor.commands.focus();
          return;
        }
        if (e.key === "Tab" && !e.shiftKey) {
          // The message sits below the toolbar, so the browser would land back in it: skip to the control after the message.
          const body = editor.view.dom;
          const tabbables = Array.from(
            document.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'),
          ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex >= 0 && !barRef.current?.contains(el) && !body.contains(el) && el !== body);
          const after = tabbables.find((el) => body.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
          if (after) {
            e.preventDefault();
            after.focus();
          }
          return;
        }
        if (i < 0) return;
        let next = -1;
        if (e.key === "ArrowRight") next = (i + 1) % items.length;
        else if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = items.length - 1;
        if (next < 0) return;
        e.preventDefault();
        active.current = next;
        syncTabIndex();
        items[next].focus();
      }}
    >
      {marks.map((m) => button(m.key, m.icon, m.label, !!state?.[m.key], () => editor && m.run(editor), m.kbd))}
      <Divider aria-hidden="true" />
      {blocks.map((b) => button(b.key, b.icon, b.label, !!state?.[b.key], () => editor && b.run(editor), b.kbd))}
      {onImage && button("image", ImageIcon, copy.toolbar.image, undefined, onImage)}
      {onAttach && button("attach", Paperclip, copy.toolbar.attach, undefined, onAttach)}
      <Tooltip content={tip(copy.toolbar.link, "mod+K")} delayDuration={TOOLTIP_DELAY} pinOnClick={false}>
        <ToolButton
          type="button"
          $variant="ghost"
          aria-label={copy.toolbar.link}
          aria-pressed={!!state?.link}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => onLink(e.currentTarget)}
          data-link-button=""
        >
          <Icon icon={LinkIcon} />
        </ToolButton>
      </Tooltip>
      <Divider aria-hidden="true" />
      <DropdownMenu>
        <Tooltip content={tip(copy.toolbar.personalizeTip)} delayDuration={TOOLTIP_DELAY} pinOnClick={false}>
          <DropdownMenuTrigger asChild>
            <ToolButton type="button" $variant="ghost" aria-label={copy.toolbar.personalize} onMouseDown={(e) => e.preventDefault()}>
              <Icon icon={AtSign} />
            </ToolButton>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
          {personalizeItems.map((item, i) => {
            const heading = item.group !== personalizeItems[i - 1]?.group && item.group !== "member" ? GROUP_LABELS[item.group] : null;
            return (
              <React.Fragment key={item.id}>
                {heading && <DropdownMenuLabel>{heading}</DropdownMenuLabel>}
                <DropdownMenuItem onSelect={() => onPersonalize(item)}>
                  <ItemName>{item.shortLabel}</ItemName>
                  <Example>{item.example}</Example>
                </DropdownMenuItem>
              </React.Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </Bar>
  );
}

const Bar = styled.div`
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  flex-wrap: wrap;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border-top: 1px solid var(--color-border-strong);
  border-bottom: 1px solid var(--color-border);

  /* With the subject in its own box, the band is the card's top edge: round with it, no second line. */
  &:first-child {
    border-top: 0;
    border-radius: calc(var(--radius-lg) - 1px) calc(var(--radius-lg) - 1px) 0 0;
  }
`;

const ToolButton = styled(Button)`
  width: 36px;
  height: 36px;
  padding: 0;
  flex: none;

  /* Pressed: the selected fill plus an inset outline, so the state doesn't rest on the fill's color alone. */
  &[aria-pressed="true"] {
    background: var(--color-bg-selected);
    color: var(--color-text);
    box-shadow: inset 0 0 0 1px var(--color-border-strong);
  }
`;

const Divider = styled.span`
  width: 1px;
  height: 24px;
  margin: 0 var(--space-1);
  background: var(--color-border);
  flex: none;
`;

const TipRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);

  kbd {
    font-family: inherit;
  }
`;


/* Two columns in every row: names share one width and one gap, so the sample values line up. */
const ItemName = styled.span`
  flex: none;
  min-width: calc(var(--space-8) + var(--space-6));
  margin-right: var(--space-4);
`;

/* The sample value: small, quiet text after the name, so the name is what you read. */
const Example = styled.span`
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
  white-space: nowrap;
`;
