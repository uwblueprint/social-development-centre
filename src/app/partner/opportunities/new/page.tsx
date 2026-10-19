import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KINDS, KIND_NOUN } from "@/features/opportunities/catalog";
import { OpportunityForm } from "@/features/opportunities/components/form/OpportunityForm";
import { copy } from "@/features/opportunities/copy";
import type { OpportunityKind } from "@/features/opportunities/types";
import { getCurrentPartner } from "../../_data/session";
import { prefillFromEventbrite, saveOpportunity } from "../_data/actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const BASE = "/partner/opportunities";

function parseKind(value: string | string[] | undefined): OpportunityKind | null {
  return typeof value === "string" && (KINDS as string[]).includes(value) ? (value as OpportunityKind) : null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const kind = parseKind((await searchParams).kind) ?? "event";
  return { title: copy.form.newTitle(KIND_NOUN[kind]) };
}

/** /partner/opportunities/new?kind=event — always posts as the partner's own organization (the action enforces it). */
export default async function NewOpportunityPage({ searchParams }: Props) {
  // No or unknown ?kind starts as an event; Type is the form's first field and can be changed there.
  const kind = parseKind((await searchParams).kind) ?? "event";
  const partner = await getCurrentPartner();
  if (!partner) redirect("/login");
  return (
    <OpportunityForm
      scope="partner"
      draftOwner={partner.email}
      basePath={BASE}
      kind={kind}
      organizationName={partner.organization.name}
      save={saveOpportunity}
      prefill={prefillFromEventbrite}
    />
  );
}
