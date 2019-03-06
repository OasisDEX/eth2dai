import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';
import { theAppContext } from '../AppContext';
import { BigNumberInput } from '../utils/bigNumberInput/BigNumberInput';
import { formatAmount, formatPrice } from '../utils/formatters/format';
import { FormatPercent, Money } from '../utils/formatters/Formatters';
import { Button } from '../utils/forms/Buttons';
import { ProgressIcon, SettingsIcon, SwapArrows } from '../utils/icons/Icons';
import * as panelStyling from '../utils/panel/Panel.scss';
import { TopRightCorner } from '../utils/panel/TopRightCorner';
import { Asset } from './asset/Asset';
import { TradeData } from './details/TradeData';
import { InstantFormChangeKind, InstantFormState, ManualChange, Message, MessageKind } from './instant';
import * as styles from './Instant.scss';

interface TradingSideProps {
  placeholder: string;
  dataTestId: string;
  asset: string;
  amount: BigNumber;
  balance: BigNumber;
  onAmountChange: () => void;
}

const Approximate = (props: any) => (
  <>
    ~&nbsp; {props.children}
  </>
);

class TradingSide extends React.Component<TradingSideProps> {
  public render() {
    const { amount, asset, balance, placeholder, onAmountChange, ...theRest } = this.props;
    return (
      <div className={styles.assetPicker} {...theRest}>
        <Asset currency={asset} balance={balance}/>
        {/* TODO: Make it parameterized like the tokens in offerMakeForm.*/}
        <BigNumberInput
          data-test-id={'amount'}
          type="text"
          className={styles.input}
          mask={createNumberMask({
            allowDecimal: true,
            decimalLimit: 5,
            prefix: ''
          })}
          onChange={onAmountChange}
          value={
            (amount || null) &&
            formatPrice(amount, asset)
          }
          guide={true}
          placeholder={placeholder}
        />
      </div>
    );
  }
}

const Selling = (props: any) => (
  <TradingSide data-test-id="selling-token" placeholder="Deposit Amount" {...props}/>
);
const Buying = (props: any) => (
  <TradingSide data-test-id="buying-token" placeholder="Receive Amount" {...props}/>
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
      gasEstimationUsd } = this.props;

    if (this.props.progress) {
      return <section className={classnames(styles.panel, panelStyling.panel)}>
        <header className={styles.header}>
          <h1>Transaction in progress</h1>
        </header>
        <pre>
          {JSON.stringify(this.props.progress, null, 2)}
        </pre>
        {this.props.progress && this.props.progress.done &&
          <div>
              <Button
                  size="lg"
                  color="greyWhite"
                  onClick={this.resetForm}
              >
                  Close
              </Button>
          </div>
        }
      </section>;
    }

    return (
      <section className={classnames(styles.panel, panelStyling.panel)}>
        <header className={styles.header}>
          <h1>Enter Order Details</h1>
          <TopRightCorner>
            <SettingsIcon/>
          </TopRightCorner>
        </header>

        <div className={classnames(styles.details, price ? '' : styles.hidden)}>
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

        <div data-test-id="error" className={classnames(styles.errors, message ? '' : 'hide-all')}>
          {error(message)}
        </div>

        <footer className={styles.footer}>
          <Button
            size="lg"
            color="greyWhite"
            onClick={this.startTx}
            style={{ width: '100%' }}
            disabled={!this.props.readyToProceed}
          >
            Start Transaction
          </Button>
        </footer>
      </section>
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
