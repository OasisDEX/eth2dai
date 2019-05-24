import { BigNumber } from 'bignumber.js';
import * as moment from 'moment';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Trade } from './trades';

export function createCurrentPrice$(
  tradeHistory$: Observable<Trade[]>
): Observable<BigNumber | undefined> {
  return tradeHistory$.pipe(
    map(trades =>
      trades[0] && trades[0].price
    ),
  );
}

export function createYesterdayPrice$(
  tradeHistory$: Observable<Trade[]>
): Observable<BigNumber | undefined> {
  return tradeHistory$.pipe(
    map(trades => !trades[0] ? undefined : trades[0].price),
    // tap(price => console.log(price && price.valueOf()))
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
