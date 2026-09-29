"use client";

import { CalendarX, MailX, MousePointerClick, UserRoundX } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { partnersCopy } from "../_copy";
import type { PartnerHealth } from "../_data/types";

const ICONS = { notOnboarded: UserRoundX, noRecentPosts: CalendarX, notEmailed: MailX, noClicks: MousePointerClick } as const;

/** An organization's health tag: text and an icon, never colour alone. */
export function HealthBadge({ tag }: { tag: PartnerHealth }) {
  return (
    <Badge $variant={tag === "notOnboarded" ? "neutral" : "warning"}>
      <Icon icon={ICONS[tag]} size={12} />
      {partnersCopy.health.tags[tag]}
    </Badge>
  );
}
