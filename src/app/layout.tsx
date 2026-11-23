import type { Metadata } from "next";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@/components/ui/tokens";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { inputModalityScript } from "@/components/ui/inputModality";
import { sidebarBootScript } from "@/lib/sidebar";
import { themeBootScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Social Development Centre",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the boot scripts may set data-theme or data-sidebar on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript + sidebarBootScript }} />
        <script dangerouslySetInnerHTML={{ __html: inputModalityScript }} />
        {/* Switzer from Fontshare: 400 for text, 500 for headings (--weight-regular / --weight-medium). */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
