import type { NextConfig } from "next";
import { withYak } from "next-yak/withYak";

const nextConfig: NextConfig = {
  // Keeps the dev tools button from covering the sidebar's profile menu.
  devIndicators: { position: "bottom-right" },
  // Opportunity images are posted with the form as data URLs; the service caps them at about 2 MB.
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
};

export default withYak(nextConfig);
