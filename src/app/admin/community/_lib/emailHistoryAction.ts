"use server";

/**
 * Thin server-action bridge to the (fixed) data contract in `_data/queries.ts`,
 * so the client-side Emails tab can call it directly. Not part of the contract itself.
 */

import { listMemberEmails } from "../_data/queries";
import type { SentEmail } from "../_data/types";

export async function getMemberEmails(id: string): Promise<SentEmail[]> {
  return listMemberEmails(id);
}
