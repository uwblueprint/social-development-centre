"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { styled } from "next-yak";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import type { Choice } from "../copy";
import type { IntakeAnswers } from "../types";

/*
 * Rank the topics by dragging (patterns from Linktree, Monarch and Klarna on Mobbin): the picked-up card
 * lifts and follows the pointer, the other cards slide aside to show where it will land, and every rank
 * number updates while you drag. Pointer events, so it works with touch as well as a mouse: a mouse can
 * grab anywhere on the card, touch grabs the handle so the page still scrolls. Keyboard: Space on the
 * handle picks a card up, the arrow keys move it, Space drops it and Escape puts it back. The up and down
 * buttons stay as a one-tap path (WCAG 2.5.7). Every move animates from where the card was to where it lands.
 */

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
  position: relative;
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-lg);
  background: var(--color-bg);
  user-select: none;
  transition:
    transform var(--duration-slow) var(--ease),
    border-color var(--duration) var(--ease),
    background-color var(--duration) var(--ease),
    box-shadow var(--duration) var(--ease);

  @media (pointer: fine) {
    cursor: grab;
  }

  &:hover {
    background: var(--color-bg-hover);
  }

  /* Picked up: lifted off the paper with the letter's ink shadow, following the pointer without lag. */
  &[data-lifted] {
    z-index: 1;
    border-color: var(--color-primary);
    background: var(--color-bg-hover);
    box-shadow: var(--shadow-intake-small);
    cursor: grabbing;
  }

  &[data-dragging] {
    transition:
      border-color var(--duration) var(--ease),
      box-shadow var(--duration) var(--ease);
  }

  /* Just landed: the border holds for a moment so the eye can find the card in its new place. */
  &[data-moved] {
    border-color: var(--color-primary);
  }

  &:focus-within:not([data-lifted]) {
    box-shadow: var(--focus-ring);
  }
`;

const DragHandle = styled(Button)`
  color: var(--color-text-muted);
  touch-action: none;

  @media (pointer: fine) {
    cursor: grab;
  }
`;

const Rank = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--space-6);
  height: var(--space-6);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-full);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: var(--leading-none);

  @media (max-width: 30rem) {
    width: var(--space-5);
    height: var(--space-5);
    font-size: var(--text-xs);
  }
`;

const TopicLabel = styled.span`
  min-width: 0;
  color: var(--color-text);
  line-height: var(--leading-ui);
`;

const ReorderActions = styled.div`
  display: flex;
  gap: var(--space-1);

  /* Phones: stack the arrows so the topic keeps the width. */
  @media (max-width: 30rem) {
    flex-direction: column;
    gap: 0;
  }
`;

/* Keeps the arrows lined up when the first or last card has only one of them (32px: the kit's small button). */
const ActionSlot = styled.span`
  display: inline-flex;
  width: 32px;
  height: 32px;
`;

const OtherField = styled.div`
  margin-left: var(--space-4);

  @media (max-width: 30rem) {
    margin-left: 0;
  }
`;

const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

/** How close to the top or bottom of the window a drag scrolls the page, and how fast. */
const AUTO_SCROLL_EDGE = 64;
const AUTO_SCROLL_SPEED = 12;
const MOVED_HIGHLIGHT_MS = 900;
const INSTRUCTIONS_ID = "topic-ranking-instructions";

interface PointerDrag {
  id: string;
  origin: number;
  over: number;
  /** Page Y (client Y plus scroll) where the drag started, so scrolling mid-drag keeps the card under the finger. */
  startY: number;
  offset: number;
  /** Each card's page-relative top and height when the drag started, in rank order. */
  tops: number[];
  heights: number[];
  /** How far the other cards slide to make room: the lifted card's height plus the list gap. */
  shift: number;
}

function reorder(choices: Choice[], id: string, destination: number): Choice[] {
  const source = choices.findIndex((choice) => choice.id === id);
  if (source < 0 || destination < 0 || destination >= choices.length || source === destination) return choices;
  const next = [...choices];
  const [moved] = next.splice(source, 1);
  next.splice(destination, 0, moved);
  return next;
}

/** Where the lifted card would land: the slot whose centre is closest to the card's centre. */
function landingIndex(drag: Pick<PointerDrag, "origin" | "tops" | "heights">, offset: number): number {
  const center = drag.tops[drag.origin] + drag.heights[drag.origin] / 2 + offset;
  let closest = drag.origin;
  drag.tops.forEach((top, index) => {
    const distance = Math.abs(top + drag.heights[index] / 2 - center);
    const best = Math.abs(drag.tops[closest] + drag.heights[closest] / 2 - center);
    if (distance < best) closest = index;
  });
  return closest;
}

