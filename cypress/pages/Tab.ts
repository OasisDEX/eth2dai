import { tid } from '../utils/index';

const defaultTimeout = { timeout: 10000 };

export class Tab {
  public static trade = () => {
    cy.get(tid('Trade'), { ...defaultTimeout }).click();
  }

  public static balances = () => {
    cy.get(tid('Account'), { ...defaultTimeout }).click();
  }

  public static instant = () => {
    cy.get(tid('Instant'), { ...defaultTimeout }).click();
  }
}
