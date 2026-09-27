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

/**
 * `values` holds the fields every type shares (organization, title, summary, link). Each type's own fields
 * live in `byKind`, so switching Type and back restores what was typed; only `kind`'s values are submitted.
 * `details` are Other's custom rows, kept the same way.
 */
export interface FormModel {
  kind: OpportunityKind;
  values: FormValues;
  byKind: Partial<Record<OpportunityKind, FormValues>>;
  topics: TopicId[];
  details: DetailRow[];
}

let nextKey = 0;
export const newDetailRow = (d: CustomDetail = { label: "", value: "" }): DetailRow => ({ ...d, key: ++nextKey });

const str = (v: unknown) => (v === undefined || v === null ? "" : String(v));

/** A type's starting values the first time it's chosen. */
export const emptyKindValues = (kind: OpportunityKind): FormValues => (kind === "event" ? { cost: "free" } : {});

/** `organizationId` preselects who a new listing is posted as (admin, e.g. from Partners' "Post an opportunity for them"). */
export function initialModel(kind: OpportunityKind, opportunity?: Opportunity, organizationId?: string): FormModel {
  const values: FormValues = {
    organizationId: opportunity?.organization.id ?? organizationId ?? SDC_ORG.id,
    title: opportunity?.title ?? "",
    summary: opportunity?.summary ?? "",
    link: opportunity?.link ?? "",
  };
  if (!opportunity) return { kind, values, byKind: { [kind]: emptyKindValues(kind) }, topics: [], details: [] };

  // Flatten the kind's details into strings; `details` (Other's custom rows) is handled separately.
  const own = emptyKindValues(opportunity.kind);
  for (const [key, value] of Object.entries(opportunity.details)) {
    if (key === "details") continue;
    if (value !== undefined && value !== "") own[key] = str(value);
  }
  const details = opportunity.kind === "other" ? (opportunity.details.details ?? []).map((d) => newDetailRow(d)) : [];
  return { kind: opportunity.kind, values, byKind: { [opportunity.kind]: own }, topics: [...opportunity.topics], details };
}

/** The control id for a FormData field (or error key like `detailLabel.0`), so the error summary can link to it. */
export const fieldId = (name: string) => `opportunity-${name.replace(/\./g, "-")}`;

/** Error keys in form order, per kind, so the error summary lists them top to bottom. */
const BASICS = ["kind", "organizationId", "title", "summary", "topics", "link"];
const KIND_ORDER: Record<OpportunityKind, string[]> = {
  event: ["date", "startTime", "endTime", "format", "location", "cost", "costDetails", "accessibility"],
  petition: ["target", "deadline", "signatureGoal"],
  volunteer: ["commitment", "format", "location", "timeCommitment", "startDate", "applyBy", "skills", "minimumAge"],
  job: ["employmentType", "workplace", "location", "pay", "applyBy", "qualifications"],
  other: ["callToAction", "deadline", "details"],
};

/** Orders field errors as the form shows them; custom detail rows (`detailLabel.<i>`, `detailValue.<i>`) come last, row by row. */
export function orderedErrors(kind: OpportunityKind, fieldErrors: Partial<Record<string, string>> = {}) {
  const order = [...BASICS, ...KIND_ORDER[kind]];
  const rank = (key: string) => {
    const known = order.indexOf(key);
    if (known >= 0) return known;
    const [base, row] = key.split(".");
    return order.length + Number(row ?? 0) * 2 + (base === "detailValue" ? 1 : 0);
  };
  return Object.entries(fieldErrors)
    .filter((entry): entry is [string, string] => !!entry[1])
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([key, message]) => ({ fieldId: fieldId(key), message }));
}

/** Props every per-kind section receives. */
export interface KindFieldsProps {
  values: FormValues;
  set: (name: string, value: string) => void;
  error: (name: string) => string | undefined;
}
