import { isEqual } from 'lodash';
import { combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, exhaustMap, map, shareReplay, switchMap } from 'rxjs/operators';

import { NetworkConfig } from '../../blockchain/config';
import { every10Seconds$ } from '../../blockchain/network';
import { compareByTimestampOnly, getTrades, Trade } from '../trades';
import { TradingPair } from '../tradingPair/tradingPair';

export function createMyClosedTrades$(
  account$: Observable<string | undefined>,
  context$: Observable<NetworkConfig>,
  { base, quote }: TradingPair
): Observable<Trade[]> {
  return combineLatest(account$, context$).pipe(
    switchMap(([account, context]) =>
      !(account && context) ? of([]) :
        every10Seconds$.pipe(
          exhaustMap(() =>
            getTrades(context, base, quote, {
              account
            }).pipe(
              map(trades => trades.sort(compareByTimestampOnly)),
            )
          ),
          distinctUntilChanged(isEqual),
        )
    ),
    shareReplay(1),
  );
}
