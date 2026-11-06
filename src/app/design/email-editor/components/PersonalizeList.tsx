"use client";

import * as React from "react";
import { styled } from "next-yak";
import { emailEditorCopy as copy } from "../copy";
import { GROUP_LABELS, GROUP_SUBJECTS, type PersonalizationVariable } from "../variables";

/** What a member without this detail sees. Shown under both personalize menus for the highlighted row. */
export function fallbackLine(item: PersonalizationVariable) {
  return copy.personalize.fallbackLine(GROUP_SUBJECTS[item.group], item.shortLabel.toLowerCase(), item.fallback, !!item.alwaysPresent);
}

export interface PersonalizeListProps {
  items: PersonalizationVariable[];
  query: string;
  onSelect: (item: PersonalizationVariable) => void;
  /** Where the typed "@query" ends; changes re-send the ghost so it follows the caret. */
  anchor?: number;
  /** The rest of the highlighted name ("" for none), drawn inline in the editor right after the typed query. */
  onGhost?: (rest: string) => void;
}

export interface PersonalizeListHandle {
  /** Arrow keys move, Enter or Tab inserts. Returns true when the key was handled. */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * The list shown after typing "@" in the subject or message. Keyboard-driven from the editor:
 * the editor keeps focus, and this list follows its arrow keys.
 */
export const PersonalizeList = React.forwardRef<PersonalizeListHandle, PersonalizeListProps>(function PersonalizeList(
  { items, query, onSelect, anchor, onGhost },
  ref,
) {
  // Typing jumps the highlight to the first name that starts with what's typed; arrows and hover take over after.
  const [picked, setPicked] = React.useState<{ query: string; index: number } | null>(null);
  const typedIndex = Math.max(0, items.findIndex((it) => it.shortLabel.toLowerCase().startsWith(query.toLowerCase())));
  const active = picked && picked.query === query ? picked.index : typedIndex;
  const setActive = (index: number) => setPicked({ query, index });
  const activeIndex = Math.min(active, Math.max(0, items.length - 1));

  React.useImperativeHandle(ref, () => ({
    onKeyDown: (event) => {
      if (!items.length) return false;
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const step = event.key === "ArrowDown" ? 1 : -1;
        setActive((activeIndex + step + items.length) % items.length);
        return true;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        onSelect(items[activeIndex]);
        return true;
      }
      return false;
    },
  }));

  // The rest of the highlighted name, ghosted where she's typing, with a Tab hint: Tab accepts it.
  const current = items[activeIndex];
  const typed = query.toLowerCase();
  const rest = current && current.shortLabel.toLowerCase().startsWith(typed) ? current.shortLabel.slice(query.length) : "";
  React.useEffect(() => {
    onGhost?.(rest);
  }, [rest, anchor, onGhost]);

  return (
    <>
    <Panel role="listbox" aria-label={copy.toolbar.personalize}>
      {items.length === 0 && <Empty>{copy.personalize.noMatch(query)}</Empty>}
      {items.map((item, i) => {
        const heading = item.group !== items[i - 1]?.group && item.group !== "member" ? GROUP_LABELS[item.group] : null;
        return (
          <React.Fragment key={item.id}>
            {heading && <Group>{heading}</Group>}
            <Option
              role="option"
              tabIndex={-1}
              aria-selected={i === activeIndex}
              data-active={i === activeIndex || undefined}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault(); // keep the caret in the editor
                onSelect(item);
              }}
            >
              <ItemName>{item.shortLabel}</ItemName>
              <Example>{item.example}</Example>
            </Option>
          </React.Fragment>
        );
      })}
    </Panel>
    </>
  );
});

const Panel = styled.div`
  width: max-content;
  min-width: 240px;
  max-height: 340px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: var(--space-1);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  /* Options are --text-sm like the kit's menu items; group labels and hints are --text-xs. */
  font-size: var(--text-sm);
  line-height: var(--leading-ui);
`;

const Group = styled.div`
  padding: var(--space-2) var(--space-2) var(--space-1);
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
`;

const Option = styled.div`
  display: flex;
  align-items: baseline;
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;

  &[data-active] {
    background: var(--color-bg-hover);
  }
`;

/* Names share one width and one gap, so the sample values line up in a second column. */
const ItemName = styled.span`
  flex: none;
  min-width: calc(var(--space-8) + var(--space-6));
  margin-right: var(--space-4);
`;

const Example = styled.span`
  margin-left: auto;
  color: var(--color-text-subtle);
  font-size: var(--text-xs);
  white-space: nowrap;
`;

const Empty = styled.div`
  padding: var(--space-2);
  color: var(--color-text-muted);
`;


/* Exported for the inline ghost widget in the editor. */
export const ghostTabKeyStyle = `
  padding: 0 var(--space-1);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  color: var(--color-text-subtle);
`;
