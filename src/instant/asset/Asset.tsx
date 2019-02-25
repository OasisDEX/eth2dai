import * as React from 'react';
import { ETHicon } from '../../blockchain/coinIcons/coinIcons';
import { FormatAmount } from '../../utils/formatters/Formatters';
import { LoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import * as styles from './Asset.scss';

interface AssetProps {
  currency: string;
  balance?: any;
}

export class Asset extends React.Component<AssetProps> {
  public render() {
    return (
      <div className={styles.asset}>
        <span className={styles.icon}>
          <ETHicon theme="circle"/>
        </span>
        {
          !this.props.balance && <LoadingIndicator inline={true} light={true}/>
        }
        {
          this.props.balance && <FormatAmount value={this.props.balance} token={this.props.currency} fallback=""/>
        }
      </div>
    );
  }
}
