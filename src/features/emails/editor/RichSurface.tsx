"use client";

/*
 * One editable surface: the subject (single line, plain text) or the message (rich text). It is a
 * contentEditable region whose DOM is managed by hand; React never renders children into it.
 * Variables show as chips: non-editable spans with data-var. The stored form is tokens like {{member.firstName}}.
 */
import * as React from "react";
import { styled } from "next-yak";
import {
  bodyToEditorHtml,
  chipHtml,
  cleanSubjectPaste,
  editorToBody,
  editorToSubject,
  sanitizeHtml,
  subjectToEditorHtml,
  textToHtml,
  varDef,
} from "./richtext";
import type { VarKey } from "../model";

export interface SurfaceHandle {
  focus(): void;
  focusChip(key: string): boolean;
  insertChip(key: VarKey): void;
  exec(command: string, arg?: string): void;
  saveRange(): void;
  restoreRange(): void;
  element(): HTMLElement | null;
  /** The link the caret is in, if any. */
  currentLink(): HTMLAnchorElement | null;
  selectedText(): string;
}

export interface SurfaceProps {
  kind: "subject" | "body";
  /** Stored value: plain text with tokens (subject) or allowed-tag HTML with tokens (body). */
  value: string;
  onValue(next: string): void;
  readOnly?: boolean;
  /** Variable keys valid for this email's moment. */
  valid: Set<string>;
  id: string;
  ariaLabel: string;
  describedBy?: string;
  invalid?: boolean;
  prompt?: { id: string; text: string };
  onBrace(): void;
  onChipOpen(key: VarKey, chip: HTMLElement): void;
  onSelectionChange?(): void;
  onFocusSurface?(): void;
  handleRef?: React.Ref<SurfaceHandle>;
}

const Box = styled.div`
  position: relative;
`;

const Editable = styled.div<{ $kind: "subject" | "body"; $invalid?: boolean }>`
  box-sizing: border-box;
  width: 100%;
  padding: var(--space-3);
  background: var(--color-bg);
  color: var(--color-text);
  font-family: inherit;
  font-size: var(--text-md);
  line-height: var(--leading-body);
  overflow-wrap: anywhere;
  outline: none;

  &[data-kind="subject"] {
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-md);
    padding-right: var(--space-8);
    white-space: pre-wrap;
  }
  &[data-kind="subject"][aria-invalid="true"] {
    border-color: var(--color-danger);
  }
  &[data-kind="subject"]:focus-visible {
    box-shadow: var(--focus-ring);
  }
  &[data-kind="body"] {
    min-height: calc(var(--space-8) * 3);
  }
  &[aria-readonly="true"] {
    background: var(--color-surface);
  }

  p {
    margin: 0 0 var(--space-3);
  }
  p:last-child,
  ul:last-child,
  ol:last-child {
    margin-bottom: 0;
  }
  ul,
  ol {
    margin: 0 0 var(--space-3);
    padding-left: var(--space-5);
  }
  a {
    color: var(--color-text);
    text-decoration: underline;
  }

  [data-var] {
    display: inline-block;
    padding: 0 var(--space-1);
    margin: 0 1px;
    border: 1px solid var(--color-info-border);
    border-radius: var(--radius-sm);
    background: var(--color-info-subtle);
    color: var(--color-info);
    font-size: 0.9em;
    line-height: var(--leading-body);
    cursor: pointer;
    user-select: all;
    white-space: nowrap;
  }
  [data-var]:hover {
    border-color: var(--color-info);
  }
  [data-var]:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }
  [data-var][data-invalid] {
    border-color: var(--color-danger-border);
    background: var(--color-danger-subtle);
    color: var(--color-danger);
    text-decoration: line-through;
  }
  [data-var][data-invalid]::before {
    content: "Not available: ";
    text-decoration: none;
    display: inline-block;
  }
  [aria-disabled="true"][data-var] {
    cursor: default;
  }
`;

const Prompt = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--text-md);
  line-height: var(--leading-body);
  pointer-events: none;
`;

const Tip = styled.div`
  position: absolute;
  z-index: var(--z-tooltip);
  transform: translate(-50%, -100%);
  max-width: 260px;
  background: var(--color-text);
  color: var(--color-bg);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  box-shadow: var(--shadow-md);
  pointer-events: none;
