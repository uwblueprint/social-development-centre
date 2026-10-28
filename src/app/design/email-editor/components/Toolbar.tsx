"use client";

import * as React from "react";
import { styled } from "next-yak";
import { useEditorState, type Editor } from "@tiptap/react";
import {
  Bold,
  Braces,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
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
import { GROUP_LABELS, type PersonalizationVariable } from "../variables";
import { useShortcutLabel } from "./shortcuts";

/** Tooltips wait a moment on first hover, then show instantly while moving along the toolbar. */
const TOOLTIP_DELAY = 450;

type Mark = "bold" | "italic";
type Block = "bulletList" | "orderedList";

export interface ToolbarProps {
  editor: Editor | null;
  personalizeItems: PersonalizationVariable[];
  onPersonalize: (item: PersonalizationVariable) => void;
  onLink: (button: HTMLElement) => void;
}

export function Toolbar({ editor, personalizeItems, onPersonalize, onLink }: ToolbarProps) {
  const shortcut = useShortcutLabel();
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            bulletList: e.isActive("bulletList"),
            orderedList: e.isActive("orderedList"),
            link: e.isActive("link"),
          }
        : null,
  });

  const marks: { key: Mark; icon: LucideIcon; label: string; kbd: string; run: (e: Editor) => void }[] = [
    { key: "bold", icon: Bold, label: copy.toolbar.bold, kbd: "mod+B", run: (e) => e.chain().focus().toggleBold().run() },
    { key: "italic", icon: Italic, label: copy.toolbar.italic, kbd: "mod+I", run: (e) => e.chain().focus().toggleItalic().run() },
  ];
  // Lists have no shortcut in the tooltip (owner): they start from typing "- ", "* " or "1. ".
  const blocks: { key: Block; icon: LucideIcon; label: string; kbd?: string; run: (e: Editor) => void }[] = [
    { key: "bulletList", icon: List, label: copy.toolbar.bulletList, run: (e) => e.chain().focus().toggleBulletList().run() },
    { key: "orderedList", icon: ListOrdered, label: copy.toolbar.orderedList, run: (e) => e.chain().focus().toggleOrderedList().run() },
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
        <Icon icon={icon} size={20} />
      </ToolButton>
    </Tooltip>
  );

  return (
    <Bar role="toolbar" aria-label="Formatting">
      {marks.map((m) => button(m.key, m.icon, m.label, !!state?.[m.key], () => editor && m.run(editor), m.kbd))}
      <Divider aria-hidden="true" />
      {blocks.map((b) => button(b.key, b.icon, b.label, !!state?.[b.key], () => editor && b.run(editor), b.kbd))}
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
          <Icon icon={LinkIcon} size={20} />
        </ToolButton>
      </Tooltip>
      <Divider aria-hidden="true" />
      <DropdownMenu>
        <Tooltip content={tip(copy.toolbar.personalizeTip)} delayDuration={TOOLTIP_DELAY} pinOnClick={false}>
          <DropdownMenuTrigger asChild>
            <PersonalizeButton type="button" $variant="ghost" onMouseDown={(e) => e.preventDefault()}>
              {copy.toolbar.personalize}
              <Icon icon={Braces} size={16} />
            </PersonalizeButton>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
          {personalizeItems.map((item, i) => {
            const heading = item.group !== personalizeItems[i - 1]?.group && item.group !== "member" ? GROUP_LABELS[item.group] : null;
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
  padding: var(--space-2);
  background: var(--color-bg);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
`;

const ToolButton = styled(Button)`
  width: 36px;
  height: 36px;
  padding: 0;
  flex: none;

  &[aria-pressed="true"] {
    background: var(--color-bg-selected);
    color: var(--color-text);
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

  kbd {
    font-family: inherit;
  }
`;

