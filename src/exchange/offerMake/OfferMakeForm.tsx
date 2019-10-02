import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';

import { tokens } from '../../blockchain/config';
import { routerContext } from '../../Main';
import { BigNumberInput } from '../../utils/bigNumberInput/BigNumberInput';
import { FormChangeKind, OfferMatchType } from '../../utils/form';
import { formatAmount, formatPrice } from '../../utils/formatters/format';
import { FormatAmount, FormatPercent } from '../../utils/formatters/Formatters';
import { Button, ButtonGroup } from '../../utils/forms/Buttons';
import { ErrorMessage } from '../../utils/forms/ErrorMessage';
import { InputGroup, InputGroupAddon } from '../../utils/forms/InputGroup';
import { Radio } from '../../utils/forms/Radio';
import { GasCost } from '../../utils/gasCost/GasCost';
import { Hr } from '../../utils/layout/LayoutHelpers';
import { PanelBody, PanelFooter, PanelHeader } from '../../utils/panel/Panel';
import { Currency, Muted } from '../../utils/text/Text';
import { OfferType } from '../orderbook/orderbook';
import {
  ManualChange,
  Message,
  MessageKind,
  OfferFormState,
  OfferMakeChangeKind,
  PickerOpenChange,
  SlippageLimitChange,
} from './offerMake';
import * as styles from './OfferMakeForm.scss';

export class OfferMakeForm extends React.Component<OfferFormState> {

  public orderTypes: {[key in OfferMatchType]: string} = {
    limitOrder: 'Limit order type',
    direct: 'Average price fill or kill order type',
  };

  private amountInput?: HTMLElement;
  private priceInput?: HTMLElement;

  public handleKindChange(kind: OfferType) {
    this.props.change({
      kind: FormChangeKind.kindChange,
      newKind: kind,
    });
  }

  public handleOpenPicker = () => {
    this.props.change({
      kind: OfferMakeChangeKind.pickerOpenChange,
    } as PickerOpenChange);
  }

