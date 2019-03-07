import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { theAppContext } from '../AppContext';
import { DAIicon, ETHicon } from '../blockchain/coinIcons/coinIcons';
import { TxStatus } from '../blockchain/transactions';
import { formatAmount } from '../utils/formatters/format';
import { FormatPercent, Money } from '../utils/formatters/Formatters';
import { AccountIcon, ProgressIcon, SettingsIcon, SwapArrows } from '../utils/icons/Icons';
import { TopRightCorner } from '../utils/panel/TopRightCorner';
import { TradeData } from './details/TradeData';
import { TxStatusRow } from './details/TxStatusRow';
import * as styles from './Instant.scss';
import { InstantFormChangeKind, InstantFormState, ManualChange, Message, MessageKind, Position } from './instantForm';
import { InstantForm } from './InstantForm';
import { ProgressReport } from './progress/ProgressReport';
import { Buying, Selling } from './TradingSide';

const Approximate = (props: any) => (
  <>
    ~&nbsp;{props.children}
  </>
);

function error(msg: Message | undefined) {
  if (!msg) {
    return <></>;
  }

  switch (msg.kind) {
    case MessageKind.insufficientAmount:
      return <>You don't have {formatAmount(msg.amount, msg.token)} {msg.token.toUpperCase()} in your wallet</>;
    case MessageKind.dustAmount:
      return <>The Minimum trade value is {msg.amount.valueOf()} {msg.token.toUpperCase()} </>;
    case MessageKind.incredibleAmount:
      return <>The Maximum trade value is {msg.amount.valueOf()} {msg.token.toUpperCase()} </>;
    case MessageKind.orderbookTotalExceeded:
      return <>No orders available to {msg.side} {formatAmount(msg.amount, msg.token)} {msg.token.toUpperCase()} </>;
    default:
      return <>Don't know how to show message: {msg.kind}</>;
  }
}

export class InstantView extends React.Component<InstantFormState> {

