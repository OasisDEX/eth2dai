import { tid } from '../utils/index';

class Order {

  public price() {
    return cy.get('@order').find(tid('price'));
  }

  public amount() {
    return cy.get('@order').find(tid('amount'));
  }

  public total() {
    return cy.get('@order').find(tid('total'));
  }
}

class Orders {

  constructor(public type: OrderType) {
  }

  public countIs(number: number) {
    cy.get(tid(this.type), { timeout: 10000 }).should('have.length', number);
  }

  public first() {
    cy.get(tid(this.type)).first().as('order');

    return new Order();
  }

  public number(number: number) {
    cy.get(tid(this.type)).eq(number - 1).as('order');

    return new Order();
  }

  public last() {
    cy.get(tid(this.type)).last().as('order');

    return new Order();
  }
}

export enum OrderType {
    BUY = 'buy',
    SELL = 'sell'
}

export class Orderbook {
  public static list(type: OrderType) {
    cy.wait(200);
    cy.get(tid('orderbook-type'), { timeout: 5000 }).select('list', { timeout: 5000 });
    return new Orders(type);
  }
}
