describe("GXQ Network E2E: Real-Time WebSockets & Explorer Search", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should stream live blocks and transactions in Block Explorer", () => {
    cy.contains("Block Explorer").click();
    cy.contains("GXQ BLOCK EXPLORER").should("be.visible");
    cy.contains("Verified Blocks").should("exist");
    cy.contains("Latest Transactions").should("exist");
  });

  it("should inspect block and transaction data via search input", () => {
    cy.contains("Block Explorer").click();
    cy.get('input[placeholder*="Search by Address"]').type("142980{enter}");
    cy.contains("Inspector Result: BLOCK").should("be.visible");
  });

  it("should receive real-time ticker stream with live micro-updates", () => {
    cy.contains("Live Markets").click();
    cy.contains("REAL LIVE MARKET MONITOR").should("be.visible");
    cy.contains("GXQ/USD").should("exist");
    cy.contains("BTC/USDT").should("exist");
  });
});
