import classnames from 'classnames';
import * as React from 'react';
import warningSvg from '../../icons/warning.svg';
import { SvgImage } from '../../utils/icons/utils';
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
    const { label, value, info, theme, ...rest } = this.props;
    return (
      <div className={classnames(styles.entry, theme ? skin(theme) : '')} {...rest}>
        <span data-test-id="label" className={styles.label}>
          {label}
        </span>&nbsp;
        {
          info && <SvgImage className={styles.warningIcon} image={warningSvg}/>
        }
        <span data-test-id="value"
              className={styles.value}>
          {value}
        </span>
      </div>
    );
  }
}
