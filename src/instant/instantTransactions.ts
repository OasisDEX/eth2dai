import { BigNumber } from 'bignumber.js';
import { combineLatest, Observable, of, throwError } from 'rxjs';
import { first, flatMap, map, startWith, switchMap } from 'rxjs/operators';
import { Calls, ReadCalls } from '../blockchain/calls/calls';
import { GetOffersAmountData, InstantOrderData } from '../blockchain/calls/instant';
import { allowance$, maxGasPerBlock } from '../blockchain/network';
import { getTxHash, isDone, isSuccess, TxState, TxStatus } from '../blockchain/transactions';
import { amountFromWei } from '../blockchain/utils';
import {
  FormResetChange,
  InstantFormChangeKind,
  InstantFormState,
  Progress,
  ProgressChange,
  ProgressKind
} from './instantForm';

function progressChange(progress?: Progress): ProgressChange {
  return { progress, kind: InstantFormChangeKind.progressChange };
}

export function tradePayWithETH(
  calls: Calls,
  proxyAddress: string | undefined,
  state: InstantFormState
): Observable<ProgressChange | FormResetChange> {

  if (!state.buyAmount || !state.sellAmount) {
    throw new Error('Empty buy of sell amount. Should not get here!');
  }

  const initialProgress: Progress = {
    kind: proxyAddress ? ProgressKind.proxyPayWithETH : ProgressKind.noProxyPayWithETH,
    tradeTxStatus: TxStatus.WaitingForApproval,
    done: false,
  };

  if (!state.gasEstimation || !state.gasPrice) {
    throw new Error('No gas estimation!');
  }

  const gasData = {
    gasEstimation: state.gasEstimation,
    gasPrice: state.gasPrice
  };

  const tx$ = proxyAddress ?
    calls.tradePayWithETHWithProxy({ ...state, ...gasData, proxyAddress } as InstantOrderData) :
    calls.tradePayWithETHNoProxy({ ...state, ...gasData } as InstantOrderData);

  return tx$.pipe(
    switchMap((txState: TxState) => {

      if (txState.status === TxStatus.Success) {
        return of(progressChange({
          ...initialProgress,
          tradeTxStatus: txState.status,
          tradeTxHash: getTxHash(txState),
          ...extractTradeSummary(txState.receipt.logs),
          gasUsed: txState.receipt.gasUsed,
          done: isDone(txState)
        }));
      }
      return of(progressChange({
        ...initialProgress,
        tradeTxStatus: txState.status,
        tradeTxHash: getTxHash(txState),
        done: isDone(txState)
      }));
    }),
    startWith(progressChange(initialProgress))
  );
}

function doTradePayWithERC20(
  calls: Calls,
  proxyAddress: string | undefined,
  state: InstantFormState,
  initialProgress: Progress
): Observable<Progress> {

  const trade$ = calls.tradePayWithERC20({
    ...state,
    proxyAddress,
    gasEstimation: state.gasEstimation,
    gasPrice: state.gasPrice
  } as InstantOrderData);

  return trade$.pipe(
    flatMap((txState: TxState) => {
      const progress = {
        ...initialProgress,
        tradeTxStatus: txState.status,
        tradeTxHash: getTxHash(txState),
      };

      if (txState.status === TxStatus.Success) {
        return of({
          ...progress,
          ...extractTradeSummary(txState.receipt.logs),
          gasUsed: txState.receipt.gasUsed,
          done: true
        });
      }

      if (isDone(txState)) {
        return of({
          ...progress,
          done: true,
        });
      }

      return of(progress);
    }),
    startWith({
      ...initialProgress,
      tradeTxStatus: TxStatus.WaitingForApproval,
    }),
  );
}

