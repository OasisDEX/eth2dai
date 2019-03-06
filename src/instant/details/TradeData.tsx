import * as React from 'react';
import { InfoIcon } from '../../utils/icons/Icons';
import * as styles from './TradeData.scss';

interface EntryProps {
  label: string | React.ReactNode;
  value: string | React.ReactNode;
  info?: string;
}

export class TradeData extends React.Component<EntryProps> {

  public render() {
    const { label, value, info, } = this.props;

    return (
      <div className={styles.entry} {...this.props}>
        <span className={styles.label}>
          {label}
        </span>&nbsp;
        {
          info && <InfoIcon className={styles.infoIcon}/>
        }
        <span data-test-id="value"
              className={styles.value}>
          {value}
        </span>
      </div>
    );
  }
}
