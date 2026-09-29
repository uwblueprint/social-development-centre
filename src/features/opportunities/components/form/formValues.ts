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

/** `organizationId` preselects who a new listing is posted as (admin, e.g. from Partners' "Post for them"). */
export function initialModel(kind: OpportunityKind, opportunity?: Opportunity, organizationId?: string): FormModel {
  const values: FormValues = {
    organizationId: opportunity?.organization.id ?? organizationId ?? SDC_ORG.id,
    title: opportunity?.title ?? "",
    summary: opportunity?.summary ?? "",
    imageUrl: opportunity?.imageUrl ?? "",
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

/** Error keys in form order, per kind, so the error summary lists them top to bottom. Step 1 holds `kind` and `link`. */
const TYPE_STEP = ["kind", "eventbrite", "link"];
const BASICS = ["organizationId", "title", "summary", "topics"];
const KIND_ORDER: Record<OpportunityKind, string[]> = {
  event: ["date", "startTime", "endTime", "format", "area", "cost", "priceMin", "priceMax", "accessibility", "accessibilityNote"],
  petition: ["target", "deadline", "signatureGoal"],
  volunteer: ["timeCommitment", "format", "area", "startDate", "applyBy", "skills", "minimumAge"],
  job: ["employmentType", "workplace", "area", "pay", "applyBy", "qualifications"],
  other: ["callToAction", "deadline", "details"],
};

export type Step = 1 | 2 | 3;

/** Which step shows a field (or error key). Everything but Type and the links is on Details. */
export const stepOf = (key: string): Step => (TYPE_STEP.includes(key) ? 1 : 2);

/** Fields that hold several ids. The model keeps them comma-joined; FormData repeats the key. */
const MULTI = new Set(["skills", "accessibility"]);
export const listValue = (values: FormValues, name: string) => (values[name] ?? "").split(",").filter(Boolean);
export const toggleListValue = (values: FormValues, name: string, id: string) => {
  const current = listValue(values, name);
  return (current.includes(id) ? current.filter((v) => v !== id) : [...current, id]).join(",");
};

/**
 * Builds the service.ts FormData from the model rather than from the DOM, since only the current step is
 * rendered. Only the selected type's own values are sent.
 */
export function toFormData(model: FormModel, intent: string, id?: string): FormData {
  const fd = new FormData();
  fd.set("intent", intent);
  fd.set("kind", model.kind);
  if (id) fd.set("id", id);
  for (const [key, value] of Object.entries(model.values)) fd.set(key, value);
  for (const topic of model.topics) fd.append("topics", topic);
  for (const [key, value] of Object.entries(model.byKind[model.kind] ?? {})) {
    if (MULTI.has(key)) for (const v of value.split(",").filter(Boolean)) fd.append(key, v);
    else fd.set(key, value);
  }
  if (model.kind === "other") {
    for (const row of model.details) {
      fd.append("detailLabel", row.label);
      fd.append("detailValue", row.value);
    }
  }
  return fd;
}

/** The model as a draft Opportunity, for the Review step's email preview (format.ts helpers read it). */
export function previewOpportunity(model: FormModel, organization: { id: string; name: string }): Opportunity {
  const own = model.byKind[model.kind] ?? {};
  const details: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(own)) if (value) details[key] = MULTI.has(key) ? value.split(",").filter(Boolean) : value;
  if (model.kind === "other") details.details = model.details.filter((d) => d.label || d.value);
  const now = new Date().toISOString();
  return {
    id: "preview",
    kind: model.kind,
    title: model.values.title?.trim() ?? "",
    summary: model.values.summary?.trim() ?? "",
    imageUrl: model.values.imageUrl || undefined,
    topics: model.topics,
    link: model.values.link?.trim() ?? "",
    organization,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    updatedBy: { name: "", role: "partner" },
    details,
  } as Opportunity;
}

/** Orders field errors as the form shows them; custom detail rows (`detailLabel.<i>`, `detailValue.<i>`) come last, row by row. */
export function orderedErrors(kind: OpportunityKind, fieldErrors: Partial<Record<string, string>> = {}) {
  const order = [...TYPE_STEP, ...BASICS, ...KIND_ORDER[kind]];
  const rank = (key: string) => {
    const known = order.indexOf(key);
    if (known >= 0) return known;
    const [base, row] = key.split(".");
    return order.length + Number(row ?? 0) * 2 + (base === "detailValue" ? 1 : 0);
  };
  return Object.entries(fieldErrors)
    .filter((entry): entry is [string, string] => !!entry[1])
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([key, message]) => ({ key, fieldId: fieldId(key), message }));
}

/** Props every per-kind section receives. */
export interface KindFieldsProps {
  kind: OpportunityKind;
  values: FormValues;
  set: (name: string, value: string) => void;
  error: (name: string) => string | undefined;
}

/**
 * Which fields a Details section shows. "all" is the normal form. After an Eventbrite fill the step is
 * split: "eventbrite" (what the Eventbrite API provides) first, then "yours" (what only the person knows).
 */
export type FieldPart = "all" | "eventbrite" | "yours";
