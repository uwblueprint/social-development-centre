import type { Metadata } from "next";
import { AdminsPage } from "./AdminsPage";

export const metadata: Metadata = { title: "Admins" };

export default function AdminsDesign() {
  return <AdminsPage />;
}