  public handleOrderTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.props.change({
      kind: FormChangeKind.matchTypeChange,
      matchType: e.target.value
    } as ManualChange);
  }

  public handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    this.props.change({
      kind: FormChangeKind.priceFieldChange,
      value: value === '' ? null : new BigNumber(value)
    } as ManualChange);
  }

  public handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    this.props.change({
      kind: FormChangeKind.amountFieldChange,
      value: value === '' ? undefined : new BigNumber(value)
    } as ManualChange);
  }

  public handleSlippageLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    this.props.change({
      kind: OfferMakeChangeKind.slippageLimitChange,
      value: value === '' ? undefined : new BigNumber(value)
    } as SlippageLimitChange);
  }

  public handleSetMax = () => {
    this.props.change({
      kind: FormChangeKind.setMaxChange,
    });
  }

  public handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.props.submit(this.props);
  }

  public handleAmountFocus = () => {
    if (this.amountInput) {
      this.amountInput.focus();
    }
  }

  public handlePriceFocus = () => {
    if (this.priceInput) {
      this.priceInput.focus();
    }
  }

  public render() {
    return this.props.pickerOpen ?
      this.orderTypePicker() :
      this.formProper();
  }

  private slippageLimit() {
    return (
      <React.Fragment>
        { this.slippageLimitGroup() }
        <Error field="slippageLimit" messages={this.props.messages} />
      </React.Fragment>
    );
  }

  private orderTypePicker() {
    return <div className={styles.picker}>
      <PanelHeader bordered={true}>
        Choose order type
      </PanelHeader>

      <PanelBody paddingVertical={true} className={styles.pickerBody}>
        <form>
          <div>
            <div className={styles.pickerOrderType}>
              <Radio
                dataTestId="limitOrder"
                name="orderType"
                value="limitOrder"
                checked={this.props.matchType === OfferMatchType.limitOrder}
                onChange={this.handleOrderTypeChange}
              >
                  { this.orderTypes.limitOrder }
              </Radio>
              <Muted className={styles.pickerDescription}>
                The order is allowed to rest on the book and can
                be filled only at the specified price or better
              </Muted>
            </div>
            <Hr />
            <div className={styles.pickerOrderType}>
              <Radio
                dataTestId="fillOrKill"
                name="orderType"
                value="direct"
                checked={this.props.matchType === OfferMatchType.direct}
                onChange={this.handleOrderTypeChange}
              >
                  { this.orderTypes.direct }
              </Radio>
              <Muted className={styles.pickerDescription}>
                The order is executed in its entirety such that the average fill price is
                the limit price or better, otherwise it is canceled
              </Muted>
              { this.slippageLimit() }
            </div>
          </div>
        </form>
      </PanelBody>
      <PanelFooter>
        { this.pickerDone() }
      </PanelFooter>
    </div>;
  }

  private formProper() {
    return <div data-test-id="create-order-widget">
      <PanelHeader bordered={true}>
        Create order
        { this.headerButtons() }
      </PanelHeader>

      <PanelBody paddingVertical={true}>
        <form onSubmit={this.handleSubmit}>
          { this.orderType() }
          { this.balanceButtons() }

          {
            this.props.matchType !== OfferMatchType.direct &&
            this.price()
          }
          { this.props.matchType === OfferMatchType.direct &&
          this.directSummary()
          }

          { this.amount() }

          { this.gasCost() }
          { this.total() }

          { this.submitButton() }
        </form>
      </PanelBody>
    </div>;
  }

  private headerButtons() {
    const disabled = this.props.stage === 'waitingForApproval';
    return (
      <ButtonGroup className={styles.btnGroup}>
        <Button
          data-test-id="new-buy-order"
          className={styles.btn}
          onClick={() => this.handleKindChange(OfferType.buy)}
          color={ this.props.kind === OfferType.buy ? 'green' : 'grey' }
          disabled={disabled}
          size="sm"
        >Buy</Button>
        <Button
          data-test-id="new-sell-order"
          className={styles.btn}
          onClick={() => this.handleKindChange(OfferType.sell)}
          color={ this.props.kind === OfferType.sell ? 'red' : 'grey' }
          disabled={disabled}
          size="sm"
        >Sell</Button>
      </ButtonGroup>
    );
  }

  private balanceButtons() {
    if (!this.props.user || !this.props.user.account) {
      return (
        <div className={styles.noResourcesInfoBox}>
          <span>Connect to view Account</span>
        </div>
      );
    }

    const disabled = this.props.stage === 'waitingForApproval';
    const setMaxSellDisabled = this.props.kind === OfferType.buy || disabled;
    const setMaxBuyDisabled = this.props.kind === OfferType.sell ||
      this.props.matchType === OfferMatchType.direct ||
      !this.props.price ||
      disabled;

    return (
    <div className={styles.ownedResourcesInfoBox}>
      <Button
        type="button"
        onClick={this.handleSetMax}
        size="lg"
        block={true}
        disabled={setMaxSellDisabled}
        className={styles.balanceBtn}
      >
        { this.props.baseToken && tokens[this.props.baseToken].icon }
        <span style={{ lineHeight: 1 }} data-test-id="base-balance">
                { this.props.balances && this.props.balances[this.props.baseToken] &&
                formatAmount(this.props.balances[this.props.baseToken], this.props.baseToken)
                } <Currency value={this.props.baseToken} />
              </span>
      </Button>
      <Button
        type="button"
        onClick={this.handleSetMax}
        size="lg"
        block={true}
        disabled={setMaxBuyDisabled}
        className={styles.balanceBtn}
      >
        { this.props.quoteToken && tokens[this.props.quoteToken].icon }
        <span style={{ lineHeight: 1 }} data-test-id="quote-balance">
                { this.props.balances && this.props.balances[this.props.quoteToken] &&
                formatAmount(this.props.balances[this.props.quoteToken], this.props.quoteToken)
                } <Currency value={this.props.quoteToken} />
              </span>
      </Button>
    </div>
    );
  }

  private orderType() {
    const disabled = this.props.stage === 'waitingForApproval';
    return (
      <div className={styles.summary} style={{ marginBottom: '16px' }}>
        <Button
          block={true}
          size="lg"
          data-test-id="select-order-type"
          type="button"
          onClick={this.handleOpenPicker}
          disabled={disabled}
        >
          {this.orderTypes[this.props.matchType]}
        </Button>
      </div>
    );
  }

  private amount() {
    return (
      <div>
        { this.amountGroup() }
        <Error field="amount" messages={this.props.messages} />
      </div>
    );
  }

  private price() {
    return (
      <React.Fragment>
        <Hr color="dark" className={styles.hrMargin}/>
        { this.priceGroup() }
        <Error field="price" messages={this.props.messages} />
      </React.Fragment>
    );
  }

  private gasCost() {
    return (
      <React.Fragment>
        <div className={styles.summary}>
          <span><Muted>Gas cost</Muted></span>
          <GasCost gasEstimationStatus={this.props.gasEstimationStatus}
                   gasEstimationUsd={this.props.gasEstimationUsd}
                   gasEstimationEth={this.props.gasEstimationEth}
          />
        </div>
        <Error field="gas" messages={this.props.messages} />
      </React.Fragment>
    );
  }

  private total() {
    return (
      <React.Fragment>
        <div data-test-id="type-total" className={styles.summary}>
          <span><Muted>Total</Muted></span>
          <span>
              <FormatAmount
                value={this.props.total || new BigNumber(0)} token={this.props.quoteToken}
              />
            &#x20;
            <Currency value={this.props.quoteToken}/>
          </span>
        </div>
        <Error field="total" messages={this.props.messages} />
      </React.Fragment>
    );
  }

  private submitButton() {
    return (
      <Button
        data-test-id="place-order"
        className={styles.confirmButton}
        type="submit"
        value="submit"
        color={this.props.kind === OfferType.buy ? 'green' : 'red' }
        disabled={this.props.stage !== 'readyToProceed'}
      >
        {this.props.kind} {this.props.baseToken}
      </Button>
    );
  }

  private pickerDone() {
    const disabledByDirectError = this.props.matchType === OfferMatchType.direct
      && (this.props.messages || [])
        .filter((message: Message) => message.field === 'slippageLimit')
        .length > 0;
    const disabled = disabledByDirectError || this.props.stage === 'waitingForApproval';
    return (
      <Button
        data-test-id="submit"
        className={styles.confirmButton}
        type="submit"
        value="submit"
        // color={this.props.kind === 'buy' ? 'green' : 'red' }
        disabled={disabled}
        onClick={this.handleOpenPicker}
      >
        Done
      </Button>
    );
  }

  private amountGroup() {
    return (
    <InputGroup hasError={ (this.props.messages || [])
                                    .filter((message: Message) => message.field === 'amount')
                                    .length > 0}>
      <InputGroupAddon className={styles.inputHeader}>Amount</InputGroupAddon>
      <div className={styles.inputTail}>
        <BigNumberInput
          data-test-id="type-amount"
          ref={(el: any) =>
            this.amountInput = (el && ReactDOM.findDOMNode(el) as HTMLElement) || undefined
          }
          type="text"
          mask={createNumberMask({
            allowDecimal: true,
            decimalLimit: this.props.baseTokenDigits,
            prefix: ''
          })}
          onChange={this.handleAmountChange}
          value={
            (this.props.amount || null) &&
            formatAmount(this.props.amount as BigNumber, this.props.baseToken)
          }
          guide={true}
          placeholder={'0'}
          className={styles.input}
          disabled={this.props.stage === 'waitingForApproval'}
        />
        <InputGroupAddon className={styles.inputCurrencyAddon} onClick={this.handleAmountFocus}>
          {this.props.baseToken}
        </InputGroupAddon>
      </div>
    </InputGroup>
    );
  }

  private priceGroup() {
    return (
      <InputGroup hasError={ (this.props.messages || [])
          .filter((message: Message) => message.field === 'price')
          .length > 0}>
        <InputGroupAddon className={styles.inputHeader}>Price</InputGroupAddon>
        <div className={styles.inputTail}>
          <BigNumberInput
            data-test-id="type-price"
            ref={(el: any) =>
              this.priceInput = (el && ReactDOM.findDOMNode(el) as HTMLElement) || undefined
            }
            type="text"
            mask={createNumberMask({
              allowDecimal: true,
              decimalLimit: this.props.quoteTokenDigits,
              prefix: ''
            })}
            onChange={this.handlePriceChange}
            value={
              (this.props.price || null) &&
              formatPrice(this.props.price as BigNumber, this.props.quoteToken)
            }
            guide={true}
            placeholder={'0'}
            className={styles.input}
            disabled={this.props.stage === 'waitingForApproval'}
          />
          <InputGroupAddon className={styles.inputCurrencyAddon} onClick={this.handlePriceFocus}>
            {this.props.quoteToken}
          </InputGroupAddon>
        </div>
      </InputGroup>
    );
  }

  private slippageLimitGroup() {
    const enabled = this.props.matchType === OfferMatchType.direct &&
      this.props.stage !== 'waitingForApproval';
    return (
      <InputGroup
        sizer="md"
        hasError={ (this.props.messages || [])
          .filter((message: Message) => message.field === 'slippageLimit')
          .length > 0}
        disabled={!enabled}
      >
        <InputGroupAddon className={styles.inputHeader}>
          Slippage limit
        </InputGroupAddon>
        <div className={styles.inputTail}>
          <BigNumberInput
            data-test-id="type-price"
            type="text"
            mask={createNumberMask({
              allowDecimal: true,
              decimalLimit: 5,
              prefix: ''
            })}
            onChange={this.handleSlippageLimitChange}
            value={
              (this.props.slippageLimit || null) &&
              formatPrice(this.props.slippageLimit as BigNumber, this.props.quoteToken)
            }
            guide={true}
            placeholder={'0'}
            className={styles.input}
            disabled={!enabled}
          />
          <InputGroupAddon className={styles.inputPercentAddon}>
            %
          </InputGroupAddon>
        </div>
      </InputGroup>
    );
  }

  private directSummary() {
    return (
      <div className={styles.directSummary}>

        <div className={styles.directSummaryLeft}>
          <Muted>Price {this.props.baseToken} / {this.props.quoteToken}</Muted>
          <div>
            <FormatAmount value={this.props.price as BigNumber}
                          token={this.props.quoteToken}
                          fallback="-"
            />
          </div>
        </div>

        <div className={styles.directSummaryRight}>
          <div className={styles.directSummaryHorizontal}>
            <Muted>Price Impact</Muted>
            <div><FormatPercent value={this.props.priceImpact} fallback="-"/></div>
          </div>

          <div className={styles.directSummaryHorizontal}>
            <Muted>Slippage limit</Muted>
            <div><FormatPercent value={this.props.slippageLimit} fallback="-"/></div>
          </div>
        </div>

      </div>
    );
  }
}

