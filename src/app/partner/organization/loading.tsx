import { PageLoading } from "@/components/patterns/PageLoading";
import { partnerCopy } from "../_copy";

export default function Loading() {
  return <PageLoading title={partnerCopy.organization.title} narrow />;
}
