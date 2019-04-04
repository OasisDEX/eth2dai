import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { User, user$ } from '../blockchain/user';

export interface Authorizable<T> {
  authorized: boolean;
  value?: T;
  user?: User;
}

export function authorizablify<T>(
  factory: (u: User) => Observable<T>,
  authorize: (u: User) => boolean = user => !!user.account,
): Observable<Authorizable<T>> {
  return user$.pipe(
    switchMap(user => user && authorize(user) ?
      factory(user).pipe(map(value => ({ value, user, authorized: true }))) :
      of({ user, authorized: false })
    ),
  );
}
