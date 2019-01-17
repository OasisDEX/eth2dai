import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';

import * as ReactDOM from 'react-dom';
import { tokens } from '../../blockchain/config';
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
  OfferFormState, OfferMakeChangeKind, PickerOpenChange, SlippageLimitChange,
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
        Choose ordertype
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
    return <div>
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
    return (
      <ButtonGroup className={styles.btnGroup}>
        <Button
          data-test-id="new-buy-order"
          className={styles.btn}
          onClick={() => this.handleKindChange(OfferType.buy)}
          color={ this.props.kind === 'buy' ? 'green' : 'grey' }
        >Buy</Button>
        <Button
          data-test-id="new-sell-order"
          className={styles.btn}
          onClick={() => this.handleKindChange(OfferType.sell)}
          color={ this.props.kind === 'sell' ? 'red' : 'grey' }
        >Sell</Button>
      </ButtonGroup>
    );
  }

  private balanceButtons() {
    return (
    <div className={styles.ownedResourcesInfoBox}>
      <Button
        type="button"
        onClick={this.handleSetMax}
        size="lg"
        block={true}
        disabled={this.props.kind === 'buy'}
        className={styles.balanceBtn}
      >
        { this.props.baseToken && <BalanceIcon token={this.props.baseToken} />}
        <span style={{ lineHeight: 1 }}>
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
        disabled={this.props.kind === 'sell' || this.props.matchType === OfferMatchType.direct}
        className={styles.balanceBtn}
      >
        { this.props.quoteToken && <BalanceIcon token={this.props.quoteToken} />}
        <span style={{ lineHeight: 1 }}>
                { this.props.balances && this.props.balances[this.props.quoteToken] &&
                formatAmount(this.props.balances[this.props.quoteToken], this.props.quoteToken)
                } <Currency value={this.props.quoteToken} />
              </span>
      </Button>
    </div>
    );
  }

  private orderType() {
    return (
      <div className={styles.summary} style={{ marginBottom: '16px' }}>
        <Button
          block={true}
          size="lg"
          data-test-id="select-order-type"
          type="button"
          onClick={this.handleOpenPicker}
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
        <div className={styles.summary}>
          <span><Muted>Total</Muted></span>
          <span>
              {this.props.total && <FormatAmount
                value={this.props.total} token={this.props.quoteToken}
              />}
            &#x20;
            {this.props.quoteToken}
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
        color={this.props.kind === 'buy' ? 'green' : 'red' }
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
      <InputGroupAddon border="right" className={styles.inputHeader}>Amount</InputGroupAddon>
      <BigNumberInput
        data-test-id="type-amount"
        ref={ (el: any) =>
          this.amountInput = (el && ReactDOM.findDOMNode(el) as HTMLElement) || undefined
        }
        type="text"
        mask={createNumberMask({
          allowDecimal: true,
          decimalLimit: 5,
          prefix: ''
        })}
        onChange={this.handleAmountChange}
        value={
          (this.props.amount || null) &&
          formatAmount(this.props.amount as BigNumber, this.props.baseToken)
        }
        guide={true}
        placeholderChar={' '}
        className={styles.input}
        disabled={this.props.stage === 'waitingForApproval'}
      />
      <InputGroupAddon className={styles.inputCurrencyAddon} onClick={ this.handleAmountFocus }>
        {this.props.baseToken}
      </InputGroupAddon>

    </InputGroup>
    );
  }

  private priceGroup() {
    return (
      <InputGroup hasError={ (this.props.messages || [])
          .filter((message: Message) => message.field === 'price')
          .length > 0}>
      <InputGroupAddon border="right" className={styles.inputHeader}>Price</InputGroupAddon>
      <BigNumberInput
          data-test-id="type-price"
          ref={ (el: any) =>
            this.priceInput = (el && ReactDOM.findDOMNode(el) as HTMLElement) || undefined
          }
          type="text"
          mask={createNumberMask({
            allowDecimal: true,
            decimalLimit: 5,
            prefix: ''
          })}
          onChange={this.handlePriceChange}
        value={
          (this.props.price || null) &&
          formatPrice(this.props.price as BigNumber, this.props.quoteToken)
        }
        guide={true}
        placeholderChar={' '}
        className={styles.input}
        disabled={this.props.stage === 'waitingForApproval'}
        />
      <InputGroupAddon className={styles.inputCurrencyAddon} onClick={ this.handlePriceFocus }>
        {this.props.quoteToken}
        </InputGroupAddon>

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
        <InputGroupAddon border="right" className={styles.inputHeader}>
          Slippage limit
        </InputGroupAddon>
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
          placeholderChar={' '}
          className={styles.input}
          disabled={!enabled}
        />
        <InputGroupAddon className={styles.inputPercentAddon}>
          %
        </InputGroupAddon>
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
      return `Trading of ${msg.token} tokens has not been enabled`;
    case MessageKind.insufficientAmount:
      return  `Your ${msg.token} balance is too low to fund this order`;
    case MessageKind.dustAmount:
      return `Order below ${msg.amount} ${msg.token} limit`;
    case MessageKind.incredibleAmount:
      return `Your order exceeds max amount for ${msg.token} token`;
    case MessageKind.slippageLimitToLow:
      return `Slippage limit to low`;
    case MessageKind.slippageLimitToHigh:
      return `Slippage limit to high`;
    case MessageKind.slippageLimitNotSet:
      return `Slippage limit is necessary`;
  }
}

const BalanceIcon = ({ token }: { token: string }) => {
  const Icon = tokens[token].icon;
  return (<Icon />);
};
