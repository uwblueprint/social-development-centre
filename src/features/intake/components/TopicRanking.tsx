"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import type { Choice } from "../copy";
import type { IntakeAnswers } from "../types";

const Rankings = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const TopicList = styled.ol`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const TopicRow = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg);

  &[data-dragging] {
    opacity: 0.55;
  }

  &[data-drop-target] {
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
  }

  &:focus-within {
    box-shadow: var(--focus-ring);
  }
`;

const DragHandle = styled.span`
  display: flex;
  align-items: center;
  color: var(--color-text-muted);
  cursor: grab;
  touch-action: none;

  &:active {
    cursor: grabbing;
  }
`;

const Rank = styled.span`
  display: inline-flex;
  min-width: var(--space-6);
  justify-content: center;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
`;

const TopicLabel = styled.span`
  min-width: 0;
  color: var(--color-text);
`;

const ReorderActions = styled.div`
  display: flex;
  gap: var(--space-1);
`;

const OtherField = styled.div`
  margin-left: var(--space-4);

  @media (max-width: 30rem) {
    margin-left: 0;
  }
`;

function reorder(choices: Choice[], id: string, destination: number): Choice[] {
  const source = choices.findIndex((choice) => choice.id === id);
  if (source < 0 || destination < 0 || destination >= choices.length || source === destination) return choices;
  const next = [...choices];
  const [moved] = next.splice(source, 1);
  next.splice(destination, 0, moved);
  return next;
}

export function TopicRanking({
  choices,
  answers,
  error,
  hint,
  otherLabel,
  onOrderChange,
  onOtherChange,
}: {
  choices: Choice[];
  answers: IntakeAnswers;
  error?: string;
  hint: string;
  otherLabel: string;
  onOrderChange: (orderedIds: string[]) => void;
  onOtherChange: (value: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const orderedChoices = [...choices].sort((a, b) => {
    const rankA = answers.topicRanks[a.id] ?? Number.MAX_SAFE_INTEGER;
    const rankB = answers.topicRanks[b.id] ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB || choices.indexOf(a) - choices.indexOf(b);
  });
  const hasRanking = Object.values(answers.topicRanks).some((rank) => rank !== null);

  function commitOrder(next: Choice[]) {
    onOrderChange(next.map((choice) => choice.id));
  }

  function moveTopic(id: string, destination: number) {
    commitOrder(reorder(orderedChoices, id, destination));
  }

  return (
    <Rankings>
      <p>{hint}</p>
      <TopicList aria-label="Rank the topics">
        {orderedChoices.map((choice, index) => (
          <TopicRow
            key={choice.id}
            draggable
            aria-roledescription="draggable"
            aria-label={`Rank ${index + 1}: ${choice.label}`}
            data-dragging={draggedId === choice.id ? "" : undefined}
            onDragStart={(event) => {
              setDraggedId(choice.id);
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", choice.id);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={(event) => {
              event.preventDefault();
              const movedId = event.dataTransfer.getData("text/plain") || draggedId;
              if (!movedId) return;
              commitOrder(reorder(orderedChoices, movedId, index));
              setDraggedId(null);
            }}
            onDragEnd={() => {
              setDraggedId(null);
            }}
          >
            <DragHandle aria-hidden="true">
              <Icon icon={GripVertical} size={16} />
            </DragHandle>
            <TopicLabel>
              <Rank>{index + 1}.</Rank> {choice.label}
            </TopicLabel>
            <ReorderActions>
              {index > 0 && (
                <Button
                  type="button"
                  $variant="ghost"
                  $size="sm"
                  aria-label={`Move ${choice.label} up`}
                  onClick={() => moveTopic(choice.id, index - 1)}
                >
                  <Icon icon={ArrowUp} size={16} />
                </Button>
              )}
              {index < orderedChoices.length - 1 && (
                <Button
                  type="button"
                  $variant="ghost"
                  $size="sm"
                  aria-label={`Move ${choice.label} down`}
                  onClick={() => moveTopic(choice.id, index + 1)}
                >
                  <Icon icon={ArrowDown} size={16} />
                </Button>
              )}
            </ReorderActions>
          </TopicRow>
        ))}
      </TopicList>
      {error && <p role="alert">{error}</p>}
      {hasRanking && (
        <OtherField>
          <Field label={otherLabel}>
            {(props) => (
              <Input
                {...props}
                name="topicsOther"
                value={answers.topicsOther}
                maxLength={120}
                autoComplete="off"
                onChange={(event) => onOtherChange(event.target.value)}
              />
            )}
          </Field>
        </OtherField>
      )}
    </Rankings>
  );
}
