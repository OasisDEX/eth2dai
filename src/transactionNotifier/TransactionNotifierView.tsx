import * as React from 'react';
import { CSSTransitionGroup } from 'react-transition-group';

import { TxState, TxStatus } from '../blockchain/transactions';
import { UnreachableCaseError } from '../utils/UnreachableCaseError';
import * as styles from './TransactionNotifier.scss';

const VISIBILITY_TIMEOUT: number = 5;

export class TransactionNotifierView extends React.Component<{
  transactions: TxState[];
}> {
  public render() {
    if (!this.props.transactions) {
      return null;
    }
    const now = new Date().getTime();
    return (
      <div className={styles.main}>
        <CSSTransitionGroup
          transitionName="transaction"
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={600}
        >
          {this.props.transactions
            .filter(
              transaction =>
                (transaction.status === TxStatus.Success &&
                  transaction.confirmations < transaction.safeConfirmations) ||
                !transaction.end ||
                now - transaction.lastChange.getTime() < VISIBILITY_TIMEOUT * 1000,
            )
            .map(transaction => (
              <Notification {...transaction} />
            ))}
        </CSSTransitionGroup>
      </div>
    );
  }
}

export const Notification: React.SFC<TxState> = transaction => {
  return (
    <div key={transaction.txNo} className={styles.block}>
      <div className={styles.title}>{transaction.meta.description(transaction.meta.args)}</div>
      <div>{transaction.status}</div>
      {transaction.status === TxStatus.Success && (
        <div>confirmations: {transaction.confirmations}</div>
      )}
    </div>
  );
};

export function describeTxStatus(status: TxStatus) {
  switch (status) {
    case TxStatus.Success:
      return 'Confirmed';
    case TxStatus.Error:
    case TxStatus.Failure:
      return 'Failed';
    case TxStatus.WaitingForApproval:
      return 'Singing Transaction';
    case TxStatus.WaitingForConfirmation:
      return 'Unconfirmed';
    case TxStatus.CancelledByTheUser:
      return 'Rejected';
    default:
      throw new UnreachableCaseError(status);
  }
}
