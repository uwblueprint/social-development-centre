import { revalidatePath } from "next/cache";
import { orgs, statusOf } from "@/app/admin/partners/_data/store";
import type { ActionState } from "@/lib/forms";
import { normalizeWebAddress } from "@/lib/url";
import { ACCESSIBILITY_FEATURES, AREAS, KIND_NOUN, LIMITS, MAX_TOPICS, SDC_ORG, SKILLS, TIME_COMMITMENTS, TOPICS } from "./catalog";
import { effectiveStatus, hasEnded } from "./format";
import { nextOpportunityId, opportunities } from "./store";
import type {
  AccessibilityFeature,
  Actor,
  Area,
  CustomDetail,
  Opportunity,
  OpportunityKind,
  OrganizationRef,
  SaveResult,
  SkillId,
  TimeCommitment,
  TopicId,
} from "./types";

/*
 * Server-side logic behind both portals' actions. Not a server action module itself:
 * src/app/{admin,partner}/opportunities/_data/actions.ts bind the actor from the session and call these.
 * Backend: keep FormData field names and ActionState results; replace the store calls.
 *
 * FormData fields (all strings; "multiple" fields repeat the key):
 *   id?            present when editing
 *   kind           event | petition | volunteer | job | other
 *   intent         draft | publish | save   (save keeps the current status)
 *   organizationId admin only; ignored for partners
 *   title, summary, link, topics (multiple)
 *   event:      date, startTime, endTime, format, area (unless online), cost, priceMin, priceMax, accessibility (multiple), accessibilityNote
 *   petition:   target, deadline, signatureGoal
 *   volunteer:  timeCommitment, format, area, startDate, skills (multiple), minimumAge, applyBy
 *   job:        employmentType, workplace, area, pay, applyBy, qualifications
 * area is one of AREAS; timeCommitment, skills and accessibility are ids from catalog.ts. Unknown list ids are dropped.
 *   other:      callToAction, deadline, detailLabel (multiple), detailValue (multiple)
 */

const KINDS = new Set<OpportunityKind>(["event", "petition", "volunteer", "job", "other"]);
const TOPIC_IDS = new Set<string>(TOPICS.map((t) => t.id));
const AREA_IDS = new Set<string>(AREAS.map((a) => a.id));
const TIME_COMMITMENT_IDS = new Set<string>(TIME_COMMITMENTS.map((t) => t.id));
const SKILL_IDS = new Set<string>(SKILLS.map((t) => t.id));
const ACCESSIBILITY_IDS = new Set<string>(ACCESSIBILITY_FEATURES.map((t) => t.id));
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const opt = (fd: FormData, key: string) => text(fd, key) || undefined;
const all = (fd: FormData, key: string) => fd.getAll(key).map((v) => String(v).trim());
const num = (fd: FormData, key: string) => {
  const v = text(fd, key);
  return v ? Number(v) : undefined;
};

function revalidate() {
  revalidatePath("/admin/opportunities");
  revalidatePath("/partner/opportunities");
  revalidatePath("/admin/partners");
}

/** About 2 MB of image as base64 (the browser scales images to 1200px wide first, so real ones are far smaller). */
const IMAGE_MAX_CHARS = 2_800_000;
const fail = (message: string, fieldErrors?: ActionState["fieldErrors"]): ActionState<never> => ({ status: "error", message, fieldErrors });

const MISSING = "This opportunity no longer exists.";

/** The form's error summary title, e.g. "Fix 2 fields to publish this event". */
function summaryTitle(count: number, intent: string, noun: string) {
  const fields = count === 1 ? "1 field" : `${count} fields`;
  if (intent === "draft") return `Fix ${fields} to save this draft`;
  if (intent === "save") return `Fix ${fields} to save your changes`;
  return `Fix ${fields} to publish this ${noun}`;
}

const isRemoved = (organizationId: string) => {
  const org = orgs().find((o) => o.id === organizationId);
  return !!org && statusOf(org) === "removed";
};

