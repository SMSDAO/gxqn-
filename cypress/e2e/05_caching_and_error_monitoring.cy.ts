describe("GXQ Network E2E: Advanced Caching & Sentry Error Monitoring", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should navigate to Advanced Caching dashboard and verify multi-tier metrics", () => {
    cy.contains("Admin Panel").click();
    cy.contains("Advanced Caching").click();
    cy.contains("Advanced Multi-Tier Caching & Invalidation Architecture").should("be.visible");
    cy.contains("Cache Hit Rate").should("be.visible");
    cy.contains("L1 Hot LRU Memory").should("be.visible");
    cy.contains("L2 Distributed Redis").should("be.visible");
    cy.contains("ONLINE").should("be.visible");
  });

  it("should benchmark endpoint performance showing significant speedup", () => {
    cy.contains("Admin Panel").click();
    cy.contains("Advanced Caching").click();
    cy.contains("Benchmark /stats").click();
    cy.contains("Performance Acceleration").should("be.visible");
    cy.contains("Faster").should("be.visible");
    cy.contains("Transparent HTTP Headers Exposed to Consumers").should("be.visible");
  });

  it("should simulate new block mining and trigger automated cache invalidation", () => {
    cy.contains("Admin Panel").click();
    cy.contains("Advanced Caching").click();
    cy.contains("Simulate New Block Mined").click();
    cy.contains("Automated cache invalidation executed").should("be.visible");
  });

  it("should capture and categorize errors in Sentry Error Monitor", () => {
    cy.contains("Admin Panel").click();
    cy.contains("Error Monitor").click();
    cy.contains("Sentry & LogRocket Comprehensive Error Monitoring").should("be.visible");
    
    // Simulate an RPC timeout error
    cy.contains("+ RPC Timeout").click();
    cy.contains("Simulated error captured in Sentry").should("be.visible");
    cy.contains("NETWORK_RPC_ERROR").should("be.visible");

    // Inspect stack trace
    cy.contains("Inspect Trace").first().click();
    cy.contains("Stack Trace Execution Frames").should("be.visible");
    cy.contains("User Context & Identity").should("be.visible");
  });
});