  public render() {
    const { sellToken, sellAmount, buyToken, buyAmount, balances, etherBalance, message, price,
      priceImpact,
      gasEstimationUsd,
      progress
    } = this.props;

    // Congratulation
    if (progress && progress.done && progress.tradeTxStatus === TxStatus.Success) {
      return (
        <InstantForm heading="Finalize Trade"
                     btnAction={this.resetForm}
                     btnDisabled={!progress.done}
                     btnLabel="Trade Again">

          <div className={classnames(styles.details, styles.done)}>
            Congratulation!
          </div>
        </InstantForm>
      );
    }

    // Finalization
    // TODO: Instead of using this approach check how the OfferMakePanel switches between two views.
    if (progress) {
      return (
        <InstantForm heading="Finalize Trade"
                     btnAction={this.resetForm}
                     btnDisabled={!progress.done}
                     btnLabel="Trade Again">

          <div className={classnames(styles.details, styles.finalization)}>
            <span>Current Estimated Price</span>
            <span style={{ marginLeft: '12px', color: '#828287' }}>
             <Approximate>
               {formatAmount(price || new BigNumber(0), 'USD')} <span
               style={{ fontWeight: 'bold' }}>{sellToken}/{buyToken}</span>
             </Approximate>
          </span>
          </div>

          <div className={classnames(styles.details, styles.transaction)}>
            <TxStatusRow icon={<AccountIcon/>}
                         label={
                           <TradeData
                             theme="reversed"
                             label="Create Account"
                             info="Something about Proxy"
                           />}
                         status={<ProgressReport status={progress.tradeTxStatus || 'unknown' as TxStatus}/>}/>
            <TxStatusRow icon={<ETHicon theme="circle"/>}
                         label={
                           <TradeData
                             theme="reversed"
                             label="Sell"
                             value={
                               <Money value={sellAmount || new BigNumber(0)} token={sellToken}/>
                             }
                           />}/>
            <TxStatusRow icon={<DAIicon theme="circle"/>}
                         label={
                           <TradeData
                             theme="reversed"
                             label="Buy"
                             value={
                               <Approximate>
                                 <Money value={buyAmount || new BigNumber(0)} token={buyToken}/>
                               </Approximate>
                             }
                           />}/>
          </div>
        </InstantForm>
      );
    }

    return (
      <InstantForm heading="Enter Order Details"
                   btnLabel="Start Transaction"
                   btnAction={this.startTx}
                   btnDisabled={!this.props.readyToProceed}>
        <TopRightCorner>
          <SettingsIcon/>
        </TopRightCorner>
        <div
          className={classnames(
            styles.details,
            price || message && message.placement === Position.TOP ? '' : styles.hidden,
            message && message.placement === Position.TOP ? styles.errors : ''
          )}>
          {
            price &&
            <>
              <TradeData label="Price"
                         data-test-id="trade-price"
                         info="Additional Info"
                         value={
                           <Approximate>
                             {formatAmount(price || new BigNumber(0), 'USD')} {sellToken}/{buyToken}
                           </Approximate>
                         }/>
              <TradeData label="Slippage Limit"
                         data-test-id="trade-slippage-limit"
                         info="Additional Info"
                         value={<FormatPercent value={new BigNumber(2.5)} precision={1}/>}/>
              <TradeData label="Gas cost"
                         data-test-id="trade-gas-cost"
                         value={
                           gasEstimationUsd
                             ? (
                               <Approximate>
                                 <Money value={gasEstimationUsd} token="USD"/>
                               </Approximate>
                             )
                             : <ProgressIcon small={true}/>
                         }/>
              <TradeData label="Price Impact"
                         data-test-id="trade-price-impact"
                         info="Additional Info"
                         value={<FormatPercent fallback={'N/A'} value={priceImpact} precision={2}/>}/>
            </>
          }

          {
            message && message.placement === Position.TOP &&
            <>
              {error(message)}
            </>
          }
        </div>
        <div className={styles.assets}>
          <Selling asset={sellToken}
                   amount={sellAmount}
                   onAmountChange={this.updateSellingAmount}
                   balance={
                     (sellToken === 'ETH' && etherBalance ||
                       balances && balances[sellToken]) || undefined
                   }/>
          <div data-test-id="swap" className={styles.swapIcon} onClick={this.swap}><SwapArrows/></div>
          <Buying asset={buyToken}
                  amount={buyAmount}
                  onAmountChange={this.updateBuyingAmount}
                  balance={
                    (buyToken === 'ETH' && etherBalance ||
                      balances && balances[buyToken]) || undefined
                  }/>
        </div>
        <div data-test-id="error"
             className={
               classnames(styles.errors, message && message.placement === Position.BOTTOM ? '' : 'hide-all')
             }>
          {error(message)}
        </div>
      </InstantForm>
    );
  }

  private swap = () => {
    this.props.change({
      kind: InstantFormChangeKind.pairChange,
      buyToken: this.props.sellToken,
      sellToken: this.props.buyToken,
    });
  }

  private updateSellingAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    this.props.change({
      kind: InstantFormChangeKind.sellAmountFieldChange,
      value: value === '' ? undefined : new BigNumber(value)
    } as ManualChange);
  }

  private updateBuyingAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    this.props.change({
      kind: InstantFormChangeKind.buyAmountFieldChange,
      value: value === '' ? undefined : new BigNumber(value)
    } as ManualChange);
  }

  private startTx = () => {
    this.props.submit(this.props);
  }

  private resetForm = () => {
    this.props.change({
      kind: InstantFormChangeKind.formResetChange
    });
  }

}

export class InstantExchange extends React.Component<any> {
  public render() {
    return (
      <theAppContext.Consumer>
        {({ InstantTxRx }) =>
          <InstantTxRx/>
        }
      </theAppContext.Consumer>
    );
  }
}
