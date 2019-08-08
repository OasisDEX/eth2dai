import * as React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import {
  transactionObserver,
  TxRebroadcastStatus,
  TxState,
  TxStatus
} from '../blockchain/transactions';
import crossSvg from '../icons/cross.svg';
import { SvgImage } from '../utils/icons/utils';
import { Timer } from '../utils/Timer';
import { UnreachableCaseError } from '../utils/UnreachableCaseError';
import * as styles from './TransactionNotifier.scss';

const VISIBILITY_TIMEOUT: number = 5;

export class TransactionNotifierView extends React.Component<{
  transactions: TxState[];
  etherscan: { url: string, apiUrl: string, apiKey: string };
}> {
  public render() {
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
                  etherscan={this.props.etherscan}
                  onDismiss={
                    () => transactionObserver.next({
                      kind: 'dismissed',
                      txNo: transaction.txNo
                    })
                  }
                  />
              </CSSTransition>
            )
          )}
      </TransitionGroup>
    );
  }
}

export type NotificationProps = TxState & {etherscan: { url: string }, onDismiss: () => void};

export const Notification: React.SFC<NotificationProps> = ({
    onDismiss,
    etherscan,
    ...transaction
  }) => {
  const description = transaction.meta.description(transaction.meta.args);
  const icon =
    transaction.meta.descriptionIcon && transaction.meta.descriptionIcon(transaction.meta.args);

  return (
    <div key={transaction.txNo} className={styles.block} data-vis-reg-hide={true}>
      {icon && (
        <div className={styles.icon}>
          <div className={styles.iconInner}>{icon}</div>
        </div>
      )}
      <div className={styles.title}>{description}</div>
      <div className={styles.description}>{describeTxStatus(transaction, etherscan)}</div>
      <a tabIndex={0}
         onClick={onDismiss}
         className={styles.cross}
         data-test-id="notification-cross"
      >
        <SvgImage image={crossSvg} />
      </a>
    </div>
  );
};

export function describeTxStatus(tx: TxState, etherscan: { url: string }) {
  switch (tx.status) {
    case TxStatus.Success:
      const rebroadcast: {[key in TxRebroadcastStatus]: string} = {
        speedup: 'gas price increased',
        cancel: 'cancelled',
      };
      return (
        <a href={`${etherscan.url}/tx/${tx.txHash}`}
           target="_blank"
           rel="noopener noreferrer"
           className={styles.link}
        >
          Confirmed {tx.rebroadcast ? ` (${rebroadcast[tx.rebroadcast]})` : ''}
        </a>
      );
    case TxStatus.Error:
    case TxStatus.Failure:
      return 'Failed';
    case TxStatus.WaitingForApproval:
      return 'Signing Transaction';
    case TxStatus.Propagating:
      return (
        <>
          Unconfirmed <Timer start={tx.broadcastedAt} />
        </>
      );
    case TxStatus.WaitingForConfirmation:
      return (
        <a href={`${etherscan.url}/tx/${tx.txHash}`}
           target="_blank"
           rel="noopener noreferrer"
           className={styles.link}
        >
          Unconfirmed <Timer start={tx.broadcastedAt} />
        </a>
      );
    case TxStatus.CancelledByTheUser:
      return 'Rejected';
    default:
      throw new UnreachableCaseError(tx);
  }
}