function canEdit(actor: Actor, o: Opportunity) {
  return actor.role === "admin" || o.organization.id === actor.organizationId;
}

function resolveOrganization(actor: Actor, fd: FormData): OrganizationRef | null {
  if (actor.role === "partner") {
    const org = orgs().find((o) => o.id === actor.organizationId);
    return org ? { id: org.id, name: org.name } : null;
  }
  const id = text(fd, "organizationId") || SDC_ORG.id;
  if (id === SDC_ORG.id) return SDC_ORG;
  const org = orgs().find((o) => o.id === id && statusOf(o) !== "removed");
  return org ? { id: org.id, name: org.name } : null;
}

type Errors = Record<string, string>;

function readDetails(kind: OpportunityKind, fd: FormData, errors: Errors, strict: boolean) {
  const need = (key: string, message: string) => {
    if (strict && !text(fd, key)) errors[key] = message;
  };
  const date = (key: string) => {
    const v = text(fd, key);
    if (v && !DATE.test(v)) errors[key] = "Enter a date like 2026-10-08.";
  };
  const positiveInt = (key: string, message: string) => {
    const v = text(fd, key);
    if (v && !(Number.isInteger(Number(v)) && Number(v) > 0)) errors[key] = message;
  };

  // Area: one of AREAS. No street address (nothing uses it). Shared by event, volunteer role and job.
  const place = () => {
    need("area", "Choose the area.");
    const raw = opt(fd, "area");
    if (raw && !AREA_IDS.has(raw)) errors.area = "Choose the area.";
    const area = raw && AREA_IDS.has(raw) ? (raw as Area) : undefined;
    return { area };
  };
  /** Repeated values from a fixed list; unknown ids and duplicates are dropped. */
  const pick = <T extends string>(key: string, allowed: Set<string>) => {
    const values = [...new Set(all(fd, key))].filter((v) => allowed.has(v)) as T[];
    return values.length ? values : undefined;
  };

  switch (kind) {
    case "event": {
      need("date", "Choose the event date.");
      need("startTime", "Enter a start time.");
      need("format", "Choose how people attend.");
      date("date");
      for (const k of ["startTime", "endTime"]) if (text(fd, k) && !TIME.test(text(fd, k))) errors[k] = "Enter a time like 18:30.";
      const format = opt(fd, "format") as "in_person" | "online" | "hybrid" | undefined;
      const start = text(fd, "startTime");
      const end = text(fd, "endTime");
      if (start && end && TIME.test(start) && TIME.test(end) && end <= start) errors.endTime = "End time must be after the start time.";
      // Online events need no area; in person and hybrid need one (and never a street address).
      const where = format === "online" ? { area: "online" as Area } : { area: place().area };
      if (strict && format && format !== "online" && where.area === "online") errors.area = "Choose where the event is.";
      const cost = (opt(fd, "cost") ?? "free") as "free" | "paid";
      const price = (key: string) => {
        const raw = text(fd, key).replace(/^\$/, "");
        if (!raw) return undefined;
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0) {
          errors[key] = "Enter a dollar amount, like 10.";
          return undefined;
        }
        return Math.round(n);
      };
      const priceMin = cost === "paid" ? price("priceMin") : undefined;
      const priceMax = cost === "paid" ? price("priceMax") : undefined;
      if (cost === "paid") need("priceMin", "Enter the price, or the lowest price if it varies.");
      if (priceMin !== undefined && priceMax !== undefined && priceMax < priceMin) errors.priceMax = "The highest price can't be lower than the lowest.";
      return {
        date: opt(fd, "date"), startTime: opt(fd, "startTime"), endTime: opt(fd, "endTime"), format, ...where, cost,
        priceMin, priceMax: priceMax !== undefined && priceMax !== priceMin ? priceMax : undefined,
        accessibility: pick<AccessibilityFeature>("accessibility", ACCESSIBILITY_IDS),
        accessibilityNote: opt(fd, "accessibilityNote")?.slice(0, LIMITS.accessibilityNote),
      };
    }
    case "petition": {
      need("target", "Say who the petition is addressed to.");
      date("deadline");
      positiveInt("signatureGoal", "Enter a whole number, like 500.");
      return { target: opt(fd, "target"), deadline: opt(fd, "deadline"), signatureGoal: num(fd, "signatureGoal") };
    }
    case "volunteer": {
      need("timeCommitment", "Choose the time commitment.");
      const rawCommitment = opt(fd, "timeCommitment");
      if (rawCommitment && !TIME_COMMITMENT_IDS.has(rawCommitment)) errors.timeCommitment = "Choose the time commitment.";
      need("format", "Choose where volunteers work.");
      const format = opt(fd, "format") as "in_person" | "remote" | "hybrid" | undefined;
      const where = place();
      date("startDate");
      date("applyBy");
      positiveInt("minimumAge", "Enter an age in years, like 16.");
      return {
        timeCommitment: rawCommitment && TIME_COMMITMENT_IDS.has(rawCommitment) ? (rawCommitment as TimeCommitment) : undefined,
        format, ...where, startDate: opt(fd, "startDate"), skills: pick<SkillId>("skills", SKILL_IDS),
        minimumAge: num(fd, "minimumAge"), applyBy: opt(fd, "applyBy"),
      };
    }
    case "job": {
      need("employmentType", "Choose the employment type.");
      need("workplace", "Choose where the work happens.");
      const workplace = opt(fd, "workplace") as "on_site" | "remote" | "hybrid" | undefined;
      const where = place();
      date("applyBy");
      return {
        employmentType: opt(fd, "employmentType") as never, workplace, ...where, pay: opt(fd, "pay"),
        applyBy: opt(fd, "applyBy"), qualifications: opt(fd, "qualifications"),
      };
    }
    case "other": {
      need("callToAction", "Enter what people should do, like “Take the survey”.");
      date("deadline");
      const labels = all(fd, "detailLabel");
      const values = all(fd, "detailValue");
      const details: CustomDetail[] = [];
      labels.forEach((label, i) => {
        const value = values[i] ?? "";
        if (!label && !value) return;
        if (!label) errors[`detailLabel.${i}`] = "Add a label, or clear this detail.";
        if (!value) errors[`detailValue.${i}`] = "Add a value, or clear this detail.";
        details.push({ label: label.slice(0, LIMITS.customLabel), value: value.slice(0, LIMITS.customValue) });
      });
      if (details.length > LIMITS.customDetails) errors.details = `Keep it to ${LIMITS.customDetails} details.`;
      return { callToAction: opt(fd, "callToAction"), deadline: opt(fd, "deadline"), details };
    }
  }
}

