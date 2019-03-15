import classnames from 'classnames';
import * as React from 'react';
import * as styles from './TxStatusRow.scss';

interface TxStatusRowProps {
  icon?: React.ReactNode | HTMLElement;
  label: string | React.ReactNode;
  status?: string | React.ReactNode;
  theme?: 'success' | 'failure' | 'generic';
}

const skin = (theme: string) => {
  switch (theme) {
    case 'success':
      return styles.success;
    case'failure':
      return styles.failure;
    default:
      return styles.generic;
  }
};

export class TxStatusRow extends React.Component<TxStatusRowProps> {
  public render() {
    const { icon, label, status, theme } = this.props;
    return (
      <div className={classnames(styles.txStatusRow, skin(theme ? theme : 'generic'))}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <span className={styles.label}>{label}</span>
        {status && <span className={styles.status}>{status}</span>}
      </div>
    );
  }
}
