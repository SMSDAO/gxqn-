// Cypress Custom Commands for GXQ Network
Cypress.Commands.add("loginAsAdmin", () => {
  cy.visit("/");
  cy.contains("Connect Wallet").click();
  cy.contains("gxqstudio@gmail.com").should("exist");
});

Cypress.Commands.add("selectEnvironment", (env: "local" | "devnet" | "testnet" | "mainnet") => {
  cy.get('button[aria-label="Select Network Environment"]').click();
  cy.contains(env.toUpperCase()).click();
});