const Error = ({ field, messages } : { field: string, messages?: Message[] }) => {
  const myMsg = (messages || [])
    .filter((message: Message) => message.field === field)
    .sort((m1, m2) => m2.priority - m1.priority)
    .map(msg => messageContent(msg));
  return (
    <ErrorMessage messages={myMsg} />
  );
};

function messageContent(msg: Message) {
  switch (msg.kind) {
    case MessageKind.noAllowance:
      return <span>
        {`Unlock ${msg.token} for Trading in the `}
        <routerContext.Consumer>
        { ({ rootUrl }) =>
          <Link to={`${rootUrl}account`} style={{ whiteSpace: 'nowrap' }}>Account Page</Link>
        }
        </routerContext.Consumer>
      </span>;
    case MessageKind.insufficientAmount:
      return  <>
        {`Your ${msg.token} balance is too low to fund this order`}
      </>;
    case MessageKind.dustAmount:
      return <>
        {`Order below ${msg.amount} ${msg.token} limit`}
      </>;
    case MessageKind.incredibleAmount:
      return <>
        {`Your order exceeds max amount for ${msg.token} token`}
      </>;
    case MessageKind.orderbookTotalExceeded:
      return <>
        {`Your order exceeds the order book total`}
      </>;
    case MessageKind.notConnected:
      return <>
        {`Connect to create Orders`}
      </>;
    case MessageKind.slippageLimitToLow:
      return <>
        Slippage limit too low
      </>;
    case MessageKind.slippageLimitToHigh:
      return <>
        Slippage limit too high
      </>;
    case MessageKind.slippageLimitNotSet:
      return <>
        Slippage limit is necessary
      </>;
  }
}
