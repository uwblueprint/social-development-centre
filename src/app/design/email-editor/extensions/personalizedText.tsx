"use client";

import * as React from "react";
import { styled } from "next-yak";
import { mergeAttributes, Node, NodeViewWrapper, ReactNodeViewRenderer, ReactRenderer, type NodeViewProps } from "@tiptap/react";
import Suggestion, { type SuggestionKeyDownProps, type SuggestionProps } from "@tiptap/suggestion";
import { PluginKey } from "@tiptap/pm/state";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";
import { Tooltip } from "@/components/ui/Tooltip";
import { emailEditorCopy as copy } from "../copy";
import { useEmailEditorContext } from "../EmailEditorContext";
import { GROUP_SUBJECTS, isAvailable, MOMENT_LABELS, variableById, type PersonalizationVariable } from "../variables";
import { PersonalizeList, type PersonalizeListHandle, type PersonalizeListProps } from "../components/PersonalizeList";

export interface PersonalizedTextOptions {
  /** The variables offered for what was typed after "{". Read on every keystroke so it follows the email moment. */
  getItems: (query: string) => PersonalizationVariable[];
}

/**
 * A member detail inside the subject or message, shown as a chip: { First name }.
 * Typing "{" opens the list; Esc removes what was typed from the "{", clicking away keeps it as text.
 */
export const PersonalizedText = Node.create<PersonalizedTextOptions>({
  name: "personalizedText",
  group: "inline",
  inline: true,
  atom: true,
  selectable: false,

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
    return ["span", mergeAttributes(HTMLAttributes), `{ ${variableById(node.attrs.id)?.label ?? node.attrs.id} }`];
  },

  renderText({ node }) {
    return `{ ${variableById(node.attrs.id)?.label ?? ""} }`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableChip);
  },

  addProseMirrorPlugins() {
    const name = this.name;
    return [
      Suggestion<PersonalizationVariable, PersonalizationVariable>({
        editor: this.editor,
        char: "{",
        pluginKey: new PluginKey(`${name}Suggestion`),
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
    ];
  },
});

type ListRenderer = ReactRenderer<PersonalizeListHandle, PersonalizeListProps>;

function renderSuggestion() {
  let component: ListRenderer | null = null;
  let host: HTMLDivElement | null = null;

  const place = (rect: DOMRect | null | undefined) => {
    if (!host || !rect) return;
    const width = host.offsetWidth || 240;
    host.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    host.style.top = `${rect.bottom + 6}px`;
  };

  return {
    onStart: (props: SuggestionProps<PersonalizationVariable, PersonalizationVariable>) => {
      component = new ReactRenderer(PersonalizeList, {
        props: { items: props.items, query: props.query, onSelect: props.command },
        editor: props.editor,
      });
      host = document.createElement("div");
      host.style.position = "fixed";
      host.style.zIndex = "var(--z-popover)";
      host.appendChild(component.element);
      document.body.appendChild(host);
      place(props.clientRect?.());
    },
    onUpdate: (props: SuggestionProps<PersonalizationVariable, PersonalizationVariable>) => {
      component?.updateProps({ items: props.items, query: props.query, onSelect: props.command });
      place(props.clientRect?.());
    },
    onKeyDown: ({ event, view, range }: SuggestionKeyDownProps) => {
      if (event.key === "Escape") {
        // Esc cancels: remove everything typed from the "{"
        view.dispatch(view.state.tr.delete(range.from, range.to));
        return true;
      }
      return component?.ref?.onKeyDown(event) ?? false;
    },
    onExit: () => {
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
  const inputId = React.useId();
  const label = `{ ${variable?.label ?? "Unknown detail"} }`;

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

  const save = () => {
    onFallbackChange?.(variable.id, draft.trim());
    setOpen(false);
  };

  return (
    <NodeViewWrapper as="span">
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) setDraft(fallback);
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
        <PopoverContent showClose={false} side="bottom" align="start">
          <FallbackForm
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <FallbackLabel htmlFor={inputId}>
              {copy.personalize.fallbackLabel(GROUP_SUBJECTS[variable.group], variable.shortLabel.toLowerCase())}
            </FallbackLabel>
            <Input
              id={inputId}
              value={draft}
              maxLength={40}
              placeholder={copy.personalize.fallbackPlaceholder}
              onChange={(e) => setDraft(e.target.value)}
            />
            <Hint>{copy.personalize.fallbackHint}</Hint>
            <Actions>
              <Button type="button" $variant="ghost" $size="sm" onClick={() => setOpen(false)}>
                {copy.personalize.cancel}
              </Button>
              <Button type="submit" $size="sm">
                {copy.personalize.save}
              </Button>
            </Actions>
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
  border: 1px solid var(--color-border);
  background: var(--color-secondary);
  color: var(--color-text);
  line-height: 22px;
  white-space: pre;
  vertical-align: baseline;
  user-select: none;

  &[data-clickable] {
    cursor: pointer;
  }
  &[data-clickable]:hover {
    background: var(--color-secondary-hover);
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

const FallbackLabel = styled.label`
  color: var(--color-text-muted);
`;

const Hint = styled.p`
  margin: 0;
  color: var(--color-text-subtle);
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
`;
