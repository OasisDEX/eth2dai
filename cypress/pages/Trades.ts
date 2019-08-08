import { tid } from '../utils/index';

class Trade {
  public price() {
    return cy.get('@trade').find(tid('price'));
  }

  public amount() {
    return cy.get('@trade').find(tid('amount'));
  }

  public total() {
    return cy.get('@trade').find(tid('total'));
  }

  public type() {
    return cy.get('@trade').find(tid('type'));
  }

  public cancel() {
    cy.get('@trade').find(tid('cancel'), { timeout: 10000 }).click();
  }
}

export class Trades {

  public static countIs(number: number) {
    cy.get(tid('my-trades'), { timeout: 15000 }).should('have.length', number);
  }

  public static first() {
    cy.get(tid('my-trades'), { timeout: 10000 }).first().as('trade');

    return new Trade();
  }

  public static number(number: number) {
    cy.get(tid('my-trades'), { timeout: 10000 }).eq(number - 1).as('trade');

    return new Trade();
  }

  public static last() {
    cy.get(tid('my-trades'), { timeout: 10000 }).as('trade');

    return new Trade();
  }
}
