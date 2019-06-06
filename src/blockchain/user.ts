import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { account$ } from './network';
import { walletStatus$ } from './wallet';

export interface User {
  account?: string;
  authorized?: boolean;
}

export const user$: Observable<User> = combineLatest(account$, walletStatus$).pipe(
  map(([account, walletStatus]) => {
    return {
      account: walletStatus === 'connected' ? account : undefined,
      authorized: undefined
    };
  }),
);
