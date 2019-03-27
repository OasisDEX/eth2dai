import classnames from 'classnames';
import * as React from 'react';
import { Balances } from '../../balances/balances';
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
  kind: OfferType;
  sellToken: string;
  buyToken: string;
  balances: Balances;
  change: (change: ManualChange) => void;
}

export class AssetSelectorView extends React.Component<ViewProps> {
  public render() {
    const { kind, balances } = this.props;
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
                         onClick={() => this.selectAsset(token.symbol, kind)}/>
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
