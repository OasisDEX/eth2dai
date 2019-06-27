import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { TxStatus } from '../../blockchain/transactions';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { formatAmountInstant } from '../../utils/formatters/format';
import { Money } from '../../utils/formatters/Formatters';
import * as genericStyles from '../Instant.scss';
import { ProgressReport, Report } from '../progress/ProgressReport';
import * as styles from './TradeSummary.scss';
import { TxStatusRow } from './TxStatusRow';

interface TradeSummaryProps {
  price: BigNumber;
  quotation: string;
  gasCost: BigNumber;
  etherscanURI: string;
  txHash: string;
  sold: BigNumber;
  soldToken: string;
  bought: BigNumber;
  boughtToken: string;
  type: OfferType;
  hadCreatedProxy: boolean;
}

export class TradeSummary extends React.Component<TradeSummaryProps> {
  public render() {
    const {
      type,
      soldToken,
      boughtToken,
      sold,
      bought,
      gasCost,
      txHash,
      etherscanURI,
      hadCreatedProxy,
      price, quotation
    } = this.props;

    return <div className={classnames(genericStyles.details, styles.details)}>
      <TxStatusRow label={'Congratulations!'}
                   status={<ProgressReport report={{
                     txHash,
                     etherscanURI,
                     txStatus: TxStatus.Success
                   } as Report}/>}/>

      <div data-test-id="summary" className={styles.summary}>
        {
          hadCreatedProxy &&
          <p data-test-id="has-proxy" style={{ marginTop: '0' }}>
            You successfully created your <span className={styles.highlight}>Proxy!</span>
          </p>
        }
        By using your <span className={styles.highlight}> Proxy </span> you
        {
          type === OfferType.sell
            ? summarizeSell(sold, soldToken, bought, boughtToken)
            : summarizeBuy(sold, soldToken, bought, boughtToken)
        }
        <span> at </span>
        <span data-test-id="final-price"
              className={styles.highlight}>
            <span>{price.valueOf()}</span>
            <span> {quotation} </span>
          </span>
        <span> by paying </span>
        <span className={styles.highlight}>
            {gasCost ? <Money value={gasCost} token="USD"/> : 'N/A'}
          </span>
        <span> gas cost</span>
      </div>
    </div>;
  }
}

const summarizeSell = (
  sold: BigNumber,
  soldToken: string,
  bought: BigNumber,
  boughtToken: string
) => {
  return (
    <>
      <span> sold </span>
      <span data-test-id="sold-token" className={styles.highlight}>
        <Money formatter={formatAmountInstant} value={sold} token={soldToken.toUpperCase()}/>
      </span>
      <span> for </span>
      <span data-test-id="bought-token" className={styles.highlight}>
        <Money formatter={formatAmountInstant} value={bought} token={boughtToken.toUpperCase()}/>
      </span>
    </>
  );
};

const summarizeBuy = (
  sold: BigNumber,
  soldToken: string,
  bought: BigNumber,
  boughtToken: string
) => {
  return (
    <>
      <span> bought </span>
      <span data-test-id="bought-token" className={styles.highlight}>
         <Money formatter={formatAmountInstant} value={bought} token={boughtToken.toUpperCase()}/>
      </span>
      <span> for </span>
      <span data-test-id="sold-token" className={styles.highlight}>
         <Money formatter={formatAmountInstant} value={sold} token={soldToken.toUpperCase()}/>
      </span>
    </>
  );
};
