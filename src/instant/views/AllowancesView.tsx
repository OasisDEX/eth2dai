import * as React from 'react';
import { BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Allowances } from '../../balances/balances';
import { calls$ } from '../../blockchain/calls/calls';
import { tokens } from '../../blockchain/config';
import { isDone } from '../../blockchain/transactions';
import doneSvg from '../../icons/done.svg';
import { connect } from '../../utils/connect';
import { Button, CloseButton } from '../../utils/forms/Buttons';
import { SvgImage } from '../../utils/icons/utils';
import { LoadingIndicator } from '../../utils/loadingIndicator/LoadingIndicator';
import { TopRightCorner } from '../../utils/panel/TopRightCorner';
import * as instantStyles from '../Instant.scss';
import { InstantFormChangeKind, ManualChange, ViewKind } from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import * as styles from './AllowancesView.scss';

interface ViewProps {
  proxyAddress: string;
  allowances: Allowances;
  change: (change: ManualChange) => void;
}

interface AssetProps {
  isAllowed: boolean;
  asset: any;
  inProgress?: boolean;
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

export class AllowancesView extends React.Component<ViewProps> {
  public render() {
    const allowances = this.props.allowances;
    const proxyAddress = this.props.proxyAddress;

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
                  const observable = new BehaviorSubject<AssetProps>({
                    asset: token,
                    isAllowed: allowances[token.symbol]
                  });

                  const AssetRx =
                    connect<any, { onClick: (e: any) => void }>(AssetAllowance, observable);

                  return <AssetRx key={index} onClick={
                    () => {
                      const args = {
                        proxyAddress,
                        token: token.symbol,
                      };

                      calls$.pipe(
                        switchMap((calls) =>
                          observable.getValue().isAllowed
                            ? calls.disapproveProxy(args)
                            : calls.approveProxy(args)
                        )
                      ).subscribe(progress => {
                        observable.next({
                          ...observable.getValue(),
                          inProgress: (
                            progress
                            && !isDone(progress)
                          ),
                        });
                      });
                    }
                  }/>;
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
