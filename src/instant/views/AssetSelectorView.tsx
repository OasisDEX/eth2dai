import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { Balances } from '../../balances/balances';
import { tokens } from '../../blockchain/config';
import { User } from '../../blockchain/user';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { CloseButton } from '../../utils/forms/Buttons';
import * as panelStyling from '../../utils/panel/Panel.scss';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import { Asset } from '../asset/Asset';
import * as instantStyles from '../Instant.scss';
import { InstantFormChangeKind, ManualChange, ViewKind } from '../instantForm';
import * as styles from './AssetSelectorView.scss';

interface ViewProps {
  side: OfferType;
  sellToken: string;
  buyToken: string;
  balances: Balances;
  user: User;
  change: (change: ManualChange) => void;
}

class AssetSelectorView extends React.Component<ViewProps> {
  public render() {
    const { side, balances, user } = this.props;
    return (
      <section className={classnames(instantStyles.panel, panelStyling.panel)}>
        <TopRightCorner>
          <CloseButton theme="instant" onClick={this.hideAssets}/>
        </TopRightCorner>
        <ul className={styles.list}>
          {
            Object.values(tokens).map((token, index) => {
              const balance = user && user.account ? balances[token.symbol] : new BigNumber(0);

              return (
                <li data-test-id={token.symbol.toLowerCase()} className={styles.listItem} key={index}>
                  <Asset currency={token.symbol}
                         balance={balance}
                         user={user}
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
    this.props.change({
      side,
      token: asset,
      kind: InstantFormChangeKind.tokenChange,
    });

    this.hideAssets();
  }
}

export const SellAssetSelectorView = (props: any) => (
  <AssetSelectorView side={OfferType.sell} {...props}/>
);

export const BuyAssetSelectorView = (props: any) => (
  <AssetSelectorView side={OfferType.buy} {...props}/>
);
