"use client";

import * as React from "react";
import { styled } from "next-yak";

/* Design-only alignment check (?grid): lines on the page's shared edges. Not part of the product. */
const Line = styled.div<{ $vertical: boolean }>`
  position: fixed;
  z-index: var(--z-toast);
  pointer-events: none;
  background: ${({ $vertical }) => ($vertical ? "var(--color-danger)" : "var(--color-category-2)")};
  opacity: 0.6;
`;

interface Lines {
  x: number[];
  y: number[];
}

/** Vertical lines on the left edge, the second column and the right edge; horizontal lines at each block's top. */
export function GridOverlay() {
  const [lines, setLines] = React.useState<Lines>({ x: [], y: [] });
  React.useEffect(() => {
    function measure() {
      const h1 = document.querySelector("h1");
      const header = h1?.closest("header");
      const second = document.querySelectorAll("table th")[1];
      const x = [h1, second].filter(Boolean).map((e) => e!.getBoundingClientRect().left);
      if (header) x.push(header.getBoundingClientRect().right);
      const y = [...document.querySelectorAll("h1, [data-figures], [data-card=chart], [data-chart], [role=tablist]")].map((e) => e.getBoundingClientRect().top);
      setLines({ x, y });
    }
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const timer = window.setInterval(measure, 500);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      window.clearInterval(timer);
    };
  }, []);
  return (
    <div aria-hidden="true">
      {lines.x.map((x, i) => (
        <Line key={`x${i}`} $vertical style={{ left: Math.round(x), top: 0, bottom: 0, width: 1 }} />
      ))}
      {lines.y.map((y, i) => (
        <Line key={`y${i}`} $vertical={false} style={{ top: Math.round(y), left: 0, right: 0, height: 1 }} />
      ))}
    </div>
  );
}
