import { tid } from '../utils';

export class TradeSettings {
  public static button = () => cy.get(tid('trade-settings'));

  public static back = () => cy.get(tid('back')).click();

  public static slippageLimit = (value: string) => cy.get(tid('slippage-limit')).clear().type(value);
}
