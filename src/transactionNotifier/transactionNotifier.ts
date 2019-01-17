import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TxState } from '../blockchain/transactions';

export function createTransactionNotifier$(
  transactions$: Observable<TxState[]>,
  interval$: Observable<number>
) {
  return combineLatest(transactions$, interval$).pipe(
    map(([transactions]) => ({ transactions }))
  );
}
