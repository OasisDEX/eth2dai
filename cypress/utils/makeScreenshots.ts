const blackoutStyle = `
    <style id="cypress-blackout">
      [data-vis-reg-mask], [data-vis-reg-mask] * {
        background-color: black !important;
        color: black !important;
      }
      [data-vis-reg-hide] {
        visibility: hidden;
      }
    </style>`;
const commonScreenshotOptions = { capture: "fullPage" };

export function makeScreenshots(name: string): void {
  cy.get("html > head").then(e => {
    e.append(blackoutStyle);
  });

  // if we are in interactive mode just do one screenshot to speed up development cycle
  if ((Cypress.config() as any).isInteractive) {
    cy.screenshot(name, commonScreenshotOptions as any);
  } else {
    // see: https://docs.cypress.io/api/commands/viewport.html#Argumentsvalues
    const viewports = ["macbook-15", "iphone-6+", "iphone-6", "iphone-5"];

    for (const viewport of viewports) {
      cy.viewport(viewport as any);

      cy.wait(100);

      cy.screenshot(`${name}-${viewport.replace("+", "plus")}`, commonScreenshotOptions as any);
    }
  }

  cy.get("#cypress-blackout").then(e => e.remove());
}
