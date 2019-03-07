import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';
import { BigNumberInput } from '../utils/bigNumberInput/BigNumberInput';
import { formatPrice } from '../utils/formatters/format';
import { Asset } from './asset/Asset';
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
            formatPrice(amount, asset)
          }
          guide={true}
          placeholder={placeholder}
        />
      </div>
    );
  }
}

export const Selling = (props: any) => (
  <TradingSide data-test-id="selling-token" placeholder="Deposit Amount" {...props}/>
);
export const Buying = (props: any) => (
  <TradingSide data-test-id="buying-token" placeholder="Receive Amount" {...props}/>
);
