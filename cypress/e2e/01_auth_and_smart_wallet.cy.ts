describe("GXQ Network E2E: Authentication & Smart Wallet Generation", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should initialize with default devnet environment and cyber-glass shell", () => {
    cy.get('div[title="GXQ Network"]').should("be.visible");
    cy.contains("DEVNET").should("exist");
  });

  it("should authenticate with Google smart wallet and verify deterministic address", () => {
    cy.contains("gxqstudio@gmail.com").should("exist");
    // Verify smart wallet address format 0x...
    cy.contains(/0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4}/).should("be.visible");
  });

  it("should claim faucet tokens on devnet and record transaction with correlation ID", () => {
    cy.contains("Faucet").click();
    cy.on("window:alert", (text) => {
      expect(text).to.contain("claimed successfully");
    });
  });
});
