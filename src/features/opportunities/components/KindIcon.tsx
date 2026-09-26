import { BriefcaseBusiness, CalendarDays, HandHeart, PenLine, Shapes, type LucideIcon } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import type { OpportunityKind } from "../types";

export const KIND_ICON: Record<OpportunityKind, LucideIcon> = {
  event: CalendarDays,
  petition: PenLine,
  volunteer: HandHeart,
  job: BriefcaseBusiness,
  other: Shapes,
};

/** Decorative: always pair with the kind's text label (never convey type by icon alone). */
export function KindIcon({ kind, size = 16 }: { kind: OpportunityKind; size?: number }) {
  return <Icon icon={KIND_ICON[kind]} size={size} />;
}
