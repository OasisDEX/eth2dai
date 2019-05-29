import classnames from 'classnames';
import * as React from 'react';
import { WarningTooltip, WarningTooltipType } from '../../utils/tooltip/Tooltip';
import * as styles from './TradeData.scss';

interface EntryProps {
  label: string | React.ReactNode;
  style?: React.CSSProperties;
  value?: string | React.ReactNode;
  info?: string;
  theme?: 'reversed';
  tooltip?: WarningTooltipType;
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
    const { label, value, tooltip, theme, ...rest } = this.props;
    return (
      <div className={classnames(styles.entry, theme ? skin(theme) : '')} {...rest}>
        <span data-test-id="label" className={styles.label}>
          {label}
        </span>&nbsp;
        {
          tooltip && <WarningTooltip {...tooltip}/>
        }
        <span data-test-id="value"
              className={styles.value}>
          {value}
        </span>
      </div>
    );
  }
}
