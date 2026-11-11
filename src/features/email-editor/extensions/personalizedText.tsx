"use client";

import * as React from "react";
import { styled } from "next-yak";
import { mergeAttributes, Node, NodeViewWrapper, ReactNodeViewRenderer, ReactRenderer, type NodeViewProps } from "@tiptap/react";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { emailEditorCopy as copy } from "../copy";
import { useEmailEditorContext } from "../EmailEditorContext";
import { isAvailable, MOMENT_LABELS, variableById, type PersonalizationVariable } from "../variables";
import { ghostTabKeyStyle, PersonalizeList, type PersonalizeListHandle, type PersonalizeListProps } from "../components/PersonalizeList";

export interface PersonalizedTextOptions {
  /** The variables offered for what was typed after "@". Read on every keystroke so it follows the email moment. */
  getItems: (query: string) => PersonalizationVariable[];
}

/**
 * A member detail inside the subject or message, shown as a chip: @First name.
 * Typing "@" opens the list; Esc removes what was typed from the "@", clicking away keeps it as text.
 */
export const PersonalizedText = Node.create<PersonalizedTextOptions>({
  name: "personalizedText",
  group: "inline",
  inline: true,
  atom: true,
  selectable: true,

  addOptions() {
    return { getItems: () => [] };
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-variable"),
        renderHTML: (attrs) => ({ "data-variable": attrs.id }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-variable]" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), `@${variableById(node.attrs.id)?.label ?? node.attrs.id}`];
  },

  renderText({ node }) {
    return `@${variableById(node.attrs.id)?.label ?? ""}`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableChip);
  },

  addProseMirrorPlugins() {
    const name = this.name;
    return [
      Suggestion<PersonalizationVariable, PersonalizationVariable>({
        editor: this.editor,
        char: "@",
        pluginKey: suggestionKey,
        allowSpaces: false,
        items: ({ query }) => this.options.getItems(query),
        command: ({ editor, range, props }) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              { type: name, attrs: { id: props.id } },
              { type: "text", text: " " },
            ])
            .run();
        },
        render: renderSuggestion,
      }),
      // The completion ghost: the rest of the highlighted name plus a Tab key, inline after the typed query (not in the doc).
      new Plugin<{ pos: number; rest: string } | null>({
        key: ghostKey,
        state: {
          init: () => null,
          apply: (tr, value) => {
            const meta = tr.getMeta(ghostKey);
            if (meta !== undefined) return meta;
            return value && tr.docChanged ? { ...value, pos: tr.mapping.map(value.pos, 1) } : value;
          },
        },
        props: {
          decorations: (state) => {
            const ghost = ghostKey.getState(state);
            if (!ghost || !ghost.rest || ghost.pos > state.doc.content.size) return null;
            return DecorationSet.create(state.doc, [
              Decoration.widget(ghost.pos, () => buildGhost(ghost.rest), { side: 1, key: `ghost:${ghost.rest}`, ignoreSelection: true }),
            ]);
          },
        },
      }),
      // Closing punctuation typed right after a tag's auto-space takes the space's place: "@First name" + "," -> "@First name,".
      new Plugin({
        key: new PluginKey(`${name}ClosingPunctuation`),
        props: {
          handleTextInput: (view, from, to, text) => {
            if (from !== to || !CLOSING_PUNCTUATION.test(text)) return false;
            const { state } = view;
            if (!state.selection.empty || from < 2) return false;
            const $from = state.doc.resolve(from);
            const space = $from.nodeBefore;
            if (!space?.isText || !space.text?.endsWith(" ")) return false;
            // The space must be the whole text node (or its end) directly after the tag.
            const spaceStart = from - 1;
            const before = state.doc.resolve(spaceStart).nodeBefore;
            if (before?.type.name !== name) return false;
            view.dispatch(state.tr.insertText(text, spaceStart, from));
            return true;
          },
        },
      }),
      // A tag is one character: a drag selection covers all of it or none, and a covered tag shows as selected.
      new Plugin({
        key: new PluginKey(`${name}InSelection`),
        props: {
          decorations: (state) => {
            const { from, to, empty } = state.selection;
            if (empty) return null;
            const marks: Decoration[] = [];
            state.doc.nodesBetween(from, to, (node, pos) => {
              if (node.type.name === name && pos >= from && pos + node.nodeSize <= to)
                marks.push(Decoration.node(pos, pos + node.nodeSize, { class: "is-in-selection" }));
            });
            return DecorationSet.create(state.doc, marks);
          },
        },
      }),
    ];
  },
});

/** Lets the body's Tab shortcut step aside while the "@" list is open (Tab accepts there). */
export const suggestionKey = new PluginKey("personalizedTextSuggestion");

const ghostKey = new PluginKey<{ pos: number; rest: string } | null>("personalizedTextGhost");

function buildGhost(rest: string) {
  const el = document.createElement("span");
  el.contentEditable = "false";
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = "color: var(--color-text-placeholder); user-select: none; pointer-events: none; white-space: pre;";
  el.append(rest);
  const key = document.createElement("kbd");
  key.style.cssText = `${ghostTabKeyStyle} margin-left: var(--space-1);`;
  key.textContent = "Tab";
  el.append(key);
  return el;
}

const CLOSING_PUNCTUATION = /^[.,!?;:)\]}…'’"”]$/;

type ListRenderer = ReactRenderer<PersonalizeListHandle, PersonalizeListProps>;

