import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { KIND_NOUN } from "@/features/opportunities/catalog";
import { OpportunityForm } from "@/features/opportunities/components/form/OpportunityForm";
import { copy } from "@/features/opportunities/copy";
import { getOpportunity } from "@/features/opportunities/queries";
import type { Actor } from "@/features/opportunities/types";
import { getCurrentPartner } from "../../../_data/session";
import { prefillFromEventbrite, saveOpportunity } from "../../_data/actions";

type Props = { params: Promise<{ id: string }> };

const BASE = "/partner/opportunities";

/** Scoped to the partner's organization: another organization's id reads as not found. */
async function load(id: string) {
  const partner = await getCurrentPartner();
  if (!partner) redirect("/login");
  const actor: Actor = { role: "partner", name: partner.name, organizationId: partner.organization.id };
  return getOpportunity(actor, id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const opportunity = await load((await params).id);
  return { title: opportunity ? copy.form.editTitle(KIND_NOUN[opportunity.kind]) : copy.notFound.title };
}

export default async function EditOpportunityPage({ params }: Props) {
  const opportunity = await load((await params).id);
  if (!opportunity) notFound(); // renders ../not-found.tsx with a 404 status
  return (
    <OpportunityForm
      key={opportunity.id}
      scope="partner"
      basePath={BASE}
      kind={opportunity.kind}
      opportunity={opportunity}
      save={saveOpportunity}
      prefill={prefillFromEventbrite}
    />
  );
}
