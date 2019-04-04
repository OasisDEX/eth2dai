import classnames from 'classnames';
import * as React from 'react';
import { Allowances } from '../../balances/balances';
import { tokens } from '../../blockchain/config';
import doneSvg from '../../icons/done.svg';
import { CloseButton } from '../../utils/forms/Buttons';
import { SvgImage } from '../../utils/icons/utils';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import { InstantFormChangeKind, ManualChange, ViewKind } from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import * as styles from './AllowancesView.scss';

interface ViewProps {
  allowances: Allowances;
  change: (change: ManualChange) => void;
}

export class AllowancesView extends React.Component<ViewProps> {
  public render() {
    const allowances = this.props.allowances;

    return (
      <InstantFormWrapper heading={'Enable Token for Trading'}>
        <TopRightCorner>
          <CloseButton onClick={this.onClose}/>
        </TopRightCorner>
        <ul className={styles.list}>
          {
            Object.values(tokens)
              .filter(asset => asset.symbol !== 'ETH')
              .map((asset, index) => {
                return (
                  <li className={styles.listItem} key={index}>
                    <span className={styles.tokenIcon}>{asset.iconCircle}</span>
                    <span>{asset.name}</span>
                    <SvgImage className={classnames(
                      styles.doneIcon,
                      allowances[asset.symbol] ? styles.isAllowed : ''
                    )} image={doneSvg}/>
                  </li>
                );
              })
          }
        </ul>
      </InstantFormWrapper>

    );
  }

  private onClose = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.account
    });
  }
}
