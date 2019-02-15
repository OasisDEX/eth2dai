// tslint:disable:no-console
import { BigNumber } from 'bignumber.js';
import { bindNodeCallback, combineLatest, concat, interval, Observable } from 'rxjs';
import { ajax } from 'rxjs/ajax';
import {
  delayWhen,
  distinctUntilChanged,
  filter,
  first,
  map,
  retryWhen,
  shareReplay,
  skip,
  startWith,
  switchMap,
  // tap,
} from 'rxjs/operators';

import * as dsValue from './abi/ds-value.abi.json';
import { NetworkConfig, networks } from './config';
import { amountFromWei } from './utils';
import { web3, web3Ready$ } from './web3';

export const every3Seconds$ = interval(3000).pipe(startWith(0));
export const every5Seconds$ = interval(5000).pipe(startWith(0));
export const every10Seconds$ = interval(10000).pipe(startWith(0));
export const every30Seconds$ = interval(30000).pipe(startWith(0));

export const version$ = web3Ready$.pipe(
  switchMap(() => bindNodeCallback(web3.version.getNode)()),
);

export const networkId$ = interval(250).pipe(
  startWith(0),
  switchMap(() => bindNodeCallback(web3.version.getNetwork)()),
  distinctUntilChanged(),
  shareReplay(1)
);

export const account$: Observable<string | undefined> = every3Seconds$.pipe(
  switchMap(() =>
    bindNodeCallback(web3.eth.getAccounts)().pipe(map((x: string[]) => x[0]))
  ),
  distinctUntilChanged(),
  shareReplay(1)
);

export const initializedAccount$ = account$.pipe(
  filter((account: string | undefined) => account !== undefined)
) as Observable<string>;

export const onEveryBlock$ = every5Seconds$.pipe(
  switchMap(() => bindNodeCallback(web3.eth.getBlockNumber)()),
  distinctUntilChanged(),
  shareReplay(1)
);

export const context$: Observable<NetworkConfig> = networkId$.pipe(
  filter((id: string) => networks[id] !== undefined),
  map((id: string) => networks[id]),
  shareReplay(1)
);

type GetBalanceType = (
  account: string,
  callback: (err: any, r: BigNumber) => any
) => any;

export const etherBalance$: Observable<BigNumber> = initializedAccount$.pipe(
  switchMap(address =>
    onEveryBlock$.pipe(
      switchMap((): Observable<BigNumber> =>
        bindNodeCallback(web3.eth.getBalance as GetBalanceType)(address).pipe(
          map(balance => {
            return amountFromWei(balance, 'ETH');
          })
        )
      ),
      distinctUntilChanged(
        (a1: BigNumber, a2: BigNumber) =>
          a1.comparedTo(a2) === 0
      )
    )
  ),
  shareReplay(1)
);

export const MIN_ALLOWANCE = new BigNumber('0xffffffffffffffffffffffffffffffff');

type Allowance = (
  account: string,
  contract: string,
  callback: (err: any, r: BigNumber) => any
) => any;

export function allowance$(token: string, guy?: string): Observable<boolean> {
  return combineLatest(context$, initializedAccount$, onEveryBlock$).pipe(
    switchMap(([context, account]) =>
      bindNodeCallback(context.tokens[token].contract.allowance as Allowance)(
        account, guy ? guy : context.otc.address)
    ),
    map((x: BigNumber) => x.gte(MIN_ALLOWANCE)),
   );
}

export type GasPrice$ = Observable<BigNumber>;

export const gasPrice$: GasPrice$ = web3Ready$.pipe(
  switchMap(() => concat(
    bindNodeCallback(web3.eth.getGasPrice)(),
    // onEveryBlock$.pipe(
    //   switchMap(() => ajax({
    //     url: 'https://ethgasstation.info/json/ethgasAPI.json',
    //     method: 'GET',
    //     headers: {
    //       Accept: 'application/json',
    //     },
    //     crossDomain: true,
    //   })),
    //   retryWhen(errors => errors.pipe(delayWhen(() => onEveryBlock$.pipe(skip(1))))),
    //   map(({ response }) =>
    //     new BigNumber(response.average).times(1.1).times(new BigNumber(10).pow(8))
    //   ),
    // )
  ).pipe(
    distinctUntilChanged((x: BigNumber, y: BigNumber) => x.eq(y)),
    shareReplay(1),
  )
));

export const etherPriceUsd$: Observable<BigNumber> = concat(
  context$.pipe(
    filter(context => !!context),
    first(),
    filter(context => context.saiTub.address !== ''),
    switchMap(context => bindNodeCallback(context.saiTub.contract.pip)()),
    map((address: string) => web3.eth.contract(dsValue as any).at(address)),
    switchMap(pip => bindNodeCallback(pip.read)()),
    map((value: string) => new BigNumber(value).div(new BigNumber(10).pow(18))),
  ),
  onEveryBlock$.pipe(
    switchMap(() => ajax({
      url: 'https://api.coinmarketcap.com/v1/ticker/ethereum/',
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })),
    retryWhen(errors => errors.pipe(delayWhen(() => onEveryBlock$.pipe(skip(1))))),
    map(({ response }) => new BigNumber(response[0].price_usd)),
  ),
).pipe(
  distinctUntilChanged((x: BigNumber, y: BigNumber) => x.eq(y)),
  shareReplay(1),
);
