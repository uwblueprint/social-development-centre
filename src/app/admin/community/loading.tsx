import { PageLoading } from "@/components/patterns/PageLoading";
import { communityCopy } from "./_copy";

export default function Loading() {
  return <PageLoading title={communityCopy.page.title} />;
}
