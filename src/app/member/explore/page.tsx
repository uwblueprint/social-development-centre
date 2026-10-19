import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ExploreView } from "@/features/feed/components/ExploreView";
import { feedCopy } from "@/features/feed/copy";
import { parseFilters } from "@/features/feed/matching";
import { listOpenOpportunities } from "@/features/feed/queries";
import { ACCESSIBILITY_FEATURES, AREAS, KINDS, TOPICS } from "@/features/opportunities/catalog";
import { getCurrentMember } from "../_data/session";

export const metadata: Metadata = { title: feedCopy.explore.title };

export default async function Page({ searchParams }: PageProps<"/member/explore">) {
  if (!(await getCurrentMember())) redirect("/login");
  const filters = parseFilters(await searchParams, {
    kinds: [...KINDS],
    topics: TOPICS.map((t) => t.id),
    areas: AREAS.map((a) => a.id),
    accessibility: ACCESSIBILITY_FEATURES.map((a) => a.id),
  });
  return <ExploreView items={await listOpenOpportunities()} initialFilters={filters} />;
}
