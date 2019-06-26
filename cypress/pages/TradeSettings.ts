import { tid, timeout } from '../utils';

export class TradeSettings {
  public static button = () => cy.get(tid('trade-settings'), timeout(3000));

  public static back = () => cy.get(tid('back')).click();

  public static slippageLimit = (value: string) =>
    cy.get(tid('slippage-limit'), timeout(2000))
      .type(`{selectall}{backspace}${value}`)
}
