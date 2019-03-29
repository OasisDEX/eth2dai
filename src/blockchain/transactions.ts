import { fromPairs } from 'lodash';
import { bindNodeCallback, combineLatest, Observable, of, Subject } from 'rxjs';
import { takeWhileInclusive } from 'rxjs-take-while-inclusive';
import { ajax } from 'rxjs/ajax';
import { catchError, filter, first, map, mergeMap, scan, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { UnreachableCaseError } from '../utils/UnreachableCaseError';
import { account$, context$, onEveryBlock$ } from './network';
import { web3 } from './web3';

export enum TxStatus {
  WaitingForApproval = 'WaitingForApproval',
  CancelledByTheUser = 'CancelledByTheUser',
  WaitingForConfirmation = 'WaitingForConfirmation',
  Success = 'Success',
  Error = 'Error',
  Failure = 'Failure',
}

export function isDone(state: TxState) {
  return [
    TxStatus.CancelledByTheUser,
    TxStatus.Error,
    TxStatus.Failure,
    TxStatus.Success
  ].indexOf(state.status) >= 0;
}

export function isSuccess(state: TxState) {
  return TxStatus.Success === state.status;
}

export function getTxHash(state: TxState): string | undefined {
  if (
    state.status === TxStatus.Success ||
    state.status === TxStatus.Failure ||
    state.status === TxStatus.Error ||
    state.status === TxStatus.WaitingForConfirmation
  ) {
    return state.txHash;
  }
  return undefined;
}

export type TxState = {
  account: string;
  txNo: number;
  networkId: string;
  meta: any;
  start: Date;
  end?: Date;
  lastChange: Date;
  dismissed: boolean;
} & (
  | {
    status: TxStatus.WaitingForApproval;
  }
  | {
    status: TxStatus.CancelledByTheUser;
    error: any;
  }
  | {
    status: TxStatus.WaitingForConfirmation;
    txHash: string;
    broadcastedAt: Date;
  }
  | {
    status: TxStatus.Success;
    txHash: string;
    blockNumber: number;
    receipt: any;
    confirmations: number;
    safeConfirmations: number;
  }
  | {
    status: TxStatus.Failure;
    txHash: string;
    blockNumber: number;
    receipt: any;
  }
  | {
    status: TxStatus.Error;
    txHash: string;
    error: any;
  });

let txCounter: number = 1;

export function send(
  account: string,
  networkId: string,
  meta: any,
  method: (...args: any[]) => string, // Any contract method
  ...args: any[]
): Observable<TxState> {
  const common = {
    account,
    networkId,
    meta,
    txNo: txCounter += 1,
    start: new Date(),
    lastChange: new Date(),
  };

  function successOrFailure(txHash: string, receipt: any): Observable<TxState> {
    const end = new Date();

    if (receipt.status !== '0x1') {
      // TODO: failure should be confirmed!
      return of({
        ...common,
        txHash,
        receipt,
        end,
        lastChange: end,
        blockNumber: receipt.blockNumber,
        status: TxStatus.Failure,
      } as TxState);
    }

    // TODO: error handling!
    return combineLatest(context$, onEveryBlock$).pipe(
      mergeMap(([context, blockNumber]) =>
        of({
          ...common,
          txHash,
          receipt,
          end,
          lastChange: new Date(),
          blockNumber: receipt.blockNumber,
          status: TxStatus.Success,
          confirmations: Math.max(0, blockNumber - receipt.blockNumber),
          safeConfirmations: context.safeConfirmations,
        } as TxState),
      ),
      takeWhileInclusive(
        state => state.status === TxStatus.Success && state.confirmations < state.safeConfirmations,
      ),
    );
  }

  const result: Observable<TxState> = bindNodeCallback(method)(...args).pipe(
    mergeMap((originalTxHash: string) => {
      return combineLatest(bindNodeCallback(web3.eth.getTransaction)(originalTxHash), externalNonce2tx$, onEveryBlock$).pipe(
        map(([transaction, externalNonce2tx]) => externalNonce2tx[(transaction as any).nonce] || originalTxHash),
        mergeMap(txHash => bindNodeCallback(web3.eth.getTransactionReceipt)(txHash)),
        filter(receipt => !!receipt),
        // to prevent degenerated infura response...
        // tap((receipt: any) =>
        //   console.log('receipt', receipt, receipt.blockNumber)
        // ),
        filter((receipt: any) =>
          receipt.blockNumber !== undefined && receipt.blockNumber !== null
        ),
        // tap(receipt => console.log('filtered receipt', receipt)),
        first(),
        mergeMap(receipt => successOrFailure(receipt.transactionHash, receipt)),
        catchError(error => {
          return of({
            ...common,
            error,
            txHash: originalTxHash,
            end: new Date(),
            lastChange: new Date(),
            status: TxStatus.Error,
          } as TxState);
        }),
        startWith({
          ...common,
          txHash: originalTxHash,
          broadcastedAt: new Date(),
          status: TxStatus.WaitingForConfirmation,
        } as TxState),
      );
    }),
    catchError(error => {
      if ((error.message as string).indexOf('User denied transaction signature') === -1) {
        console.error(error);
      }

      return of({
        ...common,
        error,
        end: new Date(),
        lastChange: new Date(),
        status: TxStatus.CancelledByTheUser,
      });
    }),
    startWith({
      ...common,
      status: TxStatus.WaitingForApproval,
    }),
  );

  result.subscribe(state => transactionObserver.next({  state, kind: 'newTx' }));

  return result;
}

interface NewTransactionChange {
  kind: 'newTx';
  state: TxState;
}

interface DismissedChange {
  kind: 'dismissed';
  txNo: number;
}

export const transactionObserver: Subject<TransactionsChange> = new Subject();

type TransactionsChange = NewTransactionChange | DismissedChange;

export const transactions$: Observable<TxState[]> = combineLatest(
  transactionObserver.pipe(
    scan((transactions: TxState[], change: TransactionsChange) => {
      switch (change.kind) {
        case 'newTx': {
          const newState = change.state;
          const result = [...transactions];
          const i = result.findIndex(t => t.txNo === newState.txNo);
          if (i >= 0) {
            result[i] = newState;
          } else {
            result.push(newState);
          }
          return result;
        }
        case 'dismissed': {
          const result = [...transactions];
          const i = result.findIndex(t => t.txNo === change.txNo);

          result[i].dismissed = true;

          return result;
        }
        default: throw new UnreachableCaseError(change);
      }
    },   []),
  ),
  account$,
  context$,
).pipe(
  map(([transactions, account, context]) =>
    transactions.filter((t: TxState) => t.account === account && t.networkId === context.id)
  ),
  startWith([]),
  shareReplay(1),
);

interface ExternalNonce2tx { [nonce: number]: string; }
const externalNonce2tx$: Observable<ExternalNonce2tx> = combineLatest(context$, account$, onEveryBlock$.pipe(first()), onEveryBlock$).pipe(
  switchMap(([context, account, firstBlock]) => ajax({ url: `${context.etherscan.apiUrl}?module=account&action=txlist&address=${account}&startblock=${firstBlock}&sort=desc&apikey=${context.etherscan.apiKey}` })),
  map(({ response }) => response.result),
  map(transactions => fromPairs(transactions.map((tx: any) => [tx.nonce, tx.hash])) as any as ExternalNonce2tx),
  shareReplay(1),
);
