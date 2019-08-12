import classnames from 'classnames';
import * as React from 'react';
import { tokens } from '../../blockchain/config';
import { TxStatus } from '../../blockchain/transactions';
import accountSvg from '../../icons/account.svg';
import doneSvg from '../../icons/done.svg';
import { Approximate } from '../../utils/Approximate';
import { formatAmountInstant } from '../../utils/formatters/format';
import { Money } from '../../utils/formatters/Formatters';
import { SvgImage } from '../../utils/icons/utils';
import { WarningTooltipType } from '../../utils/tooltip/Tooltip';
import { CurrentPrice } from '../CurrentPrice';
import { TradeData } from '../details/TradeData';
import { TxStatusRow } from '../details/TxStatusRow';
import * as styles from '../Instant.scss';
import {
  InstantFormChangeKind,
  InstantFormState,
  ProgressKind,
  ViewKind
} from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import { ProgressReport } from '../progress/ProgressReport';

// tslint:disable
const proxyTooltip = {
  id: 'proxy-tooltip',
  text: 'Proxy is a supporting contract owned by you that groups different actions as one Ethereum transaction.',
  iconColor: 'white'
} as WarningTooltipType;

const allowanceTooltip = {
  id: 'allowance-tooltip',
  text: 'Enabling token trading allows your Proxy to take tokens from you and trade them on the exchange.',
  iconColor: 'white'
} as WarningTooltipType;
// tslint:enable

export class FinalizationView extends React.Component<InstantFormState> {

  public render() {
    const {
      price,
      quotation,
      progress,
    } = this.props;

    return (
      <InstantFormWrapper heading="Finalize Trade"
                          btnAction={this.resetForm}
                          btnDisabled={!(progress && progress.done)}
                          btnLabel="Trade Again">
        <CurrentPrice price={price} quotation={quotation}/>
        <>
          {
            progress && progress.kind === ProgressKind.noProxyNoAllowancePayWithERC20
            && (
              <>
                {
                  this._proxyCreationTx()
                }
                {
                  this._tokenAllowanceTx()
                }
              </>
            )
          }
          {
            progress && progress.kind === ProgressKind.proxyNoAllowancePayWithERC20
            && this._tokenAllowanceTx()
          }
          {
            progress
            && this._tradeTx()
          }
        </>
      </InstantFormWrapper>
    );
  }

  private resetForm = () => {
    this.props.change({
      kind: InstantFormChangeKind.formResetChange
    });

    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.new
    });
  }

  private _tradeTx = () => {

    const { sellToken, buyToken, sellAmount, buyAmount, progress } = this.props;

    if (!progress) {
      return <div />;
    }

    return (
      <>
        <div className={classnames(styles.details, styles.transaction)}>
          {
            progress && progress.kind === ProgressKind.noProxyPayWithETH &&
            <TxStatusRow icon={<SvgImage image={accountSvg}/>}
                         label={
                           <TradeData
                             data-test-id="create-proxy"
                             theme="reversed"
                             label="Create Account"
                             tooltip={proxyTooltip}
                           />}
                         status={<ProgressReport report={this._tradeProgress()}/>}/>
          }
          <TxStatusRow icon={tokens[sellToken].iconColor}
                       label={
                         <TradeData
                           data-test-id="pay-token"
                           theme="reversed"
                           label="Sell"
                           value={
                             <Money formatter={formatAmountInstant} value={sellAmount}
                                    token={sellToken}/>
                           }
                         />}
                       status={progress.kind !== ProgressKind.noProxyPayWithETH &&
                       <ProgressReport report={this._tradeProgress()}/>}/>
          <TxStatusRow icon={tokens[buyToken].iconColor}
                       label={
                         <TradeData
                           data-test-id="buy-token"
                           theme="reversed"
                           label="Buy"
                           value={
                             <Approximate>
                               <Money formatter={formatAmountInstant} value={buyAmount}
                                      token={buyToken}/>
                             </Approximate>
                           }
                         />}/>
        </div>
      </>
    );
  }

  private _proxyCreationTx = () => {
    return (
      <div className={classnames(styles.details, styles.transaction)}>
        <TxStatusRow icon={<SvgImage image={accountSvg}/>}
                     label={
                       <TradeData
                         data-test-id="create-proxy"
                         theme="reversed"
                         label="Create Account"
                         tooltip={proxyTooltip}
                       />}
                     status={<ProgressReport report={this._proxyProgress()}/>}/>
      </div>
    );
  }

  private _tokenAllowanceTx = () => {
    const { sellToken } = this.props;
    return (
      <div className={classnames(styles.details, styles.transaction)}>
        <TxStatusRow icon={<SvgImage image={doneSvg}/>}
                     label={
                       <TradeData
                         data-test-id="set-token-allowance"
                         theme="reversed"
                         label={`Unlock ${sellToken.toUpperCase()}`}
                         tooltip={allowanceTooltip}
                       />}
                     status={<ProgressReport report={this._allowanceProgress()}/>}/>
      </div>
    );
  }

  private _tradeProgress = () => {
    const { tradeTxStatus: txStatus, tradeTxHash: txHash } = this.props.progress as {
      tradeTxStatus: TxStatus,
      tradeTxHash: string
    };

    return this._createReport(txStatus, txHash);
  }

  private _proxyProgress = () => {
    const { proxyTxStatus: txStatus, proxyTxHash: txHash } = this.props.progress as {
      proxyTxStatus: TxStatus,
      proxyTxHash: string
    };

    return this._createReport(txStatus, txHash);
  }

  private _allowanceProgress = () => {
    const { allowanceTxStatus: txStatus, allowanceTxHash: txHash } = this.props.progress as {
      allowanceTxStatus: TxStatus,
      allowanceTxHash: string
    };

    return this._createReport(txStatus, txHash);
  }

  private _createReport = (txStatus: TxStatus, txHash: string) => ({
    txStatus,
    txHash,
    etherscanURI: this.props.context!.etherscan.url
  })
}
