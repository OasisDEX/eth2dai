import { BigNumber } from 'bignumber.js';
import * as React from 'react';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { AssetProps } from '../asset/Asset';
import { Assets } from '../asset/Assets';
import { InstantFormChangeKind, ManualChange, ViewKind } from '../instantForm';

interface ViewProps {
  kind: OfferType;
  sellToken: string;
  buyToken: string;
  balances: any;
  change: (change: ManualChange) => void;
}

export class AssetSelectorView extends React.Component<ViewProps> {
  public render() {
    const { kind, balances } = this.props;

    const assets: AssetProps[] = [
      { currency: 'ETH', balance: new BigNumber('12.345') },
      { currency: 'WETH', balance: new BigNumber('13.345') },
      { currency: 'DAI', balance: new BigNumber('16.345') },
    ];

    return <Assets assets={assets}
                   side={kind || OfferType.sell}
                   onClick={this.selectAsset}
                   onClose={this.hideAssets}/>;
  }

  private hideAssets = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.new
    });
  }

  private selectAsset = (asset: string, side: OfferType) => {
    let buyToken = this.props.buyToken;
    let sellToken = this.props.sellToken;
    if (side === OfferType.sell) {
      sellToken = asset;
    }

    if (side === OfferType.buy) {
      buyToken = asset;
    }

    if (side === OfferType.buy && asset === sellToken ||
      side === OfferType.sell && asset === buyToken) {

      buyToken = this.props.sellToken;
      sellToken = this.props.buyToken;
    }

    this.props.change({
      buyToken,
      sellToken,
      kind: InstantFormChangeKind.pairChange,
    });

    this.hideAssets();
  }
}
