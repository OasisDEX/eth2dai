import { tid } from '../utils/index';

export class Order {

  public sell = () => {
    cy.get(tid('new-sell-order')).click();
    return this;
  }

  public buy = () => {
    cy.get(tid('new-buy-order')).click();
    return this;
  }

  public limit = () => {
    cy.get(tid('select-order-type')).click();
    cy.get(tid('limitOrder'), { timeout: 5000 }).click();
    cy.get(tid('submit')).click();
    return this;
  }

  public fillOrKill = () => {
    cy.get(tid('select-order-type')).click();
    cy.get(tid('fillOrKill'), { timeout: 5000 }).click();
    cy.get(tid('submit')).click();
    return this;
  }

  public direct = () => {
    cy.get(tid('select-order-type', tid('direct'))).click();
    return this;
  }

  public amount = (amount: string) => {
    cy.get(tid('type-amount')).type(amount);
    return this;
  }

  public atPrice = (price: string) => {
    cy.get(tid('type-price')).type(price);
    return this;
  }

  public place = () => {
    cy.get(tid('place-order')).click();
  }
}
