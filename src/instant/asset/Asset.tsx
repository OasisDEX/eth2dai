import * as React from 'react';
import daiCircleSvg from '../../icons/coins/dai-circle.svg';
import ethCircleSvg from '../../icons/coins/eth-circle.svg';
import ethInverseSvg from '../../icons/coins/eth-inverse.svg';
import { FormatAmount } from '../../utils/formatters/Formatters';
import { ProgressIcon } from '../../utils/icons/Icons';
import { SvgImage } from '../../utils/icons/utils';
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
      return <SvgImage image={ethCircleSvg}/>;
    case 'weth':
      return <SvgImage image={ethInverseSvg}/>;
    case 'dai':
      return <SvgImage image={daiCircleSvg}/>;
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
