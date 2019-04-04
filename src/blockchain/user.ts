import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { account$ } from './network';

export interface User {
  account?: string;
  authorized?: boolean;
}

export const user$: Observable<User> = combineLatest(account$).pipe(
  map(([account]) => ({ account, authorized: undefined })),
);