function renderSuggestion() {
  let component: ListRenderer | null = null;
  let host: HTMLDivElement | null = null;

  let view: EditorView | null = null;
  let anchor = 0;
  const setGhost = (rest: string) => {
    if (!view || view.isDestroyed) return;
    const current = ghostKey.getState(view.state);
    if ((current?.rest ?? "") === rest && (rest === "" || current?.pos === anchor)) return;
    view.dispatch(view.state.tr.setMeta(ghostKey, rest ? { pos: anchor, rest } : null));
  };

  const place = (rect: DOMRect | null | undefined) => {
    if (!host || !rect) return;
    const width = host.offsetWidth || 240;
    host.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    host.style.top = `${rect.bottom + 6}px`;
  };

  return {
    onStart: (props: SuggestionProps<PersonalizationVariable, PersonalizationVariable>) => {
      component = new ReactRenderer(PersonalizeList, {
        props: { items: props.items, query: props.query, onSelect: props.command, anchor: props.range.to, onGhost: setGhost },
        editor: props.editor,
      });
      view = props.editor.view;
      anchor = props.range.to;
      host = document.createElement("div");
      host.style.position = "fixed";
      // Start pinned to the corner, never in the page's flow, so the page can't grow and jump before it's placed.
      host.style.top = "0";
      host.style.left = "0";
      host.style.zIndex = "var(--z-popover)";
      host.appendChild(component.element);
      document.body.appendChild(host);
      place(props.clientRect?.());
    },
    onUpdate: (props: SuggestionProps<PersonalizationVariable, PersonalizationVariable>) => {
      anchor = props.range.to;
      component?.updateProps({ items: props.items, query: props.query, onSelect: props.command, anchor, onGhost: setGhost });
      place(props.clientRect?.());
    },
    onKeyDown: ({ event, view, range }: SuggestionKeyDownProps) => {
      if (event.key === "Escape") {
        // Esc cancels: remove everything typed from the "@"
        view.dispatch(view.state.tr.delete(range.from, range.to));
        return true;
      }
      return component?.ref?.onKeyDown(event) ?? false;
    },
    onExit: () => {
      if (view && !view.isDestroyed && ghostKey.getState(view.state)) view.dispatch(view.state.tr.setMeta(ghostKey, null));
      view = null;
      component?.destroy();
      host?.remove();
      component = null;
      host = null;
    },
  };
}

/** The chip. Hover says what shows when the detail is empty; clicking a name lets the admin change that. */
function VariableChip({ node }: NodeViewProps) {
  const { moment, fallbacks, onFallbackChange } = useEmailEditorContext();
  const variable = variableById(node.attrs.id);
  const available = !!variable && isAvailable(variable.id, moment);
  const fallback = variable ? (fallbacks[variable.id] ?? variable.fallback) : "";
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(fallback);
  const opened = React.useRef(fallback);
  const inputId = React.useId();
  const label = `@${variable?.label ?? "Unknown detail"}`;

  if (!variable || !available) {
    return (
      <NodeViewWrapper as="span">
        <Tooltip content={copy.personalize.notAvailable(MOMENT_LABELS[moment])} pinOnClick={false}>
          <Chip data-invalid="">{label}</Chip>
        </Tooltip>
      </NodeViewWrapper>
    );
  }

  if (variable.alwaysPresent) {
    return (
      <NodeViewWrapper as="span">
        <Chip>{label}</Chip>
      </NodeViewWrapper>
    );
  }

  // Saves as she types, like the rest of the email; Enter closes, Esc puts back what was there.
  const commit = (value: string) => {
    setDraft(value);
    onFallbackChange?.(variable.id, value.trim());
  };

  return (
    <NodeViewWrapper as="span">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) {
            opened.current = fallback;
            setDraft(fallback);
          }
          setOpen(next);
        }}
      >
        <Tooltip content={copy.personalize.ifEmpty(fallback)} delayDuration={450} pinOnClick={false}>
          <PopoverTrigger asChild>
            <Chip
              role="button"
              tabIndex={0}
              data-clickable=""
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setDraft(fallback);
                  setOpen(true);
                }
              }}
            >
              {label}
            </Chip>
          </PopoverTrigger>
        </Tooltip>
        <PopoverContent
          showClose={false}
          side="bottom"
          align="start"
          // Esc puts back what was there when it opened.
          onEscapeKeyDown={() => commit(opened.current)}
        >
          <FallbackForm
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
            }}
          >
            <FallbackLabel htmlFor={inputId}>{copy.personalize.fallbackLabel}</FallbackLabel>
            <Input
              id={inputId}
              value={draft}
              maxLength={40}
              placeholder={copy.personalize.fallbackPlaceholder}
              onChange={(e) => commit(e.target.value)}
              />
          </FallbackForm>
        </PopoverContent>
      </Popover>
    </NodeViewWrapper>
  );
}

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  margin: 0 2px;
  padding: 0 var(--space-1);
  border-radius: var(--radius-sm);
  border: 1px solid transparent;
  background: var(--color-mention-subtle);
  color: var(--color-mention);
  line-height: var(--leading-body);
  white-space: pre;
  vertical-align: baseline;
  user-select: none;

  &[data-clickable] {
    cursor: pointer;
  }
  &[data-clickable]:hover {
    background: var(--color-mention-hover);
  }
  /* Selected (clicked, or inside a drag selection): the colours swap, hovered or not. */
  .ProseMirror-selectednode &&,
  .is-in-selection && {
    background: var(--color-mention);
    color: var(--color-mention-subtle);
  }
  &:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
  &[data-invalid] {
    background: var(--color-danger-subtle);
    border-color: var(--color-danger-border);
    color: var(--color-danger);
    text-decoration: line-through;
  }
`;

const FallbackForm = styled.form`
  display: grid;
  gap: var(--space-2);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
`;

/* Label text is --text-sm like the kit's Label; the hint stays --text-xs like a field hint. */
const FallbackLabel = styled.label`
  color: var(--color-text-muted);
  font-size: var(--text-sm);
`;

