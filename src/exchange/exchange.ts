import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { concatAll, first, map, reduce, switchMap } from 'rxjs/operators';

import { tradingPairs } from '../blockchain/config';
import { Trade } from './trades';
import { TradingPair, tradingPairResolver } from './tradingPair/tradingPair';

export function createCurrentPrice$(
  tradeHistory$: Observable<Trade[]>
): Observable<BigNumber | undefined> {
  return tradeHistory$.pipe(
    map(trades => trades[0] && trades[0].price),
  );
}

export function createYesterdayPrice$(
  tradeHistory$: Observable<Trade[]>
): Observable<BigNumber | undefined> {
  return tradeHistory$.pipe(
    map(trades => trades[0] && trades[0].price),
  );
}

export function createYesterdayPriceChange$(
  currentPrice$: Observable<BigNumber | undefined>,
  yesterdayPrice$: Observable<BigNumber | undefined>,
): Observable<BigNumber | undefined> {
  return combineLatest(currentPrice$, yesterdayPrice$).pipe(
    map(([currentPrice, yesterdayPrice]) =>
      currentPrice && yesterdayPrice && !yesterdayPrice.isZero() ?
        currentPrice.minus(yesterdayPrice).dividedBy(yesterdayPrice).times(100) :
        undefined
    ),
  );
}

export function createDailyVolume$(
  tradeHistory$: Observable<Trade[]>
): Observable<BigNumber> {
  return tradeHistory$.pipe(
    map(trades => {
      const borderline = moment().subtract(1, 'days').toDate();
      const daily = trades.filter((t: Trade) => t.time >= borderline);
      return daily.reduce(
        (volume: BigNumber, trade: Trade) => volume.plus(trade.quoteAmount),
        new BigNumber(0)
      );
    }),
  );
}

export interface MarketDetails {
  tradingPair: TradingPair;
  price: BigNumber | undefined;
  priceDiff: BigNumber | undefined;
}
export interface MarketsDetails {
  [key: string]: MarketDetails;
}

export function createMarketDetails$(
  historyCurrent: (tp: TradingPair) => Observable<Trade[]>,
  historyYesterday: (tp: TradingPair) => Observable<Trade[]>,
  onEveryBlock$: Observable<number>,
): Observable<MarketsDetails> {
  return onEveryBlock$.pipe(
    switchMap(() =>
      forkJoin(tradingPairs.map(
        tradingPair => combineLatest(
          createCurrentPrice$(historyCurrent(tradingPair)).pipe(first()),
          createYesterdayPriceChange$(
            createCurrentPrice$(historyCurrent(tradingPair)),
            createYesterdayPrice$(historyYesterday(tradingPair)),
          ).pipe(first()),
        ).pipe(
          map(([price, priceDiff]) => ({
            [tradingPairResolver(tradingPair)]: { tradingPair, price, priceDiff },
          })),
        ),
      )).pipe(
        concatAll(),
        reduce((a, e) => ({ ...a, ...e })),
      )
    ),
  );
}
