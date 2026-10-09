/**
 * URL correction (owner): a mistyped section name, e.g. /admin/communit, goes to the real section.
 * Tightly scoped: only a single segment right after the portal, only when exactly one section is within
 * two typos, and only for segments of 4+ characters. Anything else stays a 404.
 */
const SECTIONS = {
  admin: ["opportunities", "insights", "community", "partners", "documentation"],
  partner: ["opportunities", "insights", "organization", "documentation"],
} as const;

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = next;
    }
  }
  return row[b.length];
}

export function closestSection(portal: keyof typeof SECTIONS, segments: string[]): string | null {
  if (segments.length !== 1) return null;
  const typed = decodeURIComponent(segments[0]).toLowerCase();
  if (typed.length < 4) return null;
  const matches = SECTIONS[portal].filter((s) => distance(typed, s) <= 2);
  // An exact name is not a typo: redirecting it would loop whenever that section has no page.
  if (matches.length !== 1 || matches[0] === decodeURIComponent(segments[0])) return null;
  return `/${portal}/${matches[0]}`;
}
