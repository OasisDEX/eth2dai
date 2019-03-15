import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { formatAmount } from '../../utils/formatters/format';
import { Money } from '../../utils/formatters/Formatters';
import * as genericStyles from '../Instant.scss';
import * as styles from './TradeSummary.scss';
import { TxStatusRow } from './TxStatusRow';

interface TradeSummaryProps {
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
    const { type, soldToken, boughtToken, sold, bought, gasUsed, hadCreatedProxy } = this.props;
    return <div className={classnames(genericStyles.details, styles.details)}>

      <TxStatusRow label={'Congratulations!'} theme={'success'} status={'Confirmed'}/>

      <div>
        <span data-test-id="congratulation-message" className={styles.summary}>
          {
            hadCreatedProxy && <p style={{ marginTop: '0' }}>You have successfully create a Proxy!</p>
          }
          By using your Proxy you
          {
            type === OfferType.sell
              ? summarizeSell(sold, soldToken, bought, boughtToken)
              : summarizeBuy(sold, soldToken, bought, boughtToken)
          }
          <br/>
          at&nbsp;
          <span data-test-id="final-price"
                className={styles.highlight}>
            {
              formatAmount(bought.div(sold), 'DAI')
            }
            &nbsp;{soldToken}/{boughtToken}
          </span>
          &nbsp;by paying&nbsp;
          <span className={styles.highlight}>
            {gasUsed}
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
        <Money value={sold} token={soldToken.toUpperCase()}/>
      </span>
      &nbsp;for&nbsp;
      <span data-test-id="bought-token"
            className={styles.highlight}>
        <Money value={bought} token={boughtToken.toUpperCase()}/>
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
        <Money value={bought} token={boughtToken.toUpperCase()}/>
      </span>
      &nbsp;for&nbsp;
      <span data-test-id="bought-token"
            className={styles.highlight}>
        <Money value={sold} token={soldToken.toUpperCase()}/>
      </span>
    </>
  );
};
