import classnames from 'classnames';
import * as React from 'react';
import { TxStatus } from '../../blockchain/transactions';
import accountSvg from '../../icons/account.svg';
import backSvg from '../../icons/back.svg';
import warningSvg from '../../icons/warning.svg';
import { Button } from '../../utils/forms/Buttons';
import { ButtonIcon, ProgressIcon } from '../../utils/icons/Icons';
import { SvgImage } from '../../utils/icons/utils';
import { TopLeftCorner } from '../../utils/panel/TopRightCorner';
import { WarningTooltip, WarningTooltipType } from '../../utils/tooltip/Tooltip';
import * as instantStyles from '../Instant.scss';
import { InstantFormChangeKind, InstantFormState, ViewKind } from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import * as styles from './AccountView.scss';

// tslint:disable
const proxyToolTip = {
  id: 'proxy-tooltip',
  text: 'Proxy is a supporting contract owned by you that groups different actions as one Ethereum transaction.',
  iconColor: 'white'
} as WarningTooltipType;

const activeProxyTooltip = { ...proxyToolTip, iconColor: 'soft-cyan' as 'soft-cyan' };

// tslint:enable

const box = {
  display: 'inline-flex',
  alignItems: 'center',
};

export class AccountView extends React.Component<InstantFormState> {
  public render() {
    const { proxyAddress, progress } = this.props;

    return (
      <InstantFormWrapper heading={'Account Overview'}>
        <TopLeftCorner>
          <ButtonIcon
            onClick={this.switchToNewTrade}
            className={instantStyles.cornerIcon}
            image={backSvg}
          />
        </TopLeftCorner>
        <div className={classnames(instantStyles.details, instantStyles.account)}>
          {
            proxyAddress || (
              proxyAddress
              && progress
              && progress.done
              && (progress as { proxyTxStatus: TxStatus }).proxyTxStatus === 'Success'
            )
              ? this.onHavingProxy()
              : this.onMissingProxy()
          }
        </div>
      </InstantFormWrapper>
    );
  }

  private onHavingProxy = () => (
    <>
      <div className={classnames(styles.row, styles.proxyAvailable)}>
        <div style={box}>
          <SvgImage className={styles.accountIcon} image={accountSvg}/>
          <span data-test-id="proxy-status" className={styles.text}>Proxy available</span>
          <WarningTooltip {...activeProxyTooltip}/>
        </div>
      </div>
      <div className={classnames(styles.row, styles.allowances)}>
        <span className={styles.text} data-test-id="active-allowances">
          {
            `${this.allowedTokens()} Tokens enabled for Trading`
          }
        </span>
        <Button
          size="sm"
          color="grey"
          className={styles.button}
          data-test-id="set-allowances"
          onClick={this.switchToAllowances}
        >
          Enable Token
        </Button>
      </div>
    </>
  )

  private onMissingProxy = () => {
    const progress = this.props.progress;
    const isInProgress = progress && !progress.done && !this.props.proxyAddress;
    return (
      <>
        <div className={classnames(styles.row, styles.proxyMissing)}>
          <div style={box}>
            <SvgImage className={styles.accountIcon} image={accountSvg}/>
            <span data-test-id="proxy-status" className={styles.text}>Proxy not created</span>
            <WarningTooltip {...proxyToolTip}/>
          </div>
          <div className={styles.placeholder}>
            {
              isInProgress
                ? <ProgressIcon/>
                : (
                  <Button
                    size="sm"
                    color="grey"
                    className={styles.button}
                    data-test-id="create-proxy"
                    onClick={this.props.createProxy}
                  >
                    Create
                  </Button>
                )
            }
          </div>
        </div>
        <div className={classnames(styles.row, styles.warning)}>
          <>
            <SvgImage className={styles.warningIcon} image={warningSvg}/>
            <span className={styles.text}>
            You do not need to create a proxy manually. It will be automatically created for you.
          </span>
          </>
        </div>
      </>
    );
  }

  private switchToAllowances = () => this.props.change({
    kind: InstantFormChangeKind.viewChange,
    view: ViewKind.allowances
  })

  private switchToNewTrade = () => this.props.change({
    kind: InstantFormChangeKind.viewChange,
    view: ViewKind.new
  })

  private allowedTokens = () => {
    if (!this.props.allowances) {
      return 0;
    }

    return Object
      .values(this.props.allowances)
      .reduce((allowedTokensCount: number, isAllowed: boolean) => {
        return isAllowed ? allowedTokensCount + 1 : allowedTokensCount;
      },      0);
  }
}
