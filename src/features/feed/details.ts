import {
  Accessibility,
  Banknote,
  CalendarDays,
  Clock,
  GraduationCap,
  Info,
  Landmark,
  MapPin,
  Ticket,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import {
  ACCESSIBILITY_LABEL,
  AREA_LABEL,
  EMPLOYMENT_TYPE_LABEL,
  EVENT_FORMAT_LABEL,
  SKILL_LABEL,
  TIME_COMMITMENT_LABEL,
  VOLUNTEER_FORMAT_LABEL,
  WORKPLACE_LABEL,
} from "@/features/opportunities/catalog";
import { copy as opportunityCopy } from "@/features/opportunities/copy";
import { formatDate, formatWhen, formatWhenLine } from "@/features/opportunities/format";
import type { Opportunity } from "@/features/opportunities/types";
import { feedCopy } from "./copy";

/** The button text: the partner's own for "Other", otherwise the type's (Register, Apply, Sign the petition...). */
export function ctaLabel(o: Opportunity): string {
  return o.kind === "other" && o.details.callToAction ? o.details.callToAction : opportunityCopy.form.review.cta[o.kind];
}

const number = new Intl.NumberFormat("en-CA");

export function costLabel(o: Opportunity): string | undefined {
  if (o.kind !== "event" || !o.details.cost) return undefined;
  return o.details.cost === "free" ? feedCopy.card.free : feedCopy.card.paid(o.details.priceMin, o.details.priceMax);
}

/** Where, in a few words: "Kitchener · In person". Undefined for types with no place. */
export function whereLabel(o: Opportunity): string | undefined {
  switch (o.kind) {
    case "event":
      return o.details.area ? `${AREA_LABEL[o.details.area]}${o.details.format && o.details.format !== "in_person" && o.details.area !== "online" ? ` · ${EVENT_FORMAT_LABEL[o.details.format]}` : ""}` : undefined;
    case "volunteer":
      return o.details.area ? `${AREA_LABEL[o.details.area]}${o.details.format && o.details.format !== "in_person" && o.details.area !== "online" ? ` · ${VOLUNTEER_FORMAT_LABEL[o.details.format]}` : ""}` : undefined;
    case "job":
      return o.details.area ? `${AREA_LABEL[o.details.area]}${o.details.workplace && o.details.workplace !== "on_site" && o.details.area !== "online" ? ` · ${WORKPLACE_LABEL[o.details.workplace]}` : ""}` : undefined;
    default:
      return undefined;
  }
}

/** The one line that answers "when": the date and time, the closing date, or how long it runs. */
export function whenLabel(o: Opportunity): string {
  return formatWhenLine(o) ?? formatWhen(o);
}

export interface Fact {
  icon: LucideIcon;
  label: string;
  value: string;
}

/** The labelled facts the details panel shows, in reading order. Only what the partner filled in. */
export function factsFor(o: Opportunity): Fact[] {
  const facts: Fact[] = [];
  const add = (icon: LucideIcon, label: string, value?: string) => value && facts.push({ icon, label, value });
  switch (o.kind) {
    case "event": {
      const d = o.details;
      add(CalendarDays, "When", whenLabel(o));
      add(MapPin, "Where", whereLabel(o));
      add(Ticket, "Cost", costLabel(o));
      add(
        Accessibility,
        "Accessibility",
        [...(d.accessibility ?? []).map((a) => ACCESSIBILITY_LABEL[a]), d.accessibilityNote].filter(Boolean).join(" · ") || undefined,
      );
      break;
    }
    case "petition": {
      const d = o.details;
      add(Landmark, "Addressed to", d.target);
      add(CalendarDays, "Closes", d.deadline ? formatDate(d.deadline) : undefined);
      add(Users, "Goal", d.signatureGoal ? `${number.format(d.signatureGoal)} signatures` : undefined);
      break;
    }
    case "volunteer": {
      const d = o.details;
      add(Clock, "Time", d.timeCommitment ? TIME_COMMITMENT_LABEL[d.timeCommitment] : undefined);
      add(MapPin, "Where", whereLabel(o));
      add(CalendarDays, "Starts", d.startDate ? formatDate(d.startDate) : undefined);
      add(CalendarDays, "Apply by", d.applyBy ? formatDate(d.applyBy) : undefined);
      add(Wrench, "Skills", d.skills?.length ? d.skills.map((s) => SKILL_LABEL[s]).join(" · ") : undefined);
      add(UserRound, "Minimum age", d.minimumAge ? `${d.minimumAge}+` : undefined);
      break;
    }
    case "job": {
      const d = o.details;
      add(Clock, "Type", d.employmentType ? EMPLOYMENT_TYPE_LABEL[d.employmentType] : undefined);
      add(MapPin, "Where", whereLabel(o));
      add(Banknote, "Pay", d.pay);
      add(CalendarDays, "Apply by", d.applyBy ? formatDate(d.applyBy) : undefined);
      add(GraduationCap, "Qualifications", d.qualifications);
      break;
    }
    case "other": {
      const d = o.details;
      add(CalendarDays, "Closes", d.deadline ? formatDate(d.deadline) : undefined);
      for (const item of d.details ?? []) add(Info, item.label, item.value);
      break;
    }
  }
  return facts;
}
