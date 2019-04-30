import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import swapArrowsSvg from '../../icons/swap-arrows.svg';
import { Approximate } from '../../utils/Approximate';
import { formatAmount } from '../../utils/formatters/format';
import { FormatPercent, Money } from '../../utils/formatters/Formatters';
import { ProgressIcon } from '../../utils/icons/Icons';
import { SvgImage } from '../../utils/icons/utils';
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
    case MessageKind.notConnected:
      return (
        <>
          Connect wallet to proceed with order
        </>
      );
  }
}

const priceImpactTooltip = {
  id: 'price-impact',
  text: 'The difference between the best current price on the Eth2Dai order book and the estimated price of your order.'
};
const slippageLimitTooltip = {
  id: 'slippage-limit',
  text: 'The maximum allowed difference between the estimated price of the order and the actual price. The two may differ if the order book changes before your trade executes.'
};

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
      user,
      kind,
    } = this.props;

    return (
      <InstantFormWrapper heading="Enter Order Details"
                          btnLabel="Start Transaction"
                          btnAction={this.startTx}
                          btnDisabled={!this.props.readyToProceed}
                          btnDataTestId="initiate-trade"
      >
        {
          /*
          We plan to release basic instant version so people can trade with a single click
          There are some design concerns that must be discussed so those two options are postponed

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
          */
        }

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
                         value={<FormatPercent value={new BigNumber(2.5)} precision={1}/>}
                         style={{ marginBottom: '2px' }}
              />
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
                   change={this.props.change}
                   balance={
                     (sellToken === 'ETH' && etherBalance ||
                       balances && balances[sellToken]) || undefined
                   }
                   user={user}
                   approx={sellAmount && kind === 'buy'}/>
          <div data-test-id="swap" className={styles.swapIcon} onClick={this.swap}>
            <SvgImage image={swapArrowsSvg}/>
          </div>
          <Buying asset={buyToken}
                  amount={buyAmount}
                  onAmountChange={this.updateBuyingAmount}
                  change={this.props.change}
                  balance={
                    (buyToken === 'ETH' && etherBalance ||
                      balances && balances[buyToken]) || undefined
                  }
                  user={user}
                  approx={buyAmount && kind === 'sell'}/>
        </div>
        <div data-test-id="error"
             className={classnames(
               message && message.kind === MessageKind.notConnected ? styles.warnings : styles.errors,
               message && message.placement === Position.BOTTOM ? '' : styles.hidden,
             )}>
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

  private startTx = () => {
    const priceImpact = this.props.priceImpact;

    if (priceImpact && priceImpact.gt(new BigNumber(5))) {
      this.props.change({
        kind: InstantFormChangeKind.viewChange,
        view: ViewKind.priceImpactWarning
      });
    } else {
      this.props.submit(this.props);
      this.props.change({
        kind: InstantFormChangeKind.viewChange,
        view: ViewKind.finalization
      });
    }
  }

  // @ts-ignore
  private showAccountSettings = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.account
    });
  }

  // @ts-ignore
  private showTradeSettings = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.settings
    });
  }
}
