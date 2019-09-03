import * as React from 'react';
import { TxStatus } from '../../blockchain/transactions';
import { ProgressIcon } from '../../utils/icons/Icons';
import * as styles from './ProgressReport.scss';

interface Params {
  txReport: string;
}

export interface Report {
  txStatus: TxStatus;
  txHash: string;
  etherscanURI: string;
}

const statuses = new Map<string, (params: Params) => React.ReactNode>([
  [TxStatus.WaitingForApproval, () => (
    <>
      <span>Sign Transaction</span>
      <ProgressIcon className={styles.progressIcon}/>
    </>
  )],
  [TxStatus.WaitingForConfirmation, (params: Params) => (
    <>
      <a href={params.txReport} target="_blank" rel="noreferrer noopener" className={styles.link}>
        <span>View on Etherscan</span>
      </a>
      <ProgressIcon className={styles.progressIcon}/>
    </>
  )],
  [TxStatus.Propagating, () => (
    <>
      <span className={styles.description}>Pending</span>
      <ProgressIcon className={styles.progressIcon}/>
    </>
  )],
  [TxStatus.Success, (params: Params) => (
    <>
      <a href={params.txReport} target="_blank" rel="noreferrer noopener" className={styles.link}>
        <span>Confirmed</span>
      </a>
    </>
  )],
  [TxStatus.CancelledByTheUser, () => (
    <><span className={styles.failure}>Rejected</span></>
  )],
]);

export class ProgressReport extends React.Component<{ report: Report }> {
  public render() {
    const { txStatus, txHash, etherscanURI } = this.props.report;
    const partial = statuses.get(txStatus);
    const txReport = `${etherscanURI}/tx/${txHash}`;

    return (
      <div className={styles.progressReport}>
        {
          partial && partial({ txReport } as Params)
        }
      </div>
    );
  }
}
