import { AdminNav } from "./_components/AdminNav";

// Each page checks the admin role itself (requireAdmin); the layout doesn't re-render on navigation.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
