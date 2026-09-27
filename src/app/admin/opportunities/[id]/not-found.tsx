import { OpportunityNotFound } from "@/features/opportunities/components/form/OpportunityNotFound";

/** The edit page calls notFound() for an id that doesn't exist, so the response is a real 404. */
export default function NotFound() {
  return <OpportunityNotFound basePath="/admin/opportunities" />;
}
