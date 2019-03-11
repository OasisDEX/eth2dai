import * as React from 'react';
import * as styles from './TxStatusRow.scss';

interface TxStatusRowProps {
  icon: React.ReactNode | HTMLElement;
  label: string | React.ReactNode;
  status?: string | React.ReactNode;
}

export class TxStatusRow extends React.Component<TxStatusRowProps> {
  public render() {
    const { icon, label, status } = this.props;
    return (
      <div className={styles.txStatusRow}>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.label}>{label}</span>
        <span className={styles.status}>{status}</span>
      </div>
    );
  }
}
