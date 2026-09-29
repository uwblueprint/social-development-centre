import type { Metadata } from "next";
import "@fontsource-variable/geist/wght.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@/components/ui/tokens";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { themeBootScript } from "@/lib/theme";
import { StateLab } from "@/dev/state-lab/StateLab"; // STATE LAB (disposable)

export const metadata: Metadata = {
  title: "Social Development Centre",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the theme script may set data-theme on <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
        {/* Switzer from Fontshare: 400 for text, 500 for headings (--weight-regular / --weight-medium). */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=switzer@400,500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <TooltipProvider>
          {children}
          {process.env.NODE_ENV !== "production" && <StateLab />} {/* STATE LAB (disposable) */}
        </TooltipProvider>
      </body>
    </html>
  );
}