`;

function selectionIn(el: HTMLElement): Range | null {
  const sel = typeof window !== "undefined" ? window.getSelection() : null;
  if (!sel || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  return el.contains(r.commonAncestorContainer) ? r : null;
}

function chipOf(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? (target.closest("[data-var]") as HTMLElement | null) : null;
}

export function RichSurface(props: SurfaceProps) {
  const { kind, value, onValue, readOnly, valid, id, ariaLabel, describedBy, invalid, prompt, onBrace, onChipOpen } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const rendered = React.useRef<string | null>(null);
  const saved = React.useRef<Range | null>(null);
  const [tip, setTip] = React.useState<{ text: string; left: number; top: number } | null>(null);
  const validKey = [...valid].sort().join(",");
  const interactive = !readOnly;

  // Value -> DOM, only when it changed from outside (or which variables apply changed).
  const lastValid = React.useRef("");
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (rendered.current === value && lastValid.current === validKey && !readOnly) return;
    const ctx = { valid };
    el.innerHTML = kind === "subject" ? subjectToEditorHtml(value, ctx, interactive) : bodyToEditorHtml(value, ctx, interactive);
    rendered.current = value;
    lastValid.current = validKey;
  }, [value, validKey, kind, readOnly, valid, interactive]);

  const emit = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = kind === "subject" ? editorToSubject(el) : editorToBody(el);
    if (next === rendered.current) return;
    rendered.current = next;
    onValue(next);
  }, [kind, onValue]);

  const saveRange = React.useCallback(() => {
    const el = ref.current;
    const r = el ? selectionIn(el) : null;
    if (r) saved.current = r.cloneRange();
  }, []);

  React.useEffect(() => {
    const onSel = () => {
      saveRange();
      props.onSelectionChange?.();
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [saveRange, props]);

  // "{" opens the variable list. beforeinput also covers touch keyboards, which send no usable keydown.
  const braceRef = React.useRef(onBrace);
  React.useLayoutEffect(() => {
    braceRef.current = onBrace;
  });
  React.useEffect(() => {
    const el = ref.current;
    if (!el || readOnly) return;
    const onBefore = (e: InputEvent) => {
      if (e.inputType === "insertText" && e.data === "{") {
        e.preventDefault();
        saveRange();
        braceRef.current();
      }
    };
    el.addEventListener("beforeinput", onBefore);
    return () => el.removeEventListener("beforeinput", onBefore);
  }, [readOnly, saveRange]);

  const restoreRange = React.useCallback(() => {
    const el = ref.current;
    const sel = window.getSelection();
    if (!el || !sel) return;
    sel.removeAllRanges();
    if (saved.current && el.contains(saved.current.commonAncestorContainer)) {
      sel.addRange(saved.current);
    } else {
      const r = document.createRange();
      r.selectNodeContents(el);
      r.collapse(false);
      sel.addRange(r);
    }
  }, []);

  React.useImperativeHandle(
    props.handleRef,
    () => ({
      focus: () => ref.current?.focus(),
      focusChip: (key: string) => {
        const chip = ref.current?.querySelector<HTMLElement>(`[data-var="${key}"]`);
        if (!chip) return false;
        chip.scrollIntoView({ block: "center" });
        chip.focus();
        return true;
      },
      insertChip: (key: VarKey) => {
        const el = ref.current;
        if (!el) return;
        el.focus();
        restoreRange();
        // Manual range insert: execCommand("insertHTML") can hoist an inline non-editable span out of its paragraph.
        const sel = window.getSelection();
        const r = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
        if (!r || !el.contains(r.commonAncestorContainer)) return;
        const tpl = document.createElement("template");
        tpl.innerHTML = chipHtml(key, { valid }, true);
        const chip = tpl.content.firstChild;
        if (!chip) return;
        if (kind === "body" && r.commonAncestorContainer === el && !el.querySelector("p, li")) {
          el.innerHTML = "<p></p>";
          r.setStart(el.firstChild!, 0);
          r.collapse(true);
        }
        r.deleteContents();
        const tail = document.createTextNode("​");
        r.insertNode(tail);
        r.insertNode(chip);
        const after = document.createRange();
        after.setStart(tail, 1);
        after.collapse(true);
        sel!.removeAllRanges();
        sel!.addRange(after);
        emit();
      },
      exec: (command: string, arg?: string) => {
        const el = ref.current;
        if (!el) return;
        if (!selectionIn(el)) restoreRange();
        document.execCommand(command, false, arg);
        emit();
      },
      saveRange,
      restoreRange,
      element: () => ref.current,
      currentLink: () => {
        const el = ref.current;
        const r = el ? (selectionIn(el) ?? saved.current) : null;
        const n = r?.commonAncestorContainer;
        const a = n instanceof Element ? n.closest("a") : n?.parentElement?.closest("a");
        return (a as HTMLAnchorElement | null) ?? null;
      },
      selectedText: () => (saved.current ? saved.current.toString() : ""),
    }),
    [valid, restoreRange, saveRange, emit, kind],
  );

  const showTip = (chip: HTMLElement | null) => {
    const box = ref.current?.parentElement;
    if (!chip || !box) return setTip(null);
    const def = varDef(chip.getAttribute("data-var") ?? "");
    if (!def) return setTip(null);
    const c = chip.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    const text = chip.hasAttribute("data-invalid") ? `${def.label} doesn't apply to this email` : `Example: ${def.example}`;
    setTip({ text, left: c.left - b.left + c.width / 2, top: c.top - b.top - 4 });
  };

  const openChip = (chip: HTMLElement) => {
    const key = chip.getAttribute("data-var");
    if (key && interactive && !chip.hasAttribute("data-invalid")) onChipOpen(key as VarKey, chip);
  };

  const removeChip = (chip: HTMLElement) => {
    chip.remove();
    ref.current?.focus();
    emit();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    const chip = chipOf(e.target);
    if (chip && chip !== e.currentTarget) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openChip(chip);
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        removeChip(chip);
      }
      return;
    }
    if (e.key === "{" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      saveRange();
      onBrace();
      return;
    }
    if (e.key === "Enter") {
      // A single selected chip: Enter edits its fallback.
      const el = ref.current;
      const r = el ? selectionIn(el) : null;
      if (el && r && !r.collapsed) {
        const chips = Array.from(el.querySelectorAll<HTMLElement>("[data-var]")).filter((c) => r.intersectsNode(c));
        const only = r.toString().replace(/[​\s]/g, "") === (chips[0]?.textContent ?? "").replace(/\s/g, "");
        if (chips.length === 1 && only) {
          e.preventDefault();
          openChip(chips[0]);
          return;
        }
      }
      if (kind === "subject") e.preventDefault();
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (readOnly) return;
    e.preventDefault();
    if (kind === "subject") {
      document.execCommand("insertText", false, cleanSubjectPaste(e.clipboardData.getData("text/plain")));
    } else {
      const html = e.clipboardData.getData("text/html");
      const clean = html ? sanitizeHtml(html) : textToHtml(e.clipboardData.getData("text/plain"));
      document.execCommand("insertHTML", false, clean);
    }
    emit();
  };

  const empty = value.trim() === "";

  return (
    <Box>
      <Editable
        ref={ref}
        id={id}
        $kind={kind}
        data-kind={kind}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        role="textbox"
        tabIndex={readOnly ? -1 : 0}
        aria-label={ariaLabel}
        aria-multiline={kind === "body"}
        aria-readonly={readOnly ? true : undefined}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={[describedBy, empty && prompt ? prompt.id : null].filter(Boolean).join(" ") || undefined}
        spellCheck
        onInput={emit}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        onDrop={(e) => e.preventDefault()}
        onFocus={() => {
          props.onFocusSurface?.();
          if (kind === "body" && !readOnly) document.execCommand("defaultParagraphSeparator", false, "p");
        }}
        onClick={(e) => {
          const chip = chipOf(e.target);
          if (chip) openChip(chip);
        }}
        onMouseOver={(e) => showTip(chipOf(e.target))}
        onMouseOut={() => setTip(null)}
        onFocusCapture={(e) => showTip(chipOf(e.target))}
        onBlurCapture={() => setTip(null)}
      />
      {empty && prompt ? <Prompt id={prompt.id}>{prompt.text}</Prompt> : null}
      {tip ? (
        <Tip role="tooltip" style={{ left: tip.left, top: tip.top }}>
          {tip.text}
        </Tip>
      ) : null}
    </Box>
  );
}
