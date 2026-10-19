import type { AdminRecord } from "../_data/types";

/**
 * Frontend stand-in. The backend replaces both exports (see docs/backend/admins.md): the list comes from the
 * admin records, and the send result comes from the email provider.
 */
export const SAMPLE_ADMINS: AdminRecord[] = [
  { id: "adm_1", name: "Admin User", email: "admin@sdc.example", status: "active", addedAt: "2026-06-02T15:00:00.000Z" },
  { id: "adm_2", name: "Priya Raman", email: "priya@sdc.example", status: "active", addedAt: "2026-07-14T15:00:00.000Z" },
  { id: "adm_3", name: "Marcus Webb", email: "marcus@sdc.example", status: "invited" },
  { id: "adm_4", name: "Dana Okafor", email: "dana@sdc.example", status: "not_sent" },
];

/** Addresses at this domain fail to send, so the "Not sent" flow can be tried without a backend. */
export const DEMO_BOUNCE_DOMAIN = "bounce.test";

export function demoSendInvite(email: string): "sent" | "failed" {
  return email.toLowerCase().endsWith(`@${DEMO_BOUNCE_DOMAIN}`) ? "failed" : "sent";
}
