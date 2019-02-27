import { tid } from '../utils/index';

export class Tab {
  public static exchange = () => {
    cy.get(tid('Exchange'), { timeout: 5000 }).click();
  }

  public static margin = () => {
    cy.get(tid('Margin'), { timeout: 5000 }).click();
  }

  public static balances = () => {
    cy.get(tid('Balances'), { timeout: 5000 }).click();
  }

  public static instant = () => {
    cy.get(tid('Instant'), { timeout: 5000 }).click();
  }
}
