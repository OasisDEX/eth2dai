import * as React from 'react';
import { DAIicon, ETHicon, WETHicon } from '../../blockchain/coinIcons/coinIcons';
import { FormatAmount } from '../../utils/formatters/Formatters';
import { ProgressIcon } from '../../utils/icons/Icons';
import { Currency } from '../../utils/text/Text';
import * as styles from './Asset.scss';

export interface AssetProps {
  currency: string;
  balance?: any;
  onClick?: () => void;
}

const iconOf = (asset: string) => {
  switch (asset.toLowerCase()) {
    case 'eth':
      return <ETHicon theme="circle"/>;
    case 'weth':
      return <WETHicon theme="circle"/>;
    case 'dai':
      return <DAIicon theme="circle"/>;
    default:
      throw new Error(`unknown asset ${asset}`);
  }
};

export class Asset extends React.Component<AssetProps> {
  public render() {
    const { balance, currency, onClick } = this.props;
    return (
      <div className={styles.asset} onClick={onClick}>
        <span className={styles.icon}>
          {iconOf(currency)}
        </span>
        {
          !balance && <ProgressIcon small={true}/>
        }
        {
          balance &&
          <div data-test-id="balance">
            <FormatAmount value={balance} token={currency} fallback=""/>
            &nbsp;
            <Currency value={currency} theme="semi-bold"/>
          </div>
        }
      </div>
    );
  }
}
