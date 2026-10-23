"use client";

import * as React from "react";
import { styled } from "next-yak";
import { emailEditorCopy as copy } from "../copy";
import { GROUP_LABELS, type PersonalizationVariable } from "../variables";

export interface PersonalizeListProps {
  items: PersonalizationVariable[];
  query: string;
  onSelect: (item: PersonalizationVariable) => void;
}

export interface PersonalizeListHandle {
  /** Arrow keys move, Enter or Tab inserts. Returns true when the key was handled. */
  onKeyDown: (event: KeyboardEvent) => boolean;
}

/**
 * The list shown after typing "{" in the subject or message. Keyboard-driven from the editor:
 * the editor keeps focus, and this list follows its arrow keys.
 */
export const PersonalizeList = React.forwardRef<PersonalizeListHandle, PersonalizeListProps>(function PersonalizeList(
  { items, query, onSelect },
  ref,
) {
  const [active, setActive] = React.useState(0);
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

  return (
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
              <span>{item.shortLabel}</span>
              <Example>{item.example}</Example>
            </Option>
          </React.Fragment>
        );
      })}
      <Foot>{copy.personalize.braceHint}</Foot>
    </Panel>
  );
});

const Panel = styled.div`
  width: 240px;
  max-height: 340px;
  overflow-y: auto;
  padding: var(--space-1);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
`;

const Group = styled.div`
  padding: var(--space-2) var(--space-2) var(--space-1);
  color: var(--color-text-subtle);
`;

const Option = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2);
  border-radius: var(--radius-md);
  cursor: pointer;

  &[data-active] {
    background: var(--color-bg-hover);
  }
`;

const Example = styled.span`
  color: var(--color-text-subtle);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`;

const Empty = styled.div`
  padding: var(--space-2);
  color: var(--color-text-muted);
`;

const Foot = styled.div`
  margin-top: var(--space-1);
  padding: var(--space-2) var(--space-2) var(--space-1);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-subtle);
`;
