import { tid } from '../utils/index';

export class Tab {
  public static exchange = () => {
    cy.get(tid('Exchange')).click();
  }

  public static margin = () => {
    cy.get(tid('Margin')).click();
  }

  public static balances = () => {
    cy.get(tid('Balances')).click();
  }
}
