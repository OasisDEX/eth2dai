import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { OfferType } from '../../exchange/orderbook/orderbook';
import accountSvg from '../../icons/account.svg';
import cogWheelSvg from '../../icons/cog-wheel.svg';
import swapArrowsSvg from '../../icons/swap-arrows.svg';
import { Approximate } from '../../utils/Approximate';
import { formatAmount } from '../../utils/formatters/format';
import { FormatPercent, Money } from '../../utils/formatters/Formatters';
import { ButtonIcon, ProgressIcon } from '../../utils/icons/Icons';
import { SvgImage } from '../../utils/icons/utils';
import { TopLeftCorner, TopRightCorner } from '../../utils/panel/TopRightCorner';
import { TradeData } from '../details/TradeData';
import * as styles from '../Instant.scss';
import {
  InstantFormChangeKind,
  InstantFormState,
  ManualChange,
  Message,
  MessageKind,
  Position,
  ViewKind
} from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import { Buying, Selling } from '../TradingSide';

function error(msg: Message | undefined) {
  if (!msg) {
    return <></>;
  }

  switch (msg.kind) {
    case MessageKind.insufficientAmount:
      return (
        <>
          You don't have {formatAmount(msg.amount, msg.token)} {msg.token.toUpperCase()} in your wallet
        </>);
    case MessageKind.dustAmount:
      return (
        <>
          The Minimum trade value is {msg.amount.valueOf()} {msg.token.toUpperCase()}
        </>
      );
    case MessageKind.incredibleAmount:
      return (
        <>
          The Maximum trade value is {msg.amount.valueOf()} {msg.token.toUpperCase()}
        </>
      );
    case MessageKind.orderbookTotalExceeded:
      return (
        <>
          No orders available to {msg.side} {formatAmount(msg.amount, msg.token)} {msg.token.toUpperCase()}
        </>
      );
    default:
      return (
        <>
          Don't know how to show message: {msg.kind}
        </>
      );
  }
}

export class NewTradeView extends React.Component<InstantFormState> {

  public render() {
    const {
      sellToken,
      sellAmount,
      buyToken,
      buyAmount,
      balances,
      etherBalance,
      message,
      price,
      priceImpact,
      gasEstimationUsd,
      quotation,
    } = this.props;

    return (
      <InstantFormWrapper heading="Enter Order Details"
                          btnLabel="Start Transaction"
                          btnAction={this.startTx}
                          btnDisabled={!this.props.readyToProceed}
                          btnDataTestId="initiate-trade"
      >
        <TopRightCorner>
          <ButtonIcon
            className={classnames(styles.cornerIcon, styles.settingsIcon)}
            disabled={!price}
            onClick={this.showTradeSettings}
            image={cogWheelSvg}/>
        </TopRightCorner>
        <TopLeftCorner>
          <ButtonIcon
            className={styles.cornerIcon}
            onClick={this.showAccountSettings}
            image={accountSvg}/>
        </TopLeftCorner>
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
                             {formatAmount(price, 'USD')} {quotation || ''}
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
                               <Approximate data-vis-reg-hide={true}>
                                 <Money value={gasEstimationUsd} token="USD"/>
                               </Approximate>
                             )
                             : <ProgressIcon data-vis-reg-hide={true} small={true}/>
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
                   onClick={this.changeSellingToken}
                   balance={
                     (sellToken === 'ETH' && etherBalance ||
                       balances && balances[sellToken]) || undefined
                   }/>
          <div data-test-id="swap" className={styles.swapIcon} onClick={this.swap}>
            <SvgImage image={swapArrowsSvg}/>
          </div>
          <Buying asset={buyToken}
                  amount={buyAmount}
                  onAmountChange={this.updateBuyingAmount}
                  onClick={this.changeBuyingToken}
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
      </InstantFormWrapper>
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

  private changeSellingToken = () => {
    this.props.change({
      kind: InstantFormChangeKind.tokenChange,
      side: OfferType.sell
    });
    this.showAssets();
  }

  private changeBuyingToken = () => {
    this.props.change({
      kind: InstantFormChangeKind.tokenChange,
      side: OfferType.buy
    });
    this.showAssets();
  }

  private startTx = () => {
    this.props.submit(this.props);
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.finalization
    });
  }

  private showAssets = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.assetSelector
    });
  }

  private showAccountSettings = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.account
    });
  }

  private showTradeSettings = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.settings
    });
  }
}
