import { combineLatest, from, interval, Observable, of, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  first,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap
} from 'rxjs/operators';
import * as Web3 from 'web3';

import { isEqual } from 'lodash';
import { account$ } from './network';
import { Web3Window } from './web3';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'denied' | 'missing';

export const accepted$ = interval(500).pipe(
  map(() => JSON.parse(localStorage.getItem('tos') || 'false')),
  startWith(JSON.parse(localStorage.getItem('tos') || 'false')),
  distinctUntilChanged(isEqual)
);

const connectToWallet$: Subject<number> = new Subject();

export function connectToWallet() {
  connectToWallet$.next(1);
}

const connecting$ = connectToWallet$.pipe(
  switchMap(() => {
    const win = window as Web3Window;
    window.localStorage.setItem('tos', 'true');
    if (win.ethereum) {
      win.web3 = new Web3(win.ethereum);
      return from(win.ethereum.enable()).pipe(
        switchMap(([enabled]) => account$.pipe(
          filter(account => account === enabled),
          first(),
          map(() => {
            return undefined;
          }),
        )),
        startWith('connecting'),
        catchError(() => of('denied')),
      );
    }
    return of();
  }),
  startWith(undefined)
);

export const walletStatus$: Observable<WalletStatus> = combineLatest(
  account$,
  accepted$,
  connecting$
).pipe(
  map(([account, hasAcceptedToS, connecting]) =>
    connecting ? connecting :
      account && hasAcceptedToS ?
        'connected' :
        (window as Web3Window).ethereum ?
          'disconnected' :
          'missing'
  ),
  tap(console.log),
  shareReplay(1),
);

// walletStatus$.subscribe(console.log);
