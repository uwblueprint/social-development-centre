import type { Metadata } from "next";
import { MemberDirectory } from "./MemberDirectory";

export const metadata: Metadata = { title: "People (design)" };

/** Member directory: the list of everyone, with each member's page in a side panel. Demo data only. */
export default function MemberDirectoryDesignPage() {
  return <MemberDirectory />;
}
