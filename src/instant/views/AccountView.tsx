import classnames from 'classnames';
import * as React from 'react';
import { Allowances } from '../../balances/balances';
import accountSvg from '../../icons/account.svg';
import backSvg from '../../icons/back.svg';
import warningSvg from '../../icons/warning.svg';
import { Button } from '../../utils/forms/Buttons';
import { ButtonIcon } from '../../utils/icons/Icons';
import { SvgImage } from '../../utils/icons/utils';
import { TopLeftCorner } from '../../utils/panel/TopRightCorner';
import * as instantStyles from '../Instant.scss';
import { InstantFormChangeKind, ManualChange, ViewKind } from '../instantForm';
import { InstantFormWrapper } from '../InstantFormWrapper';
import * as styles from './AccountView.scss';

export interface ViewProps {
  proxyAddress: string;
  allowances: Allowances;
  change: (change: ManualChange) => void;
}

const box = {
  display: 'inline-flex',
  alignItems: 'center',
};

export class AccountView extends React.Component<ViewProps> {
  public render() {
    const proxyAddress = '0x';

    return (
      <InstantFormWrapper heading={'Account Overview'}>
        <TopLeftCorner>
          <ButtonIcon
            onClick={this.switchToNewTrade}
            className={instantStyles.cornerIcon}
            image={backSvg}
          />
        </TopLeftCorner>
        <div className={instantStyles.details}>
          {
            proxyAddress
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
          <span className={styles.text}>Proxy available</span>
          <SvgImage className={styles.warningIcon} image={warningSvg}/>
        </div>
      </div>
      <div className={classnames(styles.row, styles.allowances)}>
        <span className={styles.text}>{this.allowedTokens()} Tokens enabled for Trading</span>
        <Button
          size="sm"
          color="greyWhite"
          className={styles.button}
          onClick={this.switchToAllowances}
        >
          Enable Token
        </Button>
      </div>
    </>
  )

  private onMissingProxy = () => (
    <>
      <div className={classnames(styles.row, styles.proxyMissing)}>
        <div style={box}>
          <SvgImage className={styles.accountIcon} image={accountSvg}/>
          <span className={styles.text}>Proxy not created</span>
          <SvgImage className={styles.warningIcon} image={warningSvg}/>
        </div>
        <Button
          size="sm"
          color="greyWhite"
          className={styles.button}
          onClick={() => false}
        >
          Create
        </Button>
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
  )

  private switchToAllowances = () => this.props.change({
    kind: InstantFormChangeKind.viewChange,
    view: ViewKind.allowances
  })

  private switchToNewTrade = () => this.props.change({
    kind: InstantFormChangeKind.viewChange,
    view: ViewKind.new
  })

  private allowedTokens = () => {
    return Object
      .values(this.props.allowances)
      .reduce((allowedTokensCount: number, isAllowed: boolean) => {
        return isAllowed ? allowedTokensCount + 1 : allowedTokensCount;
      }, 0);
  }
}
