import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { theAppContext } from '../AppContext';
import { TxStatus } from '../blockchain/transactions';
import { OfferType } from '../exchange/orderbook/orderbook';
import accountSvg from '../icons/account.svg';
import cogWheelSvg from '../icons/cog-wheel.svg';
import daiCircleSvg from '../icons/coins/dai-circle.svg';
import ethCircleSvg from '../icons/coins/eth-circle.svg';
import doneSvg from '../icons/done.svg';
import swapArrowsSvg from '../icons/swap-arrows.svg';
import { Approximate } from '../utils/Approximate';
import { formatAmount, formatPrice } from '../utils/formatters/format';
import { FormatPercent, Money } from '../utils/formatters/Formatters';
import { ProgressIcon, } from '../utils/icons/Icons';
import { SvgImage } from '../utils/icons/utils';
import { TopRightCorner } from '../utils/panel/TopRightCorner';
import { AssetProps } from './asset/Asset';
import { Assets } from './asset/Assets';
import { TradeData } from './details/TradeData';
import { TradeSummary } from './details/TradeSummary';
import { TxStatusRow } from './details/TxStatusRow';
import * as styles from './Instant.scss';
import {
  InstantFormChangeKind,
  InstantFormState,
  ManualChange,
  Message,
  MessageKind,
  Position,
  ProgressKind
} from './instantForm';
import { InstantFormWrapper } from './InstantFormWrapper';
import { ProgressReport } from './progress/ProgressReport';
import { Buying, Selling } from './TradingSide';

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

class CurrentPrice extends React.Component<{
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
            {price ? formatAmount(price, 'USD') : ''}
            <span style={{ fontWeight: 'bold' }}>{quotation ? quotation : ''}</span>
          </Approximate>
        </span>
      </div>
    );
  }
}

export class InstantView extends React.Component<InstantFormState> {

  public state = { areAssetsOpen: false, kind: OfferType.sell };

