// tslint:disable:no-console

import { BigNumber } from 'bignumber.js';
import { isEqual } from 'lodash';
import { bindNodeCallback, combineLatest, forkJoin, Observable, of } from 'rxjs';
import {
  concatAll,
  distinctUntilChanged, first,
  last,
  map,
  scan,
  switchMap
} from 'rxjs/operators';

import { shareReplay } from 'rxjs/internal/operators';
import { GasPrice$ } from 'src/blockchain/network';
import { Calls$ } from '../blockchain/calls/calls';
import { TxMetaKind } from '../blockchain/calls/txMeta';
import { NetworkConfig, tokens } from '../blockchain/config';
import { TxState, TxStatus } from '../blockchain/transactions';
import { amountFromWei } from '../blockchain/utils';

export interface Balances {
  [token: string]: BigNumber;
}

export interface Allowances {
  [token: string]: boolean;
}

export interface DustLimits {
  [token: string]: BigNumber;
}

type BalanceOf = (account: string, callback: (err: any, r: BigNumber) => any) => any;

export function balance$(
  context: NetworkConfig,
  token: string,
  account: string,
): Observable<BigNumber> {
  return bindNodeCallback(context.tokens[token].contract.balanceOf as BalanceOf)(
    account
  ).pipe(
    map(balance => {
      return amountFromWei(balance, token);
    })
  );
}

export function createBalances$(
  context$: Observable<NetworkConfig>,
  initializedAccount$: Observable<string>,
  onEveryBlock$: Observable<number>,
): Observable<Balances> {
  return combineLatest(
    context$,
    initializedAccount$,
    onEveryBlock$
  ).pipe(
    switchMap(([context, account]) =>
      !account ? of({}) :
        forkJoin(
          Object.keys(tokens).filter(name => name !== 'ETH').map((token: string) =>
            balance$(context, token, account).pipe(
              map(balance => ({
                [token]: balance
              }))
            )
          )
        ).pipe(concatAll(), scan((a, e) => ({ ...a, ...e }), {}), last())
    ),
    distinctUntilChanged(isEqual)
  );
}

export function createWethBalances$(
  context$: Observable<NetworkConfig>,
  initializedAccount$: Observable<string>,
  onEveryBlock$: Observable<number>,
) {
  return combineLatest(
    context$,
    initializedAccount$,
    onEveryBlock$
  ).pipe(
    switchMap(([context, account]) =>
      balance$(context, 'WETH', account)),
    distinctUntilChanged(isEqual)
  );
}

type Dust = (token: string, callback: (err: any, r: BigNumber) => any) => any;

export function createDustLimits$(context$: Observable<NetworkConfig>): Observable<DustLimits> {
  return combineLatest(context$).pipe(
    switchMap(([context]) =>
      forkJoin(
        Object.keys(tokens).filter(name => name !== 'ETH').map((token: string) => {
          return bindNodeCallback(context.otc.contract.getMinSell as Dust)(
           context.tokens[token].address
          ).pipe(
           map(dustLimit => ({
             [token]: amountFromWei(dustLimit, token)
           }))
          );
        })
      ).pipe(concatAll(), scan((a, e) => ({ ...a, ...e }), {}), last())
    ),
    distinctUntilChanged(isEqual),
    shareReplay(1)
  );
}

export const MIN_ALLOWANCE = new BigNumber('0xffffffffffffffffffffffffffffffff');

type Allowance = (
  account: string,
  contract: string,
  callback: (err: any, r: BigNumber) => any
) => any;

export function createAllowances$(
  context$: Observable<NetworkConfig>,
  initializedAccount$: Observable<string>,
  onEveryBlock$: Observable<number>
): Observable<Allowances> {
  return combineLatest(context$, initializedAccount$, onEveryBlock$).pipe(
    switchMap(([context, account]) =>
      forkJoin(
        Object.keys(tokens)
        .filter(token => token !== 'ETH')
        .map((token: string) =>
              bindNodeCallback(context.tokens[token].contract.allowance as Allowance)(
                account, context.otc.address
              ).pipe(
                map((x: BigNumber) => ({ [token]: x.gte(MIN_ALLOWANCE) }))
              )
        )
      ).pipe(concatAll(), scan((a, e) => ({ ...a, ...e }), {}), last())
    ),
    distinctUntilChanged(isEqual)
  );
}

