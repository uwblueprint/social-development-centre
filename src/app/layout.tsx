import type { Metadata } from "next";
import "@fontsource-variable/geist/wght.css";
import "@/components/ui/tokens";
import { TooltipProvider } from "@/components/ui/Tooltip";

export const metadata: Metadata = {
  title: "Social Development Centre",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
