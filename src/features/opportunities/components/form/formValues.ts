import { SDC_ORG } from "../../catalog";
import type { CustomDetail, Opportunity, OpportunityKind, TopicId } from "../../types";

/**
 * The form keeps every control controlled, so typed values survive a failed submit
 * (React resets uncontrolled fields after a form action). Keys match the FormData
 * field names in service.ts exactly.
 */
export type FormValues = Record<string, string>;

/** One custom detail row (Other). `key` is a stable React key; it is never submitted. */
export type DetailRow = CustomDetail & { key: number };

export interface FormModel {
  values: FormValues;
  topics: TopicId[];
  details: DetailRow[];
}

let nextKey = 0;
export const newDetailRow = (d: CustomDetail = { label: "", value: "" }): DetailRow => ({ ...d, key: ++nextKey });

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));

export function initialModel(kind: OpportunityKind, opportunity?: Opportunity): FormModel {
  const values: FormValues = {
    organizationId: opportunity?.organization.id ?? SDC_ORG.id,
    title: opportunity?.title ?? "",
    summary: opportunity?.summary ?? "",
    link: opportunity?.link ?? "",
  };
  let details: DetailRow[] = [];

  if (!opportunity) {
    if (kind === "event") values.cost = "free";
    return { values, topics: [], details };
  }

  // Flatten the kind's details into strings; `details` (Other's custom rows) is handled separately.
  for (const [key, value] of Object.entries(opportunity.details)) {
    if (key === "details") continue;
    values[key] = str(value);
  }
  if (opportunity.kind === "event" && !values.cost) values.cost = "free";
  if (opportunity.kind === "other") details = (opportunity.details.details ?? []).map((d) => newDetailRow(d));

  return { values, topics: [...opportunity.topics], details };
}

/** Props every per-kind section receives. */
export interface KindFieldsProps {
  values: FormValues;
  set: (name: string, value: string) => void;
  error: (name: string) => string | undefined;
}
