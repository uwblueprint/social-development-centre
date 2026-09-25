import type { Metadata } from "next";
import { getCommunityCounts, listMembers, PAGE_SIZE } from "./_data/queries";
import type { MemberTier } from "./_data/types";
import { CommunityView } from "./_components/CommunityView";

export const metadata: Metadata = { title: "Community" };

function normalizeTab(value: string | undefined): MemberTier {
  return value === "paying" ? "paying" : "general";
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const tab = normalizeTab(params.tab);
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [memberPage, counts] = await Promise.all([listMembers(tab, q, page), getCommunityCounts()]);

  return <CommunityView tab={tab} q={q} memberPage={memberPage} counts={counts} pageSize={PAGE_SIZE} />;
}
