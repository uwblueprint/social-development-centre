import { PageLoading } from "@/components/patterns/PageLoading";
import { copy } from "../copy";

/** Route-level loading state for both portals' Opportunities lists. */
export function OpportunitiesLoading() {
  return <PageLoading title={copy.page.title} />;
}
