/**
 * Returns the value stored on `globalThis` under `key`, creating it with `create` the first time.
 * The in-memory dev stores use it so their data survives hot reloads; bump the key when a seed's shape
 * changes so a running dev server picks up the new one.
 */
export function globalSingleton<T>(key: string, create: () => T): T {
  const existing: unknown = Reflect.get(globalThis, key);
  if (existing !== undefined) return existing as T;
  const created = create();
  Reflect.set(globalThis, key, created);
  return created;
}
