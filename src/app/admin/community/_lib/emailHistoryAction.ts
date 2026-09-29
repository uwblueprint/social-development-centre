"use server";

/**
 * Thin server-action bridge to the data contract in `_data/queries.ts`, so the member panel can call
 * it directly: the person after an action, and their Emails section. Not part of the contract itself.
 */

import { getMember, getSentEmailHtml, listMemberEmails } from "../_data/queries";
import type { Member, SentEmail } from "../_data/types";

export async function getMemberById(id: string): Promise<Member | null> {
  return getMember(id);
}

export async function getMemberEmails(id: string): Promise<SentEmail[]> {
  return listMemberEmails(id);
}

export async function getMemberEmailHtml(memberId: string, emailId: string): Promise<string | null> {
  return getSentEmailHtml(memberId, emailId);
}
