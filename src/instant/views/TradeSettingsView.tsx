import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';
import backSvg from '../../icons/back.svg';
import warningSvg from '../../icons/warning.svg';
import { BigNumberInput } from '../../utils/bigNumberInput/BigNumberInput';
import { formatPrice } from '../../utils/formatters/format';
import { ButtonIcon } from '../../utils/icons/Icons';
import { SvgImage } from '../../utils/icons/utils';
import { TopLeftCorner } from '../../utils/panel/TopRightCorner';
import { TradeDetails } from '../details/TradeDetails';
import * as instantStyles from '../Instant.scss';
import { InstantFormChangeKind, InstantFormState, ViewKind } from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import * as styles from './TradeSettingsView.scss';

export class TradeSettingsView extends React.Component<InstantFormState> {

  public render() {
    const { slippageLimit, price, sellToken } = this.props;
    const slippageLimitInPercentage = slippageLimit.times(100).valueOf();
    const { base, quote } = this._quotation();
    return (
      <InstantFormWrapper heading="Advanced Settings">
        <TopLeftCorner>
          <ButtonIcon
            className={classnames(instantStyles.cornerIcon, instantStyles.backIcon)}
            onClick={this._hideTradeSettings}
            image={backSvg}
            data-test-id="back"
          />
        </TopLeftCorner>
        <TradeDetails {...this.props}/>
        <section className={styles.settings}>
          <div className={styles.parameter}>
            <span className={styles.name}>Slippage limit</span>
            <span className={instantStyles.inputWrapper}>
            <BigNumberInput
              data-test-id={'slippage-limit'}
              type="text"
              className={classnames(instantStyles.input, styles.value)}
              onChange={this._updateSlippageLimit}
              value={
                slippageLimit
                  ? slippageLimitInPercentage
                  : ''
              }
              mask={createNumberMask({
                allowDecimal: true,
                prefix: ''
              })}
              pipe={
                lessThanOrEqual(100)
              }
              guide={true}
              placeholder={slippageLimitInPercentage}
            />
            <span className={instantStyles.inputPercentage}>%</span>
            </span>
          </div>
          <div className={styles.warning}>
            <SvgImage className={styles.icon} image={warningSvg}/>
            <p className={styles.text}>
              The transaction will fail (and gas will be spent), if the price of
              <span className={styles.highlight}>&nbsp;1 {base}</span> is
              {
                base === sellToken ? ' lower' : ' higher'
              } than
              <span className={styles.highlight}>
                &nbsp;
                {
                  price && formatPrice(
                    this._calculateSlippage(price, slippageLimit),
                    quote
                  )
                }
                &nbsp;{quote}
              </span>
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
    if (!value.isNaN()) {
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
    return { quote: '', base: '' };
  }

  private _calculateSlippage = (price: BigNumber, slippageLimit: BigNumber) => {
    if (this._quotation().base === this.props.sellToken) {
      return price.minus(price.times(slippageLimit));
    }
    return price.plus(price.times(slippageLimit));
  }
}

const lessThanOrEqual = (max: number) => {
  return (value: number) => value <= max ? value : false;
};
