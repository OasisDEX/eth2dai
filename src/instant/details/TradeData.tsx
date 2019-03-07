import classnames from 'classnames';
import * as React from 'react';
import { InfoIcon } from '../../utils/icons/Icons';
import * as styles from './TradeData.scss';

interface EntryProps {
  label: string | React.ReactNode;
  value?: string | React.ReactNode;
  info?: string;
  theme?: 'reversed';
}

const skin = (theme: string) => {
  switch (theme) {
    case 'reversed':
      return styles.reversed;
    default:
      return styles.entry;
  }
};

export class TradeData extends React.Component<EntryProps> {
  public render() {
    const { label, value, info, theme } = this.props;
    return (
      <div className={classnames(styles.entry, theme ? skin(theme) : '')} {...this.props}>
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
