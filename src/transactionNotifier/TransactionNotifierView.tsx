import * as React from 'react';
import { CSSTransitionGroup } from 'react-transition-group';

import { transactionObserver, TxState, TxStatus } from '../blockchain/transactions';
import { Timer } from '../utils/Timer';
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
    // debugger;
    return (
      <div className={styles.main}>
        <CSSTransitionGroup
          transitionName="transaction"
          transitionEnterTimeout={1000}
          transitionLeaveTimeout={600}
        >
          {this.props.transactions
            .filter(
              transaction => !transaction.dismissed && (
                (transaction.status === TxStatus.Success &&
                  transaction.confirmations < transaction.safeConfirmations) ||
                !transaction.end ||
                now - transaction.lastChange.getTime() < VISIBILITY_TIMEOUT * 1000)
            )
            .map(transaction =>
              (
                <Notification
                  key={transaction.txNo}
                  {...transaction}
                  onDismiss={ () => transactionObserver.next({ kind: 'dismissed', txNo: transaction.txNo }) }
                  />
              )
            )}
        </CSSTransitionGroup>
      </div>
    );
  }
}

export type NotificationProps = TxState & {onDismiss: () => void};

export const Notification: React.SFC<NotificationProps> = ({ onDismiss, ...transaction }) => {
  const description = transaction.meta.description(transaction.meta.args);
  const icon =
    transaction.meta.descriptionIcon && transaction.meta.descriptionIcon(transaction.meta.args);

  return (
    <div key={transaction.txNo} className={styles.block}>
      {icon && (
        <div className={styles.icon}>
          <div className={styles.iconInner}>{icon}</div>
        </div>
      )}
      <div className={styles.title}>{description}</div>
      <div className={styles.description}>{describeTxStatus(transaction)}</div>
      <a tabIndex={0} onClick={onDismiss} className={styles.cross}>&times;</a>
    </div>
  );
};

export function describeTxStatus({ status, start }: TxState) {
  switch (status) {
    case TxStatus.Success:
      return 'Confirmed';
    case TxStatus.Error:
    case TxStatus.Failure:
      return 'Failed';
    case TxStatus.WaitingForApproval:
      return 'Signing Transaction';
    case TxStatus.WaitingForConfirmation:
      return (
        <>
          Unconfirmed <Timer start={start} />
        </>
      );
    case TxStatus.CancelledByTheUser:
      return 'Rejected';
    default:
      throw new UnreachableCaseError(status);
  }
}
