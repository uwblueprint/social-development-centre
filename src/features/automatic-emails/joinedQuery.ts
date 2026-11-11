import { formatISODate } from "@/components/ui/DatePicker";
import { monthFromName, parseTypedDate } from "@/components/ui/dateText";
import type { JoinedRule } from "./model";

export interface JoinedQueryResult {
  /** The text looks like the start of a join-date phrase, so the Joined option should show. */
  matches: boolean;
  /** The rule the text spells out, or null when it only names Joined. */
  rule: JoinedRule | null;
}

const NO: JoinedQueryResult = { matches: false, rule: null };

function monthRange(month: number, year: number): { from: string; to: string } {
  return { from: formatISODate(new Date(year, month, 1)), to: formatISODate(new Date(year, month + 1, 0)) };
}

/** "november", "in nov 2027" (without the "in") to a whole-month range. */
function parseMonth(text: string, year: number) {
  const m = /^([a-z]+)\.?(?: (\d{4}))?$/.exec(text);
  if (!m) return undefined;
  const month = monthFromName(m[1]);
  return month < 0 ? undefined : monthRange(month, m[2] ? Number(m[2]) : year);
}

const between = (a: Date, b: Date): JoinedRule => {
  const [x, y] = a <= b ? [a, b] : [b, a];
  return { op: "between", from: formatISODate(x), to: formatISODate(y) };
};

/** Reads a join-date phrase typed into the Anyone with field. */
export function parseJoinedQuery(text: string, today: Date): JoinedQueryResult {
  const q = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return NO;
  if ("joined".startsWith(q)) return { matches: true, rule: null };
  const joined = q.startsWith("join");
  const year = today.getFullYear();
  const date = (s: string) => parseTypedDate(s.trim(), year);
  const rest = q.replace(/^join(?:ed)?(?: date)?(?: on)?\b/, "").trim();
  if (!rest || rest === "date") return { matches: true, rule: null };
  // Without "joined", only text that spells out a real date phrase counts, so plain words never match.
  const hit = (rule: JoinedRule | null): JoinedQueryResult => (rule || joined ? { matches: true, rule } : NO);

  let m = /^(?:before|until|by|up to)\s+(.+)$/.exec(rest);
  if (m) {
    const d = date(m[1]);
    return hit(d ? { op: "before", from: formatISODate(d), to: "" } : null);
  }
  m = /^(?:between|from)\s+(.+?)\s+(?:and|to|until|-|–)\s+(.+)$/.exec(rest);
  if (m) {
    const a = date(m[1]);
    const b = date(m[2]);
    return hit(a && b ? between(a, b) : null);
  }
  m = /^(?:after|since|from)\s+(.+)$/.exec(rest);
  if (m) {
    const d = date(m[1]);
    return hit(d ? { op: "after", from: formatISODate(d), to: "" } : null);
  }
  m = /^(.+?)\s+(?:to|-|–)\s+(.+)$/.exec(rest);
  if (m) {
    const a = date(m[1]);
    const b = date(m[2]);
    if (a && b) return hit(between(a, b));
  }
  const bare = rest.replace(/^(?:on|in)\s+/, "");
  const month = parseMonth(bare, year);
  if (month) return hit({ op: "between", ...month });
  const d = date(bare);
  return hit(d ? between(d, d) : null);
}