export function createProxyAllowances$(
  context$: Observable<NetworkConfig>,
  initializedAccount$: Observable<string>,
  proxyAccount$: Observable<string>,
  onEveryBlock$: Observable<number>,
): Observable<Allowances> {
  return combineLatest(context$, initializedAccount$, proxyAccount$, onEveryBlock$).pipe(
    switchMap(([context, account, proxy]) =>
      forkJoin(
        Object.keys(context.tokens)
          .filter(token => token !== 'ETH')
          .map((token: string) =>
            bindNodeCallback(context.tokens[token].contract.allowance as Allowance)(
              account, proxy
            ).pipe(
              map((x: BigNumber) => ({ [token]: x.gte(MIN_ALLOWANCE) }))
            )
          )
      ).pipe(concatAll(), scan((a, e) => ({ ...a, ...e }), {}), last())
    ),
    distinctUntilChanged(isEqual)
  );
}

export interface CombinedBalance {
  name: string;
  balance: BigNumber;
  allowance: boolean;
  allowanceChangeInProgress: boolean;
  valueInUsd?: BigNumber;
}

export interface CombinedBalances {
  etherBalance: BigNumber;
  etherValueInUsd: BigNumber;
  balances: CombinedBalance[];
}

function isAllowanceChangeInProgress(token: string, currentBlock: number) {
  return (tx: TxState) => (
    tx.meta.kind === TxMetaKind.approveWallet ||
    tx.meta.kind === TxMetaKind.disapproveWallet
  ) && (
    tx.status === TxStatus.WaitingForApproval ||
    tx.status === TxStatus.WaitingForConfirmation ||
    tx.status === TxStatus.Success && tx.blockNumber > currentBlock ||
    tx.status === TxStatus.Failure && tx.blockNumber > currentBlock
  ) && tx.meta.args.token === token;
}

export function combineBalances(
  balances: Balances, allowances: Allowances,
  etherPriceUsd: BigNumber, transactions: TxState[],
  currentBlock: number
) {

  return Object.keys(tokens)
  .filter(name => name !== 'ETH')
  .map(name => {
    return {
      name,
      balance: balances[name],
      allowance: allowances[name],
      allowanceChangeInProgress:
        !!transactions.find(isAllowanceChangeInProgress(name, currentBlock)),
      valueInUsd: name === 'DAI' ? balances[name] :
        name === 'WETH' ? etherPriceUsd.times(balances[name]) : undefined,
    };
  });
}

export function createCombinedBalances$(
  context$: Observable<NetworkConfig>,
  initializedAccount$: Observable<string>,
  etherBalance$: Observable<BigNumber>,
  balances$: Observable<Balances>,
  onEveryBlock$: Observable<number>,
  etherPriceUsd$: Observable<BigNumber>,
  transactions$: Observable<TxState[]>
): Observable<CombinedBalances> {

  return combineLatest(
    etherBalance$,
    balances$,
    createAllowances$(context$, initializedAccount$, onEveryBlock$),
    etherPriceUsd$,
    transactions$, onEveryBlock$
  ).pipe(
    map(([etherBalance, balances, allowances, etherPriceUsd, transactions, currentBlock]) =>
      ({
        etherBalance,
        etherValueInUsd: etherBalance && etherPriceUsd && etherBalance.times(etherPriceUsd),
        balances: combineBalances(balances, allowances, etherPriceUsd, transactions, currentBlock),
      })
    )
  );
}

export function createWalletApprove(calls$: Calls$, gasPrice$: GasPrice$) {
  return (token: string): Observable<TxState> => {
    const r = calls$.pipe(
      first(),
      switchMap(calls => {
        return calls.approveWallet(gasPrice$, { token });
      })
    );
    r.subscribe();
    return r;
  };
}

export function createWalletDisapprove(calls$: Calls$, gasPrice$: GasPrice$) {
  return (token: string): Observable<TxState> => {
    const r = calls$.pipe(
      first(),
      switchMap(calls => {
        return calls.disapproveWallet(gasPrice$, { token });
      })
    );
    r.subscribe();
    return r;
  };
}
