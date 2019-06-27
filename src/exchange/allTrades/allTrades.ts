// tslint:disable:no-console

import * as moment from 'moment';
import { equals } from 'ramda';
import { combineLatest, Observable, Subject } from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  exhaustMap,
  map,
  mergeScan,
  retryWhen,
  shareReplay,
  startWith,
  switchMap
} from 'rxjs/operators';

import { NetworkConfig } from '../../blockchain/config';
import { EtherscanConfig } from '../../blockchain/etherscan';
import { LoadableWithTradingPair } from '../../utils/loadable';
import { getTrades, Trade } from '../trades';
import { TradingPair } from '../tradingPair/tradingPair';

export type IntervalUnit = 'hour' | 'day' | 'week' | 'month';

const TRADES_PAGE_SIZE = 100;

export interface AllTradesProps extends LoadableWithTradingPair<TradesBrowser> {
  etherscan: EtherscanConfig;
}

export function loadAllTrades(
  context$$: Observable<NetworkConfig>,
  onEveryBlock$$: Observable<number>,
  { base, quote }: TradingPair,
): Observable<Trade[]> {
  const borderline = moment().subtract(1, 'hour').toDate();

  return context$$.pipe(
    switchMap(context =>
      combineLatest(
        onEveryBlock$$.pipe(
          exhaustMap(() =>
            getTrades(context, base, quote, 'allTradesLive', {
              from: borderline,
            })
          ),
        ),
        getTrades(context, base, quote, 'allTradesCurrent', {
          limit: TRADES_PAGE_SIZE,
          to: borderline,
          from: moment(borderline).subtract(14, 'day').toDate()
        })
      )
    ),
    map(([recent, later]) => [...recent, ...later]),
    distinctUntilChanged((x, y) => equals(x, y)),
    shareReplay(1),
  );
}

export function loadPriceDaysAgo(
  days: number,
  context$$: Observable<NetworkConfig>,
  onEveryBlock$$: Observable<number>,
  { base, quote }: TradingPair,
): Observable<Trade[]> {
  return context$$.pipe(
    switchMap((context) => onEveryBlock$$.pipe(
      exhaustMap(() => getTrades(context, base, quote, 'allTradesCurrent', {
        to: moment().subtract(days, 'days').toDate(),
        from: moment().subtract(days + 1, 'days').toDate(),
        limit: 1,
      })))
    ),
    distinctUntilChanged((x, y) => equals(x, y)),
    shareReplay(1),
  );
}

export function loadVolumeForThePastDay(
  context$$: Observable<NetworkConfig>,
  onEveryBlock$$: Observable<number>,
  { base, quote }: TradingPair,
): Observable<Trade[]> {
  return context$$.pipe(
    switchMap((context) => onEveryBlock$$.pipe(
      exhaustMap(() =>
        getTrades(
          context,
          base,
          quote,
          'allTradesCurrent', {
            to: moment().toDate(),
            from: moment().subtract(1, 'days').toDate()
          }
          )
      ))
    ),
    map((
      trades: Trade[]) => trades.sort(
        (current, next) => next.time.getTime() - current.time.getTime()
      )
    ),
    distinctUntilChanged((x, y) => equals(x, y)),
    shareReplay(1),
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
  more$: Subject<any>;
}

export function createTradesBrowser$(
  context$$: Observable<NetworkConfig>,
  allTrades: (pair: TradingPair) => Observable<Trade[]>,
  tradingPair: TradingPair,
): Observable<TradesBrowser> {
  const more$ = new Subject<any>();

  return context$$.pipe(
    switchMap(context => combineLatest(
      allTrades(tradingPair),
      more$.pipe(
        mergeScan<any, { nextPageStart: number, loading: boolean, trades: Trade[] }>(
          ({ nextPageStart, trades }, _more) => {
            return getTrades(context, tradingPair.base, tradingPair.quote, 'allTradesPrevious', {
              offset: nextPageStart,
              limit: TRADES_PAGE_SIZE
            }).pipe(
              retryWhen(errors => errors.pipe(delay(500))),
              map(newTrades => ({
                trades: [...trades, ...newTrades],
                loading: false,
                nextPageStart: nextPageStart + TRADES_PAGE_SIZE,
              })),
              startWith({
                trades,
                nextPageStart,
                loading: true,
              }),
            );
          },
          { nextPageStart: TRADES_PAGE_SIZE, loading: false, trades: [] },
        ),
        startWith({ nextPageStart: TRADES_PAGE_SIZE, loading: false, trades: [] as Trade[] }),
      ),
    ).pipe(
      map(([current, { loading, trades }]) => ({
        more$,
        loading,
        trades: [...current, ...trades],
      })),
    )),
  );
}
