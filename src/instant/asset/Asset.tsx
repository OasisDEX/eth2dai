import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import { tokens } from '../../blockchain/config';
import { User } from '../../blockchain/user';
import { FormatAmount } from '../../utils/formatters/Formatters';
import { ProgressIcon } from '../../utils/icons/Icons';
import { Currency } from '../../utils/text/Text';
import * as styles from './Asset.scss';

export interface AssetProps {
  currency: string;
  balance?: any;
  onClick?: () => void;
  user?: User;
}

export class Asset extends React.Component<AssetProps> {
  public render() {
    const { user, currency, onClick } = this.props;
    const balance = user && user.account ? this.props.balance : new BigNumber(0);
    return (
      <div className={styles.asset} onClick={onClick}>
        <span className={styles.icon}>
          {tokens[currency].iconColor}
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
