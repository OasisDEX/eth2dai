import { BigNumber } from 'bignumber.js';
import { first, memoize } from 'lodash';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { tradingPairs } from '../../blockchain/config';
import {
  Loadable,
  LoadableWithTradingPair,
  loadablifyLight
} from '../../utils/loadable';
import { MarketsDetails } from '../exchange';

export interface TradingPair {
  readonly base: string;
  readonly quote: string;
}

export function tradingPairResolver({ base, quote }: TradingPair) {
  return `${base}/${quote}`;
}

export function memoizeTradingPair<T>(f: (pair: TradingPair) => T) {
  return memoize(f, tp => tradingPairResolver(tp));
}

export function injectTradingPair$<T>(
  tradingPair$: Observable<TradingPair>,
  f: (pair: TradingPair) => Observable<T>
): Observable<{tradingPair: TradingPair} & T> {
  return tradingPair$.pipe(
    switchMap(tradingPair => {
      return f(tradingPair).pipe(
        map(r => ({
          tradingPair,
          // @ts-ignore
          ...r,
        }))
      );
    })
  );
}

export function loadablifyPlusTradingPair<T>(
  tradingPair: Observable<TradingPair>,
  f: (pair: TradingPair) => Observable<T>
): Observable<LoadableWithTradingPair<T>> {
  return injectTradingPair$(tradingPair, pair => loadablifyLight(f(pair))
  );
}

export const currentTradingPair$ =
  new BehaviorSubject<TradingPair>(first(tradingPairs) as TradingPair);

export interface TradingPairsProps {
  parentMatch?: string;
  select: (pair: TradingPair) => void;
  base: string;
  quote: string;
  currentPrice: Loadable<BigNumber | undefined>;
  yesterdayPriceChange: Loadable<BigNumber | undefined>;
  weeklyVolume: Loadable<BigNumber>;
  marketsDetails: Loadable<MarketsDetails>;
}

export function createTradingPair$(
  currentTradingPair$$: BehaviorSubject<TradingPair>,
  currentPrice$: Observable<BigNumber | undefined>,
  yesterdayPriceChange$: Observable<BigNumber | undefined>,
  weeklyVolume$: Observable<BigNumber>,
  marketsDetails$: Observable<MarketsDetails>,
): Observable<TradingPairsProps> {
  return combineLatest(
    currentTradingPair$$,
    loadablifyLight(currentPrice$),
    loadablifyLight(yesterdayPriceChange$),
    loadablifyLight(weeklyVolume$),
    loadablifyLight(marketsDetails$),
  ).pipe(
    map(([currentTradingPair, currentPrice, yesterdayPriceChange, weeklyVolume, marketsDetails]) => ({
      ...currentTradingPair,
      currentPrice,
      yesterdayPriceChange,
      weeklyVolume,
      marketsDetails,
      select: currentTradingPair$$.next.bind(currentTradingPair$$),
    }))
  );
}
