// tslint:disable:no-console

import * as moment from 'moment';
import { equals } from 'ramda';
import { combineLatest, Observable, Subject } from 'rxjs';
import { delay, distinctUntilChanged, exhaustMap,
  map, mergeScan, retryWhen, shareReplay, startWith, switchMap
} from 'rxjs/operators';

import { NetworkConfig } from '../../blockchain/config';
import { EtherscanConfig } from '../../blockchain/etherscan';
import { LoadableWithTradingPair } from '../../utils/loadable';
import { getTrades, Trade } from '../trades';
import { TradingPair } from '../tradingPair/tradingPair';

export type IntervalUnit = 'hour' | 'day' | 'week' | 'month';

export interface AllTradesProps extends LoadableWithTradingPair<TradesBrowser> {
  etherscan: EtherscanConfig;
}

export function loadAllTrades(
  interval: number, unit: IntervalUnit,
  context$$: Observable<NetworkConfig>,
  onEveryBlock$$: Observable<number>,
  { base, quote }: TradingPair,
): Observable<Trade[]> {
  const borderline = moment().subtract(1, 'hour').toDate();

  return combineLatest(
    combineLatest(context$$, onEveryBlock$$).pipe(
      exhaustMap(([context]) =>
        getTrades(context, base, quote, {
          from: borderline,
        })
      ),
      distinctUntilChanged((x, y) => equals(x, y)),
      shareReplay(1),
    ),
    context$$.pipe(
      switchMap(context =>
        getTrades(context, base, quote, {
          from: moment().subtract(interval, unit).startOf('day').toDate(),
          to: borderline,
        })
      ),
      distinctUntilChanged((x, y) => equals(x, y)),
      shareReplay(1),
    )
  ).pipe(
    map(([recent, later]) => [...recent, ...later]),
  );
}

export function createAllTrades$(
  tradeHistory$$: Observable<LoadableWithTradingPair<TradesBrowser>>,
  context$$: Observable<NetworkConfig>,
): Observable<AllTradesProps> {
  return combineLatest(tradeHistory$$, context$$).pipe(
    map(([allTradesHistory, context]) =>
      ({ ...allTradesHistory, etherscan: context.etherscan }))
  );
}

export interface TradesBrowser {
  trades: Trade[];
  loading: boolean;
  nextPageStart: Date;
  more$: Subject<any>;
}

export function createTradesBrowser$(
  interval: number, unit: IntervalUnit,
  context$$: Observable<NetworkConfig>,
  allTrades: (pair: TradingPair) => Observable<Trade[]>,
  tradingPair: TradingPair,
): Observable<TradesBrowser> {
  const firstPageEnd = moment().subtract(interval, unit).startOf('day').toDate();
  const more$ = new Subject<any>();

  return context$$.pipe(
    switchMap(context => combineLatest(
      allTrades(tradingPair),
      more$.pipe(
        mergeScan<any, { nextPageStart: Date, loading: boolean, trades: Trade[] }>(
          ({ nextPageStart, trades }, _more) => {
            const pageStart = nextPageStart;
            const pageEnd = moment(nextPageStart).subtract(interval, unit).toDate();
            return getTrades(context, tradingPair.base, tradingPair.quote, {
              from: pageEnd,
              to: pageStart,
            }).pipe(
              retryWhen(errors => errors.pipe(delay(500))),
              map(newTrades => ({
                trades: [...trades, ...newTrades],
                loading: false,
                nextPageStart: pageEnd,
              })),
              startWith({
                trades,
                nextPageStart,
                loading: true,
              }),
            );
          },
          { nextPageStart: firstPageEnd, loading: false, trades: [] },
        ),
        startWith({ nextPageStart: firstPageEnd, loading: false, trades: [] as Trade[] }),
      ),
    ).pipe(
      map(([current, { nextPageStart, loading, trades }]) => ({
        more$,
        nextPageStart,
        loading,
        trades: [...current, ...trades],
      })),
    )),
  );
}
