// Cypress E2E Support File
import "./commands";

declare global {
  namespace Cypress {
    interface Chainable {
      loginAsAdmin(): Chainable<void>;
      selectEnvironment(env: "local" | "devnet" | "testnet" | "mainnet"): Chainable<void>;
    }
  }
}
