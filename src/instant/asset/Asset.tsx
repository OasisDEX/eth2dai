import { BigNumber } from 'bignumber.js';
import * as React from 'react';

import { tokens } from '../../blockchain/config';
import { User } from '../../blockchain/user';
import { formatAmountInstant } from '../../utils/formatters/format';
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
          !balance && <ProgressIcon size="sm"/>
        }
        {
          balance &&
          <div data-test-id="balance">
            <span data-vis-reg-hide={true}>
              {
                formatAmountInstant(balance, currency)
              }
            </span>
            &nbsp;
            <Currency value={currency} theme="medium"/>
          </div>
        }
      </div>
    );
  }
}
