/** `not_sent`: the invite email bounced or couldn't be sent. The person has no access until a new invite goes out. */
export type AdminStatus = "active" | "invited" | "not_sent";

export interface AdminRecord {
  id: string;
  name: string;
  email: string;
  status: AdminStatus;
  /** ISO 8601: when they accepted the invite. Absent until they have, so invited and not-sent admins have none. */
  addedAt?: string;
}
