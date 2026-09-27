import type { Metadata } from "next";
import {
  countPartnersNeedingSupport,
  listActivePartnerEmails,
  listOrganizationOptions,
  listPartnerDirectory,
  listPartnerPeople,
  listPartners,
} from "./_data/queries";
import { PartnersView } from "./_components/PartnersView";
import { parseFilter, parseSort } from "./_lib/params";
import {
  DEFAULT_ORGANIZATION_SORT,
  DEFAULT_PERSON_SORT,
  DEFAULT_PERSON_TAGS,
  ORGANIZATION_SORT_KEYS,
  PARTNER_HEALTH,
  PARTNER_STATUSES,
  PERSON_SORT_KEYS,
  PERSON_TAG_FILTERS,
} from "./_data/types";

export const metadata: Metadata = { title: "Partners" };

type Params = { view?: string; q?: string; sort?: string; dir?: string; status?: string; health?: string; orgs?: string; tags?: string };

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const view = params.view === "people" ? "people" : "organizations";
  const q = params.q?.trim() ?? "";

  // Filters live in the URL: absent = the default, "all" = off, otherwise a comma-separated list.
  const status = parseFilter(params.status, PARTNER_STATUSES, ["active"]);
  const health = parseFilter(params.health, PARTNER_HEALTH, []);
  const tags = parseFilter(params.tags, PERSON_TAG_FILTERS, DEFAULT_PERSON_TAGS);
  const organizationIds = params.orgs ? params.orgs.split(",").filter(Boolean) : [];
  // The sort applies to the open view; switching views clears it.
  const orgSort = parseSort(view === "organizations" ? params.sort : undefined, params.dir, ORGANIZATION_SORT_KEYS, DEFAULT_ORGANIZATION_SORT);
  const personSort = parseSort(view === "people" ? params.sort : undefined, params.dir, PERSON_SORT_KEYS, DEFAULT_PERSON_SORT);

  const [organizations, people, directory, needSupport, activeEmails, organizationOptions] = await Promise.all([
    listPartners({ q, status, health, sort: orgSort }),
    listPartnerPeople({ q, organizations: organizationIds, tags, sort: personSort }),
    listPartnerDirectory(),
    countPartnersNeedingSupport(),
    listActivePartnerEmails(),
    listOrganizationOptions(),
  ]);

  return (
    <PartnersView
      view={view}
      q={q}
      organizations={organizations}
      people={people}
      filters={{ status, health, organizations: organizationIds, tags }}
      sorts={{ organizations: orgSort, people: personSort }}
      directory={directory}
      needSupport={needSupport}
      activeEmails={activeEmails}
      organizationOptions={organizationOptions}
      now={new Date().toISOString()}
    />
  );
}
