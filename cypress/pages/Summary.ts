import { tid } from '../utils';

export class Summary {

  public expectProxyBeingCreated = () => {
    cy.get(tid('has-proxy')).contains('You successfully created your Proxy!');
  }

  public expectProxyNotBeingCreated = () => {
    cy.get(tid('has-proxy'))
      .should('not.exist');
  }

  public expectSold = (amount: string, token: string) => {
    cy.get(tid('sold-token', tid('amount'))).contains(`${amount}`);
    cy.get(tid('sold-token', tid('currency'))).contains(`${token}`);
  }

  public expectBought = (amount: string, token: string) => {
    cy.get(tid('bought-token', tid('amount'))).contains(`${amount}`);
    cy.get(tid('bought-token', tid('currency'))).contains(`${token}`);
  }

  public expectPriceOf = (price: string | RegExp) =>
    cy.get(tid('final-price')).contains(price)

}
