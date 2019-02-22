import classnames from 'classnames';
import * as React from 'react';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';
import { ETHicon } from '../blockchain/coinIcons/coinIcons';
import { BigNumberInput } from '../utils/bigNumberInput/BigNumberInput';
import { Button } from '../utils/forms/Buttons';
import { SettingsIcon, SwapArrows } from '../utils/icons/Icons';
import * as panelStyling from '../utils/panel/Panel.scss';
import * as styles from './Instant.scss';

class TopLeftCorner extends React.Component<any> {
  public render() {
    const className = this.props.className;

    return (
      <div {...this.props} className={classnames(className, styles.topLeftCorner)}>
        {this.props.children}
      </div>
    );
  }
}

class AssetPicker extends React.Component<any> {

  public render() {
    return (
      <div className={styles.assetPicker}>
        <div className={styles.assetToggle}>
          <span className={styles.icon}>
            <ETHicon theme="circle"/>
          </span>
          12.345 ETH
        </div>
        <BigNumberInput
          type="text"
          className={styles.input}
          mask={createNumberMask({
            allowDecimal: true,
            decimalLimit: 5,
            prefix: ''
          })}
          onChange={this.update}
          guide={true}
          placeholder={this.props.inputPlaceholder}
        />
      </div>
    );
  }

  private update() {
    console.log('Updated');
  }
}

export class InstantView extends React.Component {

  public render() {
    return (
      <section className={classnames(styles.panel, panelStyling.panel)}>
        <header className={styles.header}>
          <h1>Enter Order Details</h1>
          <TopLeftCorner>
            <SettingsIcon/>
          </TopLeftCorner>
        </header>

        <div className={styles.details}>

        </div>

        <div className={styles.assets}>
          <AssetPicker inputPlaceholder="Deposit Amount"/>
          <div className={styles.swapIcon}><SwapArrows/></div>
          <AssetPicker inputPlaceholder="Receive Amount"/>
        </div>

        <div className={styles.errors}>
        </div>

        <footer>
          <Button size="lg" color="greyWhite" onClick={this.startTx} style={{ width: '100%' }}>
            Start Transaction
          </Button>
        </footer>
      </section>
    );
  }

  private startTx = () => {

  }
}

export const InstantViewTxRx = InstantView;
