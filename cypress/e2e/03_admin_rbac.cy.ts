describe("GXQ Network E2E: Admin Panel Hardening & Role-Based Access Control (RBAC)", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("should permit gxqstudio@gmail.com with Super Admin access", () => {
    cy.contains("Admin Panel").click();
    cy.contains("GXQ ISOLATED ADMIN CONTROL CORE").should("be.visible");
    cy.contains("SUPER_ADMIN").should("exist");
    cy.contains("Governance Emergency Circuit Breakers").should("be.visible");
  });

  it("should allow Super Admin to toggle Launchpad Circuit Breaker and enforce lock", () => {
    cy.contains("Admin Panel").click();
    cy.contains("PAUSE LAUNCHPAD").click();
    cy.contains("RESUME LAUNCHPAD").should("be.visible");

    // Check Launchpad reflects paused state
    cy.contains("Launchpad").click();
    cy.contains("LAUNCHPAD PAUSED BY GOVERNANCE").should("be.visible");
  });

  it("should enforce RBAC when switching persona to Auditor", () => {
    cy.contains("Admin Panel").click();
    cy.contains("Auditor").click();
    cy.contains("Role: AUDITOR").should("exist");
    // Circuit breaker button should be disabled for Auditor
    cy.contains("SUPER ADMIN ONLY").should("exist");
  });
});
