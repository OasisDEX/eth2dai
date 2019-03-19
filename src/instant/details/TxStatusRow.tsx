import classnames from 'classnames';
import * as React from 'react';
import * as styles from './TxStatusRow.scss';

interface TxStatusRowProps {
  icon?: React.ReactNode | HTMLElement;
  label: string | React.ReactNode;
  status?: string | React.ReactNode;
}

export class TxStatusRow extends React.Component<TxStatusRowProps> {
  public render() {
    const { icon, label, status, ...rest } = this.props;
    return (
      <div {...rest} className={classnames(styles.txStatusRow)}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span data-test-id="label" className={styles.label}>{label}</span>
        {status && <span data-test-id="status" className={styles.status}>{status}</span>}
      </div>
    );
  }
}
