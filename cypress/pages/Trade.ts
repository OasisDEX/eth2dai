import { tid, timeout } from '../utils';

const input = (side: 'sellInput' | 'buyInput') => ({

  amount: (amount: string) => {
    cy.get(`@${side}`, timeout(2000)).type(amount);
  },

  clear: () => {
    cy.get(`@${side}`, timeout(2000)).type('{selectall}{backspace}');
  },

  type: (value: string) => {
    cy.get(`@${side}`, timeout(2000)).type(value);
  }

});

export class Trade {

  public sell = (token: string = '') => {
    if (token) {
      cy.get(tid('pick-an-asset-to-sell'))
        .click();

      cy.get(tid(token.toLowerCase()))
        .click();
    }

    cy.get(tid('selling-token', tid('amount'))).as('sellInput');

    return input('sellInput');
  }

  public buy = (token: string = '') => {
    // Since we don't have a token list for now, this logic is not called
    if (token) {
      cy.get(tid('pick-an-asset-to-buy'))
        .click();

      cy.get(tid(token.toLowerCase()))
        .click();
    }

    cy.get(tid('buying-token', tid('amount'))).as('buyInput');

    return input('buyInput');
  }

  public execute = () => {
    cy.get(tid('initiate-trade')).click();
  }

  public resultsInError = (error: string | RegExp) => {
    cy.get(tid('error')).contains(error);
  }
}

chai.Assertion.addChainableMethod('receive', (amount: string | RegExp) => {
  cy.get(tid('buying-token', tid('amount')), timeout(2000))
    .should('have.value', `${amount}`);
});

chai.Assertion.addChainableMethod('pay', (amount: string | RegExp) => {
  cy.get(tid('selling-token', tid('amount')), timeout(2000))
    .should('have.value', `${amount}`);
});
