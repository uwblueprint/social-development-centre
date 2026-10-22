import { DocumentationPage } from "@/features/documentation/DocumentationPage";

export const metadata = { title: "Notes for product" };

/** Prototype only: ambiguities, missed states and backend risks found while building, by flow. */
export default function Page() {
  return <DocumentationPage portal="flags" />;
}
