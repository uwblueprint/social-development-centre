import type { Metadata } from "next";
import { getCommunityCounts, listMembers, PAGE_SIZE } from "./_data/queries";
import { DEFAULT_MEMBER_SORT, MEMBER_SORT_KEYS } from "./_data/types";
import type { MemberSort, MemberSortKey, MemberTier } from "./_data/types";
import { CommunityView } from "./_components/CommunityView";

export const metadata: Metadata = { title: "Community" };

function normalizeTab(value: string | undefined): MemberTier {
  return value === "paying" ? "paying" : "general";
}

/** Unknown or missing sort keys fall back to the default order; `dir` is anything but "desc" → ascending. */
function normalizeSort(sort: string | undefined, dir: string | undefined): MemberSort {
  if (!sort || !(MEMBER_SORT_KEYS as readonly string[]).includes(sort)) return DEFAULT_MEMBER_SORT;
  return { key: sort as MemberSortKey, direction: dir === "desc" ? "desc" : "asc" };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; page?: string; sort?: string; dir?: string }>;
}) {
  const params = await searchParams;
  const tab = normalizeTab(params.tab);
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const sort = normalizeSort(params.sort, params.dir);

  const [memberPage, counts] = await Promise.all([listMembers(tab, q, page, sort), getCommunityCounts(q)]);

  return <CommunityView tab={tab} q={q} memberPage={memberPage} counts={counts} sort={sort} pageSize={PAGE_SIZE} />;
}
