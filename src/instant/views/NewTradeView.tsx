import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import cogWheelSvg from '../../icons/cog-wheel.svg';
import swapArrowsSvg from '../../icons/swap-arrows.svg';
import { formatAmount } from '../../utils/formatters/format';
import { ButtonIcon } from '../../utils/icons/Icons';
import { SvgImage } from '../../utils/icons/utils';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import { TradeDetails } from '../details/TradeDetails';
import * as styles from '../Instant.scss';
import {
  InstantFormChangeKind,
  InstantFormState,
  ManualChange,
  Message,
  MessageKind,
  ViewKind
} from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import { Buying, Selling } from '../TradingSide';

function error(msg: Message | undefined) {
  if (!msg) {
    return <></>;
  }
  // tslint:disable
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
          No orders available to {msg.side}&#32;{formatAmount(msg.amount, msg.token)}&#32;{msg.token.toUpperCase()}
        </>
      );
    case MessageKind.notConnected:
      return (
        <>
          Connect wallet to proceed with order
        </>
      );
  }
// tslint:enable
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
        <TopRightCorner>
          <ButtonIcon
            className={classnames(styles.cornerIcon, styles.settingsIcon)}
            disabled={!price}
            onClick={this.showTradeSettings}
            image={cogWheelSvg}
            data-test-id="trade-settings"
          />
        </TopRightCorner>
        {
          /*
          We plan to release basic instant version so people can trade with a single click
          There are some design concerns that must be discussed so those two options are postponed

          <TopLeftCorner>
            <ButtonIcon
              className={styles.cornerIcon}
              onClick={this.showAccountSettings}
              image={accountSvg}/>
          </TopLeftCorner>
          */
        }
        <div className={styles.tradeDetails}>
          {
            message && message.top
              ? <TradeDetails.Error dataTestId={'top-error'}
                                    message={error(message.top)}
              />
              : (
                price
                  ? <TradeDetails {...this.props}/>
                  : null
              )
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
        <div data-test-id="bottom-error"
             className={classnames(
               message && message.bottom && message.bottom.kind === MessageKind.notConnected
                 ? styles.warnings
                 : styles.errors,
               message && message.bottom
                 ? ''
                 : styles.hidden,
             )}>
          { message && message.bottom && error(message.bottom)}
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
