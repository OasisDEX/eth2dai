import * as React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import { transactionObserver, TxState, TxStatus } from '../blockchain/transactions';
import { Cross } from '../utils/icons/Icons';
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
    return (
      <TransitionGroup className={styles.main}>
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
              <CSSTransition key={transaction.txNo} classNames="transaction" timeout={1000}>
                <Notification
                  {...transaction}
                  onDismiss={ () => transactionObserver.next({ kind: 'dismissed', txNo: transaction.txNo }) }
                  />
              </CSSTransition>
            )
          )}
      </TransitionGroup>
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
      <a tabIndex={0} onClick={onDismiss} className={styles.cross}><Cross/></a>
    </div>
  );
};

export function describeTxStatus(tx: TxState) {
  switch (tx.status) {
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
          Unconfirmed <Timer start={tx.broadcastedAt} />
        </>
      );
    case TxStatus.CancelledByTheUser:
      return 'Rejected';
    default:
      throw new UnreachableCaseError(tx);
  }
}
