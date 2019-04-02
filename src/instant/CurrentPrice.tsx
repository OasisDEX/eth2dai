import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { Approximate } from '../utils/Approximate';
import { formatAmount } from '../utils/formatters/format';
import * as styles from './Instant.scss';

export class CurrentPrice extends React.Component<{
  price?: BigNumber,
  quotation?: string
}> {
  public render() {
    const { price, quotation } = this.props;
    return (
      <div className={classnames(styles.details, styles.finalization)}>
        <span>Current Estimated Price</span>
        <span style={{ marginLeft: '12px', color: '#828287' }}>
          <Approximate>
            {price && formatAmount(price, 'USD')}
            <span style={{ fontWeight: 'bold' }}>{quotation ? quotation : ''}</span>
          </Approximate>
        </span>
      </div>
    );
  }
}
