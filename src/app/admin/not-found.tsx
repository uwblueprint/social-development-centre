import type { Metadata } from "next";
import { NotFoundScreen, notFoundTitle } from "@/app/_components/NotFoundScreen";

export const metadata: Metadata = { title: notFoundTitle };

/** The shared 404, inside the sidebar so you can always click back out. */
export default function SectionNotFound() {
  return <NotFoundScreen inShell />;
}
