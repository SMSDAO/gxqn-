describe("GXQ Network E2E: SimpleSwap DEX & Smart Contract Interactions", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should switch between Local, Devnet, and Testnet environments", () => {
    // Switch to Local
    cy.selectEnvironment("local");
    cy.contains("LOCAL-31337").should("exist");

    // Switch to Testnet
    cy.selectEnvironment("testnet");
    cy.contains("TESTNET-9001").should("exist");
  });

  it("should navigate to DEX Swap, calculate constant product output, and execute swap", () => {
    cy.contains("Swap").click();
    cy.contains("GXQ SIMPLESWAP AMM").should("be.visible");
    cy.contains("Constant Product Liquidity Pool").should("exist");

    // Input amount
    cy.get('input[type="number"]').first().clear().type("50");
    cy.contains("Exchange Rate").should("exist");

    // Click swap execution
    cy.contains("Swap GXQ for USDC").click();
    cy.contains("Swap Confirmed on Block").should("be.visible");
  });

  it("should navigate to Staking Vault and lock GXQ for strategic APY", () => {
    cy.contains("Stake").click();
    cy.contains("GXQ VALIDATOR & STAKING VAULT").should("be.visible");
    cy.contains("90 Days").click();
    cy.contains("Confirm Staking Position").click();
    cy.contains("Successfully staked").should("be.visible");
  });

  it("should upload token branding, generate metadata JSON, and automatically index in Swap list", () => {
    cy.contains("Launchpad").click();
    cy.contains("TOKEN BRANDING & METADATA UPLOAD ENGINE").should("be.visible");
    cy.contains("Metadata JSON Specification").should("exist");
    cy.contains("Download JSON").should("exist");
    cy.contains("Copy").should("exist");

    // Click register token to Swap list
    cy.contains("Register Token & Index to Swap List").click();
    cy.contains("Live Indexed in Swap Lists").should("be.visible");
  });
});

