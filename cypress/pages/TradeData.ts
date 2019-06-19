import { tid, timeout } from '../utils';

export class TradeData {
  public static expectPriceOf(expected: string | RegExp) {
    cy.get(tid('trade-price', tid('value')), timeout()).contains(expected);
  }

  public static expectPriceImpact(expected: string | RegExp) {
    cy.get(tid('trade-price-impact', tid('value')), timeout()).contains(expected);
  }

  public static expectSlippageLimit(expected: string | RegExp) {
    cy.get(tid('trade-slippage-limit', tid('value')), timeout()).contains(expected);
  }

}
