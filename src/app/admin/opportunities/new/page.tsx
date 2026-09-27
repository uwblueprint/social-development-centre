import type { Metadata } from "next";
import { KINDS, KIND_NOUN } from "@/features/opportunities/catalog";
import { OpportunityForm } from "@/features/opportunities/components/form/OpportunityForm";
import { copy } from "@/features/opportunities/copy";
import { listPublisherOptions } from "@/features/opportunities/queries";
import type { OpportunityKind } from "@/features/opportunities/types";
import { saveOpportunity } from "../_data/actions";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const BASE = "/admin/opportunities";

function parseKind(value: string | string[] | undefined): OpportunityKind | null {
  return typeof value === "string" && (KINDS as string[]).includes(value) ? (value as OpportunityKind) : null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const kind = parseKind((await searchParams).kind) ?? "event";
  return { title: copy.form.newTitle(KIND_NOUN[kind]) };
}

/** /admin/opportunities/new, optionally ?kind=job to preselect a type. */
export default async function NewOpportunityPage({ searchParams }: Props) {
  // No or unknown ?kind starts as an event; Type is the form's first field and can be changed there.
  const kind = parseKind((await searchParams).kind) ?? "event";
  const organizations = await listPublisherOptions();
  return <OpportunityForm scope="admin" basePath={BASE} kind={kind} organizations={organizations} save={saveOpportunity} />;
}
