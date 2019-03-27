import * as React from 'react';
import { TxStatus } from '../../blockchain/transactions';
import { ProgressIcon } from '../../utils/icons/Icons';
import * as styles from './ProgressReport.scss';

const states = new Map<string, React.ReactNode>([
  [TxStatus.WaitingForApproval, <>
    <span>Sign Transaction</span>
    <ProgressIcon className={styles.progressIcon}/>
  </>],
  [TxStatus.WaitingForConfirmation, <>
    <span>Waiting for confirmation</span>
    <ProgressIcon className={styles.progressIcon}/>
  </>],
  [TxStatus.Success, <><span className={styles.success}>Confirmed</span></>],
  [TxStatus.CancelledByTheUser, <><span className={styles.failure}>Rejected</span></>],
]);

export class ProgressReport extends React.Component<{ status: TxStatus }> {
  public render() {
    const { status } = this.props;

    return (
      <div className={styles.progressReport}>
        {states.get(status)}
      </div>
    );
  }
}
