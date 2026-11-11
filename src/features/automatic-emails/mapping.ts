import type { JSONContent } from "@tiptap/react";
import type { Json } from "@/lib/supabase/database.types";
import { DELAY_MAX, EVERYONE, type Audience, type AutomaticEmail, type CondKind, type Trigger, type Unit } from "./model";

/** An automatic_emails row, as the pages select it. */
export interface AutomaticEmailRow {
  id: string;
  name: string;
  state: string;
  trigger: string;
  trigger_tag_id: string | null;
  delay_amount: number;
  delay_unit: string;
  conditions: Json;
  mode: string;
  subject: string;
  subject_doc: Json;
  body: Json;
  published_at: string | null;
}

export const AUTOMATIC_EMAIL_COLUMNS =
  "id, name, state, trigger, trigger_tag_id, delay_amount, delay_unit, conditions, mode, subject, subject_doc, body, published_at";

type Counts = Pick<AutomaticEmail, "edited" | "approved" | "waiting">;
const NO_COUNTS: Counts = { edited: 0, approved: 0, waiting: 0 };

const KINDS: CondKind[] = ["only", "require", "never", "joined"];
const ids = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const isDoc = (v: Json): v is JSONContent & Json =>
  typeof v === "object" && v !== null && !Array.isArray(v) && (v as { type?: unknown }).type === "doc";

function audienceFrom(conditions: Json): Audience {
  const c = (typeof conditions === "object" && conditions && !Array.isArray(conditions) ? conditions : {}) as Record<string, unknown>;
  const joined = (c.joined ?? {}) as Record<string, unknown>;
  const op = joined.op === "before" || joined.op === "after" || joined.op === "between" ? joined.op : "any";
  return {
    rows: ids(c.rows).filter((k): k is CondKind => (KINDS as string[]).includes(k)),
    only: ids(c.only),
    require: ids(c.require),
    never: ids(c.never),
    joined: { op, from: typeof joined.from === "string" ? joined.from : "", to: typeof joined.to === "string" ? joined.to : "" },
  };
}

export function emailFromRow(row: AutomaticEmailRow, counts: Counts = NO_COUNTS): AutomaticEmail {
  const unit = (["days", "weeks", "months", "years"] as const).find((u) => u === row.delay_unit) ?? "days";
  const same = row.delay_amount === 0;
  return {
    id: row.id,
    name: row.name,
    trigger: row.trigger as Trigger,
    tag: row.trigger_tag_id,
    delay: same ? "same" : "days",
    days: same ? "30" : String(row.delay_amount),
    unit,
    daysEdited: !same,
    audience: row.conditions ? audienceFrom(row.conditions) : EVERYONE,
    mode: row.mode === "review" ? "review" : "auto",
    state: row.state === "published" || row.state === "trash" ? row.state : "draft",
    subject: row.subject,
    subjectDoc: isDoc(row.subject_doc) ? row.subject_doc : undefined,
    body: isDoc(row.body) ? row.body : undefined,
    wasPublished: row.state === "draft" && row.published_at !== null,
    ...counts,
  };
}

/** The whole draft as save_automatic_email's patch. Dates left blank are left out, as the database expects. */
export function patchFromEmail(e: AutomaticEmail): Record<string, Json> {
  const n = Number(e.days);
  const amount = e.delay === "same" ? 0 : Number.isInteger(n) && n >= 1 ? Math.min(n, DELAY_MAX[e.unit]) : null;
  const { op, from, to } = e.audience.joined;
  return {
    name: e.name,
    trigger: e.trigger,
    trigger_tag_id: e.trigger === "tag_added" ? e.tag : null,
    ...(amount !== null && { delay_amount: amount, delay_unit: e.unit satisfies Unit }),
    conditions: {
      version: 2,
      rows: e.audience.rows,
      only: e.audience.only,
      require: e.audience.require,
      never: e.audience.never,
      joined: { op, ...(from && { from }), ...(to && { to }) },
    },
    mode: e.mode,
    subject: e.subject,
    subject_doc: (e.subjectDoc ?? {}) as Json,
    body: (e.body ?? {}) as Json,
  };
}
