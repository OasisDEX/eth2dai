import classnames from 'classnames';
import * as React from 'react';
import { Subject } from 'rxjs';
import { connectToWallet$, disconnected$ } from '../blockchain/wallet';
import { Button } from '../utils/forms/Buttons';
import { Checkbox } from '../utils/forms/Checkbox';
import {
  getCurrentProviderName,
  Ledger,
  Metamask,
  Parity,
  Provider,
  Status,
  Trezor,
  Trust,
  WebWallet
} from '../utils/providers';
import * as styles from './WalletConnection.scss';

const hwWallets = [Trezor, Ledger];

const {
  section,
  heading,
  icon,
  list,
  single,
  item,
  wallet,
  inactive,
  selected,
  termsAndConditions,
  button,
  buttonPlaceholder,
} = styles;

const ListItem = (props: Provider & { className?: string, isSelected?: boolean, onSelect?: () => void }) => {
  const { supported, isSelected, className, name: fullName, icon: walletIcon, onSelect } = props;
  return (
    <li className={
      classnames(
        item, wallet, className,
        !supported && inactive,
        isSelected && selected
      )
    }
        onClick={onSelect}
    >
      <div className={icon}>{walletIcon}</div>
      <span>{fullName}</span>
    </li>
  );
};

class SuggestedClients extends React.Component<any> {
  public render() {
    return (
      <section className={section}>
        <h4 className={heading}>Get a Wallet</h4>
        <ul className={list}>
          {
            [Metamask, Parity, Status, Trust].map((provider) => {
              return (
                <a key={provider.id} href={provider.website} rel="noreferrer noopener" target="_blank">
                  <ListItem id={provider.id}
                            icon={provider.iconWhite}
                            name={provider.name}
                            supported={provider.supported}
                  />
                </a>
              );
            })
          }
        </ul>
        <div className={buttonPlaceholder}>
          <Button size="lg"
                  color="white"
                  className={classnames(item, button)}
                  data-test-id="continue-with-app"
                  onClick={this._goBack}
          >
            Back
          </Button>
        </div>
      </section>
    );
  }

  private _goBack = () => {
    walletConnectionViewManual$.next(WalletConnectionViewKind.noClient);
  }
}

class NotConnected extends React.Component<any, { isChecked: boolean, selectedWallet: Provider }> {
  public constructor(props: any) {
    super(props);
    this.state = {
      isChecked: false,
      selectedWallet: {} as Provider
    };
  }

  public render() {
    const provider = getCurrentProviderName();
    return (
      <section className={section}>
        <h4 className={heading}> Connect Wallet </h4>
        <ul className={list}>
          <ListItem icon={provider.icon}
                    name={provider.name}
                    supported={provider.supported}
                    isSelected={this.state.selectedWallet.id === provider.id}
                    onSelect={() => this._selectWallet(provider)}/>
        </ul>
        <ul className={list}>
          {
            [...hwWallets].map((hwWallet) =>
              <ListItem key={hwWallet.id}
                        icon={hwWallet.icon}
                        name={hwWallet.name}
                        supported={hwWallet.supported}
                        isSelected={this.state.selectedWallet.id === hwWallet.id}/>
            )
          }
        </ul>
        <Checkbox name="tos"
                  data-test-id="accept-tos"
                  onChange={this._toggle}
                  className={termsAndConditions}
        >
          I accept&nbsp;<a target="_blank" rel="noopener noreferrer" href="/tos.pdf"> Terms of Service</a>
        </Checkbox>
        <div className={buttonPlaceholder}>
          <Button size="lg"
                  color="white"
                  className={classnames(item, button)}
                  disabled={!this._canConnect()}
                  onClick={this._connect}
                  data-test-id="continue-with-app"
          >
            Connect
          </Button>
        </div>
      </section>
    );
  }

  private _toggle = () => {
    this.setState((state: any) => {
      const isChecked = !state.isChecked;
      return { isChecked };
    });
  }

