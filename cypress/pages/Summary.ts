import { tid, timeout } from '../utils';

export class Summary {

  public expectProxyBeingCreated = () => {
    cy.get(tid('has-proxy')).contains('You have successfully created a Proxy!');
  }

  public expectProxyNotBeingCreated = () => {
    cy.get(tid('has-proxy'))
      .should('not.exist');
  }

  public expectSold = (amount: string, token: string) => {
    cy.get(tid('sold-token', tid('amount')), timeout(60000)).contains(`${amount}`);
    cy.get(tid('sold-token', tid('currency')), timeout(60000)).contains(`${token}`);
  }

  public expectBought = (amount: string, token: string) => {
    cy.get(tid('bought-token', tid('amount')), timeout(60000)).contains(`${amount}`);
    cy.get(tid('bought-token', tid('currency')), timeout(60000)).contains(`${token}`);
  }

  public expectPriceOf = (price: string | RegExp) => {
    cy.get(tid('final-price'), timeout(60000)).contains(price);
  }

}