function doApprove(
  calls: Calls,
  state: InstantFormState,
  initialProgress: Progress
): Observable<Progress> {
  return calls.proxyAddress().pipe(
    flatMap(proxyAddress => {
      if (!proxyAddress) {
        throw new Error('Proxy not ready!');
      }
      if (!state.gasEstimation || !state.gasPrice) {
        throw new Error('No gas estimation!');
      }
      return calls.approveProxy({
        proxyAddress,
        token: state.sellToken,
        gasEstimation: state.gasEstimation,
        gasPrice: state.gasPrice
      }).pipe(
        flatMap((txState: TxState) => {
          if (isSuccess(txState)) {
            return doTradePayWithERC20(calls, proxyAddress, state, {
              ...initialProgress,
              allowanceTxStatus: txState.status,
              allowanceTxHash: getTxHash(txState),
            });
          }

          if (isDone(txState)) {
            return of({
              ...initialProgress,
              allowanceTxStatus: txState.status,
              allowanceTxHash: getTxHash(txState),
              done: true,
            });
          }

          return of({
            ...initialProgress,
            allowanceTxStatus: txState.status,
            allowanceTxHash: getTxHash(txState),
          });
        }),
        startWith({
          ...initialProgress,
          allowanceTxStatus: TxStatus.WaitingForApproval,
        }),
      );
    })
  );
}

function doSetupProxy(
  calls: Calls,
  state: InstantFormState,
): Observable<Progress> {
  if (!state.gasEstimation || !state.gasPrice) {
    throw new Error('No gas estimation!');
  }

  return calls.setupProxy({
    gasEstimation: state.gasEstimation,
    gasPrice: state.gasPrice
  }).pipe(
    startWith({
      kind: ProgressKind.noProxyNoAllowancePayWithERC20,
      proxyTxStatus: TxStatus.WaitingForApproval,
      done: false,
    }),
    flatMap((txState: TxState) => {
      if (isSuccess(txState)) {
        return doApprove(calls, state, {
          kind: ProgressKind.noProxyNoAllowancePayWithERC20,
          proxyTxStatus: txState.status,
          proxyTxHash: getTxHash(txState),
          done: false
        });
      }

      if (isDone(txState)) {
        return of({
          kind: ProgressKind.noProxyNoAllowancePayWithERC20,
          proxyTxStatus: txState.status,
          proxyTxHash: getTxHash(txState),
          done: true,
        });
      }

      return of({
        kind: ProgressKind.noProxyNoAllowancePayWithERC20,
        proxyTxStatus: txState.status,
        proxyTxHash: getTxHash(txState),
        done: false
      });
    })
  );
}

export function tradePayWithERC20(
  calls: Calls,
  proxyAddress: string | undefined,
  state: InstantFormState
): Observable<ProgressChange> {

  const sellAllowance$ = proxyAddress ?
    allowance$(state.sellToken, proxyAddress).pipe(first()) :
    of(false);

  return sellAllowance$.pipe(
    flatMap(sellAllowance => {
      if (!proxyAddress) {
        return doSetupProxy(calls, state);
      }
      if (!sellAllowance) {
        return doApprove(calls, state, {
          kind: ProgressKind.proxyNoAllowancePayWithERC20,
          allowanceTxStatus: TxStatus.WaitingForApproval,
          done: false,
        });
      }
      return doTradePayWithERC20(calls, proxyAddress, state, {
        kind: ProgressKind.proxyAllowancePayWithERC20,
        tradeTxStatus: TxStatus.WaitingForApproval,
        done: false,
      });
    }),
    map(progressChange)
  );
}

export function estimateTradePayWithETH(
  calls: Calls,
  readCalls: ReadCalls,
  proxyAddress: string | undefined,
  state: InstantFormState
): Observable<number> {
  if (state.message) {
    return combineLatest(
      simulateEstimateDoTradePayWithERC20(readCalls, state),
      proxyAddress ? of(0) : simulateEstimateDoSetupProxy(state),
    ).pipe(
      map(([trade, proxy]) => trade + proxy),
    );
  }

  return proxyAddress ?
    calls.tradePayWithETHWithProxyEstimateGas({ ...state, proxyAddress } as InstantOrderData) :
    calls.tradePayWithETHNoProxyEstimateGas({ ...state } as InstantOrderData);
}