export async function saveOpportunity(actor: Actor, fd: FormData): Promise<ActionState<SaveResult>> {
  const id = text(fd, "id");
  const existing = id ? opportunities().find((o) => o.id === id) : undefined;
  if (id && (!existing || !canEdit(actor, existing))) return fail(MISSING);

  // Type can change while a listing is new or a draft; after publishing it's fixed.
  const kind = (existing && existing.status !== "draft" ? existing.kind : text(fd, "kind")) as OpportunityKind;
  if (!KINDS.has(kind)) return fail("Choose a type of opportunity.");

  const intent = text(fd, "intent") || "publish";
  // "save" keeps the stored status. An ended listing is stored as published, so moving its date forward revives it.
  const nextStatus = intent === "draft" ? "draft" : intent === "save" ? (existing?.status ?? "draft") : "published";
  const strict = nextStatus !== "draft";

  const organization = resolveOrganization(actor, fd);
  const errors: Errors = {};
  if (!organization) errors.organizationId = "Choose an organization.";

  const title = text(fd, "title");
  const summary = text(fd, "summary");
  // The image: a browser-scaled JPEG/PNG/WebP data URL, or an https address (e.g. from Eventbrite).
  const rawImage = text(fd, "imageUrl");
  const imageOk = !rawImage || /^data:image\/(jpeg|png|webp);base64,/.test(rawImage) || /^https:\/\//.test(rawImage);
  if (!imageOk) errors.imageUrl = "Choose a JPG, PNG or WebP image.";
  else if (rawImage.length > IMAGE_MAX_CHARS) errors.imageUrl = "Choose a smaller image, up to about 2 MB.";
  const rawLink = text(fd, "link");
  // Volunteer roles and jobs may only have an email: stored as mailto: so the email button still works.
  const emailOk = kind === "volunteer" || kind === "job";
  const isEmail = emailOk && /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(rawLink);
  const link = !rawLink ? "" : isEmail ? `mailto:${rawLink}` : normalizeWebAddress(rawLink);
  const topics = [...new Set(all(fd, "topics"))].filter((t) => TOPIC_IDS.has(t)) as TopicId[];

  if (!title) errors.title = "Enter a title.";
  else if (title.length > LIMITS.title) errors.title = `Keep the title to ${LIMITS.title} characters.`;
  if (summary.length > LIMITS.summary) errors.summary = `Keep the description to ${LIMITS.summary} characters.`;
  if (strict && !summary) errors.summary = "Add a short description.";
  if (strict && topics.length === 0) errors.topics = "Choose at least one topic.";
  if (topics.length > MAX_TOPICS) errors.topics = `Choose up to ${MAX_TOPICS} topics.`;
  if (strict && !rawLink) errors.link = "Add the link where people take action.";
  else if (link === null) errors.link = emailOk ? "Enter a web address, like sdckw.ca, or an email address." : "Enter a web address, like sdckw.ca.";

  const details = readDetails(kind, fd, errors, strict);
  const noun = KIND_NOUN[kind];

  // The message titles the form's error summary; there's no toast for field errors.
  if (Object.keys(errors).length) return fail(summaryTitle(Object.keys(errors).length, intent, noun), errors);

  const now = new Date().toISOString();
  const record = {
    id: existing?.id ?? nextOpportunityId(),
    kind,
    title,
    summary,
    imageUrl: imageOk && rawImage ? rawImage : undefined,
    topics,
    link: link ?? "",
    organization: organization!,
    details,
    status: nextStatus,
    closedReason: nextStatus === "closed" ? (existing?.closedReason ?? "closed") : undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    updatedBy: { name: actor.name, role: actor.role },
    publishedAt: nextStatus === "published" ? (existing?.publishedAt ?? now) : existing?.publishedAt,
  } as Opportunity;

  if (intent === "publish" && hasEnded(record)) {
    const field = kind === "event" ? "date" : kind === "volunteer" || kind === "job" ? "applyBy" : "deadline";
    return fail(summaryTitle(1, intent, noun), {
      [field]: kind === "event" ? "This date and time has passed. Choose a future date." : "This date has passed. Choose a future date or clear it.",
    });
  }

  const list = opportunities();
  if (existing) list[list.indexOf(existing)] = record;
  else list.push(record);
  revalidate();

  // Every confirmation names the listing ("Draft saved" alone doesn't say which).
  const name = `“${record.title}”`;
  const message =
    nextStatus === "draft"
      ? `${name} saved as a draft.`
      : !existing || existing.status === "draft"
        ? `${name} is published. Members can now see this ${noun}.`
        : `Changes to ${name} saved.`;
  const removedAt = orgs().find((o) => o.id === record.organization.id)?.removedAt;
  const shown = effectiveStatus(record, new Date(), removedAt).status;
  return { status: "success", message, data: { id: record.id, tab: shown === "draft" ? "drafts" : shown } };
}

