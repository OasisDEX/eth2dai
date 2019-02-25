import classnames from 'classnames';
import * as React from 'react';
import { createNumberMask } from 'text-mask-addons/dist/textMaskAddons';
import { theAppContext } from '../AppContext';
import { BigNumberInput } from '../utils/bigNumberInput/BigNumberInput';
import { Button } from '../utils/forms/Buttons';
import { SettingsIcon, SwapArrows } from '../utils/icons/Icons';
import * as panelStyling from '../utils/panel/Panel.scss';
import { Asset } from './asset/Asset';
import { InstantFormState } from './instant';
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

class TradingSide extends React.Component<any> {

  public render() {
    console.log(this.props);
    return (
      <div className={styles.assetPicker}>
        <Asset currency={this.props.asset} balance={this.props.balance}/>
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

const Selling = (props: any) => (<TradingSide inputPlaceholder="Deposit Amount" {...props}/>);
const Buying = (props: any) => (<TradingSide inputPlaceholder="Receive Amount" {...props}/>);

export class InstantView extends React.Component<InstantFormState> {

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
          <h1> placeholder </h1>
        </div>

        <div className={styles.assets}>
          <Selling asset={this.props.sellToken}
                   balance={this.props.balances ? this.props.balances.WETH : undefined}/>
          <div className={styles.swapIcon}><SwapArrows/></div>
          <Buying asset={this.props.buyToken}
                  balance={this.props.balances ? this.props.balances.DAI : undefined}/>
        </div>

        <div className={styles.errors}>
          <h1>placeholder</h1>
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
    return false;
  }
}

export class InstantExchange extends React.Component<any> {
  public render() {
    return (
      <theAppContext.Consumer>
        {({ InstantTxRx }) =>
          <InstantTxRx/>
        }
      </theAppContext.Consumer>
    );
  }
}
