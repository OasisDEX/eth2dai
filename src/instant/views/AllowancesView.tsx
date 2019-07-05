import * as React from 'react';
import { Allowances } from '../../balances/balances';
import { tokens } from '../../blockchain/config';
import doneSvg from '../../icons/done.svg';
import { Button, CloseButton } from '../../utils/forms/Buttons';
import { SvgImage } from '../../utils/icons/utils';
import { LoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import * as instantStyles from '../Instant.scss';
import {
  InstantFormChangeKind,
  ManualAllowanceProgressState,
  ManualChange,
  ViewKind
} from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import * as styles from './AllowancesView.scss';

interface AssetProps {
  isAllowed: boolean;
  asset: any;
  inProgress?: boolean;
  onClick: () => void;
}

class AssetAllowance extends React.Component<AssetProps> {
  public render() {
    // @ts-ignore
    const { isAllowed, asset, inProgress, onClick } = this.props;

    return (
      <Button color="grey"
              disabled={inProgress}
              className={styles.asset}
              onClick={onClick}
      >
        <span className={styles.tokenIcon}>{asset.iconColor}</span>
        <span>{asset.symbol}</span>
        <span className={styles.indicator}>
          {
            inProgress
              ? <LoadingIndicator inline={true}/>
              : <SvgImage className={
                isAllowed ? styles.isAllowed : styles.disabled
              } image={doneSvg}
              />
          }
        </span>
      </Button>
    );
  }
}

interface ViewProps extends ManualAllowanceProgressState {
  allowances: Allowances;
  change: (change: ManualChange) => void;
}

export class AllowancesView extends React.Component<ViewProps> {
  public render() {
    const { allowances, toggleAllowance, manualAllowancesProgress } = this.props;

    return (
      <InstantFormWrapper heading={'Unlock Token for Trading'}>
        <TopRightCorner>
          <CloseButton theme="danger"
                       className={instantStyles.closeButton}
                       onClick={this.close}
          />
        </TopRightCorner>
        <div className={styles.assets}>
          {
            Object.values(tokens)
              .filter(token => token.symbol !== 'ETH')
              .map(
                (token: any, index: number) => {
                  const symbol = token.symbol;

                  const progress = manualAllowancesProgress && manualAllowancesProgress[symbol];

                  const isInProgress =
                    // up to the moment when the done property of progress is true
                    (progress && !progress.done)
                    // since there is inconsistency when the tx is marked as done and
                    // when we check if anything has changed the following block
                    // the tx should be still pending unless th change is confirmed on next block
                    || (
                    progress && progress.done
                    && (
                      // If we are unlocking the given token, we wait until it's
                      // allowed which will be visible on the next block check.
                      (progress.direction === 'unlocking' && !allowances[symbol])
                      // If we are locking the given token, we wait until it's
                      // not allowed which will be visible on the next block check.
                      || (progress.direction === 'locking' && allowances[symbol])
                    ));

                  return <AssetAllowance isAllowed={allowances[symbol]}
                                         inProgress={isInProgress}
                                         key={index}
                                         asset={token}
                                         onClick={() => {
                                           toggleAllowance(symbol);
                                         }}
                  />;
                }
              )
          }

        </div>
      </InstantFormWrapper>

    );
  }

  private close = () => {
    this.props.change({
      kind: InstantFormChangeKind.viewChange,
      view: ViewKind.account
    });
  }
}
