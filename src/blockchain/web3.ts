import { from, fromEvent, Observable } from 'rxjs';
import { catchError, filter, map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import * as Web3 from 'web3';

export let web3 : Web3;

export type Web3Status = 'waiting' | 'ready' | 'denied' | 'missing' | 'initializing';

export const web3Status$: Observable<Web3Status> = fromEvent(document, 'visibilitychange').pipe(
  startWith(null),
  filter(() => !web3),
  filter(() => !document.hidden),
  switchMap(() => {
    const win = window as { web3?: any, ethereum?: any };
    if (win.ethereum) {
      web3 = new Web3(win.ethereum);
      return from(win.ethereum.enable()).pipe(
        map(() => 'ready'),
        startWith('waiting'),
        catchError(() => from(['denied'])),
      );
    }
    if (win.web3) {
      web3 = new Web3(win.web3.currentProvider);
      return from(['ready']);
    }
    return from(['missing']);
  }),
  shareReplay(1),
);
web3Status$.subscribe();

export const web3Ready$ = web3Status$.pipe(filter(status => status === 'ready'));

export function setupFakeWeb3ForTesting() {
  web3 = new Web3();
}
