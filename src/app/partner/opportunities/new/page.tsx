import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KINDS, KIND_NOUN } from "@/features/opportunities/catalog";
import { OpportunityForm } from "@/features/opportunities/components/form/OpportunityForm";
import { copy } from "@/features/opportunities/copy";
import type { OpportunityKind } from "@/features/opportunities/types";
import { saveOpportunity } from "../_data/actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const BASE = "/partner/opportunities";

function parseKind(value: string | string[] | undefined): OpportunityKind | null {
  return typeof value === "string" && (KINDS as string[]).includes(value) ? (value as OpportunityKind) : null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const kind = parseKind((await searchParams).kind);
  return { title: kind ? copy.form.newTitle(KIND_NOUN[kind]) : copy.page.title };
}

/** /partner/opportunities/new?kind=event — always posts as the partner's own organization (the action enforces it). */
export default async function NewOpportunityPage({ searchParams }: Props) {
  const kind = parseKind((await searchParams).kind);
  if (!kind) redirect(BASE);
  return <OpportunityForm scope="partner" basePath={BASE} kind={kind} save={saveOpportunity} />;
}
