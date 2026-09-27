import type { ListSort } from "../_data/types";

/*
 * Partners' URL params for header filters and sorting. A filter param is absent for its default, "all" when
 * it's off (every option), or a comma-separated list of options. Unknown values are ignored.
 */

export const FILTER_OFF = "all";

export function parseFilter<V extends string>(param: string | undefined, allowed: readonly V[], fallback: V[]): V[] {
  if (param === undefined) return fallback;
  if (param === FILTER_OFF) return [];
  const values = param.split(",").filter((v): v is V => (allowed as readonly string[]).includes(v));
  return values.length ? values : fallback;
}

/** The param value for `selected`: undefined when it equals the default. */
export function filterParam(selected: readonly string[], fallback: readonly string[]): string | undefined {
  const same = selected.length === fallback.length && selected.every((v) => fallback.includes(v));
  if (same) return undefined;
  return selected.length ? selected.join(",") : FILTER_OFF;
}

export function parseSort<K extends string>(
  sort: string | undefined,
  dir: string | undefined,
  keys: readonly K[],
  fallback: ListSort<K>,
): ListSort<K> {
  if (!sort || !(keys as readonly string[]).includes(sort)) return fallback;
  return { key: sort as K, direction: dir === "desc" ? "desc" : "asc" };
}
