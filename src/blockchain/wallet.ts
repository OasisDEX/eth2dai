import { concat, from, Observable, Subject } from 'rxjs';
import { catchError, first, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import * as Web3 from 'web3';

import { account$, accountRefreshed$, refreshAccount$ } from './network';
import { Web3Window } from './web3';

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'denied' | 'missing';

export const connectToWallet$: Subject<number> = new Subject();
export const walletStatus$: Observable<WalletStatus> = concat(
  account$.pipe(
    first(),
    map(account => account ? 'connected' : (window as Web3Window).ethereum ? 'disconnected' : 'missing'),
  ),
  connectToWallet$.pipe(
    switchMap(() => {
      const win = window as Web3Window;
      if (win.ethereum) {
        win.web3 = new Web3(win.ethereum);
        return from(win.ethereum.enable()).pipe(
          switchMap(() => {
            refreshAccount$.next();
            return accountRefreshed$.pipe(first(), map(() => 'connected'));
          }),
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
