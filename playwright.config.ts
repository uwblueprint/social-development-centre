import { defineConfig, devices } from "@playwright/test";

// PW_PORT lets tests target an already-running dev server on another port.
const port = process.env.PW_PORT ?? "3000";
const origin = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests",
  use: { baseURL: origin },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: `${origin}/components`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