  public render() {
    const {
      kind,
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
      progress
    } = this.props;

    if (this.state.areAssetsOpen) {
      const assets: AssetProps[] = [
        { currency: 'ETH', balance: new BigNumber('12.345') },
        { currency: 'WETH', balance: new BigNumber('13.345') },
        { currency: 'DAI', balance: new BigNumber('16.345') },
      ];

      console.log(kind);
      return <Assets assets={assets}
                     side={kind || OfferType.sell}
                     onClick={this.selectAsset}
                     onClose={this.hideAssets}/>;
    }

    // TradeSummary
    if (progress && progress.done && progress.tradeTxStatus === TxStatus.Success) {
      const { sold, bought, gasUsed } = progress;
      return (
        <InstantFormWrapper heading="Finalize Trade"
                            btnAction={this.resetForm}
                            btnLabel="Trade Again"
                            btnDataTestId="new-trade"
        >
          <CurrentPrice price={price} quotation={quotation}/>
          <TradeSummary sold={sold || new BigNumber(0)}
                        bought={bought || new BigNumber(0)}
                        gasUsed={gasUsed || new BigNumber(0)}
                        soldToken={sellToken}
                        boughtToken={buyToken}
                        type={kind || '' as OfferType}
                        hadCreatedProxy={
                          [
                            ProgressKind.noProxyPayWithETH,
                            ProgressKind.noProxyNoAllowancePayWithERC20
                          ].includes(progress.kind)
                        }/>

        </InstantFormWrapper>
      );
    }

    // Finalization
    if (progress) {
      return (
        <InstantFormWrapper heading="Finalize Trade"
                            btnAction={this.resetForm}
                            btnDisabled={!progress.done}
                            btnLabel="Trade Again">
          {
            progress.kind === ProgressKind.noProxyNoAllowancePayWithERC20 &&
            <>
              <CurrentPrice price={price} quotation={quotation}/>
              <div className={classnames(styles.details, styles.transaction)}>
                <TxStatusRow icon={<SvgImage image={accountSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="create-proxy"
                                 theme="reversed"
                                 label="Create Account"
                                 info="Something about Proxy"
                               />}
                             status={<ProgressReport status={progress.proxyTxStatus || '' as TxStatus}/>}/>
              </div>
              <div className={classnames(styles.details, styles.transaction)}>
                <TxStatusRow icon={<SvgImage image={doneSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="set-token-allowance"
                                 theme="reversed"
                                 label={`Unlock ${sellToken.toUpperCase()}`}
                                 info="Something about allowances"
                               />}
                             status={<ProgressReport status={progress.allowanceTxStatus || '' as TxStatus}/>}/>
              </div>
              <div className={classnames(styles.details, styles.transaction)}>
                <TxStatusRow icon={<SvgImage image={ethCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="pay-token"
                                 theme="reversed"
                                 label="Sell"
                                 value={
                                   <Money formatter={formatPrice} value={sellAmount || new BigNumber(0)}
                                          token={sellToken}/>
                                 }
                               />}/>
                <TxStatusRow icon={<SvgImage image={daiCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="buy-token"
                                 theme="reversed"
                                 label="Buy"
                                 value={
                                   <Approximate>
                                     <Money formatter={formatPrice} value={buyAmount || new BigNumber(0)}
                                            token={buyToken}/>
                                   </Approximate>
                                 }
                               />}/>
              </div>
            </>
          }
          {
            progress.kind === ProgressKind.proxyNoAllowancePayWithERC20 &&
            <>
              <CurrentPrice price={price} quotation={quotation}/>
              <div className={classnames(styles.details, styles.transaction)}>
                <TxStatusRow icon={<SvgImage image={doneSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="set-token-allowance"
                                 theme="reversed"
                                 label={`Unlock ${sellToken.toUpperCase()}`}
                                 info="Something about allowances"
                               />}
                             status={<ProgressReport status={progress.allowanceTxStatus || '' as TxStatus}/>}/>
              </div>
              <div className={classnames(styles.details, styles.transaction)}>
                <TxStatusRow icon={<SvgImage image={ethCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="pay-token"
                                 theme="reversed"
                                 label="Sell"
                                 value={
                                   <Money formatter={formatPrice} value={sellAmount || new BigNumber(0)}
                                          token={sellToken}/>
                                 }
                               />}
                             status={<ProgressReport status={progress.tradeTxStatus || 'unknown' as TxStatus}/>}/>
                <TxStatusRow icon={<SvgImage image={daiCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="buy-token"
                                 theme="reversed"
                                 label="Buy"
                                 value={
                                   <Approximate>
                                     <Money formatter={formatPrice} value={buyAmount || new BigNumber(0)}
                                            token={buyToken}/>
                                   </Approximate>
                                 }
                               />}/>
              </div>
            </>
          }
          {
            progress.kind === ProgressKind.proxyAllowancePayWithERC20 &&
            <>
              <div className={classnames(styles.details, styles.finalization)}>
                <span>Current Estimated Price</span>
                <span style={{ marginLeft: '12px', color: '#828287' }}>
                  <Approximate>
                    {formatAmount(price || new BigNumber(0), 'USD')}
                    <span style={{ fontWeight: 'bold' }}>{sellToken}/{buyToken}</span>
                  </Approximate>
                </span>
              </div>
              <div className={classnames(styles.details, styles.transaction)}>
                <TxStatusRow icon={<SvgImage image={ethCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="pay-token"
                                 theme="reversed"
                                 label="Sell"
                                 value={
                                   <Money formatter={formatPrice} value={sellAmount || new BigNumber(0)}
                                          token={sellToken}/>
                                 }
                               />}
                             status={<ProgressReport status={progress.tradeTxStatus || 'unknown' as TxStatus}/>}/>
                <TxStatusRow icon={<SvgImage image={daiCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="buy-token"
                                 theme="reversed"
                                 label="Buy"
                                 value={
                                   <Approximate>
                                     <Money formatter={formatPrice} value={buyAmount || new BigNumber(0)}
                                            token={buyToken}/>
                                   </Approximate>
                                 }
                               />}/>
              </div>
            </>
          }
          {
            progress.kind === ProgressKind.noProxyPayWithETH &&
            <>
              <CurrentPrice price={price} quotation={quotation}/>
              <div className={classnames(styles.details, styles.transaction)}>
                <TxStatusRow icon={<SvgImage image={accountSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="create-proxy"
                                 theme="reversed"
                                 label="Create Account"
                                 info="Something about Proxy"
                               />}
                             status={<ProgressReport status={progress.tradeTxStatus || 'unknown' as TxStatus}/>}/>
                <TxStatusRow icon={<SvgImage image={ethCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="pay-token"
                                 theme="reversed"
                                 label="Sell"
                                 value={
                                   <Money formatter={formatPrice} value={sellAmount || new BigNumber(0)}
                                          token={sellToken}/>
                                 }
                               />}
                />
                <TxStatusRow icon={<SvgImage image={daiCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="buy-token"
                                 theme="reversed"
                                 label="Buy"
                                 value={
                                   <Approximate>
                                     <Money formatter={formatPrice} value={buyAmount || new BigNumber(0)}
                                            token={buyToken}/>
                                   </Approximate>
                                 }
                               />}
                />
              </div>
            </>
          }
          {
            progress.kind === ProgressKind.proxyPayWithETH &&
            <>
              <CurrentPrice price={price} quotation={quotation}/>
              <div className={classnames(styles.details, styles.transaction)}>
                <TxStatusRow icon={<SvgImage image={ethCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="pay-token"
                                 theme="reversed"
                                 label="Sell"
                                 value={
                                   <Money formatter={formatPrice} value={sellAmount || new BigNumber(0)}
                                          token={sellToken}/>
                                 }
                               />}
                             status={<ProgressReport status={progress.tradeTxStatus || 'unknown' as TxStatus}/>}/>
                <TxStatusRow icon={<SvgImage image={daiCircleSvg}/>}
                             label={
                               <TradeData
                                 data-test-id="buy-token"
                                 theme="reversed"
                                 label="Buy"
                                 value={
                                   <Approximate>
                                     <Money formatter={formatPrice} value={buyAmount || new BigNumber(0)}
                                            token={buyToken}/>
                                   </Approximate>
                                 }
                               />}/>
              </div>
            </>
          }

        </InstantFormWrapper>
      );
    }

    return (
      <InstantFormWrapper heading="Enter Order Details"
                          btnLabel="Start Transaction"
                          btnAction={this.startTx}
                          btnDisabled={!this.props.readyToProceed}
                          btnDataTestId="initiate-trade"
      >
        <TopRightCorner>
          <SvgImage className={styles.settingsIcon} image={cogWheelSvg}/>
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
  }

  private resetForm = () => {
    this.props.change({
      kind: InstantFormChangeKind.formResetChange
    });
  }

  private showAssets = () => {
    this.setState({ areAssetsOpen: true });
  }

  private hideAssets = () => {
    this.setState({ areAssetsOpen: false });
  }

  private selectAsset = (asset: string, side: OfferType) => {
    let buyToken = this.props.buyToken;
    let sellToken = this.props.sellToken;
    if (side === OfferType.sell) {
      sellToken = asset;
    }

    if (side === OfferType.buy) {
      buyToken = asset;
    }

    if (side === OfferType.buy && asset === sellToken ||
      side === OfferType.sell && asset === buyToken) {

      buyToken = this.props.sellToken;
      sellToken = this.props.buyToken;
    }

    this.props.change({
      buyToken,
      sellToken,
      kind: InstantFormChangeKind.pairChange,
    });

    this.hideAssets();
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
