import { combineLatest, from, interval, merge, Observable, Subject } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  filter,
  first,
  map,
  shareReplay,
  startWith,
  switchMap
} from 'rxjs/operators';
import * as Web3 from 'web3';

import { isEqual } from 'lodash';
import { account$ } from './network';
import { Web3Window } from './web3';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'denied' | 'missing';

const accepted$ = interval(500).pipe(
  map(() => JSON.parse(localStorage.getItem('tos') || 'false')),
  startWith(JSON.parse(localStorage.getItem('tos') || 'false')),
  distinctUntilChanged(isEqual)
);

export const connectToWallet$: Subject<number> = new Subject();
export const walletStatus$: Observable<WalletStatus> = merge(
  combineLatest(
    account$,
    accepted$
  ).pipe(
    map(([account, hasAcceptedToS]) =>
      account && hasAcceptedToS ?
        'connected' :
        (window as Web3Window).ethereum ?
          'disconnected' :
          'missing'
    ),
  ),
  connectToWallet$.pipe(
    switchMap(() => {
      const win = window as Web3Window;
      if (win.ethereum) {
        win.web3 = new Web3(win.ethereum);
        return from(win.ethereum.enable()).pipe(
          switchMap(([enabled]) => account$.pipe(
            filter(account => account === enabled),
            first(),
            map(() => {
              window.localStorage.setItem('tos', 'true');
              return 'connected';
            }),
          )),
          startWith('connecting' as WalletStatus),
          catchError(() => from(['denied'])),
        );
      }
      return from(['missing' as WalletStatus]);
    }),
  ),
).pipe(
  shareReplay(1),
);

walletStatus$.subscribe();
