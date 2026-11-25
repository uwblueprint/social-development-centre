"use client";

import * as React from "react";
import { styled } from "next-yak";
import { mergeAttributes, Node, NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";

/** Images never get wider than a typical email column. */
const MAX_WIDTH = 600;
const MIN_WIDTH = 48;

/**
 * An image in the message. Each image takes its own row; selecting it shows corner handles
 * that resize it with its proportions locked. No rotation (design decision).
 * Only images placed by the editor are parsed back in, so images in pasted content are dropped.
 */
export const EmailImage = Node.create({
  name: "emailImage",
  group: "block",
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      width: {
        default: null,
        parseHTML: (el) => {
          const w = Number(el.getAttribute("width"));
          return Number.isFinite(w) && w > 0 ? w : null;
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[data-email-image]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes({ "data-email-image": "" }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
});

type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

function ImageView({ node, selected, updateAttributes, editor }: NodeViewProps) {
  const imgRef = React.useRef<HTMLImageElement>(null);
  const [dragWidth, setDragWidth] = React.useState<number | null>(null);
  // Height over width, read once the image loads; the size label during a resize uses it.
  const [ratio, setRatio] = React.useState(1);
  const width: number | null = dragWidth ?? node.attrs.width;
  const editable = editor.isEditable;

  const maxWidth = () => Math.min(MAX_WIDTH, editor.view.dom.clientWidth || MAX_WIDTH);

  const startResize = (event: React.PointerEvent, corner: Corner) => {
    event.preventDefault();
    event.stopPropagation();
    const img = imgRef.current;
    if (!img) return;
    const startX = event.clientX;
    const startWidth = img.getBoundingClientRect().width;
    const direction = corner === "nw" || corner === "sw" ? -1 : 1;
    let latest = startWidth;
    const move = (e: PointerEvent) => {
      latest = Math.round(Math.max(MIN_WIDTH, Math.min(maxWidth(), startWidth + direction * (e.clientX - startX))));
      setDragWidth(latest);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      updateAttributes({ width: latest });
      setDragWidth(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <NodeViewWrapper>
      <Frame data-selected={(selected && editable) || undefined} data-editable={editable || undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element -- user content inside the editor, often a blob: URL */}
        <img
          ref={imgRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          draggable={false}
          style={width ? { width: `${width}px` } : undefined}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth) setRatio(img.naturalHeight / img.naturalWidth);
            // A read-only email keeps what was saved; changing it would count as an edit.
            if (!node.attrs.width && editor.isEditable) updateAttributes({ width: Math.min(img.naturalWidth, maxWidth()) });
          }}
        />
        {selected &&
          editable &&
          CORNERS.map((corner) => (
            <Handle key={corner} data-corner={corner} aria-hidden="true" onPointerDown={(e) => startResize(e, corner)} />
          ))}
        {dragWidth !== null && (
          <Size>
            {dragWidth} × {Math.round(dragWidth * ratio)}
          </Size>
        )}
      </Frame>
    </NodeViewWrapper>
  );
}

const Frame = styled.div`
  position: relative;
  width: fit-content;
  max-width: 100%;
  margin: 0 0 var(--space-4);
  line-height: 0;

  img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-sm);
  }

  /* Drawn inside the image so selecting it doesn't shift anything. */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border: 2px solid transparent;
    border-radius: var(--radius-sm);
    pointer-events: none;
  }
  &[data-editable]:hover::after {
    border-color: var(--color-border);
  }
  /* Selected image: outlined in the SDC green tint; the handles mark it too. */
  &[data-selected]::after {
    border-color: var(--sdc-200);
  }
`;

/* Handles are 12px dots, the same size as the kit's check glyphs; they hang a space-1 outside each corner. */
const Handle = styled.span`
  position: absolute;
  z-index: var(--z-raised);
  width: var(--space-3);
  height: var(--space-3);
  border-radius: var(--radius-full);
  background: var(--color-bg);
  border: 2px solid var(--color-border-strong);
  box-shadow: var(--shadow-sm);
  touch-action: none;

  &[data-corner="nw"] { left: calc(var(--space-1) * -1); top: calc(var(--space-1) * -1); cursor: nwse-resize; }
  &[data-corner="ne"] { right: calc(var(--space-1) * -1); top: calc(var(--space-1) * -1); cursor: nesw-resize; }
  &[data-corner="sw"] { left: calc(var(--space-1) * -1); bottom: calc(var(--space-1) * -1); cursor: nesw-resize; }
  &[data-corner="se"] { right: calc(var(--space-1) * -1); bottom: calc(var(--space-1) * -1); cursor: nwse-resize; }
`;

const Size = styled.span`
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  padding: 0 var(--space-1);
  border-radius: var(--radius-sm);
  background: var(--color-text);
  color: var(--color-bg);
  font-family: var(--font-sans);
  font-size: var(--text-xs);
  line-height: var(--leading-ui);
  font-variant-numeric: tabular-nums;
`;