  private _selectWallet = (selectedWallet: Provider) => {
    this.setState({ selectedWallet });
  }

  private _connect = () => {
    connectToWallet$.next();
  }

  private _canConnect = () => {
    const selectedWallet = this.state.selectedWallet;
    return this.state.isChecked &&
      selectedWallet && (
        selectedWallet.id !== undefined &&
        selectedWallet.id !== null
      );
  }
}

class NoClient extends React.Component<any, { isChecked: boolean, selectedWallet: Provider }> {
  public constructor(props: any) {
    super(props);
    this.state = {
      isChecked: false,
      selectedWallet: {} as Provider
    };
  }

  public render() {
    return (
      <section className={section}>
        <h4 className={heading}> Connect Wallet </h4>
        <ul className={list}>
          <ListItem icon={WebWallet.icon}
                    name={WebWallet.name}
                    supported={WebWallet.supported}
                    isSelected={this.state.selectedWallet.id === WebWallet.id}
                    onSelect={this._suggestClients}/>
        </ul>
        <ul className={list}>
          {
            [...hwWallets].map((hwWallet) =>
              <ListItem key={hwWallet.id}
                        icon={hwWallet.icon}
                        name={hwWallet.name}
                        supported={hwWallet.supported}
                        isSelected={this.state.selectedWallet.id === hwWallet.id}/>
            )
          }
        </ul>
        <Checkbox name="tos"
                  data-test-id="accept-tos"
                  onChange={this._toggle}
                  className={termsAndConditions}
        >
          I accept&nbsp;<a target="_blank" rel="noopener noreferrer" href="/tos.pdf"> Terms of Service</a>
        </Checkbox>
        <div className={buttonPlaceholder}>
          <Button size="lg"
                  color="white"
                  className={classnames(item, button)}
                  disabled={!this._canConnect()}
                  onClick={this._connect}
                  data-test-id="continue-with-app"
          >
            Connect
          </Button>
        </div>
      </section>
    );
  }

  private _toggle = () => {
    this.setState((state: any) => {
      const isChecked = !state.isChecked;
      return { isChecked };
    });
  }

  private _selectWallet = (selectedWallet: Provider) => {
    this.setState({ selectedWallet });
  }

  private _connect = () => {
    connectToWallet$.next();
  }

  private _canConnect = () => {
    const selectedWallet = this.state.selectedWallet;
    return this.state.isChecked &&
      selectedWallet && (
        selectedWallet.id !== undefined &&
        selectedWallet.id !== null
      )
      ;
  }

  private _suggestClients = () => {
    walletConnectionViewManual$.next(WalletConnectionViewKind.suggest);
  }
}

class Connected extends React.Component<any> {
  public render() {
    return <>
      <section className={section}>
        <h4 className={heading}> Metamask Connected </h4>
        <ul className={classnames(list, single)}>
          {
            hwWallets.map((hwWallet) =>
              <ListItem id={hwWallet.id}
                        key={hwWallet.id}
                        icon={hwWallet.icon}
                        name={hwWallet.name}
                        supported={hwWallet.supported}/>
            )
          }
        </ul>
        <div className={buttonPlaceholder}>
          <Button color="darkRed" size="lg" className={button} onClick={
            () => disconnected$.next()
          }> Disconnect </Button>
        </div>
      </section>
    </>
      ;
  }
}

export enum WalletConnectionViewKind {
  suggest = 'suggest',
  connected = 'connected',
  notConnected = 'notConnected',
  noClient = 'noClient',
}

export const walletConnectionViewManual$ = new Subject();
walletConnectionViewManual$.subscribe();

export const WalletConnectionViews = new Map<WalletConnectionViewKind, any>(
  [
    [WalletConnectionViewKind.connected, Connected],
    [WalletConnectionViewKind.notConnected, NotConnected],
    [WalletConnectionViewKind.noClient, NoClient],
    [WalletConnectionViewKind.suggest, SuggestedClients],
  ]);
