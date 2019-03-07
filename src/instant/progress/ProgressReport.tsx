import * as React from 'react';
import { TxStatus } from '../../blockchain/transactions';
import { ProgressIcon } from '../../utils/icons/Icons';
import * as styles from './ProgressReport.scss';

const progressIcon = {
  marginLeft: '.5rem'
};

const states = new Map<string, React.ReactNode>([
  [TxStatus.WaitingForApproval, <><span>Sign Transaction</span><ProgressIcon style={progressIcon}/></>],
  [TxStatus.WaitingForConfirmation, <><span>Waiting for confirmation</span> <ProgressIcon style={progressIcon}/></>],
  [TxStatus.CancelledByTheUser, <>Rejected</>],
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
