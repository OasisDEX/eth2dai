import { BigNumber } from 'bignumber.js';
import { BehaviorSubject, combineLatest, noop, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Calls$ } from '../../blockchain/calls/calls';
import { CancelData } from '../../blockchain/calls/offerMake';
import { NetworkConfig } from '../../blockchain/config';
import { EtherscanConfig } from '../../blockchain/etherscan';
import { LoadableWithTradingPair } from '../../utils/loadable';
import { Trade } from '../trades';
import { TradeWithStatus } from './openTrades';

export enum MyTradesKind {
  open = 'open',
  closed = 'closed'
}

export type MyTradesKindKeys = keyof typeof MyTradesKind ;

export interface MyTradesPropsLoadable extends LoadableWithTradingPair<TradeWithStatus[]> {
  kind: MyTradesKind;
  changeKind: (kind: MyTradesKindKeys) => void;
  cancelOffer: (args: CancelData) => any;
  etherscan: EtherscanConfig;
}

export function createMyTradesKind$(): BehaviorSubject<MyTradesKind> {
  return new BehaviorSubject<MyTradesKind>(MyTradesKind.open);
}

export function createMyCurrentTrades$(
  myTradesKind$: Observable<MyTradesKind>,
  myOpenTrades$: Observable<LoadableWithTradingPair<Trade[]>>,
  myClosedTrades$: Observable<LoadableWithTradingPair<Trade[]>>
): Observable<LoadableWithTradingPair<TradeWithStatus[]>> {
  return myTradesKind$.pipe(
    switchMap(kind => kind === MyTradesKind.open ? myOpenTrades$ : myClosedTrades$),
  );
}

export function createMyTrades$(
  myTradesKind$: BehaviorSubject<MyTradesKind>,
  myCurrentTrades$: Observable<LoadableWithTradingPair<TradeWithStatus[]>>,
  calls$: Calls$,
  context$: Observable<NetworkConfig>,
  gasPrice$: Observable<BigNumber>,
): Observable<MyTradesPropsLoadable> {
  return combineLatest(myTradesKind$, myCurrentTrades$, context$, calls$).pipe(
    map(([kind, loadableTrades, context, calls]) => ({
      kind,
      ...loadableTrades,
      cancelOffer: (cancelData: CancelData) =>
        calls.cancelOffer(gasPrice$, cancelData).subscribe(noop),
      etherscan: context.etherscan,
      changeKind: (k: MyTradesKindKeys) => myTradesKind$.next(MyTradesKind[k]),
    })),
  );
}
