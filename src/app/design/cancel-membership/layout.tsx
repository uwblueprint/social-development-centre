import type { ReactNode } from "react";
import { LightOnly } from "../unsubscribe/parts";

/** Member-facing pages are always light (see LightOnly in ../unsubscribe/parts.tsx). */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <>
      <LightOnly />
      {children}
    </>
  );
}
