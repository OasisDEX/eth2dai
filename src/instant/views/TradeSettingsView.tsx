import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';
import backSvg from '../../icons/back.svg';
import warningSvg from '../../icons/warning.svg';
import { BigNumberInput } from '../../utils/bigNumberInput/BigNumberInput';
import { ButtonIcon } from '../../utils/icons/Icons';
import { SvgImage } from '../../utils/icons/utils';
import { TopLeftCorner } from '../../utils/panel/TopRightCorner';
import { TradeDetails } from '../details/TradeDetails';
import * as instantStyles from '../Instant.scss';
import { InstantFormChangeKind, InstantFormState, ViewKind } from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import * as styles from './TradeSettingsView.scss';

export class TradeSettingsView extends React.Component<InstantFormState, { slippage: BigNumber | undefined }> {

  public render() {

    return (
      <InstantFormWrapper heading="Advanced Settings">
        <TopLeftCorner>
          <ButtonIcon
            className={classnames(instantStyles.cornerIcon, instantStyles.backIcon)}
            onClick={this._hideTradeSettings}
            image={backSvg}/>
        </TopLeftCorner>
        <TradeDetails {...this.props}/>
        <section className={styles.settings}>
          <div className={styles.parameter}>
            <span className={styles.name}>Slippage limit</span>
            <span className={instantStyles.inputWrapper}>
            <BigNumberInput
              data-test-id={'slippage'}
              type="text"
              className={classnames(instantStyles.input, styles.value)}
              onChange={this._updateSlippageLimit}
              value={
                this.props.slippageLimit
                  ? this.props.slippageLimit.times(100).valueOf()
                  : ''
              }
              mask={createNumberMask({
                integerLimit: 3,
                allowDecimal: true,
                prefix: ''
              })}
              pipe={
                lessThan(100)
              }
              guide={true}
              placeholder={this.props.slippageLimit.times(100).valueOf()}
            />
            <span className={instantStyles.inputPercentage}>%</span>
            </span>
          </div>
          <div className={styles.warning}>
            <SvgImage className={styles.icon} image={warningSvg}/>
            <p data-test-id="slippage-warning" className={styles.text}>
              The transaction will fail (and gas will be spent), if the price of 1
              <strong> {this._quotation().base}</strong> is
              {
                this._quotation().base === this.props.sellToken ? ' lower' : ' higher'
              } than
              ~{this.props.price && this._calculateSlippage(this.props.price, this.props.slippageLimit).valueOf()}
              <strong> {this._quotation().quote}</strong>
            </p>
          </div>
        </section>
      </InstantFormWrapper>
    )
      ;
  }

  private _hideTradeSettings = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.new
    });
  }

  private _updateSlippageLimit = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = new BigNumber(e.target.value.replace(/,/g, ''));
    if (!value.isNaN() && value.isLessThan(new BigNumber(100))) {
      this.props.change({
        value: value.div(100),
        kind: InstantFormChangeKind.slippageLimitChange,
      });
    }
  }

  private _quotation = () => {
    if (this.props.quotation) {
      const [base, quote] = this.props.quotation.split('/');
      return { base, quote };
    }
    return {};
  }

  private _calculateSlippage = (price: BigNumber, slippageLimit: BigNumber) => {
    if (this._quotation().base === this.props.sellToken) {
      return price.minus(price.times(slippageLimit));
    }
    return price.plus(price.times(slippageLimit));
  }
}

const lessThan = (max: number) => {
  return (value: number) => value <= max ? value : false;
};
