"use client";

import * as React from "react";
import { styled } from "next-yak";
import { EditorContent, mergeAttributes, Node, NodeViewWrapper, ReactNodeViewRenderer, useEditor, useEditorState, type NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Plugin, PluginKey, TextSelection } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import { Bold, Italic, Underline, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { Tooltip } from "@/components/ui/Tooltip";
import { plainJson } from "@/features/email-editor/plainJson";
import { countLinks, linkLabel, type FooterDoc, type FooterLinkKind } from "./doc";
import { ReferLinkContext, ReferLinkTag } from "./ReferLinkEditor";

const dropKey = new PluginKey<number | null>("footerDropCaret");

/** Where a drop at these coordinates lands: always inside a line of text, never between paragraphs. */
function textPosAt(view: EditorView, event: DragEvent): number | null {
  const hit = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!hit) return null;
  const $pos = view.state.doc.resolve(hit.pos);
  return $pos.parent.inlineContent ? hit.pos : TextSelection.near($pos).from;
}

/**
 * While dragging, a vertical caret where the drop will land (owner: always a vertical line). Links can only sit
 * in a line of text, so the spot snaps to the nearest place in a line, and a dropped link goes exactly there.
 */
function dropCaret() {
  const set = (view: EditorView, pos: number | null) => {
    if (dropKey.getState(view.state) !== pos) view.dispatch(view.state.tr.setMeta(dropKey, pos));
  };
  return new Plugin<number | null>({
    key: dropKey,
    state: {
      init: () => null,
      apply: (tr, prev) => {
        const meta = tr.getMeta(dropKey) as number | null | undefined;
        if (meta !== undefined) return meta;
        return prev === null ? null : tr.mapping.map(prev);
      },
    },
    props: {
      decorations(state) {
        const pos = dropKey.getState(state);
        if (pos == null) return null;
        return DecorationSet.create(state.doc, [
          Decoration.widget(pos, () => {
            const caret = document.createElement("span");
            caret.className = "footer-drop-caret";
            return caret;
          }),
        ]);
      },
      handleDOMEvents: {
        dragover(view, event) {
          set(view, textPosAt(view, event));
          return false;
        },
        dragleave(view, event) {
          // Left the footer altogether (not just moved onto a child of it).
          const into = event.relatedTarget;
          if (!(into instanceof HTMLElement) || !view.dom.contains(into)) set(view, null);
          return false;
        },
        dragend(view) {
          set(view, null);
          return false;
        },
      },
      handleDrop(view, event, slice) {
        const target = textPosAt(view, event);
        set(view, null);
        const node = slice.content.childCount === 1 ? slice.content.firstChild : null;
        if (target == null || node?.type.name !== "footerLink") return false;
        // There's only ever one of each link, so a drop is always a move: take it out of where it is now
        // (found by kind, not by the selection, which isn't always the dragged tag), then put it at the caret.
        let tr = view.state.tr;
        let from = -1;
        tr.doc.descendants((n, pos) => {
          if (from < 0 && n.type.name === "footerLink" && n.attrs.kind === node.attrs.kind) from = pos;
          return from < 0;
        });
        if (from >= 0) tr = tr.delete(from, from + 1);
        tr = tr.insert(tr.mapping.map(target), node);
        view.dispatch(tr.scrollIntoView());
        return true;
      },
    },
  });
}

/**
 * A fixed link in the footer, shown as the kit's Tag. It's one character to the cursor, so you type before or
 * after it like a word, and you can drag it to another spot in the footer. Deleting or copying it is refused
 * (see the plugin below); a drag is a move, so it's allowed.
 */
const FooterLink = Node.create({
  name: "footerLink",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      kind: {
        default: "unsubscribe",
        parseHTML: (el) => el.getAttribute("data-footer-link"),
        renderHTML: (attrs) => ({ "data-footer-link": attrs.kind }),
      },
      // The refer link's words, chosen in Settings (the other links always say the same).
      label: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-label"),
        renderHTML: (attrs) => (attrs.label ? { "data-label": attrs.label } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-footer-link]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), linkLabel(node.toJSON() as FooterDoc)];
  },

  renderText({ node }) {
    return linkLabel(node.toJSON() as FooterDoc);
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkTag);
  },

  addProseMirrorPlugins() {
    return [
      dropCaret(),
      new Plugin({
        // Refuse any change that removes a fixed link or adds a second one (a paste, a cut, select-all and type).
        filterTransaction: (tr, state) => {
          if (!tr.docChanged) return true;
          const before = countLinks(state.doc.toJSON() as FooterDoc);
          const after = countLinks(tr.doc.toJSON() as FooterDoc);
          return (Object.keys(after) as FooterLinkKind[]).every((k) => after[k] >= before[k] && after[k] <= 1);
        },
      }),
    ];
  },
});