function find(actor: Actor, id: string) {
  const o = opportunities().find((x) => x.id === id);
  return o && canEdit(actor, o) ? o : null;
}

export async function closeOpportunity(actor: Actor, id: string): Promise<ActionState> {
  const o = find(actor, id);
  if (!o) return fail(MISSING);
  o.status = "closed";
  o.closedReason = "closed";
  o.updatedAt = new Date().toISOString();
  o.updatedBy = { name: actor.name, role: actor.role };
  revalidate();
  return { status: "success", message: `“${o.title}” is closed. It won't be recommended to members or included in emails.` };
}

export async function reopenOpportunity(actor: Actor, id: string): Promise<ActionState> {
  const o = find(actor, id);
  if (!o) return fail(MISSING);
  if (hasEnded(o)) return fail(`This ${KIND_NOUN[o.kind]} has already ended. Edit its date to reopen it.`);
  if (isRemoved(o.organization.id)) {
    return fail("This partner no longer has access. Reinvite them before reopening their opportunities.");
  }
  o.status = "published";
  o.closedReason = undefined;
  o.updatedAt = new Date().toISOString();
  o.updatedBy = { name: actor.name, role: actor.role };
  revalidate();
  return { status: "success", message: `“${o.title}” is open again. Members can see it.` };
}

