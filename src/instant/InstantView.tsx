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
import { FormChangeKind, FormStage, InstantFormState, ManualChange, Message, MessageKind } from './instant';
import * as styles from './Instant.scss';

interface TradingSideProps {
  placeholder: string;
  dataTestId: string;
  asset: string;
  amount: BigNumber;
  balance: BigNumber;
  onAmountChange: () => void;
}

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
            formatPrice(amount as BigNumber, asset)
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
      return <>Balance too low</>;
    case MessageKind.dustAmount:
      return <>Amount too low</>;
    case MessageKind.incredibleAmount:
      return <>Amount too big</>;
    case MessageKind.orderbookTotalExceeded:
      return <>Not enough orders </>;
    default:
      return <>Don't know how to show message: {msg.kind}</>;
  }
}

export class InstantView extends React.Component<InstantFormState> {

  public render() {
    const { sellToken, sellAmount, buyToken, buyAmount, balances, tradeEvaluationError } = this.props;
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
          <div data-test-id="swap" className={styles.swapIcon} onClick={this.swap}><SwapArrows/></div>
          <Buying asset={buyToken}
                  amount={buyAmount}
                  onAmountChange={this.updateBuyingAmount}
                  balance={balances ? balances[buyToken] : undefined}/>
        </div>

        <div data-test-id="error" className={classnames(styles.errors, tradeEvaluationError ? '' : 'hide-all')}>
          {error(tradeEvaluationError)}
        </div>

        <footer className={styles.footer}>
          <Button
            size="lg"
            color="greyWhite"
            onClick={this.startTx}
            style={{ width: '100%' }}
            disabled={this.props.stage !== FormStage.readyToProceed}
          >
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