function estimateDoTradePayWithERC20(
  calls: Calls,
  proxyAddress: string | undefined,
  state: InstantFormState,
): Observable<number> {
  return calls.tradePayWithERC20EstimateGas({
    ...state,
    proxyAddress,
    gasEstimation: state.gasEstimation,
    gasPrice: state.gasPrice
  } as InstantOrderData);
}

function simulateEstimateDoTradePayWithERC20(
  calls: ReadCalls,
  { kind, buyAmount, buyToken, sellAmount, sellToken }: InstantFormState,
): Observable<number> {
  return calls.otcGetOffersAmount(
    { kind, buyAmount, buyToken, sellAmount, sellToken } as GetOffersAmountData)
    .pipe(
      map(([offersCount, partial]) =>
        141100 + offersCount.toNumber() * 136500 + (partial ? 70000 : 0)
      ),
      switchMap(gasAmount => gasAmount > maxGasPerBlock ?
        throwError('block gas limit exceeded') :
        of(gasAmount)
      ),
    );
}

function estimateDoApprove(
  calls: Calls,
  readCalls: ReadCalls,
  state: InstantFormState,
  proxyAddress: string,
): Observable<number> {
  return combineLatest(
    calls.approveProxyEstimateGas({
      proxyAddress,
      token: state.sellToken,
    }),
    simulateEstimateDoTradePayWithERC20(readCalls, state),
  ).pipe(
    map(([approve, trade]) => approve + trade),
  );
}

function simulateEstimateDoApprove(
  _state: InstantFormState,
): Observable<number> {
  // for WETH and single-collateral DAI
  return of(50000);
}

function estimateDoSetupProxy(
  calls: Calls,
  readCalls: ReadCalls,
  state: InstantFormState,
): Observable<number> {
  return combineLatest(
    calls.setupProxyEstimateGas({}),
    simulateEstimateDoApprove(state),
    simulateEstimateDoTradePayWithERC20(readCalls, state),
  ).pipe(
    map(([createProxy, approve, trade]) => createProxy + approve + trade),
  );
}

function simulateEstimateDoSetupProxy(
  _state: InstantFormState,
) {
  // based on sample transaction from main
  return of(600000);
}

export function estimateTradePayWithERC20(
  calls: Calls,
  readCalls: ReadCalls,
  proxyAddress: string | undefined,
  state: InstantFormState
): Observable<number> {

  const sellAllowance$ = proxyAddress ?
    allowance$(state.sellToken, proxyAddress).pipe(first()) :
    of(false);

  return sellAllowance$.pipe(
    flatMap(sellAllowance => {
      if (!proxyAddress) {
        return estimateDoSetupProxy(calls, readCalls, state);
      }
      if (!sellAllowance) {
        return estimateDoApprove(calls, readCalls, state, proxyAddress);
      }

      if (state.message) {
        return simulateEstimateDoTradePayWithERC20(readCalls, state);
      }

      return estimateDoTradePayWithERC20(calls, proxyAddress, state);
    }),
  );

}

export function estimateTradeReadonly(
  readCalls: ReadCalls,
  state: InstantFormState,
): Observable<number> {
  return combineLatest(
    simulateEstimateDoSetupProxy(state),
    simulateEstimateDoApprove(state),
    simulateEstimateDoTradePayWithERC20(readCalls, state)
  ).pipe(
    map(([createProxy, approve, trade]) => createProxy + approve + trade),
  );
}

const extractTradeSummary = (logs: any): { sold: BigNumber, bought: BigNumber } => {
  let sold = new BigNumber(0);
  let bought = new BigNumber(0);
  logs.map((log: any) => {
    // This is the topic for LogTrade log emitted from Simple Market
    if (log.topics[0] === '0x819e390338feffe95e2de57172d6faf337853dfd15c7a09a32d76f7fd2443875') {
      const tradeData = log.data.replace('0x', '');

      sold = sold.plus(new BigNumber(tradeData.substr(64, 128), 16));
      bought = bought.plus(new BigNumber(tradeData.substr(0, 64), 16));
    }
  });

  return { sold: amountFromWei(sold, 'DAI'), bought: amountFromWei(bought, 'DAI') };
};
