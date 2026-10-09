import { DEFAULT_MEMBER_STATUSES, MEMBER_STATUSES } from "../_data/types";
import type { MemberStatus } from "../_data/types";

/**
 * The Status filter in the URL (`status`): absent = the default (every status but Unsubscribed),
 * `all` = every status, `none` = nothing selected, otherwise a comma-separated list of statuses.
 */
export function parseStatusParam(value: string | undefined): MemberStatus[] {
  if (!value) return [...DEFAULT_MEMBER_STATUSES];
  if (value === "all") return [...MEMBER_STATUSES];
  if (value === "none") return [];
  const wanted = new Set(value.split(","));
  return MEMBER_STATUSES.filter((s) => wanted.has(s));
}

/** The inverse of `parseStatusParam`; `undefined` removes the param (the default). */
export function statusParam(selected: readonly string[]): string | undefined {
  const set = new Set(selected);
  const same = (list: readonly string[]) => list.length === set.size && list.every((s) => set.has(s));
  if (same(DEFAULT_MEMBER_STATUSES)) return undefined;
  if (same(MEMBER_STATUSES)) return "all";
  if (set.size === 0) return "none";
  return MEMBER_STATUSES.filter((s) => set.has(s)).join(",");
}
