"use client";

import * as React from "react";
import { styled } from "next-yak";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Braces,
  Heading1,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
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
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { emailEditorCopy as copy } from "../copy";
import { toggleHeading } from "../extensions/editorShortcuts";
import { GROUP_LABELS, type PersonalizationVariable } from "../variables";
import { useShortcutLabel } from "./shortcuts";

/** Tooltips wait a moment on first hover, then show instantly while moving along the toolbar. */
const TOOLTIP_DELAY = 450;

type Mark = "bold" | "italic" | "underline" | "strike";
type Block = "heading" | "bulletList" | "orderedList" | "blockquote";

export interface ToolbarProps {
  editor: Editor | null;
  personalizeItems: PersonalizationVariable[];
  onPersonalize: (item: PersonalizationVariable) => void;
  onImage: () => void;
  onLink: (button: HTMLElement) => void;
}

export function Toolbar({ editor, personalizeItems, onPersonalize, onImage, onLink }: ToolbarProps) {
  const shortcut = useShortcutLabel();
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            underline: e.isActive("underline"),
            strike: e.isActive("strike"),
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
        <Icon icon={icon} size={20} strokeWidth={2} />
      </ToolButton>
    </Tooltip>
  );

  let lastGroup: string | null = null;

  return (
    <Bar role="toolbar" aria-label="Formatting">
      {marks.map((m) => button(m.key, m.icon, m.label, !!state?.[m.key], () => editor && m.run(editor), m.kbd))}
      <Divider aria-hidden="true" />
      {blocks.map((b) => button(b.key, b.icon, b.label, !!state?.[b.key], () => editor && b.run(editor), b.kbd))}
      {button("image", ImageIcon, copy.toolbar.image, undefined, onImage)}
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
          <Icon icon={LinkIcon} size={20} strokeWidth={2} />
        </ToolButton>
      </Tooltip>
      <Divider aria-hidden="true" />
      <DropdownMenu>
        <Tooltip content={tip(copy.toolbar.personalizeTip)} delayDuration={TOOLTIP_DELAY} pinOnClick={false}>
          <DropdownMenuTrigger asChild>
            <PersonalizeButton type="button" $variant="ghost" onMouseDown={(e) => e.preventDefault()}>
              {copy.toolbar.personalize}
              <Icon icon={Braces} size={16} strokeWidth={2} />
            </PersonalizeButton>
          </DropdownMenuTrigger>
        </Tooltip>
        <SmallMenu align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
          {personalizeItems.map((item) => {
            const heading = item.group !== lastGroup && item.group !== "member" ? GROUP_LABELS[item.group] : null;
            lastGroup = item.group;
            return (
              <React.Fragment key={item.id}>
                {heading && <DropdownMenuLabel>{heading}</DropdownMenuLabel>}
                <DropdownMenuItem onSelect={() => onPersonalize(item)}>
                  {item.shortLabel}
                  <DropdownMenuShortcut>{item.example}</DropdownMenuShortcut>
                </DropdownMenuItem>
              </React.Fragment>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{copy.personalize.menuHint}</DropdownMenuLabel>
        </SmallMenu>
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
  padding: var(--space-2);
  background: var(--color-bg);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  overflow-x: auto;
  scrollbar-width: none;
`;

const ToolButton = styled(Button)`
  width: 36px;
  height: 36px;
  padding: 0;
  flex: none;

  &[aria-pressed="true"] {
    background: var(--color-brand-subtle);
    color: var(--color-brand);
  }
`;

const PersonalizeButton = styled(Button)`
  height: 36px;
  padding: 0 var(--space-2);
  gap: var(--space-1);
  flex: none;
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
  font-size: var(--text-2xs);
  line-height: var(--leading-2xs);

  kbd {
    opacity: 0.7;
  }
`;

/** Popup text is 12px across the editor (owner). */
const SmallMenu = styled(DropdownMenuContent)`
  min-width: 240px;

  [role="menuitem"],
  [role="separator"] + div,
  div {
    font-size: var(--text-2xs);
  }
`;
