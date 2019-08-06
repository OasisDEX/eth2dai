import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';

import { Approximate } from '../../utils/Approximate';
import { GasEstimationStatus } from '../../utils/form';
import { formatAmount } from '../../utils/formatters/format';
import { FormatPercent, Money } from '../../utils/formatters/Formatters';
import { ProgressIcon } from '../../utils/icons/Icons';
import { TradeData } from './TradeData';
import * as styles from './TradeDetails.scss';

// tslint:disable
const priceImpactTooltip = {
  id: 'price-impact',
  text: 'The difference between the best current price on the Eth2Dai order book and the estimated price of your order.'
};
const slippageLimitTooltip = {
  id: 'slippage-limit',
  text: 'The maximum allowed difference between the estimated price of the order and the actual price. The two may differ if the order book changes before your trade executes.'
};

// tslint:enable

interface TradeDetailsProps {
  price?: BigNumber;
  quotation?: string;
  priceImpact?: BigNumber;
  slippageLimit: BigNumber;
  gasEstimationStatus?: GasEstimationStatus;
  gasEstimationUsd?: BigNumber;
  withErrors?: string;
}

export class TradeDetails extends React.Component<TradeDetailsProps> {

  public static Error({ message, dataTestId }: { message: any, dataTestId?: string }) {
    return (
      <section data-test-id={dataTestId} className={classnames(styles.details, styles.errors)}>
        {message}
      </section>
    );
  }

  public render() {
    const {
      price, quotation, slippageLimit, gasEstimationStatus, gasEstimationUsd, priceImpact
    } = this.props;
    return (<section className={styles.details}> {
      price && <>
        <TradeData label="Price"
                   data-test-id="trade-price"
                   value={
                     <Approximate>
                       {formatAmount(price, 'USD')} {quotation || ''}
                     </Approximate>
                   }
                   style={{ marginBottom: '2px' }}
        />
        <TradeData label="Slippage Limit"
                   data-test-id="trade-slippage-limit"
                   tooltip={slippageLimitTooltip}
                   value={
                     <FormatPercent value={new BigNumber(slippageLimit.times(100))}
                                    precision={2}
                     />
                   }
                   style={{ marginBottom: '2px' }}
        />
        <TradeData label="Gas cost"
                   data-test-id="trade-gas-cost"
                   value={
                     gasEstimationStatus === GasEstimationStatus.error ?
                       'error' :
                       gasEstimationUsd
                         ? (
                           <Approximate data-vis-reg-hide={true}>
                             <Money value={gasEstimationUsd} token="USD"/>
                           </Approximate>
                         )
                         : <ProgressIcon data-vis-reg-hide={true} size="sm"/>
                   }/>
        <TradeData label="Price Impact"
                   data-test-id="trade-price-impact"
                   tooltip={priceImpactTooltip}
                   value={
                     <FormatPercent
                       className={priceImpact && priceImpact.gt(new BigNumber(5)) ? 'danger' : ''}
                       fallback={'N/A'}
                       value={priceImpact}
                       precision={2}
                     />
                   }
        />
      </>
    }</section>);
  }
}