export async function duplicateOpportunity(actor: Actor, id: string): Promise<ActionState<{ id: string }>> {
  const o = find(actor, id);
  if (!o) return fail(MISSING);
  const now = new Date().toISOString();
  const copy = {
    ...structuredClone(o),
    id: nextOpportunityId(),
    title: `Copy of ${o.title}`.slice(0, LIMITS.title),
    status: "draft",
    closedReason: undefined,
    createdAt: now,
    updatedAt: now,
    publishedAt: undefined,
    updatedBy: { name: actor.name, role: actor.role },
  } as Opportunity;
  opportunities().push(copy);
  revalidate();
  return { status: "success", message: `Duplicated “${o.title}” as a draft.`, data: { id: copy.id } };
}

export async function deleteOpportunity(actor: Actor, id: string): Promise<ActionState> {
  const o = find(actor, id);
  if (!o) return fail(MISSING);
  const list = opportunities();
  list.splice(list.indexOf(o), 1);
  revalidate();
  return { status: "success", message: `Deleted “${o.title}”.` };
}

/**
 * Stores a removed organization's published listings as closed (`partner_removed`), so they stay closed
 * while its access is being restored. Listings whose date passed before removal are left to read as Ended.
 * Call it when access is removed, or at the latest before the removal is cleared on reinvite.
 */
export function closeListingsForOrganization(organizationId: string) {
  const removedAt = orgs().find((o) => o.id === organizationId)?.removedAt;
  for (const o of opportunities()) {
    if (o.organization.id !== organizationId || o.status !== "published") continue;
    if (effectiveStatus(o, new Date(), removedAt ?? new Date().toISOString()).closedReason !== "partner_removed") continue;
    o.status = "closed";
    o.closedReason = "partner_removed";
  }
  revalidate();
}

/** @deprecated Use closeListingsForOrganization; kept so Partners' reinvite keeps working until it switches over. */
export const closeListingsPastRemovalCutoff: (organizationId: string, removedAt?: string) => void = (organizationId) =>
  closeListingsForOrganization(organizationId);

/**
 * Reinstatement: when someone accepts an invitation to a removed organization and its
 * access returns, the acceptance handler calls this. It reopens the organization's listings that were closed
 * because its access was removed and whose dates haven't passed. Listings someone closed by hand, and
 * listings that ended, stay closed. Returns how many reopened.
 */
export function reopenListingsForOrganization(organizationId: string): number {
  let reopened = 0;
  for (const o of opportunities()) {
    if (o.organization.id !== organizationId || o.status !== "closed" || o.closedReason !== "partner_removed") continue;
    if (hasEnded(o)) {
      o.closedReason = "ended";
      continue;
    }
    o.status = "published";
    o.closedReason = undefined;
    reopened++;
  }
  revalidate();
  return reopened;
}
