import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { referFriend } from "@/features/referrals/actions";
import { copy } from "@/features/referrals/copy";
import { ReferPage } from "@/features/referrals/ReferPage";
import { parseUuid } from "@/features/referrals/types";

export const metadata: Metadata = { title: copy.pageTitle, robots: { index: false } };

/**
 * The page behind every member email's "Refer a friend" link. No sign-in: the token is the member's
 * person token (`people.unsubscribe_token`). A token that isn't a current member's shows "This link
 * doesn't work".
 */
export default async function ReferPageRoute({ params }: { params: Promise<{ token: string }> }) {
  const token = parseUuid((await params).token);
  let firstName: string | null = null;
  if (token) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("referral_page", { p_token: token });
    if (error) console.error("referral_page failed:", error.message);
    firstName = data?.[0]?.first_name ?? null;
  }
  return <ReferPage referrerFirstName={firstName} onRefer={referFriend.bind(null, token ?? "")} />;
}
