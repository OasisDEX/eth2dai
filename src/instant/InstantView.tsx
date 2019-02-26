import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';
import { theAppContext } from '../AppContext';
import { BigNumberInput } from '../utils/bigNumberInput/BigNumberInput';
import { formatPrice } from '../utils/formatters/format';
import { Button } from '../utils/forms/Buttons';
import { SettingsIcon, SwapArrows } from '../utils/icons/Icons';
import * as panelStyling from '../utils/panel/Panel.scss';
import { TopRightCorner } from '../utils/panel/TopRightCorner';
import { Asset } from './asset/Asset';
import { FormChangeKind, InstantFormState, ManualChange, Message, MessageKind } from './instant';
import * as styles from './Instant.scss';

class TradingSide extends React.Component<any> {
  public render() {
    return (
      <div className={styles.assetPicker}>
        <Asset currency={this.props.asset} balance={this.props.balance}/>
        <BigNumberInput
          type="text"
          className={styles.input}
          mask={createNumberMask({
            allowDecimal: true,
            decimalLimit: 5,
            prefix: ''
          })}
          onChange={this.props.onAmountChange}
          value={
            (this.props.amount || null) &&
            formatPrice(this.props.amount as BigNumber, this.props.asset)
          }
          guide={true}
          placeholder={this.props.inputPlaceholder}
        />
      </div>
    );
  }
}

const Selling = (props: any) => (<TradingSide inputPlaceholder="Deposit Amount" {...props}/>);
const Buying = (props: any) => (<TradingSide inputPlaceholder="Receive Amount" {...props}/>);

const error = (msg: Message) => {
  switch (msg.kind) {
    case MessageKind.insufficientAmount:
      return <>Balance too low</>;
    case MessageKind.dustAmount:
      return <>Amount too low</>;
    case MessageKind.incredibleAmount:
      return <>Amount too big</>;
    case MessageKind.orderbookTotalExceeded:
      return <>Not enough orders </>;
    default:
      return <></>;
  }
};

export class InstantView extends React.Component<InstantFormState> {

  public render() {
    const { sellToken, sellAmount, buyToken, buyAmount, balances, messages } = this.props;
    return (
      <section className={classnames(styles.panel, panelStyling.panel)}>
        <header className={styles.header}>
          <h1>Enter Order Details</h1>
          <TopRightCorner>
            <SettingsIcon/>
          </TopRightCorner>
        </header>

        <div className={styles.details}>
          <h1> placeholder </h1>
        </div>

        <div className={styles.assets}>
          <Selling asset={sellToken}
                   amount={sellAmount}
                   onAmountChange={this.updateSellingAmount}
                   balance={balances ? balances[sellToken] : undefined}/>
          <div className={styles.swapIcon} onClick={this.swap}><SwapArrows/></div>
          <Buying asset={buyToken}
                  amount={buyAmount}
                  onAmountChange={this.updateBuyingAmount}
                  balance={balances ? balances[buyToken] : undefined}/>
        </div>

        <div className={classnames(styles.errors, messages.length ? '' : 'hide-all')}>
          {error(messages[0] || {})}
        </div>

        <footer className={styles.footer}>
          <Button size="lg" color="greyWhite" onClick={this.startTx} style={{ width: '100%' }}>
            Start Transaction
          </Button>
        </footer>
      </section>
    );
  }

  private swap = () => {
    this.props.change({
      kind: FormChangeKind.pairChange,
      buyToken: this.props.sellToken,
      sellToken: this.props.buyToken,
    });
  }

  private updateSellingAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    this.props.change({
      kind: FormChangeKind.sellAmountFieldChange,
      value: value === '' ? undefined : new BigNumber(value)
    } as ManualChange);
  }

  private updateBuyingAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    this.props.change({
      kind: FormChangeKind.buyAmountFieldChange,
      value: value === '' ? undefined : new BigNumber(value)
    } as ManualChange);
  }

  private startTx = () => {
    return false;
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
