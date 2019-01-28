import bignumberJs, { BigNumber } from 'bignumber.js';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap, tap, first } from 'rxjs/operators';
import { TxState } from 'src/blockchain/transactions';
import { doGasEstimation, GasEstimationStatus, HasGasEstimation } from 'src/utils/form';
import { Calls$ } from '../../blockchain/calls/calls';
import { CancelData } from '../../blockchain/calls/offerMake';
import { NetworkConfig } from '../../blockchain/config';
import { EtherscanConfig } from '../../blockchain/etherscan';
import { LoadableWithTradingPair } from '../../utils/loadable';
import { Trade } from '../trades';
import { TradeWithStatus } from './openTrades';
import { gasPrice$ } from 'src/blockchain/network';

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

export function createMyTrades$(myTradesKind$: BehaviorSubject<MyTradesKind>,
                                myCurrentTrades$:
                                  Observable<LoadableWithTradingPair<TradeWithStatus[]>>,
                                calls$: Calls$,
                                context$: Observable<NetworkConfig>, 
                                gasPrice$: Observable<BigNumber>)
  : Observable<MyTradesPropsLoadable> {
  return combineLatest(myTradesKind$, myCurrentTrades$, calls$, context$).pipe(
    map(([kind, loadableTrades, calls, context]) => ({
      kind,
      ...loadableTrades,
      cancelOffer: createCancelOffer(calls$, gasPrice$),
      etherscan: context.etherscan,
      changeKind: (k: MyTradesKindKeys) => myTradesKind$.next(MyTradesKind[k]),
    }))
  );
}

function createCancelOffer(calls$: Calls$, gasPrice$: Observable<BigNumber>) {
  return function(cancelData: CancelData) {
    return calls$.pipe(
      first(),
      switchMap(calls => calls.cancelOfferEstimateGas(cancelData)),
      switchMap(gasEstimation =>
        combineLatest(calls$, gasPrice$).pipe(
          first(),
          switchMap(([calls, gasPrice]) =>
            calls.cancelOffer({ ...cancelData, gasPrice, gasEstimation}),
          ),
        ),
      ),
    ).subscribe(console.log);
  };
}
