import { eth2weth } from '../blockchain/calls/instant';
import { TradingPair } from '../exchange/tradingPair/tradingPair';

export const marketsOf = (token: string, allMarkets: TradingPair[]) => {
  return allMarkets.reduce((possibleMarkets, pair) => {
    if (token === pair.quote) {
      possibleMarkets.add(eth2weth(pair.base));
    }

    if (token === pair.base) {
      possibleMarkets.add(eth2weth(pair.quote));
    }
    return possibleMarkets;
  },                       new Set<string>());
};
