"use client";

import * as React from "react";
import { keyframes, styled } from "next-yak";
import { Check } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { Icon } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import { Tooltip } from "@/components/ui/Tooltip";
import { OFFLINE_OPEN_REASON } from "../_offline";
import { sendTone, type Send } from "../_data";
import { useOutboxData } from "../_outboxData";
import { failText, rowMeta, rowWhen } from "../_recipients";
import type { PanelMode } from "../_types";

/* An approved row collapses out of For review (height and fade, leaving faster than entering); undo brings it back the other way.
   Rows are at most about 96px tall, so max-height is the height that animates. */
const collapse = keyframes`
  from {
    max-height: 96px;
    opacity: 1;
  }
  to {
    max-height: 0;
    padding-block: 0;
    border-top-width: 0;
    opacity: 0;
  }
`;

const expand = keyframes`
  from {
    max-height: 0;
    padding-block: 0;
    opacity: 0;
  }
  to {
    max-height: 96px;
    opacity: 1;
  }
`;

/* Full-width rows split by 1px lines: hover tints, the open email is selected, failures/past-due carry a status tint. */
const Row = styled.li`
  /* The kit checkbox's size, and the first line's height (a 24px line box). The box sits (24 - 20) / 2 = 2px below the line's top: whole pixels, centred on the line. */
  --check-size: 20px;
  --line-1: var(--space-5);

  position: relative;
  /* Its own stacking context, so the checkbox's raised hit area only competes with the open button's inside this row. */
  isolation: isolate;
  box-sizing: border-box;
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  /* Top line only: see the list's divider rule in RecipientsPanel. */
  border-top: 1px solid var(--color-border);

  &:hover {
    background: var(--color-bg-hover);
  }
  &[data-tone="danger"] {
    background: var(--color-danger-subtle);
  }
  &[data-tone="warning"] {
    background: var(--color-warning-subtle);
  }
  &[data-current] {
    background: var(--color-bg-selected);
  }
  /* Just approved: its new state shows, with words and an icon as well as the colour. */
  &[data-motion="confirmed"],
  &[data-motion="leaving"] {
    background: var(--color-success-subtle);
    transition: background-color var(--duration) var(--ease-out);
  }
  &[data-motion="leaving"] {
    overflow: hidden;
    animation: ${collapse} var(--duration-slow) var(--ease-in) forwards;
  }
  &[data-motion="entering"] {
    overflow: hidden;
    animation: ${expand} var(--duration-slow) var(--ease-out);
  }
  /* All tab: one line, centred in the standard row height. */
  &[data-compact] {
    align-items: center;
    padding-block: 0;
    min-height: var(--row-height);
  }
`;

/* Not positioned, so the checkbox's hit area (below) is placed against the row itself. */
const CheckCell = styled.div`
  flex: none;
  display: flex;
  height: var(--check-size);
  /* The box's top edge lines up with the top of the name's text (the top of its font box inside the first line), not the line's centre. */
  margin-top: calc((var(--line-1) - var(--text-sm)) / 2);

  /* One-line rows centre everything, so no offset. */
  [data-compact] > & {
    margin-top: 0;
  }

  /* The whole left strip of the row toggles the box: from the row's left edge to where the text starts, top to bottom.
     It is the checkbox's own ::after, so the click lands on the checkbox, above the open button's stretched hit area. */
  & > button::after {
    content: "";
    position: absolute;
    z-index: var(--z-raised);
    top: 0;
    bottom: 0;
    left: 0;
    width: calc(var(--space-4) + var(--check-size) + var(--space-3));
  }
`;

/* The whole row opens the email: the button's hit area stretches over the row, under the checkbox. */
/* What a just-approved row says in place of its button. */
const Confirmed = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
  flex: 1 1 auto;
`;

const ConfirmedLine = styled.span`
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  font-size: var(--text-sm);
  line-height: var(--line-1);
  color: var(--color-success);

  & > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const OpenButton = styled(ListRow)`
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: 0;
  min-width: 0;

  /* Blocked while offline (aria-disabled, so it stays focusable for the reason): this email hasn't loaded. */
  &[aria-disabled="true"] {
    cursor: not-allowed;
  }
  &:hover {
    background: transparent;
  }
  &::after {
    content: "";
    position: absolute;
    inset: 0;
  }
  /* ListRow makes a focused button position: relative, which would shrink the ring's containing block to the text column. Stay static so the row is. */
  &:focus-visible {
    position: static;
    box-shadow: none;
  }
  /* The ring outlines the whole row edge to edge, inside it so the scrolling list can't clip it; above the tints and the checkbox strip, and never takes the pointer. */
  &:focus-visible::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: var(--z-sticky);
    pointer-events: none;
    box-shadow: var(--focus-ring-inset);
  }
`;

