import { PageLoading } from "@/components/patterns/PageLoading";
import { adminsCopy } from "./_copy";

export default function Loading() {
  return <PageLoading title={adminsCopy.page.title} />;
}
