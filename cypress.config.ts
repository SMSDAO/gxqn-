import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:3000",
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    env: {
      targetEnv: process.env.GXQ_NETWORK || "devnet",
      adminEmail: "gxqstudio@gmail.com",
      localRpcUrl: "http://127.0.0.1:8545",
      devnetRpcUrl: "https://devnet-rpc.gxq.network",
      testnetRpcUrl: "https://testnet-rpc.gxq.network",
    },
    setupNodeEvents(on, config) {
      // Configuration hooks for multi-environment test runs
      on("task", {
        log(message) {
          console.log(`[Cypress E2E]: ${message}`);
          return null;
        },
      });
      return config;
    },
  },
});
