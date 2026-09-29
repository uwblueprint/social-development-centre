import type { NextConfig } from "next";
import { withYak } from "next-yak/withYak";

const nextConfig: NextConfig = {
  // Keeps the dev tools button from covering the sidebar's profile menu.
  devIndicators: { position: "bottom-right" },
};

export default withYak(nextConfig);
