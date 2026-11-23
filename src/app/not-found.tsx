import type { Metadata } from "next";
import { NotFoundScreen, notFoundTitle } from "./_components/NotFoundScreen";

export const metadata: Metadata = { title: notFoundTitle };

export default function NotFound() {
  return <NotFoundScreen />;
}
