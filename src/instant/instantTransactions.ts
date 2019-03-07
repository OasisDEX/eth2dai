import { Observable, of } from 'rxjs';
import { first, flatMap, map, startWith, switchMap } from 'rxjs/operators';
import { Calls } from '../blockchain/calls/calls';
import { InstantOrderData } from '../blockchain/calls/instant';
import { allowance$ } from '../blockchain/network';
import { getTxHash, isDone, isSuccess, TxState, TxStatus } from '../blockchain/transactions';
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

  const tx$ = proxyAddress ?
    calls.tradePayWithETHWithProxy({ ...state, proxyAddress } as InstantOrderData) :
    calls.tradePayWithETHNoProxy({ ...state } as InstantOrderData);

  return tx$.pipe(
    switchMap((txState: TxState) =>
      of(progressChange({
        ...initialProgress,
        tradeTxStatus: txState.status,
        tradeTxHash: getTxHash(txState),
        done: isDone(txState)
      }))
    ),
    startWith(progressChange(initialProgress))
  );
}

function doTradePayWithERC20(
  _calls: Calls,
  _proxyAddress: string | undefined,
  _state: InstantFormState,
  initialProgress: Progress
): Observable<Progress> {
  return of({
    ...initialProgress,
    tradeTxStatus: TxStatus.Error,
    done: true,
  });
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
      return calls.approveProxy({
        proxyAddress,
        token: state.sellToken
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
  return calls.setupProxy({}).pipe(
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
