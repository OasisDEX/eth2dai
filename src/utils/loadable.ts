import { Observable, of } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';

import { TradingPair } from '../exchange/tradingPair/tradingPair';

export type LoadableStatus = 'loading' | 'loaded' | 'error';

export interface Loadable<T> {
  status: LoadableStatus;
  value?: T;
  error?: Error;
}

export function loadablifyLight<T>(observable: Observable<T>): Observable<Loadable<T>> {
  return observable.pipe(
    map(value => ({ value, status: 'loaded' })),
    startWith({ status: 'loading' } as Loadable<T>),
    catchError(error => {
      console.log(error);
      return of({ error, status: 'error' });
    })
  );
}

export type LoadableWithTradingPair<T> = Loadable<T> & {tradingPair: TradingPair};
