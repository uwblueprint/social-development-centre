import type { Metadata } from "next";
import "@/components/ui/tokens";

export const metadata: Metadata = {
  title: "Social Development Centre",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
