"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { copy } from "./copy";
import { friendLinkPath, parseUuid, type ReferralResult, type ReferralValues } from "./types";

const onDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Toronto" });

/**
 * A member refers a friend from their referral link. No sign-in: the person token in the link is the
 * proof, and `refer_friend` applies every rule (docs/backend/referrals.md). Bind the token on the
 * server (`referFriend.bind(null, token)`) so the page never handles it as a form field.
 */
export async function referFriend(token: string, values: ReferralValues): Promise<ReferralResult> {
  const personToken = parseUuid(token);
  if (!personToken) return { status: "unknown" };
  const name = String(values.name ?? "").trim();
  if (!name) return { status: "invalid", fieldErrors: { name: copy.nameRequired } };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("refer_friend", {
    p_token: personToken,
    p_full_name: name,
    p_email: String(values.email ?? ""),
    p_send_email: values.delivery === "email",
  });
  const row = data?.[0];
  if (error || !row) {
    console.error("refer_friend failed:", error?.message ?? "no row");
    return { status: "failed" };
  }

  switch (row.status) {
    case "unknown_link":
      return { status: "unknown" };
    case "invalid_name":
      return { status: "invalid", fieldErrors: { name: copy.nameInvalid } };
    case "invalid_email":
      return { status: "invalid", fieldErrors: { email: copy.emailInvalid } };
    case "own_email":
      return { status: "invalid", fieldErrors: { email: copy.ownEmail } };
    case "limit":
      return { status: "limit" };
    case "emailed":
      return { status: "emailed", friendName: row.friend_name };
    case "message": {
      // Server actions always carry Origin (Next checks it); fall back to the bare path just in case.
      const origin = (await headers()).get("origin");
      const path = friendLinkPath(row.referral_id);
      return {
        status: "message",
        friendName: row.friend_name,
        link: origin ? new URL(path, origin).toString() : path,
        referredOn: row.referred_on ? onDate.format(new Date(row.referred_on)) : undefined,
      };
    }
    default:
      console.error("refer_friend returned an unknown status:", row.status);
      return { status: "failed" };
  }
}
