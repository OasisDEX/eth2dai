import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';

import { tokens } from '../blockchain/config';
import { User } from '../blockchain/user';
import { OfferType } from '../exchange/orderbook/orderbook';
import { BigNumberInput } from '../utils/bigNumberInput/BigNumberInput';
import { formatAmountInstant } from '../utils/formatters/format';
import { Asset } from './asset/Asset';
import * as styles from './Instant.scss';
import { InstantFormChangeKind, ManualChange, ViewKind } from './instantForm';

interface TradingSideProps {
  placeholder: string;
  dataTestId: string;
  asset: string;
  side: OfferType;
  amount: BigNumber;
  balance: BigNumber;
  user: User;
  onAmountChange: () => void;
  change: (change: ManualChange) => void;
  approx: boolean;
}

class TradingSide extends React.Component<TradingSideProps> {
  public render() {
    const { amount, asset, balance, placeholder, onAmountChange, user, approx } = this.props;
    const decimalLimit = tokens[asset] ? tokens[asset].digitsInstant : 3;
    return (
      <div className={styles.tradingSide} data-test-id={this.props.dataTestId}>
        <div className={styles.tradingAsset}>
          <Asset currency={asset} balance={balance} user={user} onClick={this.changeToken}/>
        </div>
        {/* TODO: Make it parameterized like the tokens in offerMakeForm.*/}
        <span className={styles.inputWrapper}>
          <BigNumberInput
            data-test-id={'amount'}
            type="text"
            className={styles.input}
            mask={createNumberMask({
              decimalLimit,
              allowDecimal: true,
              prefix: ''
            })}
            onChange={onAmountChange}
            value={
              (amount || null) &&
              formatAmountInstant(amount, asset)
            }
            guide={true}
            placeholder={placeholder}
          />
          { approx && <span className={styles.inputApprox}>~</span> }
        </span>
      </div>
    );
  }

  private changeToken = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: this.props.side === OfferType.buy
        ? ViewKind.buyAssetSelector
        : ViewKind.sellAssetSelector,
    });
  }
}

export const Selling = (props: any) => (
  <TradingSide dataTestId="selling-token"
               side={OfferType.sell}
               placeholder="Deposit Amount"
               {...props}
  />
);
export const Buying = (props: any) => (
  <TradingSide dataTestId="buying-token"
               side={OfferType.buy}
               placeholder="Receive Amount"
               {...props}
  />
);
