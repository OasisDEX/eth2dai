import classnames from 'classnames';
import * as React from 'react';
import { OfferType } from '../../exchange/orderbook/orderbook';
import { CloseButton } from '../../utils/forms/Buttons';
import * as panelStyling from '../../utils/panel/Panel.scss';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import * as instantStyles from '../Instant.scss';
import { Asset, AssetProps } from './Asset';
import * as styles from './Assets.scss';

interface AssetsProps {
  assets: AssetProps[];
  side: OfferType;
  onClose: () => void;
  onClick: (asset: string, type: OfferType) => void;
}

export class Assets extends React.Component<AssetsProps> {
  public render() {
    const { assets, side, onClick, onClose } = this.props;
    return (
      <section className={classnames(instantStyles.panel, panelStyling.panel)}>
        <TopRightCorner>
          <CloseButton onClick={onClose}/>
        </TopRightCorner>
        <ul className={styles.list}>
          {
            assets.map((asset: AssetProps, index) => {
              return (
                <li className={styles.listItem} key={index}>
                  <Asset currency={asset.currency} balance={asset.balance}
                         onClick={() => onClick(asset.currency, side)}/>
                </li>
              );
            })
          }
        </ul>
      </section>
    );
  }
}
