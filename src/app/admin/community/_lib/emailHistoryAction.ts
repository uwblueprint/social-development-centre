"use server";

/**
 * Thin server-action bridge to the (fixed) data contract in `_data/queries.ts`,
 * so the member panel's Emails section can call it directly. Not part of the contract itself.
 */

import { getSentEmailHtml, listMemberEmails } from "../_data/queries";
import type { SentEmail } from "../_data/types";

export async function getMemberEmails(id: string): Promise<SentEmail[]> {
  return listMemberEmails(id);
}

export async function getMemberEmailHtml(memberId: string, emailId: string): Promise<string | null> {
  return getSentEmailHtml(memberId, emailId);
}
