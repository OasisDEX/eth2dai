const commonScreenshotOptions = { capture: "fullPage" };

export function makeScreenshots(name: string): void {
  // if we are in interactive mode just do one screenshot to speed up development cycle
  if ((Cypress.config() as any).isInteractive) {
    cy.screenshot(commonScreenshotOptions as any);
    return;
  }

  // see: https://docs.cypress.io/api/commands/viewport.html#Argumentsvalues
  const viewports = ["macbook-15", "iphone-6+", "iphone-6", "iphone-5"];

  for (const viewport of viewports) {
    cy.viewport(viewport as any);
    cy.screenshot(`${name}-${viewport.replace("+", "plus")}`, commonScreenshotOptions as any);
  }
}
