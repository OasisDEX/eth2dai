import classnames from 'classnames';
import * as React from 'react';
import { Balances } from '../../balances/balances';
import { eth2weth } from '../../blockchain/calls/instant';
import { tokens } from '../../blockchain/config';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { CloseButton } from '../../utils/forms/Buttons';
import * as panelStyling from '../../utils/panel/Panel.scss';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import { Asset } from '../asset/Asset';
import * as instantStyles from '../Instant.scss';
import { InstantFormChangeKind, ManualChange, ViewKind } from '../instantForm';
import * as styles from './AssetSelectorView.scss';

interface ViewProps {
  meta: any;
  sellToken: string;
  buyToken: string;
  balances: Balances;
  change: (change: ManualChange) => void;
}

export class AssetSelectorView extends React.Component<ViewProps> {
  public render() {
    const { meta: side, balances } = this.props;
    return (
      <section className={classnames(instantStyles.panel, panelStyling.panel)}>
        <TopRightCorner>
          <CloseButton onClick={this.hideAssets}/>
        </TopRightCorner>
        <ul className={styles.list}>
          {
            Object.values(tokens).map((token, index) => {
              return (
                <li data-test-id={token.symbol.toLowerCase()} className={styles.listItem} key={index}>
                  <Asset currency={token.symbol} balance={balances[token.symbol]}
                         onClick={() => this.selectAsset(token.symbol, side)}/>
                </li>
              );
            })
          }
        </ul>
      </section>
    );
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
    let shouldClearInputs = false;
    if (side === OfferType.sell) {
      sellToken = asset;
      shouldClearInputs = asset !== this.props.sellToken;
    }

    if (side === OfferType.buy) {
      buyToken = asset;
      shouldClearInputs = asset !== this.props.buyToken;
    }

    if (side === OfferType.buy && eth2weth(asset) === eth2weth(this.props.sellToken)) {
      buyToken = asset;
      sellToken = this.props.buyToken;
      shouldClearInputs = true;
    }

    if (side === OfferType.sell && eth2weth(asset) === eth2weth(this.props.buyToken)) {
      buyToken = this.props.sellToken;
      sellToken = asset;
      shouldClearInputs = true;
    }

    this.props.change({
      buyToken,
      sellToken,
      shouldClearInputs,
      kind: InstantFormChangeKind.pairChange,
    });

    this.hideAssets();
  }
}
