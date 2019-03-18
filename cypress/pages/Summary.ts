import { tid } from '../utils';

export class Summary {

  public expectProxyBeingCreated = () => {
    cy.get(tid('summary', tid('has-proxy'))).contains('You have successfully created a Proxy!');
  }

  public expectProxyNotBeingCreated = () => {
    cy.get(tid('summary', tid('has-proxy')))
      .should('not.exist');
  }

  public expectSold = (amount: string, token: string) => {
    cy.get(tid('summary', tid('sold-token', tid('amount')))).contains(`${(amount)}`);
    cy.get(tid('summary', tid('sold-token', tid('currency')))).contains(`${(token)}`);
  }

  public expectBought = (amount: string, token: string) => {
    cy.get(tid('summary', tid('bought-token', tid('amount')))).contains(`${(amount)}`);
    cy.get(tid('summary', tid('bought-token', tid('currency')))).contains(`${(token)}`);
  }

  public expectPriceOf = (price: string | RegExp) => {
    cy.get(tid('final-price')).contains(price);
  }

}
