import * as React from 'react';
import { DAIicon, ETHicon } from '../../blockchain/coinIcons/coinIcons';
import { FormatAmount } from '../../utils/formatters/Formatters';
import { ProgressIcon } from '../../utils/icons/Icons';
import { Currency } from '../../utils/text/Text';
import * as styles from './Asset.scss';

interface AssetProps {
  currency: string;
  balance?: any;
}

const iconOf = (asset: string) => {
  switch (asset.toLowerCase()) {
    case 'eth':
      return <ETHicon theme="circle"/>;
    case 'weth':
      return <ETHicon theme="circle"/>;
    case 'dai':
      return <DAIicon theme="circle"/>;
    default:
      throw new Error(`unknown asset ${asset}`);
  }
};

export class Asset extends React.Component<AssetProps> {
  public render() {
    const { balance, currency } = this.props;
    return (
      <div className={styles.asset}>
        <span className={styles.icon}>
          {iconOf(currency)}
        </span>
        {
          !balance && <ProgressIcon small={true}/>
        }
        {
          balance &&
          <div>
            <FormatAmount value={balance} token={currency} fallback=""/>
            &nbsp;
            <Currency value={currency} theme="semi-bold"/>
          </div>
        }
      </div>
    );
  }
}
