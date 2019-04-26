import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { TxStatus } from '../../blockchain/transactions';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { formatPrice } from '../../utils/formatters/format';
import { Money } from '../../utils/formatters/Formatters';
import * as genericStyles from '../Instant.scss';
import { ProgressReport, Report } from '../progress/ProgressReport';
import * as styles from './TradeSummary.scss';
import { TxStatusRow } from './TxStatusRow';

interface TradeSummaryProps {
  price: BigNumber;
  quotation: string;
  gasUsed: BigNumber;
  sold: BigNumber;
  soldToken: string;
  bought: BigNumber;
  boughtToken: string;
  type: OfferType;
  hadCreatedProxy: boolean;
}

export class TradeSummary extends React.Component<TradeSummaryProps> {
  public render() {
    const { type, soldToken, boughtToken, sold, bought, gasUsed, hadCreatedProxy, price, quotation } = this.props;

    return <div className={classnames(genericStyles.details, styles.details)}>

      <TxStatusRow label={'Congratulations!'}
                   status={<ProgressReport report={{ txStatus: TxStatus.Success } as Report}/>}/>

      <div>
        <span data-test-id="summary" className={styles.summary}>
          {
            hadCreatedProxy &&
            <p data-test-id="has-proxy" style={{ marginTop: '0' }}>
              You have successfully created a <span className={styles.highlight}>Proxy!</span>
            </p>
          }
          By using your <span className={styles.highlight}> Proxy </span> you
          {
            type === OfferType.sell
              ? summarizeSell(sold, soldToken, bought, boughtToken)
              : summarizeBuy(sold, soldToken, bought, boughtToken)
          }
          <br/>
          at&nbsp;
          <span data-test-id="final-price"
                className={styles.highlight}>
            <span>{price.valueOf()}</span>
            <span> {quotation}</span>
          </span>
          &nbsp;by paying&nbsp;
          <span className={styles.highlight}>
            {gasUsed ? gasUsed : 'N/A'}
          </span>
          &nbsp;gas
        </span>
      </div>
    </div>;
  }
}

const summarizeSell = (sold: BigNumber, soldToken: string, bought: BigNumber, boughtToken: string) => {
  return (
    <>
      &nbsp;sold&nbsp;
      <span data-test-id="sold-token"
            className={styles.highlight}>
      <Money formatter={formatPrice} value={sold} token={soldToken.toUpperCase()}/>
      </span>
      &nbsp;for&nbsp;
      <span data-test-id="bought-token"
            className={styles.highlight}>
      <Money formatter={formatPrice} value={bought} token={boughtToken.toUpperCase()}/>
      </span>
    </>
  );
};

const summarizeBuy = (sold: BigNumber, soldToken: string, bought: BigNumber, boughtToken: string) => {
  return (
    <>
      &nbsp;bought&nbsp;
      <span data-test-id="bought-token"
            className={styles.highlight}>
      <Money formatter={formatPrice} value={bought} token={boughtToken.toUpperCase()}/>
      </span>
      &nbsp;for&nbsp;
      <span data-test-id="sold-token"
            className={styles.highlight}>
      <Money formatter={formatPrice} value={sold} token={soldToken.toUpperCase()}/>
      </span>
    </>
  );
};
