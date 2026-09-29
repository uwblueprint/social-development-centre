import { labRead } from "@/dev/state-lab/state"; // STATE LAB (disposable)
import { getPartner } from "@/app/admin/partners/_data/queries";
import type { PartnerOrganization } from "@/app/admin/partners/_data/types";
import { getCurrentPartner } from "../../_data/session";

/** Backend: the signed-in partner's own organization, with its current contacts. Scoped by the session. */
export async function getMyOrganization(): Promise<PartnerOrganization | null> {
  await labRead(); // STATE LAB (disposable)
  const partner = await getCurrentPartner();
  return partner ? getPartner(partner.organization.id) : null;
}