/** The rank each card shows while a drag is under way. */
function projectedIndex(index: number, drag: PointerDrag | null): number {
  if (!drag) return index;
  if (index === drag.origin) return drag.over;
  if (drag.origin < index && index <= drag.over) return index - 1;
  if (drag.over <= index && index < drag.origin) return index + 1;
  return index;
}

/** Start a card where it was, then let its transform transition carry it to where it is now. */
function glide(row: HTMLElement, fromTop: number) {
  // Measure the resting spot with transitions off, or a card still sliding aside from a drag reads as elsewhere.
  row.style.transition = "none";
  row.style.transform = "none";
  const delta = fromTop - row.getBoundingClientRect().top;
  if (Math.abs(delta) < 1) {
    row.style.transition = "";
    row.style.transform = "";
    return;
  }
  row.style.transform = `translateY(${delta}px)`;
  void row.offsetHeight;
  row.style.transition = "";
  row.style.transform = "";
}

function slideOffset(index: number, drag: PointerDrag | null): number {
  if (!drag) return 0;
  if (index === drag.origin) return drag.offset;
  return (projectedIndex(index, drag) - index) * drag.shift;
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
  const [drag, setDrag] = useState<PointerDrag | null>(null);
  const [keyboardLift, setKeyboardLift] = useState<{ id: string; origin: number } | null>(null);
  const [movedId, setMovedId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState({ id: 0, text: "" });
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const controlRefs = useRef(new Map<string, HTMLButtonElement>());
  /** Card positions just before an order change, for the FLIP animation once the new order renders. */
  const flipFrom = useRef<Map<string, number> | null>(null);
  /** The control to put focus back on after a move re-renders the list. */
  const refocus = useRef<string | null>(null);
  const pointerY = useRef(0);
  /** The live drag, for the window listeners, which subscribe once per drag. */
  const dragRef = useRef<PointerDrag | null>(null);
  const stopFollowing = useRef<(() => void) | null>(null);

  const orderedChoices = [...choices].sort((a, b) => {
    const rankA = answers.topicRanks[a.id] ?? Number.MAX_SAFE_INTEGER;
    const rankB = answers.topicRanks[b.id] ?? Number.MAX_SAFE_INTEGER;
    return rankA - rankB || choices.indexOf(a) - choices.indexOf(b);
  });
  const orderKey = orderedChoices.map((choice) => choice.id).join("|");
  const hasRanking = Object.values(answers.topicRanks).some((rank) => rank !== null);
  const total = orderedChoices.length;

  function announce(text: string) {
    setAnnouncement((current) => ({ id: current.id + 1, text }));
  }

  function flashMoved(id: string) {
    setMovedId(id);
  }

  useEffect(() => {
    if (!movedId) return;
    const timer = window.setTimeout(() => setMovedId(null), MOVED_HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [movedId]);

  function commitOrder(next: Choice[]) {
    flipFrom.current = new Map(
      [...rowRefs.current].map(([id, row]) => [id, row.getBoundingClientRect().top] as const),
    );
    onOrderChange(next.map((choice) => choice.id));
  }

  function moveTopic(id: string, destination: number) {
    const next = reorder(orderedChoices, id, destination);
    if (next === orderedChoices) return;
    commitOrder(next);
    flashMoved(id);
    const choice = orderedChoices.find((c) => c.id === id);
    if (choice) announce(`${choice.label}, rank ${destination + 1} of ${total}.`);
  }

  // FLIP: start each card where it was before the order changed, then let the transition carry it home.
  useLayoutEffect(() => {
    const from = flipFrom.current;
    flipFrom.current = null;
    if (from) {
      for (const [id, row] of rowRefs.current) {
        const before = from.get(id);
        if (before !== undefined) glide(row, before);
      }
    }
    // React moves list items with insertBefore, which can drop focus from the one that moved.
    const key = refocus.current;
    refocus.current = null;
    if (key) {
      const [id, kind] = key.split(":");
      const target =
        controlRefs.current.get(key) ??
        controlRefs.current.get(`${id}:${kind === "up" ? "down" : "up"}`) ??
        controlRefs.current.get(`${id}:handle`);
      if (target && document.activeElement !== target) target.focus();
    }
  }, [orderKey]);

  // Stop following the pointer if the step changes mid-drag.
  useEffect(() => () => stopFollowing.current?.(), []);

  /*
   * Follow the pointer on the window so a fast drag never slips off the card. Subscribed straight from
   * pointerdown, not from an effect: a quick flick can move and let go before React has rendered.
   */
  function followPointer(id: string) {
    let frame = 0;

    function update(clientY: number) {
      pointerY.current = clientY;
      const current = dragRef.current;
      if (!current) return;
      const offset = clientY + window.scrollY - current.startY;
      const next = { ...current, offset, over: landingIndex(current, offset) };
      dragRef.current = next;
      setDrag(next);
    }

    function autoScroll() {
      const y = pointerY.current;
      const step = y < AUTO_SCROLL_EDGE ? -AUTO_SCROLL_SPEED : y > window.innerHeight - AUTO_SCROLL_EDGE ? AUTO_SCROLL_SPEED : 0;
      if (step !== 0) {
        window.scrollBy(0, step);
        update(y);
      }
      frame = window.requestAnimationFrame(autoScroll);
    }

    function onMove(event: PointerEvent) {
      event.preventDefault();
      update(event.clientY);
    }

    function finish(cancelled: boolean) {
      const current = dragRef.current;
      if (!current) return;
      const choice = orderedChoices.find((c) => c.id === id);
      if (!cancelled && current.over !== current.origin) {
        // Read positions while the cards still sit where the drag left them, then commit the new order.
        commitOrder(reorder(orderedChoices, id, current.over));
        flashMoved(id);
        if (choice) announce(`Moved ${choice.label} to rank ${current.over + 1} of ${total}.`);
      } else {
        // Dropped where it started (or cancelled): glide back from wherever it was let go.
        const row = rowRefs.current.get(id);
        if (row) flipFrom.current = new Map([[id, row.getBoundingClientRect().top]]);
      }
      stopFollowing.current?.();
      dragRef.current = null;
      setDrag(null);
    }

    function onUp() {
      finish(false);
    }

    function onCancel() {
      finish(true);
    }

    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") finish(true);
    }

    frame = window.requestAnimationFrame(autoScroll);
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    stopFollowing.current = () => {
      stopFollowing.current = null;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
    };
  }

  // A drop that stayed put still needs its glide back, which the order-keyed effect above won't run for.
  useLayoutEffect(() => {
    if (drag || !flipFrom.current || flipFrom.current.size !== 1) return;
    const [[id, before]] = [...flipFrom.current];
    flipFrom.current = null;
    const row = rowRefs.current.get(id);
    if (row) glide(row, before);
  }, [drag]);

  function startDrag(event: ReactPointerEvent<HTMLElement>, id: string, fromHandle: boolean) {
    if (event.button !== 0 || keyboardLift) return;
    // Touch scrolls the page unless it starts on the handle; other buttons and fields keep their own clicks.
    if (!fromHandle && (event.pointerType === "touch" || (event.target as HTMLElement).closest("button, input"))) return;
    event.preventDefault();
    const origin = orderedChoices.findIndex((choice) => choice.id === id);
    const rows = orderedChoices.map((choice) => rowRefs.current.get(choice.id));
    if (origin < 0 || rows.some((row) => !row)) return;
    const rects = rows.map((row) => row!.getBoundingClientRect());
    const tops = rects.map((rect) => rect.top + window.scrollY);
    const heights = rects.map((rect) => rect.height);
    const gap = rects.length > 1 ? rects[1].top - rects[0].bottom : 0;
    pointerY.current = event.clientY;
    dragRef.current = {
      id,
      origin,
      over: origin,
      startY: event.clientY + window.scrollY,
      offset: 0,
      tops,
      heights,
      shift: heights[origin] + gap,
    };
    setDrag(dragRef.current);
    followPointer(id);
  }

  function onHandleKeyDown(event: KeyboardEvent<HTMLButtonElement>, choice: Choice, index: number) {
    const lifted = keyboardLift?.id === choice.id;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (lifted) {
        setKeyboardLift(null);
        flashMoved(choice.id);
        announce(`Dropped ${choice.label} at rank ${index + 1} of ${total}.`);
      } else {
        setKeyboardLift({ id: choice.id, origin: index });
        announce(`Picked up ${choice.label}, rank ${index + 1} of ${total}. Use the up and down arrow keys to move it, Space to drop it, Escape to cancel.`);
      }
      return;
    }
    if (!lifted) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const destination = index + (event.key === "ArrowUp" ? -1 : 1);
      if (destination < 0 || destination >= total) return;
      refocus.current = `${choice.id}:handle`;
      moveTopic(choice.id, destination);
    } else if (event.key === "Escape") {
      event.preventDefault();
      refocus.current = `${choice.id}:handle`;
      const origin = keyboardLift.origin;
      setKeyboardLift(null);
      if (origin !== index) {
        commitOrder(reorder(orderedChoices, choice.id, origin));
      }
      announce(`Cancelled. ${choice.label} is back at rank ${origin + 1} of ${total}.`);
    }
  }

  function setControlRef(key: string) {
    return (node: HTMLButtonElement | null) => {
      if (node) controlRefs.current.set(key, node);
      else controlRefs.current.delete(key);
    };
  }

  return (
    <Rankings>
      <p>{hint}</p>
      <VisuallyHidden id={INSTRUCTIONS_ID}>
        Press Space to pick up a topic, use the up and down arrow keys to move it, then press Space again to drop it.
      </VisuallyHidden>
      <TopicList aria-label="Rank the topics">
        {orderedChoices.map((choice, index) => {
          const isDragged = drag?.id === choice.id;
          const isLifted = isDragged || keyboardLift?.id === choice.id;
          const offset = slideOffset(index, drag);
          return (
            <TopicRow
              key={choice.id}
              ref={(node: HTMLLIElement | null) => {
                if (node) rowRefs.current.set(choice.id, node);
                else rowRefs.current.delete(choice.id);
              }}
              aria-label={`Rank ${index + 1}: ${choice.label}`}
              data-lifted={isLifted ? "" : undefined}
              data-dragging={isDragged ? "" : undefined}
              data-moved={movedId === choice.id && !isLifted ? "" : undefined}
              style={drag ? { transform: offset ? `translateY(${offset}px)` : undefined } : undefined}
              onPointerDown={(event) => startDrag(event, choice.id, false)}
            >
              <DragHandle
                ref={setControlRef(`${choice.id}:handle`)}
                type="button"
                $variant="ghost"
                $size="sm"
                aria-label={`Reorder ${choice.label}`}
                aria-describedby={INSTRUCTIONS_ID}
                aria-pressed={keyboardLift?.id === choice.id}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  startDrag(event, choice.id, true);
                }}
                onKeyDown={(event) => onHandleKeyDown(event, choice, index)}
                onBlur={() => {
                  if (keyboardLift?.id !== choice.id) return;
                  // A move re-renders the list and refocuses the handle; only a real focus change drops the card.
                  window.setTimeout(() => {
                    if (document.activeElement !== controlRefs.current.get(`${choice.id}:handle`)) setKeyboardLift(null);
                  });
                }}
              >
                <Icon icon={GripVertical} size={16} />
              </DragHandle>
              <Rank aria-hidden="true">{projectedIndex(index, drag) + 1}</Rank>
              <TopicLabel>{choice.label}</TopicLabel>
              <ReorderActions>
                {index > 0 ? (
                  <Button
                    ref={setControlRef(`${choice.id}:up`)}
                    type="button"
                    $variant="ghost"
                    $size="sm"
                    aria-label={`Move ${choice.label} up`}
                    onClick={() => {
                      refocus.current = `${choice.id}:up`;
                      moveTopic(choice.id, index - 1);
                    }}
                  >
                    <Icon icon={ArrowUp} size={16} />
                  </Button>
                ) : (
                  <ActionSlot aria-hidden="true" />
                )}
                {index < total - 1 ? (
                  <Button
                    ref={setControlRef(`${choice.id}:down`)}
                    type="button"
                    $variant="ghost"
                    $size="sm"
                    aria-label={`Move ${choice.label} down`}
                    onClick={() => {
                      refocus.current = `${choice.id}:down`;
                      moveTopic(choice.id, index + 1);
                    }}
                  >
                    <Icon icon={ArrowDown} size={16} />
                  </Button>
                ) : (
                  <ActionSlot aria-hidden="true" />
                )}
              </ReorderActions>
            </TopicRow>
          );
        })}
      </TopicList>
      <VisuallyHidden aria-live="polite" aria-atomic="true">
        <span key={announcement.id}>{announcement.text}</span>
      </VisuallyHidden>
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
