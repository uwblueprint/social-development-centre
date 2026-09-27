import type { Metadata } from "next";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@/components/ui/tokens";
import { TooltipProvider } from "@/components/ui/Tooltip";

export const metadata: Metadata = {
  title: "Social Development Centre",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        {/* Switzer from Fontshare: 400 for text, 500 for headings (--weight-regular / --weight-medium). */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
