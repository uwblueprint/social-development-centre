import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { KIND_NOUN } from "@/features/opportunities/catalog";
import { OpportunityForm } from "@/features/opportunities/components/form/OpportunityForm";
import { copy } from "@/features/opportunities/copy";
import { getOpportunity, listPublisherOptions } from "@/features/opportunities/queries";
import type { Actor } from "@/features/opportunities/types";
import { getCurrentAdmin } from "../../../_data/session";
import { prefillFromEventbrite, saveOpportunity } from "../../_data/actions";

type Props = { params: Promise<{ id: string }> };

const BASE = "/admin/opportunities";

async function load(id: string) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login/admin");
  const actor: Actor = { role: "admin", name: admin.name };
  return getOpportunity(actor, id);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const opportunity = await load((await params).id);
  return { title: opportunity ? copy.form.editTitle(KIND_NOUN[opportunity.kind]) : copy.notFound.title };
}

export default async function EditOpportunityPage({ params }: Props) {
  const opportunity = await load((await params).id);
  if (!opportunity) notFound(); // renders ../not-found.tsx with a 404 status
  const organizations = await listPublisherOptions();
  return (
    <OpportunityForm
      key={opportunity.id}
      scope="admin"
      basePath={BASE}
      kind={opportunity.kind}
      opportunity={opportunity}
      organizations={organizations}
      save={saveOpportunity}
      prefill={prefillFromEventbrite}
    />
  );
}
