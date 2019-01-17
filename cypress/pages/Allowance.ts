import { tid } from '../utils/index';

export enum ALLOWANCE_STATE {
  ENABLED = 'enabled',
  DISABLED = 'disabled'
}

export class Allowance {
  public static of = (tokenSymbol: string) => {
    const symbol = tokenSymbol.toUpperCase();
    cy.get(tid(`${symbol}-overview`), { timeout: 10000 }).as(`${symbol}`);

    return {
      toggle: () => {
        cy.get(`@${symbol}`).find(tid('toggle-allowance')).click();
      },

      shouldBe: (state: ALLOWANCE_STATE) => {
        switch (state) {
          case ALLOWANCE_STATE.DISABLED:
            cy.get(`@${symbol}`)
              .find(tid('toggle-button-state'), { timeout: 10000 })
              .should('have.attr', 'data-toggle-state', 'disabled');
            break;
          case ALLOWANCE_STATE.ENABLED:
            cy.get(`@${symbol}`)
              .find(tid('toggle-button-state'), { timeout: 10000 })
              .should('have.attr', 'data-toggle-state', 'enabled');
            break;
        }
      }
    };
  }
}
