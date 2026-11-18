"use client";

import { ReferPage } from "@/features/referrals/ReferPage";
import { demoReferFriend, REFERRER } from "./data";

/** The real page with the demo standing in for the server action (a client function can't come from the server page). */
export function DemoReferPage({ unknownLink }: { unknownLink: boolean }) {
  return <ReferPage referrerFirstName={unknownLink ? null : REFERRER.firstName} onRefer={demoReferFriend} />;
}