/* Line 1 (and the All tab's only line): name left, something right, on one baseline. Line-height is --line-1. */
const Head = styled.span`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-3);
  width: 100%;
  min-width: 0;
  line-height: var(--line-1);

  /* All tab: two equal columns after the checkbox, so the template starts at the same x on every row. Each cell truncates inside its own column. */
  [data-compact] & {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    align-items: baseline;
  }
`;

/* Truncates second in the All tab (the email name goes first). */
const Name = styled.span`
  /* Above the row's stretched hit area (OpenButton::after), so hovering the text reaches it and its tooltip; a click still opens the row (it bubbles to the button). */
  position: relative;
  z-index: var(--z-raised);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text);
`;

/* Never wraps or shrinks: the deadline is the one thing line 1 must keep. */
const When = styled.span`
  flex: none;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  white-space: nowrap;

  &[data-tone="warning"] {
    color: var(--color-warning);
    font-weight: var(--weight-medium);
  }
  /* On the open row's selected fill, warning text (light theme) drops under 4.5:1; the words carry the status. */
  [data-current] &[data-tone] {
    color: var(--color-text);
  }
`;

/* All tab: the automatic email's name, right-aligned and muted; it truncates before the member's name. */
const TemplateName = styled.span`
  /* Above the row's stretched hit area (OpenButton::after), so hovering the text reaches it and its tooltip; a click still opens the row (it bubbles to the button). */
  position: relative;
  z-index: var(--z-raised);
  flex: 0 100 auto;
  text-align: left;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
  color: var(--color-text-muted);
`;

const Line = styled.span`
  /* Above the row's stretched hit area (OpenButton::after), so hovering the text reaches it and its tooltip; a click still opens the row (it bubbles to the button). */
  position: relative;
  z-index: var(--z-raised);
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
  color: var(--color-text);

  &[data-muted] {
    color: var(--color-text-muted);
  }
  &[data-tone="danger"] {
    color: var(--color-danger);
  }
  /* On the open row's selected fill, danger text can drop under 4.5:1 (dark theme); the words carry the status. */
  [data-current] &[data-tone="danger"] {
    color: var(--color-text);
  }
`;

interface RecipientRowProps {
  send: Send;
  /** The tab: All is grouped by day and shows one line per row. */
  mode: PanelMode;
  /** This row's email is the one open. */
  current: boolean;
  checked: boolean;
  /** Offline and this email's content hasn't loaded, so it can't be opened. */
  blocked: boolean;
  /** Ticks or unticks the row. `range`: Shift was held, so everything from the last row ticked to this one follows. */
  onToggle: (range: boolean) => void;
  onOpen: () => void;
  /** The pointer or focus is on this row (null: it left). Lights up the row's day on the calendar. */
  onHoverDay: (day: number | null) => void;
  /** Roving focus: this row's stop key, whether it is the list's one tab stop, and focus tracking. */
  rovingKey: string;
  tabStop: boolean;
  onRovingFocus: (key: string) => void;
  /** Approved a moment ago: "confirmed" shows the new state, "leaving" collapses it out; "entering" is an undo coming back. */
  motion?: "confirmed" | "leaving" | "entering";
  /** What the row says while confirmed, e.g. "Scheduled · Sun, Nov 8". */
  confirmText?: string;
  /** A selection box is being dragged: the cut-off-text tooltip waits longer (1s), since you're picking, not reading. */
  boxSelecting?: boolean;
}

