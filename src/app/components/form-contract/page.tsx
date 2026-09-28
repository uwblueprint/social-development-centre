import type { Metadata } from "next";
import { PlaceholderPage } from "@/app/admin/_components/PlaceholderPage";
import { ContractForm } from "./ContractForm";

export const metadata: Metadata = { title: "Form contract" };

export default function FormContractPage() {
  return (
    <div>
      <PlaceholderPage
        title="Form contract"
        description="Every kit control inside one form, posted to a reference server action. Submit to see exactly what your action receives."
      />
      <div style={{ padding: "0 var(--space-6) var(--space-7)", display: "grid", gap: "var(--space-5)" }}>
        <ContractForm />
      </div>
    </div>
  );
}