function LinkTag({ node }: NodeViewProps) {
  // The refer link's words come from Settings (they can change there before the footer is saved again).
  const refer = React.useContext(ReferLinkContext);
  const json = node.toJSON() as FooterDoc;
  return (
    <NodeViewWrapper as="span">
      <Grab data-drag-handle="" contentEditable={false}>
        {json.attrs?.kind === "refer" && refer ? <ReferLinkTag link={refer} /> : <Tag>{linkLabel(json)}</Tag>}
      </Grab>
    </NodeViewWrapper>
  );
}

export interface FooterEditorProps {
  /** Read once when the editor starts. */
  initial: FooterDoc;
  onChange: (doc: FooterDoc) => void;
  /** From `Field`. */
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-labelledby"?: string;
  /** A label's `for` can't name an editable area, so name it here (or with aria-labelledby). */
  "aria-label"?: string;
}

/**
 * The email footer, as members see it under every email: a few short lines, with bold, italic and underline.
 * The unsubscribe and cancel-membership links are locked tags you can type around.
 */
export function FooterEditor({ initial, onChange, id, "aria-describedby": describedBy, "aria-invalid": invalid, "aria-labelledby": labelledBy, "aria-label": ariaLabel }: FooterEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        link: false,
        // Replaced by the drop caret below: the built-in one draws a horizontal line between paragraphs.
        dropcursor: false,
        gapcursor: false,
      }),
      FooterLink,
    ],
    content: initial,
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        ...(labelledBy ? { "aria-labelledby": labelledBy } : {}),
        ...(ariaLabel ? { "aria-label": ariaLabel } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
      },
    },
    // Plain data: ProseMirror's attrs have no prototype, and a server action can't read those (plainJson.ts).
    onUpdate: ({ editor }) => onChange(plainJson(editor.getJSON()) as FooterDoc),
  });

  const marks = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      underline: editor?.isActive("underline") ?? false,
    }),
  });

  const button = (mark: "bold" | "italic" | "underline", icon: LucideIcon, label: string, keys: string) => (
    <Tooltip content={`${label} (${keys})`} pinOnClick={false}>
      <ToolButton
        type="button"
        $variant="ghost"
        $size="sm"
        aria-label={label}
        aria-pressed={marks?.[mark] ?? false}
        // Keep the selection in the footer.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          const chain = editor?.chain().focus();
          if (mark === "bold") chain?.toggleBold().run();
          else if (mark === "italic") chain?.toggleItalic().run();
          else chain?.toggleUnderline().run();
        }}
      >
        <Icon icon={icon} size={16} />
      </ToolButton>
    </Tooltip>
  );

  return (
    <Frame data-invalid={invalid ? "" : undefined}>
      <Bar role="toolbar" aria-label="Footer formatting">
        {button("bold", Bold, "Bold", "Ctrl+B")}
        {button("italic", Italic, "Italic", "Ctrl+I")}
        {button("underline", Underline, "Underline", "Ctrl+U")}
      </Bar>
      <Content editor={editor} />
    </Frame>
  );
}

/* A field like Textarea: the kit's border, radius and focus ring, with a small toolbar along the top. */
const Frame = styled.div`
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-bg);

  &:hover:not(:focus-within) {
    border-color: var(--color-text-muted);
  }
  &:focus-within {
    border-color: var(--color-focus);
    box-shadow: var(--focus-ring-text);
  }
  &[data-invalid] {
    border-color: var(--color-danger);
  }
`;

const Bar = styled.div`
  display: flex;
  gap: var(--space-1);
  padding: var(--space-1);
  border-bottom: 1px solid var(--color-border);
`;

/* Pressed: the selected fill plus an inset outline, as in the email editor's toolbar, so it isn't fill alone. */
const ToolButton = styled(Button)`
  /* && so it beats the kit's $size="sm" padding whichever stylesheet loads last. */
  && {
    width: 32px;
    padding: 0;
  }
  color: var(--color-text-muted);

  &[aria-pressed="true"] {
    background: var(--color-bg-selected);
    color: var(--color-text);
    box-shadow: inset 0 0 0 1px var(--color-border-strong);
  }
`;

/* Regular text (owner): the fields' size and colour, 1.6 line height and --space-2 between paragraphs. */
const Content = styled(EditorContent)`
  & .ProseMirror {
    min-height: calc(var(--control-height) * 2);
    padding: var(--space-3);
    outline: none;
    font-size: var(--text-sm);
    line-height: var(--leading-editor);
    color: var(--color-text);
    overflow-wrap: anywhere;
  }
  & .ProseMirror p {
    margin: 0;
  }
  & .ProseMirror p + p {
    margin-top: var(--space-2);
  }
  /* Where a dragged link will land: a vertical caret in the line, the height of the text. */
  & .footer-drop-caret {
    display: inline-block;
    width: 2px;
    height: 1lh;
    margin: 0 -1px;
    vertical-align: top;
    background: var(--color-focus);
    pointer-events: none;
  }
`;

/* Holds a fixed link's Tag; the whole tag is the drag handle. */
const Grab = styled.span`
  /* The kit Tag at its full size, the same as the tags in the alert fields (owner). */
  display: inline-block;
  vertical-align: middle;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;