export function RecipientRow({ send, mode, current, checked, blocked, onToggle, onOpen, onHoverDay, rovingKey, tabStop, onRovingFocus, motion, confirmText, boxSelecting = false }: RecipientRowProps) {
  const { members, templates } = useOutboxData();
  const m = members[send.member];
  const tone = sendTone(send);
  const compact = mode === "all";
  const when = rowWhen(send);
  const template = templates[send.template].name;
  const meta = rowMeta(send);
  const failure = mode === "failed" ? failText(send) : null;

  // One name for the single tab stop, in reading order. It also says "selected": the checkbox is out of the tab order.
  const label = [
    m.name,
    template,
    failure ? `couldn't send ${when.text}, ${failure}` : compact ? null : when.text,
    ...(failure ? [] : meta),
    checked ? "selected" : null,
  ]
    .filter(Boolean)
    .join(", ");

  // Cut-off text is readable on hover: each cut-off line has its own tooltip, anchored to that line.
  // While a selection box is being dragged it waits longer (1s): you're picking rows, not reading them.
  const tipDelay = boxSelecting ? 1000 : 300;

  const open = (
    <OpenButton
      type="button"
      data-roving={rovingKey}
      data-send-id={send.id}
      tabIndex={tabStop ? 0 : -1}
      aria-label={label}
      aria-current={current ? "true" : undefined}
      aria-disabled={blocked || undefined}
      onClick={(event) => {
        // Shift+click selects the run of rows up to this one (as in Gmail), instead of opening it.
        if (event.shiftKey) {
          event.preventDefault();
          onToggle(true);
        } else if (blocked) event.preventDefault();
        else onOpen();
      }}
      onFocus={() => {
        onRovingFocus(rovingKey);
        onHoverDay(send.day);
      }}
      onBlur={() => onHoverDay(null)}
    >
      {compact ? (
        <Head>
          <TruncTip text={m.name} delay={tipDelay}><Name>{m.name}</Name></TruncTip>
          <TruncTip text={template} delay={tipDelay}><TemplateName>{template}</TemplateName></TruncTip>
        </Head>
      ) : (
        <>
          <Head>
            <TruncTip text={m.name} delay={tipDelay}><Name>{m.name}</Name></TruncTip>
            <When data-tone={when.tone}>{when.text}</When>
          </Head>
          <TruncTip text={template} delay={tipDelay}><Line>{template}</Line></TruncTip>
          {failure ? (
            <TruncTip text={failure} delay={tipDelay}>
              <Line data-tone="danger">{failure}</Line>
            </TruncTip>
          ) : (
            meta.length > 0 && (
              <TruncTip text={meta.join(" · ")} delay={tipDelay}>
                <Line data-muted="">{meta.join(" · ")}</Line>
              </TruncTip>
            )
          )}
        </>
      )}
    </OpenButton>
  );

  return (
    <Row
      data-tone={tone}
      data-compact={compact ? "" : undefined}
      data-current={current ? "" : undefined}
      data-motion={motion}
      onMouseEnter={() => onHoverDay(send.day)}
      onMouseLeave={() => onHoverDay(null)}
      // Shift+click is a range pick, not a move: keep focus where it was. Chrome treats focus that follows a Shift
      // press as keyboard focus, so letting the checkbox take focus would draw its keyboard ring.
      onMouseDown={(event) => {
        if (event.shiftKey) event.preventDefault();
      }}
    >
      <CheckCell
        // Shift+click on the box (or its strip) is a range: handled here, before the checkbox toggles only itself.
        onClickCapture={(event) => {
          if (!event.shiftKey) return;
          event.preventDefault();
          event.stopPropagation();
          onToggle(true);
        }}
      >
        {/* Out of the tab order on purpose: the list is one tab stop and "x" ticks the focused row. Still clickable. */}
        {motion === "confirmed" || motion === "leaving" ? (
          <Checkbox aria-label={`Select ${m.name}`} tabIndex={-1} checked={checked} disabled disabledReason={null} onCheckedChange={() => onToggle(false)} />
        ) : (
          <Checkbox aria-label={`Select ${m.name}`} tabIndex={-1} checked={checked} onCheckedChange={() => onToggle(false)} />
        )}
      </CheckCell>
      {motion === "confirmed" || motion === "leaving" ? (
        <Confirmed role="status">
          <Name>{m.name}</Name>
          <ConfirmedLine>
            <Icon icon={Check} size={16} />
            <span>{confirmText}</span>
          </ConfirmedLine>
        </Confirmed>
      ) : blocked ? (
        <Tooltip content={OFFLINE_OPEN_REASON}>{open}</Tooltip>
      ) : (
        open
      )}
    </Row>
  );
}

/* Lays out as if it weren't there (its child is the flex item), so it can hold the ref that measures the child. */
const Measure = styled.span`
  display: contents;
`;

/**
 * One line of a row that ends in an ellipsis when it doesn't fit. Only while it's cut off, hovering that line
 * shows its full text in a tooltip anchored to the line itself (not the whole row). Measured when it resizes;
 * `truncated` is a dependency because wrapping in the tooltip swaps in a new element that needs observing.
 */
function TruncTip({ text, delay, children }: { text: string; delay: number; children: React.ReactElement }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [truncated, setTruncated] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current?.firstElementChild;
    if (!el) return;
    const measure = () => setTruncated(el.scrollWidth > el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [truncated, text]);
  return (
    <Measure ref={ref}>
      {truncated ? (
        <Tooltip pinOnClick={false} delayDuration={delay} content={text}>
          {children}
        </Tooltip>
      ) : (
        children
      )}
    </Measure>
  );
}
