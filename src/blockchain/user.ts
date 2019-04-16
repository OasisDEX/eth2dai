import { bindNodeCallback, combineLatest, Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { account$, context$, onEveryBlock$ } from './network';

export interface User {
  account?: string;
  authorized?: boolean;
}

const authorized$: Observable<boolean | undefined> = combineLatest(account$, context$, onEveryBlock$).pipe(
  switchMap(([account, context]) => account ? bindNodeCallback(context.kycStorage.contract.customers)(account) : of(undefined)),
  map(x => x as any),
);
export const user$: Observable<User> = combineLatest(account$, authorized$).pipe(
  map(([account, authorized]) => ({ account, authorized })),
);
