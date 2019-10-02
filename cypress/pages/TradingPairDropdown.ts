// This should be taken from src/exchange/tradingPair/tradingPair.ts
// but for now there are issues with importing project ( src ) files.
import { tid } from '../utils';

export interface TradingPair {
  base: string;
  quote: string;
}

export class TradingPairInfo {
  public static lastPrice = () =>
    cy.get(tid('trading-pair-info', tid('last-price', tid('value'))))
  public static dailyVolume = () =>
    cy.get(tid('trading-pair-info', tid('24h-volume', tid('value'))))
}

export class TradingPairDropdown {
  public static expand() {
    cy.get(tid('select-pair')).click();
  }

  public static hasMarkets(tradingPairs: TradingPair[]) {
    tradingPairs.forEach((pair) => {
      cy.get(tid(`${pair.base}-${pair.quote}`, tid('base'))).contains(pair.base);
      cy.get(tid(`${pair.base}-${pair.quote}`, tid('quote'))).contains(pair.quote);
    });
  }

  public static expectActivePAir(tradingPair: TradingPair) {
    cy.get(tid('active-pair', tid('base'))).contains(tradingPair.base);
    cy.get(tid('active-pair', tid('quote'))).contains(tradingPair.quote);

  }

  public static select(tradingPair: TradingPair) {
    TradingPairDropdown.expand();
    cy.get(tid(`${tradingPair.base}-${tradingPair.quote}`)).click();
  }
}
