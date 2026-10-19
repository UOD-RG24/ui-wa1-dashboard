import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://127.0.0.1:4300",
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/mock-core-server.mjs",
      url: "http://127.0.0.1:4301/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 4300",
      url: "http://127.0.0.1:4300/login",
      reuseExistingServer: false,
      env: {
        AUTH_SECRET: "dashboard-test-secret-dashboard-test-secret",
        ALLOW_LOCAL_AUTH: "true",
        CORE_API_BASE_URL: "http://127.0.0.1:4301",
      },
    },
  ],
});
