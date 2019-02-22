import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactModal from 'react-modal';

import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';
import { BigNumberInput } from '../utils/bigNumberInput/BigNumberInput';
import { AmountFieldChange, FormChangeKind } from '../utils/form';
import { formatAmount } from '../utils/formatters/format';
import { Money } from '../utils/formatters/Formatters';
import { Button } from '../utils/forms/Buttons';
import { ErrorMessage } from '../utils/forms/ErrorMessage';
import { InputGroup, InputGroupAddon } from '../utils/forms/InputGroup';
import { GasCost } from '../utils/gasCost/GasCost';
import { InfoIcon } from '../utils/icons/Icons';
import { BorderBox, Hr } from '../utils/layout/LayoutHelpers';
import { Loadable } from '../utils/loadable';
import { WithLoadingIndicator } from '../utils/loadingIndicator/LoadingIndicator';
import { ModalProps } from '../utils/modal';
import { Panel, PanelBody, PanelFooter, PanelHeader } from '../utils/panel/Panel';
import { Muted } from '../utils/text/Text';
import { TransactionStateDescription } from '../utils/text/TransactionStateDescription';
import { Message, MessageKind, WrapUnwrapFormKind, WrapUnwrapFormState } from './wrapUnwrapForm';
import * as styles from './WrapUnwrapFormView.scss';

type WrapUnwrapFormProps =
  { kind: WrapUnwrapFormKind } &
  Loadable<WrapUnwrapFormState> &
  ModalProps;

export class WrapUnwrapFormView
  extends React.Component<WrapUnwrapFormProps> {

  private amountInput?: HTMLElement;

  public render() {
    return <ReactModal
      ariaHideApp={false}
      isOpen={true}
      className={styles.modal}
      overlayClassName={styles.modalOverlay}
      closeTimeoutMS={250}
    >
      <Panel className={classnames(styles.panel, styles.modalChild)}
             onClick={event => event.stopPropagation()}>
        <PanelHeader bordered={true}>
          <div>{this.props.kind} ether</div>
        </PanelHeader>
        <WithLoadingIndicator loadable={this.props}>
        { state =>
          (<React.Fragment>
            <PanelBody className={styles.panelBody}>
              { this.summary(state) }
              <Hr color="light" className={styles.hrMargin}/>
              {this.formOrTransactionState(state)}
            </PanelBody>
            { this.footerWithButtons(state)}
          </React.Fragment>)
        }
        </WithLoadingIndicator>
      </Panel>
    </ReactModal>;
  }

  public handleAmountFocus = () => {
    if (this.amountInput) {
      this.amountInput.focus();
    }
  }

  public handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/,/g, '');
    this.props.value!.change({
      kind: FormChangeKind.amountFieldChange,
      value: value === '' ? null : new BigNumber(value)
    } as AmountFieldChange);
  }

  private summary(state: WrapUnwrapFormState) {
    return (
      <div className={styles.summary}>
        <div className={classnames(styles.infoRow, styles.infoRowMargin)}>
          <Muted>Wallet</Muted>
          <Money token="ETH" value={state.ethBalance} fallback="-" />
        </div>
        <div className={classnames(styles.infoRow, styles.infoRowMargin)}>
          <Muted>Wrapped</Muted>
          <Money token="WETH" value={state.wethBalance} fallback="-" />
        </div>
      </div>
    );
  }

  private formOrTransactionState(state: WrapUnwrapFormState) {
    return state.progress ? this.transactionState(state) : this.form(state);
  }

  private transactionState(state: WrapUnwrapFormState) {
    const amount = state.amount || new BigNumber(0);
    return (
      <BorderBox>
        <div className={styles.checklistLine} >
          <span className={styles.checklistTitle}>
            {state.kind === WrapUnwrapFormKind.wrap ? 'Wrap Ether' : 'Unwrap Ether'}
          </span>
          <div className={styles.checklistSummary}>
            <TransactionStateDescription progress={state.progress}/>
          </div>
        </div>
        <Hr color="dark" className={styles.checklistHrMargin} />
        <div className={styles.checklistLine} >
          <span className={styles.checklistTitle}>Amount</span>
          <Muted className={styles.checklistSummary}>
            <Money value={amount} token="ETH" />
          </Muted>
        </div>
        <Hr color="dark" className={styles.checklistHrMargin} />
        <div className={styles.checklistLine} >
          <span className={styles.checklistTitle}>Gas cost</span>
          <Muted className={styles.checklistSummary}>
            <GasCost gasEstimationStatus={state.gasEstimationStatus}
                     gasEstimationUsd={state.gasEstimationUsd}
                     gasEstimationEth={state.gasEstimationEth}
            />
          </Muted>
        </div>
      </BorderBox>
    );
  }

  private form(state: WrapUnwrapFormState) {
    return (
      <div>
        <div className={classnames(styles.warning, styles.infoRowMargin)}>
          <div className={styles.warningIcon}><InfoIcon /></div>
          <Muted className={styles.warningText}>{this.info(state.kind)}</Muted>
        </div>
        { this.amount(state) }
        <div className={classnames(styles.infoRow)}>
          <Muted>Gas cost</Muted>
          <GasCost {...state} />
        </div>
      </div>
    );
  }

  private info(kind: WrapUnwrapFormKind) {
    switch (kind) {
      case WrapUnwrapFormKind.wrap:
        return 'Wrapped Ether (WETH) is a tradeable version of regular Ether. ' +
          'Be sure to keep some Ether to pay for transactions';
      case WrapUnwrapFormKind.unwrap:
        return 'You can unwrap your Wrapped Ether (WETH) back to ETH anytime. ' +
          'Any WETH you convert back to ETH will no longer be usable on Eth2dai';
    }
  }

  private amount(state: WrapUnwrapFormState) {
    const errorMessages = (state.messages || []).map(this.messageContent);
    return (
      <div>
        <InputGroup hasError={ (state.messages || []).length > 0}>
          <InputGroupAddon className={styles.inputHeader}>
            Amount
          </InputGroupAddon>
          <div className={styles.inputTail}>
            <BigNumberInput
              data-test-id="type-amount"
              ref={(el: any) =>
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
                (state.amount || null) &&
                formatAmount(state.amount as BigNumber, 'ETH')
              }
              guide={true}
              placeholder={'0'}
              disabled={state.progress !== undefined}
            />
            <InputGroupAddon
              className={styles.inputCurrencyAddon}
              onClick={this.handleAmountFocus}
            >
              {this.props.kind === WrapUnwrapFormKind.wrap ? 'ETH' : 'WETH'}
            </InputGroupAddon>
          </div>
        </InputGroup>

        <ErrorMessage data-test-id="error-msg" messages={errorMessages} />

      </div>
    );
  }

  private messageContent(msg: Message) {
    switch (msg.kind) {
      case MessageKind.insufficientAmount:
        return `Your ${msg.token} balance is too low`;
      case MessageKind.dustAmount:
        return `Amount is too low`;
    }
  }

  private footerWithButtons(state: WrapUnwrapFormState) {
    return (
      <PanelFooter className={styles.buttons}>
        <Button
          onClick={this.props.close}
          size="lg"
        >
          Close
        </Button>
        <Button
          className={styles.btn}
          data-test-id="proceed"
          disabled={!state.readyToProceed || state.progress !== undefined}
          onClick={() => state.proceed(state)}
          size="lg"
          color="white"
        >
          Proceed
        </Button>
      </PanelFooter>
    );
  }
}
