import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { NetworkConfig } from '../blockchain/config';
import { TxState } from '../blockchain/transactions';

export function createTransactionNotifier$(
  transactions$: Observable<TxState[]>,
  interval$: Observable<number>,
  context$: Observable<NetworkConfig>,
) {
  return combineLatest(transactions$, context$, interval$).pipe(
    map(([transactions, { etherscan }]) => ({ transactions, etherscan }))
  );
}
