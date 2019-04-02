import * as React from 'react';
import { tokens } from '../../blockchain/config';
import { FormatAmount } from '../../utils/formatters/Formatters';
import { ProgressIcon } from '../../utils/icons/Icons';
import { Currency } from '../../utils/text/Text';
import * as styles from './Asset.scss';

export interface AssetProps {
  currency: string;
  balance?: any;
  onClick?: () => void;
}

export class Asset extends React.Component<AssetProps> {
  public render() {
    const { balance, currency, onClick } = this.props;
    return (
      <div className={styles.asset} onClick={onClick}>
        <span className={styles.icon}>
          {tokens[currency].iconCircle}
        </span>
        {
          !balance && <ProgressIcon small={true}/>
        }
        {
          balance &&
          <div data-test-id="balance">
            <FormatAmount value={balance} token={currency} fallback="" data-vis-reg-hide={true}/>
            &nbsp;
            <Currency value={currency} theme="semi-bold"/>
          </div>
        }
      </div>
    );
  }
}
