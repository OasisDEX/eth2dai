import { BigNumber } from 'bignumber.js';
import classnames from 'classnames';
import * as React from 'react';
import { eth2weth } from '../../blockchain/calls/instant';
import { tokens, tradingPairs } from '../../blockchain/config';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { CloseButton } from '../../utils/forms/Buttons';
import { marketsOf } from '../../utils/markets';
import * as panelStyling from '../../utils/panel/Panel.scss';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import { Asset } from '../asset/Asset';
import * as instantStyles from '../Instant.scss';
import { InstantFormChangeKind, InstantFormState, ViewKind } from '../instantForm';
import * as styles from './AssetSelectorView.scss';

class AssetSelectorView extends React.Component<InstantFormState & {side: OfferType}> {
  public render() {
    const { balances, user } = this.props;
    return (
      <section className={classnames(instantStyles.panel, panelStyling.panel)}>
        <TopRightCorner>
          <CloseButton theme="danger"
                       className={instantStyles.closeButton}
                       onClick={this.hideAssets}
          />
        </TopRightCorner>
        <section className={styles.assetsContainer}>
          <div className={styles.assets}>
            <ul className={styles.list}>
              {
                Object.values(tokens).map((token, index) => {
                  const asset = token.symbol;
                  const balance = user && user.account
                    ? balances ? balances[asset] : new BigNumber(0)
                    : new BigNumber(0);

                  return (
                    <li data-test-id={asset.toLowerCase()}
                        className={styles.listItem}
                        key={index}
                    >
                      <Asset currency={token.symbol}
                             balance={balance}
                             user={user}
                             isLocked={this.isLocked(asset)}
                             onClick={() => this.selectAsset(asset)}/>
                    </li>
                  );
                })
              }
            </ul>
          </div>
        </section>
      </section>
    );
  }

  private hideAssets = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.new
    });
  }

  private selectAsset = (asset: string) => {
    this.props.change({
      side: this.props.side,
      token: asset,
      kind: InstantFormChangeKind.tokenChange,
    });

    this.hideAssets();
  }

  private isLocked = (asset: string): boolean => {
    const { side, buyToken, sellToken } = this.props;

    const markets = side === OfferType.sell
      ? marketsOf(buyToken, tradingPairs)
      : marketsOf(sellToken, tradingPairs);

    /* A given asset is NOT locked when:
     * 1) is part of market
     * 2) is the opposing asset
     *    - clicking on the opposing type of asset
     *    allows the tokens to be swapped in the UI
     * 3) is the same token that is already selected
     * */

    return !markets.has(eth2weth(asset))
      && asset !== sellToken
      && asset !== eth2weth(sellToken)
      && asset !== buyToken
      && asset !== eth2weth(buyToken);
  }
}

export const SellAssetSelectorView: React.SFC<InstantFormState> = (props) => (
  <AssetSelectorView side={OfferType.sell} {...props}/>
);

export const BuyAssetSelectorView: React.SFC<InstantFormState> = (props) => (
  <AssetSelectorView side={OfferType.buy} {...props}/>
);
