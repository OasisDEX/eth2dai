const blackoutStyle = `
    <style id="cypress-blackout">
      [data-vis-reg-mask], [data-vis-reg-mask] * {
        background-color: black !important;
        color: black !important;
      }
      [data-vis-reg-hide] {
        display: none;
      }
    </style>`;
const commonScreenshotOptions = { capture: 'fullPage' };

export function makeScreenshots(
  name: string,
  viewports: string[] = ['macbook-15', 'iphone-6+', 'iphone-6', 'iphone-5']
): void {
  cy.get('html > head').then(e => e.append(blackoutStyle));

  // if we are in interactive mode just do one screenshot to speed up development cycle
  if ((Cypress.config() as any).isInteractive) {
    cy.screenshot(name, commonScreenshotOptions as any);
  } else {
    // see: https://docs.cypress.io/api/commands/viewport.html#Argumentsvalues

    cy.get('body')
      .then(e => e.append('<textarea style="position: absolute; top: 0; opacity: 0" />'));
    for (const viewport of viewports) {
      cy.viewport(viewport as any);
      cy.get('textarea').last().focus().blur();
      // tslint:disable-next-line:max-line-length
      cy.wait(100); // this is needed to give some type to browser to redraw after viewport changing :shrug:
      cy.screenshot(`${name}-${normalizeViewportName(viewport)}`, commonScreenshotOptions as any);
    }
    cy.get('textarea').last().then(e => e.remove());
  }

  cy.get('#cypress-blackout').then(e => e.remove());
}

// tslint:disable-next-line:max-line-length
// we need to get rid of special characters that can be part of viewport names but are not valid as filenames
function normalizeViewportName(viewport: string): string {
  return viewport.replace('+', 'plus');
}
